import {
    IsString, IsOptional, IsDateString, IsIn, MaxLength, IsUUID,
} from 'class-validator';

export class UpdateProjectDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsIn(['planning', 'active', 'completed', 'cancelled'])
    status?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsUUID()
    pmId?: string;
}
