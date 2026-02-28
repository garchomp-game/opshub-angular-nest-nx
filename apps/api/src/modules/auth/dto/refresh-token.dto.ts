import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
    @ApiProperty({ description: 'リフレッシュトークン' })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}
