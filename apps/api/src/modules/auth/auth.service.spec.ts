import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '@prisma-db';

// bcrypt モック
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('$hashed$'),
    compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let prisma: any;
    let jwtService: JwtService;
    let configService: ConfigService;

    const mockUser = {
        id: 'user-1',
        email: 'test@demo.com',
        password: '$hashed$',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockUserWithRelations = {
        ...mockUser,
        profile: { displayName: 'テスト太郎', avatarUrl: null },
        roles: [{ tenantId: 'tenant-1', role: 'member' }],
    };

    beforeEach(async () => {
        // Prisma モック（this.prisma.user.xxx パターンに対応）
        prisma = {
            user: {
                findUnique: jest.fn(),
                create: jest.fn(),
            },
            profile: {
                create: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: prisma },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('jwt-token'),
                        verify: jest.fn().mockReturnValue({ sub: 'user-1', email: 'test@demo.com' }),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('secret-key'),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);
        configService = module.get<ConfigService>(ConfigService);
    });

    afterEach(() => jest.clearAllMocks());

    // ─── validateUser ───

    describe('validateUser', () => {
        it('should return user when credentials are valid', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.validateUser('test@demo.com', 'Password123');

            expect(result).toEqual(mockUser);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@demo.com' } });
        });

        it('should return null when user is not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await service.validateUser('unknown@demo.com', 'Password123');

            expect(result).toBeNull();
        });

        it('should return null when password is invalid', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await service.validateUser('test@demo.com', 'wrong');

            expect(result).toBeNull();
        });
    });

    // ─── login ───

    describe('login', () => {
        it('should return token pair on successful login', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.login({ email: 'test@demo.com', password: 'Password123' });

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result).toHaveProperty('expiresIn', 900);
            expect(jwtService.sign).toHaveBeenCalledTimes(2);
        });

        it('should throw UnauthorizedException on invalid credentials', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(
                service.login({ email: 'bad@demo.com', password: 'wrong' }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    // ─── register ───

    describe('register', () => {
        it('should create user with profile and return tokens', async () => {
            prisma.user.findUnique.mockResolvedValue(null); // email not taken
            prisma.user.create.mockResolvedValue(mockUser);
            prisma.profile.create.mockResolvedValue({});

            const result = await service.register({
                email: 'new@demo.com',
                password: 'Password123',
                displayName: '新規ユーザー',
            });

            expect(result).toHaveProperty('accessToken');
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: { email: 'new@demo.com', password: '$hashed$' },
            });
            expect(prisma.profile.create).toHaveBeenCalledWith({
                data: { id: 'user-1', displayName: '新規ユーザー' },
            });
        });

        it('should throw ConflictException when email already exists', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);

            await expect(
                service.register({ email: 'test@demo.com', password: 'Password123', displayName: 'dup' }),
            ).rejects.toThrow(ConflictException);
        });
    });

    // ─── refreshTokens ───

    describe('refreshTokens', () => {
        it('should return new token pair with valid refresh token', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.refreshTokens('valid-refresh-token');

            expect(result).toHaveProperty('accessToken');
            expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token', {
                secret: 'secret-key',
            });
        });

        it('should throw UnauthorizedException with invalid refresh token', async () => {
            (jwtService.verify as jest.Mock).mockImplementation(() => {
                throw new Error('invalid');
            });

            await expect(service.refreshTokens('bad-token')).rejects.toThrow(UnauthorizedException);
        });
    });

    // ─── getProfile ───

    describe('getProfile', () => {
        it('should return user profile with roles', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUserWithRelations);

            const result = await service.getProfile('user-1');

            expect(result).toEqual({
                id: 'user-1',
                email: 'test@demo.com',
                displayName: 'テスト太郎',
                tenantIds: ['tenant-1'],
                roles: [{ tenantId: 'tenant-1', role: 'member' }],
            });
        });

        it('should throw UnauthorizedException when user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.getProfile('nonexistent')).rejects.toThrow(UnauthorizedException);
        });
    });
});
