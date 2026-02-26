import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: jest.Mocked<AuthService>;

    const mockTokenPair = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
    };

    const mockUser = {
        id: 'user-1',
        email: 'test@demo.com',
        displayName: 'テスト太郎',
        tenantIds: ['tenant-1'],
        roles: [{ tenantId: 'tenant-1', role: 'member' }],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        login: jest.fn().mockResolvedValue(mockTokenPair),
                        register: jest.fn().mockResolvedValue(mockTokenPair),
                        refreshTokens: jest.fn().mockResolvedValue(mockTokenPair),
                        logout: jest.fn().mockResolvedValue(undefined),
                        getProfile: jest.fn().mockResolvedValue(mockUser),
                    },
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get(AuthService) as jest.Mocked<AuthService>;
    });

    afterEach(() => jest.clearAllMocks());

    // ─── login ───

    describe('POST /auth/login', () => {
        it('should delegate to AuthService.login and return token pair', async () => {
            const dto = { email: 'test@demo.com', password: 'Password123' };

            const result = await controller.login(dto);

            expect(authService.login).toHaveBeenCalledWith(dto);
            expect(result).toEqual(mockTokenPair);
        });
    });

    // ─── register ───

    describe('POST /auth/register', () => {
        it('should delegate to AuthService.register and return token pair', async () => {
            const dto = { email: 'new@demo.com', password: 'Password123', displayName: '新規' };

            const result = await controller.register(dto);

            expect(authService.register).toHaveBeenCalledWith(dto);
            expect(result).toEqual(mockTokenPair);
        });
    });

    // ─── refresh ───

    describe('POST /auth/refresh', () => {
        it('should delegate to AuthService.refreshTokens', async () => {
            const dto = { refreshToken: 'old-refresh-token' };

            const result = await controller.refresh(dto);

            expect(authService.refreshTokens).toHaveBeenCalledWith('old-refresh-token');
            expect(result).toEqual(mockTokenPair);
        });
    });

    // ─── logout ───

    describe('POST /auth/logout', () => {
        it('should delegate to AuthService.logout', async () => {
            const result = await controller.logout(mockUser as any);

            expect(authService.logout).toHaveBeenCalledWith('user-1');
            expect(result).toEqual({ message: 'Logged out successfully' });
        });
    });

    // ─── me ───

    describe('GET /auth/me', () => {
        it('should delegate to AuthService.getProfile', async () => {
            const result = await controller.me(mockUser as any);

            expect(authService.getProfile).toHaveBeenCalledWith('user-1');
            expect(result).toEqual(mockUser);
        });
    });
});
