import {
    IsString, IsNotEmpty, IsOptional, IsIn, IsInt, Min, Max, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    q!: string;

    @IsOptional()
    @IsIn(['all', 'workflows', 'projects', 'tasks', 'expenses'])
    category?: string = 'all';

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}
