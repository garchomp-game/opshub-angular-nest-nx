import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from './types/auth.types';

@ApiTags('auth')
@Controller('auth')
@SkipThrottle()
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Throttle({ login: { ttl: 60_000, limit: 10 } })  // 1分あたり10回
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Public()
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshTokens(dto.refreshToken);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@CurrentUser() user: AuthUser) {
        await this.authService.logout(user.id);
        return { message: 'Logged out successfully' };
    }

    @Get('me')
    async me(@CurrentUser() user: AuthUser) {
        return this.authService.getProfile(user.id);
    }

    @Public()
    @Throttle({ forgot: { ttl: 60_000, limit: 3 } })  // 1分あたり3回
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        await this.authService.forgotPassword(dto.email);
        return { message: 'パスワードリセットメールを送信しました（登録済みの場合）' };
    }

    @Public()
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() dto: ResetPasswordDto) {
        await this.authService.resetPassword(dto.token, dto.newPassword);
        return { message: 'パスワードが正常にリセットされました' };
    }
}
