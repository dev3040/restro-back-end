import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength, ValidateIf, ValidateNested } from "class-validator";

export class CountyReportDto {

    @IsInt()
    @IsOptional()
    @ValidateIf((b) => b.batchId)
    batchId: number;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    comment?: string;
}

export class BatchCommentsArrayDto {

    @ApiPropertyOptional({
        description: "Enter Comment for batch",
        example: [{
            batchId: 2,
            comment: "Hey Shaun",
        }],
    })
    @ValidateNested()
    @Type(() => CountyReportDto)
    comments: CountyReportDto[];

    @IsOptional()
    @ApiPropertyOptional({
        type: [Number],
        description: "Array of batch IDs",
        example: [1, 2],
    })
    @Type(() => Number)
    @IsInt({ each: true, message: "Each ID must be an integer." })
    batchIds?: number[];
}