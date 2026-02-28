import {
    IsString, IsOptional, MaxLength, IsUUID,
    IsDateString, IsIn, IsNumber, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskDto {
    @ApiPropertyOptional({ description: 'タスクタイトル', maxLength: 200 })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    title?: string;

    @ApiPropertyOptional({ description: '説明' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: '担当者ID（UUID）', nullable: true })
    @IsOptional()
    @IsUUID()
    assigneeId?: string | null;

    @ApiPropertyOptional({ description: '優先度', enum: ['high', 'medium', 'low'] })
    @IsOptional()
    @IsIn(['high', 'medium', 'low'])
    priority?: string;

    @ApiPropertyOptional({ description: '期限', example: '2026-03-31', nullable: true })
    @IsOptional()
    @IsDateString()
    dueDate?: string | null;

    @ApiPropertyOptional({ description: '見積工数（時間）', minimum: 0, maximum: 999, nullable: true })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(999)
    estimatedHours?: number | null;
}

export class ChangeTaskStatusDto {
    @ApiProperty({ description: 'タスクステータス', enum: ['todo', 'in_progress', 'done'] })
    @IsIn(['todo', 'in_progress', 'done'])
    status: string;
}
