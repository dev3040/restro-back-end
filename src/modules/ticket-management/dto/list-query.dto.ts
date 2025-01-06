import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBooleanString, IsEnum, IsNumberString, IsOptional, ValidateIf, ValidationArguments } from 'class-validator';
import { OrderDir } from 'src/shared/enums/order-dir.enum';
import { TaskGroupByEnum } from 'src/shared/enums/task-group-by.enum';
import { TicketOrderByEnum } from 'src/shared/enums/ticket-order-by.enum';
import { orderByEnumValues, taskGroupByEnumValues, taskOrderByFieldsEnumValues } from 'src/shared/utility/enum-helper-functions';

export class PageQueryDto {
    @IsOptional()
    @ValidateIf(o => o.offset)
    @IsNumberString({}, { message: 'Offset contain only number' })
    @ApiPropertyOptional({
        description: 'Enter offset ',
        example: 0,
    })
    offset: number;

    @IsOptional()
    @ValidateIf(o => o.limit)
    @IsNumberString({}, { message: 'Limit contain only number' })
    @ApiPropertyOptional({
        description: 'Enter limit ',
        example: 10,
    })
    limit: number;

    @IsOptional()
    @ValidateIf(o => o.orderBy)
    @IsEnum(TicketOrderByEnum, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == 'undefined' || args.value == '' || args.value == null) {
                return `Please select order by field.(${taskOrderByFieldsEnumValues()}).&&&orderBy&&&ERROR_MESSAGE`;
            } else {
                return `Please select a valid order by field (${taskOrderByFieldsEnumValues()}).&&&orderBy&&&ERROR_MESSAGE`;
            }
        },
    })
    @ApiPropertyOptional({
        description: `Select order by field (${taskOrderByFieldsEnumValues()})`,
        example: TicketOrderByEnum.ID,
    })
    orderBy: TicketOrderByEnum;

    @IsOptional()
    @ValidateIf(o => o.orderDir)
    @IsEnum(OrderDir, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == 'undefined' || args.value == '' || args.value == null) {
                return `Please select order dir.&&&orderDir&&&ERROR_MESSAGE`;
            } else {
                return `Please select a valid order dir(${orderByEnumValues()}).&&&orderDir&&&ERROR_MESSAGE`;
            }
        },
    })
    @ApiPropertyOptional({
        description: `Select order dir (${orderByEnumValues()})`,
        example: 'DESC',
    })
    orderDir: OrderDir;

    @IsOptional()
    @ValidateIf(o => o.groupBy)
    @IsEnum(['1', '2'], {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
                return `Enter group by value. (${taskGroupByEnumValues()})&&&groupBy&&&ERROR_MESSAGE`;
            } else {
                return `Enter a valid group by value. (${taskGroupByEnumValues()})&&&groupBy&&&ERROR_MESSAGE`;
            }
        }
    })
    @ApiPropertyOptional({
        description: `Enter group by value(${taskGroupByEnumValues()})`,
    })
    groupBy: TaskGroupByEnum;

    @IsOptional()
    @ApiPropertyOptional({
        description: "Enter search value"
    })
    search: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter from task start date(YYYY-MM-DD)',
        example: '2024-04-25',
    })
    taskStartToDate: Date;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter to task start date(YYYY-MM-DD)',
        example: '2024-04-30',
    })
    taskStartFromDate: Date;

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
        description: 'Enter to date purchased(YYYY-MM-DD)',
    })
    toPurchaseDate: Date;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter from date purchased(YYYY-MM-DD)',
    })
    fromPurchaseDate: Date;

    @IsOptional()
    @ValidateIf(o => o.statusIds)
    @Type(() => Number)
    @ApiPropertyOptional({
        description: 'Array of status ids',
        nullable: false
    })
    statusIds: Array<number>;

    @IsOptional()
    @ValidateIf(o => o.priorityIds)
    @Type(() => Number)
    @ApiPropertyOptional({
        description: 'Array of priority ids',
        nullable: true
    })
    priorityIds: Array<number>;

    @IsOptional()
    @Type(() => Number)
    @ApiPropertyOptional({
        description: 'Array of assigned user ids',
        example: [1, 2]
    })
    assignedUserIds: Array<number>;

    @IsOptional()
    @Type(() => Number)
    @ApiPropertyOptional({
        description: 'Array of department ids',
    })
    departmentIds: Array<number>

    @IsOptional()
    @Type(() => Number)
    @ApiPropertyOptional({
        description: 'Array of tag ids',
    })
    tagIds: Array<number>;

    @ValidateIf(o => o.isMeMode)
    @IsBooleanString()
    @ApiPropertyOptional({
        description: 'Indication whether Me mode is required'
    })
    isMeMode: boolean;

    @IsOptional()
    @ValidateIf(o => o.groupBy)
    @IsBooleanString()
    @ApiPropertyOptional({
        description: 'Indication whether only grouping data is required'
    })
    onlyGroupingData: boolean;

}


export class GlobalSearchPageQueryDto {
    @IsOptional()
    @ValidateIf(o => o.offset)
    @IsNumberString({}, { message: 'Offset contain only number' })
    @ApiPropertyOptional({
        description: 'Enter offset ',
        example: 0,
    })
    offset: number;

    @IsOptional()
    @ValidateIf(o => o.limit)
    @IsNumberString({}, { message: 'Limit contain only number' })
    @ApiPropertyOptional({
        description: 'Enter limit ',
        example: 10,
    })
    limit: number;

    @IsOptional()
    @ValidateIf(o => o.orderBy)
    @IsEnum(TicketOrderByEnum, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == 'undefined' || args.value == '' || args.value == null) {
                return `Please select order by field.(${taskOrderByFieldsEnumValues()}).&&&orderBy&&&ERROR_MESSAGE`;
            } else {
                return `Please select a valid order by field (${taskOrderByFieldsEnumValues()}).&&&orderBy&&&ERROR_MESSAGE`;
            }
        },
    })
    @ApiPropertyOptional({
        description: `Select order by field (${taskOrderByFieldsEnumValues()})`,
        example: TicketOrderByEnum.ID,
    })
    orderBy: TicketOrderByEnum;

    @IsOptional()
    @ValidateIf(o => o.orderDir)
    @IsEnum(OrderDir, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == 'undefined' || args.value == '' || args.value == null) {
                return `Please select order dir.&&&orderDir&&&ERROR_MESSAGE`;
            } else {
                return `Please select a valid order dir(${orderByEnumValues()}).&&&orderDir&&&ERROR_MESSAGE`;
            }
        },
    })
    @ApiPropertyOptional({
        description: `Select order dir (${orderByEnumValues()})`,
        example: 'DESC',
    })
    orderDir: OrderDir;


    @IsOptional()
    @ApiPropertyOptional({
        description: "Enter search value"
    })
    search: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter to date purchased(YYYY-MM-DD)',
    })
    toDate: Date;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter from date purchased(YYYY-MM-DD)',
    })
    fromDate: Date;

}

