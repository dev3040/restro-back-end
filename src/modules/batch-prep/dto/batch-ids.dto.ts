import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty } from 'class-validator';

export class BatchIdsDto {
    @ApiProperty({
        type: [Number],
        description: "Array of batch IDs",
        example: [1, 2],
    })
    @ArrayNotEmpty({ message: "The list of IDs should not be empty." })
    batchIds?: number[];

}