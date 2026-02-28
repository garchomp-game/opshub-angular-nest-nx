import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectWorkflowDto {
    @ApiProperty({ description: '差戻し理由' })
    @IsNotEmpty()
    @IsString()
    reason: string;
}
