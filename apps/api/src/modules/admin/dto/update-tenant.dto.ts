import { IsOptional, IsString, MaxLength, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantDto {
    @ApiPropertyOptional({ description: 'テナント名', maxLength: 100 })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({ description: 'テナント設定' })
    @IsOptional()
    @IsObject()
    settings?: Record<string, unknown>;
}
