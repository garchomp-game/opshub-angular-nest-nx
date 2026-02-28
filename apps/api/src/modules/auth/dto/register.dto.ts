import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ description: 'メールアドレス', example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'パスワード（大文字・小文字・数字を各1文字以上）', minLength: 8 })
    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'パスワードは大文字・小文字・数字を各1文字以上含む必要があります',
    })
    password: string;

    @ApiProperty({ description: '表示名', maxLength: 100 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    displayName: string;
}
