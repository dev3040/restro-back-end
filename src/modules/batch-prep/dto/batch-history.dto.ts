import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, ValidateIf, ValidationArguments } from "class-validator";
import { OrderDir } from "src/shared/enums/order-dir.enum";
import { pdfHistoryStatusEnumValues } from "src/shared/utility/enum-helper-functions";


export class BatchHistoryDto {
    @IsNumberString({}, { message: "Offset contain only number" })
    @IsNotEmpty({ message: "Enter offset" })
    @ApiProperty({
        description: "Enter offset ",
        example: 0
    })
    offset: number;

    @IsNumberString({}, { message: "Limit contain only number" })
    @IsNotEmpty({
        message: "Enter limit"
    })
    @ApiProperty({
        description: "Enter limit ",
        example: 10
    })
    limit: number;

    @IsString({ message: "Order by contain only string" })
    @ApiProperty({
        description: "Enter order by (created_at)",
        example: "created_at"
    })
    orderBy: string;

    @IsEnum(["DESC", "ASC"], {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
                return `Enter select order dir.`;
            } else {
                return `Enter select a valid order dir("DESC", "ASC").`;
            }
        }
    })
    @ApiProperty({
        description: "Select order dir (DESC,ASC)",
        example: "DESC"
    })
    orderDir: OrderDir;

    @IsOptional()
    @ValidateIf((d) => d.fromDate)
    @ApiPropertyOptional({
        description: "Enter pdf to generated date(YYYY-MM-DD)",
        example: "2024-10-12"
    })
    fromDate: Date;

    @IsOptional()
    @ValidateIf((d) => d.toDate)
    @ApiPropertyOptional({
        description: "Enter pdf from generated date(YYYY-MM-DD)",
        example: "2024-10-18"
    })
    toDate: Date;

    @ApiPropertyOptional({
        type: [Number],
        description: `Array of status IDs(${pdfHistoryStatusEnumValues()})`,
        example: [1],
    })
    @Type(() => Number)
    status: Array<number>;

}
