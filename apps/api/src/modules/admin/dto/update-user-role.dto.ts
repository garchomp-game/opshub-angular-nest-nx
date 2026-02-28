import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@shared/types';

export class UpdateUserRoleDto {
    @ApiProperty({ description: '変更先ロール', enum: Role })
    @IsEnum(Role)
    role: Role;
}
