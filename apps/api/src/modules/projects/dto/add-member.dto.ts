import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMemberDto {
    @ApiProperty({ description: 'ユーザーID（UUID）' })
    @IsNotEmpty()
    @IsUUID()
    userId: string;
}
