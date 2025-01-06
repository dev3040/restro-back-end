import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class StateTransferDto {

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter state transfer value',
        example: false,
        nullable: true
    })
    isStateTransfer: boolean;
}
