import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@prisma-db';
import * as bcrypt from 'bcrypt';
import { TokenPair, AuthUser } from './types/auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async validateUser(email: string, password: string): Promise<any | null> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return null;

        return user;
    }

    async login(dto: LoginDto): Promise<TokenPair> {
        const user = await this.validateUser(dto.email, dto.password);
        if (!user) {
            throw new UnauthorizedException({
                code: 'ERR-AUTH-001',
                message: 'メールアドレスまたはパスワードが正しくありません',
            });
        }
        return this.generateTokenPair(user.id, user.email);
    }

    async register(dto: RegisterDto): Promise<TokenPair> {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new ConflictException({
                code: 'ERR-AUTH-004',
                message: 'このメールアドレスは既に登録されています',
            });
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
            },
        });

        // Profile 自動作成
        await this.prisma.profile.create({
            data: {
                id: user.id,
                displayName: dto.displayName,
            },
        });

        this.logger.log(`User registered: ${user.email}`);
        return this.generateTokenPair(user.id, user.email);
    }

    async refreshTokens(refreshToken: string): Promise<TokenPair> {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            return this.generateTokenPair(user.id, user.email);
        } catch {
            throw new UnauthorizedException({
                code: 'ERR-AUTH-001',
                message: 'リフレッシュトークンが無効です',
            });
        }
    }

    async logout(_userId: string): Promise<void> {
        // リフレッシュトークンの無効化（ステートレスJWTのためサーバー側は処理なし）
        this.logger.log(`User logged out: ${_userId}`);
    }

    async getProfile(userId: string): Promise<AuthUser> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: { select: { tenantId: true, role: true } },
                profile: { select: { displayName: true, avatarUrl: true } },
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            displayName: user.profile?.displayName ?? user.email,
            tenantIds: [...new Set(user.roles.map((r: any) => r.tenantId))] as string[],
            roles: user.roles.map((r: any) => ({ tenantId: r.tenantId, role: r.role })),
        };
    }

    private generateTokenPair(userId: string, email: string): TokenPair {
        const payload = { sub: userId, email };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: 900, // 15 minutes
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: 604800, // 7 days
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: 900,
        };
    }
}
