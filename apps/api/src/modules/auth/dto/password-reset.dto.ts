import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @ApiProperty({ description: 'パスワードリセット対象のメールアドレス', example: 'user@example.com' })
    @IsNotEmpty({ message: 'メールアドレスは必須です' })
    @IsEmail({}, { message: 'メールアドレスの形式が正しくありません' })
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({ description: 'パスワードリセットトークン' })
    @IsNotEmpty({ message: 'トークンは必須です' })
    @IsString()
    token: string;

    @ApiProperty({ description: '新しいパスワード (8文字以上、英数字混在)', minLength: 8 })
    @IsNotEmpty({ message: 'パスワードは必須です' })
    @IsString()
    @MinLength(8, { message: 'パスワードは8文字以上である必要があります' })
    @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, { message: 'パスワードは英字と数字の両方を含む必要があります' })
    newPassword: string;
}
