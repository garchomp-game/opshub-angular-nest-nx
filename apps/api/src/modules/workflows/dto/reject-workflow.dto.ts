import { IsNotEmpty, IsString } from 'class-validator';

export class RejectWorkflowDto {
    @IsNotEmpty()
    @IsString()
    reason: string;
}
