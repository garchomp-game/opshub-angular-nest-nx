import { IsEnum } from 'class-validator';
import { Role } from '@shared/types';

export class UpdateUserRoleDto {
    @IsEnum(Role)
    role: Role;
}
