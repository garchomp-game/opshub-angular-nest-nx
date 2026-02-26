import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@prisma-db';
import { JwtPayload, AuthUser } from '../types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    async validate(payload: JwtPayload): Promise<AuthUser> {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            include: {
                roles: { select: { tenantId: true, role: true } },
                profile: { select: { displayName: true, avatarUrl: true } },
            },
        });

        if (!user) throw new UnauthorizedException();

        const tenantIds = [...new Set(user.roles.map((r: any) => r.tenantId))] as string[];
        return {
            id: user.id,
            email: user.email,
            displayName: user.profile?.displayName ?? user.email,
            tenantIds,
            roles: user.roles.map((r: any) => ({ tenantId: r.tenantId, role: r.role })),
        };
    }
}
