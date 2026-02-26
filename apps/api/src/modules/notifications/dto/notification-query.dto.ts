import { IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class NotificationQueryDto {
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    unreadOnly?: boolean;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}
