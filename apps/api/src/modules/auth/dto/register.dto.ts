import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty, Matches } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'パスワードは大文字・小文字・数字を各1文字以上含む必要があります',
    })
    password: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    displayName: string;
}
