import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class ResetMenuQueryDto {
    @ApiProperty({
        description: 'Branch ID for which to reset the menu',
        example: 1,
        required: true
    })
    @IsNotEmpty({ message: 'Branch ID is required' })
    @IsNumber({}, { message: 'Branch ID must be a number' })
    @Type(() => Number)
    branchId: number;
}
