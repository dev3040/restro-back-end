import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsInt } from "class-validator";

export class VinProfileDocsDto {
    @ApiProperty({
        type: [Number],
        description: "Array of ticket IDs",
        example: [1, 2],
    })
    @ArrayNotEmpty({ message: 'The list of IDs should not be empty.' })
    @IsInt({ each: true, message: 'Each ID must be an integer.' })
    docIds?: number[];

}