import {
    IsString, IsOptional, IsNotEmpty, MaxLength, IsUUID,
    IsDateString, IsIn, IsNumber, Min, Max,
} from 'class-validator';

export class CreateTaskDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(200)
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    assigneeId?: string;

    @IsOptional()
    @IsIn(['high', 'medium', 'low'])
    priority?: string = 'medium';

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(999)
    estimatedHours?: number;
}
