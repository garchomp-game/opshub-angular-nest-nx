import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ description: 'メールアドレス', example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'パスワード（8文字以上）', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string;
}
