import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@shared/types';

export class InviteUserDto {
    @IsEmail()
    email: string;

    @IsEnum(Role)
    role: Role;

    @IsOptional()
    @IsString()
    displayName?: string;
}
