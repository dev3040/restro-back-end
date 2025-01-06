import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsNumberString, IsOptional, MaxLength, MinLength, Validate, ValidateIf, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { OdometerCodeEnum } from 'src/shared/enums/trade-in-info.enum';


@ValidatorConstraint({ name: 'sevenDigitsBeforeDot', async: false })
export class SevenDigitsBeforeDotValidator implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        if (typeof value !== 'string') {
            return false;
        }
        const regex = /^[0-9]{1,7}(?:\.[0-9]{1,3})?$/;
        return regex.test(value);
    }

    defaultMessage(args: ValidationArguments) {
        return 'Invalid format. Must contain up to 7 digits before the decimal point and up to 3 digits after the decimal point.';
    }
}


export class TradeInInfoDto {

    @IsNotEmpty()
    @IsOptional()
    @MaxLength(17, { message: "VIN number is too long. It should be maximum 17 characters.&&&vinNumber" })
    @MinLength(8, { message: "VIN number is too short. It should be minimum 8 characters.&&&vinNumber" })
    @ApiPropertyOptional({
        description: 'Please enter Vin number',
        example: '1FTYE1Y85PKB27846',
    })
    vinNumber: string;


    @IsNotEmpty({ message: 'Select odometer code.(actual, exceeds_mechanical_limits,exempt,not_actual_milage).&&&odometerCode&&&ERROR_MESSAGE.' })
    @IsOptional()
    @IsEnum(OdometerCodeEnum, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
                return `Select odometer code.(actual, exceeds_mechanical_limits,exempt,not_actual_milage).&&&odometerCode&&&ERROR_MESSAGE`;
            } else {
                return `Select valid odometer code(actual, exceeds_mechanical_limits,exempt,not_actual_milage).&&&odometerCode&&&ERROR_MESSAGE`;
            }
        }
    })
    @ApiPropertyOptional({
        description: `odometerCode (actual, exceeds_mechanical_limits).`,
        example: "actual",
    })
    odometerCode: OdometerCodeEnum;


    @ValidateIf(o => o.lastOdometerReading)
    @IsOptional()
    @IsNumberString()
    @MaxLength(10)
    @ApiPropertyOptional({
        description: 'Enter last Odometer Reading.',
        example: '123456'
    })
    lastOdometerReading: string;

    @ValidateIf(o => o.tradeInAllowance)
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter Trade in allowance.',
        example: '12.67',
    })
    @Validate(SevenDigitsBeforeDotValidator, {
        message: 'Invalid format. Must contain up to 7 digits before the decimal point and up to 3 digits after the decimal point.'
    })
    tradeInAllowance: string;

    @IsNumber()
    @IsNotEmpty({ message: 'Please enter Ticket id.' })
    @ApiProperty({
        description: 'Enter ticket id.',
        example: 2,
    })
    ticketId: number;
}

export class TradeInIdDto {
    @ValidateIf(o => !o.ticketId)
    @IsNumberString()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter id.',
        example: 35,
    })
    id: number;

    @ValidateIf(o => !o.id)
    @IsNumberString()
    @IsNotEmpty({ message: 'Enter Ticket id.' })
    @ApiPropertyOptional({
        description: 'Enter ticket id.',
        example: 2,
    })
    ticketId: number;
}

export class UpdateTradeInInfoDto extends PartialType(TradeInInfoDto) { }