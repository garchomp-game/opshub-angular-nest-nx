import { IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationQueryDto {
    @ApiPropertyOptional({ description: '未読のみ', default: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    unreadOnly?: boolean;

    @ApiPropertyOptional({ description: 'ページ番号', minimum: 1 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: '1ページの件数', minimum: 1, maximum: 100 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}
