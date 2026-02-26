import { IsOptional, IsString, MaxLength, IsObject } from 'class-validator';

export class UpdateTenantDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsObject()
    settings?: Record<string, unknown>;
}
