import { IsIn, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const EXPORTABLE_TABLES = ['users', 'projects', 'workflows', 'timesheets', 'expenses'] as const;
export type ExportableTable = (typeof EXPORTABLE_TABLES)[number];

export class ExportTenantDto {
    @ApiProperty({ enum: ['json', 'csv'], description: 'エクスポート形式' })
    @IsIn(['json', 'csv'])
    format: 'json' | 'csv';

    @ApiProperty({
        enum: EXPORTABLE_TABLES,
        isArray: true,
        description: 'エクスポート対象テーブル',
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsIn(EXPORTABLE_TABLES, { each: true })
    include: ExportableTable[];
}
