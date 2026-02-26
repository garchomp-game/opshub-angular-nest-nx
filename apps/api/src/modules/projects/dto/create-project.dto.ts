import {
    IsString, IsOptional, IsDateString, IsIn, IsNotEmpty, MaxLength, IsUUID,
} from 'class-validator';

export class CreateProjectDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsIn(['planning', 'active', 'completed', 'cancelled'])
    status?: string = 'planning';

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsNotEmpty()
    @IsUUID()
    pmId: string;
}
