import {
    IsString, IsOptional, IsNotEmpty, MaxLength, IsUUID,
    IsDateString, IsIn, IsNumber, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
    @ApiProperty({ description: 'タスクタイトル', maxLength: 200 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(200)
    title: string;

    @ApiPropertyOptional({ description: '説明' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: '担当者ID（UUID）' })
    @IsOptional()
    @IsUUID()
    assigneeId?: string;

    @ApiPropertyOptional({ description: '優先度', enum: ['high', 'medium', 'low'], default: 'medium' })
    @IsOptional()
    @IsIn(['high', 'medium', 'low'])
    priority?: string = 'medium';

    @ApiPropertyOptional({ description: '期限', example: '2026-03-31' })
    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @ApiPropertyOptional({ description: '見積工数（時間）', minimum: 0, maximum: 999 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(999)
    estimatedHours?: number;
}
