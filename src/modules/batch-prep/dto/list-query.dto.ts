import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, ValidationArguments } from "class-validator";
import { TicketTypes } from "src/shared/enums/county-location.enum";
import { IsActive } from "src/shared/enums/is-active.enum";
import { OrderDir } from "src/shared/enums/order-dir.enum";

export class PageQueryDto {
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

    @ApiPropertyOptional({ description: "Enter search value" })
    search: string;

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

    @IsOptional()
    @ApiPropertyOptional({
        description: `Ticket listing type(0- All, 1-Walk, 2-Drop, 3-Mail)`,
        example: TicketTypes.WALK,
    })
    ticketType: TicketTypes;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter to date purchased(YYYY-MM-DD)',
    })
    toPurchaseDate: Date;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter from date purchased(YYYY-MM-DD)',
    })
    fromPurchaseDate: Date;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter from date received(YYYY-MM-DD)',
    })
    toDocReceivedDate: Date;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter to date received(YYYY-MM-DD)',
    })
    fromDocReceivedDate: Date;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter from sent to batch prep (YYYY-MM-DD)',
    })
    toSentToBatchPrepDate: Date;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter to sent to batch prep (YYYY-MM-DD)',
    })
    fromSentToBatchPrepDate: Date;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter from task start date(YYYY-MM-DD)',
        example: '2024-04-25',
    })
    toTaskStartDate: Date;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter to task start date(YYYY-MM-DD)',
        example: '2024-04-30',
    })
    fromTaskStartDate: Date;
}
