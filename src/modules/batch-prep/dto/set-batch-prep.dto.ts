import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayNotEmpty, IsInt, IsOptional, ValidateIf } from "class-validator";
import { IsValidProcessingDate } from "./create-batch.dto";

export class SetBatchPrepDto {

    @ApiProperty({
        type: [Number],
        description: "Array of county IDs",
        example: [1, 2],
    })
    @ArrayNotEmpty({ message: 'The list of IDs should not be empty.' })
    @IsInt({ each: true, message: 'Each ID must be an integer.' })
    countyIds?: number[];

    @ApiProperty({
        type: [Number],
        description: "Array of ticket IDs",
        example: [1, 2],
    })
    @ArrayNotEmpty({ message: 'The list of IDs should not be empty.' })
    @IsInt({ each: true, message: 'Each ID must be an integer.' })
    ticketIds?: number[];

    @IsOptional()
    @ApiPropertyOptional({
        type: [Number],
        description: "Array of ticket IDs",
        example: [1, 2],
    })
    cityIds?: number[];

}

export class DeleteBatchPrepDto {

    @ApiPropertyOptional({
        type: [Number],
        description: "Array of ticket IDs",
        example: [1, 2],
    })
    @IsInt({ each: true, message: 'Each ID must be an integer.' })
    ticketIds?: number[];

    @IsInt()
    @IsOptional()
    @ApiPropertyOptional({
        description: "Enter batch ID",
        example: 1
    })
    @ValidateIf((b) => b.batchId)
    batchId: number;

}

export class GenerateBatchPrepRoundDto {

    @ApiProperty({
        type: [Number],
        description: "Array of county IDs",
        example: [1, 2],
    })
    @ArrayNotEmpty({ message: 'The list of IDs should not be empty.' })
    @IsInt({ each: true, message: 'Each ID must be an integer.' })
    countyIds?: number[];

    @IsOptional()
    @ApiPropertyOptional({
        type: [Number],
        description: "Array of city IDs",
        example: [1, 2],
    })
    @ArrayNotEmpty({ message: 'The list of IDs should not be empty.' })
    cityIds?: number[];

    @IsOptional()
    @IsValidProcessingDate()
    @ValidateIf((d) => d.dateProcessing)
    @ApiPropertyOptional({
        description: "Enter processing date",
        example: "2024-11-25",
    })
    dateProcessing: Date;

}