import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, ValidateIf, ValidationArguments } from "class-validator";
import { TicketTypes } from "src/shared/enums/county-location.enum";
import { OrderDir } from "src/shared/enums/order-dir.enum";

export class BatchQueryDto {

    @IsInt()
    @Type(() => Number)
    @IsOptional()
    @ApiPropertyOptional({
        description: "Enter batch ID",
        example: 1
    })
    @ValidateIf((b) => b.batchId)
    batchId: number;

    @IsNumberString({}, { message: "Offset contain only number" })
    @IsNotEmpty({ message: "Please enter offset" })
    @ApiProperty({
        description: "Enter offset ",
        example: 0
    })
    offset: number;

    @IsNumberString({}, { message: "Limit contain only number" })
    @IsNotEmpty({
        message: "Please enter limit"
    })
    @ApiProperty({
        description: "Enter limit ",
        example: 10
    })
    limit: number;

    @IsString({ message: "Order by contain only string" })
    @ApiProperty({
        description: "Please enter order by (created_at)",
        example: "created_at"
    })
    orderBy: string;

    @IsEnum(["DESC", "ASC"], {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
                return `Please select order dir.`;
            } else {
                return `Please select a valid order dir('DESC', 'ASC').`;
            }
        }
    })
    @ApiProperty({
        description: "Please select order dir (DESC,ASC)",
        example: "DESC"
    })
    orderDir: OrderDir;

    @IsOptional()
    @Type(() => Number)
    @IsEnum(TicketTypes, {
        message: "County processing type must be a valid integer value (ALL = 0,WALK = 1, DROP = 2, MAIL = 3)."
    })
    @ApiPropertyOptional({
        description: "County processing type (ALL = 0,WALK = 1, DROP = 2, MAIL = 3)",
        example: TicketTypes.MAIL,
        enum: TicketTypes
    })
    countyProcessingType?: TicketTypes;
}

export class ProcessingCountsDto {

    @IsInt()
    @IsOptional()
    @Type(() => Number)
    @ApiPropertyOptional({
        description: "Enter batch ID",
        example: 1
    })
    @ValidateIf((b) => b.batchId)
    batchId: number;

}