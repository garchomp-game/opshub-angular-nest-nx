import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserStatusDto {
    @ApiProperty({ description: '有効/無効フラグ' })
    @IsBoolean()
    active: boolean;
}
