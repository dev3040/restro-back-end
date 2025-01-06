import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, ValidationArguments } from "class-validator";
import { OrderDir } from "../enums/order-dir.enum";
import { IsActive } from "../enums/is-active.enum";

export class PageQueryDto {
    @IsNumberString({}, { message: "Offset contain only number" })
    @IsNotEmpty({ message: "Please enter offset" })
    @ApiProperty({
        description: "Enter offset ",
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

    @IsString({
        message: "Order by contain only string"
    })
    @ApiProperty({
        description: "Please enter order by (id, firstName, lastName)",
        example: "id"
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

    @ApiPropertyOptional({ description: "Enter search value" })
    search: string;

    @ApiPropertyOptional({ description: "Enter isDealer value" })
    isDealer: boolean;

    @ApiPropertyOptional({ description: "Enter isElt value" })
    isElt: boolean;

    @IsOptional()
    @IsEnum(["active", "inactive", "all"], {
        message: () => {
            return `Please select a valid active status (active,inactive,all)`;
        }
    })
    @ApiPropertyOptional({
        description: "Enter active status (active,inactive,all')"
    })
    activeStatus: IsActive;
}
