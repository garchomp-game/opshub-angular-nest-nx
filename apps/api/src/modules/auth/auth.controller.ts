import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from './types/auth.types';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
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
}
