import {
    IsString, IsOptional, MaxLength, IsUUID,
    IsDateString, IsIn, IsNumber, Min, Max,
} from 'class-validator';

export class UpdateTaskDto {
    @IsOptional()
    @IsString()
    @MaxLength(200)
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    assigneeId?: string | null;

    @IsOptional()
    @IsIn(['high', 'medium', 'low'])
    priority?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string | null;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(999)
    estimatedHours?: number | null;
}

export class ChangeTaskStatusDto {
    @IsIn(['todo', 'in_progress', 'done'])
    status: string;
}
