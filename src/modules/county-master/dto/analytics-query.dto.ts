import { ApiProperty } from "@nestjs/swagger";
import { IsNumberString, IsOptional  } from "class-validator";


export class AnalyticsQueryDto {
    @IsNumberString()
    @IsOptional()
    @ApiProperty({
        description: "Enter year",
        example: 2024
    })
    year: number;

    @IsOptional()
    @ApiProperty({
        description: "Weekly graph flag",
        example: 2024
    })
    isWeekly: boolean;
}
