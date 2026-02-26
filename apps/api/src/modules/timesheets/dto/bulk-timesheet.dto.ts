import {
    IsString,
    IsOptional,
    IsNumber,
    IsDateString,
    IsNotEmpty,
    IsUUID,
    IsArray,
    ValidateNested,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkTimesheetEntryDto {
    @IsOptional()
    @IsUUID()
    id?: string;

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

export class BulkTimesheetDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkTimesheetEntryDto)
    entries: BulkTimesheetEntryDto[];

    @IsOptional()
    @IsArray()
    @IsUUID(undefined, { each: true })
    deletedIds?: string[];
}
