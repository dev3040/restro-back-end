import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, ValidationArguments } from "class-validator";
import { OrderDir } from "src/shared/enums/order-dir.enum";

export class PageQueryDto {

    @IsNumberString({}, { message: "Offset contain only number" })
    @IsNotEmpty({ message: "Please enter offset" })
    @ApiProperty({
        description: "Enter offset",
        example: 0
    })
    offset: number;

    @IsNumberString({}, { message: "Limit contain only number" })
    @IsNotEmpty({ message: "Please enter limit" })
    @ApiProperty({
        description: "Enter limit ",
        example: 10
    })
    limit: number;

    @IsNumberString({}, { message: "Ticket ID contain only number" })
    @IsNotEmpty({ message: "Please enter ticket ID" })
    @ApiProperty({
        description: "Enter ticket ID",
        example: 1
    })
    ticketId: number;

    @IsOptional()
    @IsString({ message: "Order by contain only string" })
    @ApiPropertyOptional({
        description: "Please enter order by (created_at)",
        example: "created_at"
    })
    orderBy: string;

    @IsOptional()
    @IsEnum(["DESC", "ASC"], {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
                return `Please select order dir.`;
            } else {
                return `Please select a valid order dir('DESC', 'ASC').`;
            }
        }
    })
    @ApiPropertyOptional({
        description: "Please select orderdir (DESC,ASC)",
        example: "DESC"
    })
    orderDir: OrderDir;

}

export class StampPageQueryDto {
    @IsNumberString(
        {},
        {
            message: "Offset contain only number"
        }
    )
    @IsNotEmpty({ message: "Please enter offset" })
    @ApiProperty({
        description: "Enter offset",
        example: 0
    })
    offset: number;

    @IsNumberString(
        {},
        {
            message: "Limit contain only number"
        }
    )
    @IsNotEmpty({
        message: "Please enter limit"
    })
    @ApiProperty({
        description: "Enter limit ",
        example: 10
    })
    limit: number;

    @IsString({
        message: "Order by contain only string"
    })
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
        description: "Please select orderdir (DESC,ASC)",
        example: "DESC"
    })
    orderDir: OrderDir;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter value for add on',
        example: 'true',
    })
    isAddOn: boolean;

    @IsNumberString({}, { message: "Ticket ID contain only number" })
    @IsNotEmpty({ message: "Please enter ticket id" })
    @ApiProperty({
        description: "Enter ticketId",
        example: 0
    })
    ticketId: number;

}
