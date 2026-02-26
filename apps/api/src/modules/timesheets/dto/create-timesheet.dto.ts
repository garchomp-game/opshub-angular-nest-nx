import {
    IsString,
    IsOptional,
    IsNumber,
    IsDateString,
    IsNotEmpty,
    IsUUID,
    Min,
    Max,
} from 'class-validator';

export class CreateTimesheetDto {
    @IsNotEmpty()
    @IsUUID()
    projectId: string;

    @IsOptional()
    @IsUUID()
    taskId?: string;

    @IsNotEmpty()
    @IsDateString()
    workDate: string;

    @IsNumber()
    @Min(0.25)
    @Max(24)
    hours: number;

    @IsOptional()
    @IsString()
    note?: string;
}
