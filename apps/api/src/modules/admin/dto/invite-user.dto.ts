import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@shared/types';

export class InviteUserDto {
    @ApiProperty({ description: '招待先メールアドレス', example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: '付与するロール', enum: Role })
    @IsEnum(Role)
    role: Role;

    @ApiPropertyOptional({ description: '表示名' })
    @IsOptional()
    @IsString()
    displayName?: string;
}
