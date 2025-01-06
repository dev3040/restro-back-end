import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumberString, IsOptional, MaxLength, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OdometerCode } from 'src/shared/enums/odometer-code.enum';
import { OdometerUnit } from 'src/shared/enums/odometer-unit.enum';
import { IsValidNumber } from 'src/shared/decorators/is-number.decorators';
import { IsPastDateValidator } from 'src/shared/decorators/past-date.decorator';

class BrandDto {
    @ApiProperty({
        description: 'Brand',
        example: 'Salvage'
    })
    brand: string;

    @ValidateIf(o => o.brandDate)
    @IsDateString()
    @ApiProperty({
        description: 'Brand date',
        example: '2024-05-01'
    })
    brandDate: Date;

    @MaxLength(50, { message: "qqqqqqqqqqq" })
    @ApiProperty({
        description: 'Jurisdiction',
        example: 'CA',
    })
    jurisdiction: string;
}

export class TitleInfoDto {

    @IsNotEmpty({ message: 'Please enter ticket id.&&&ticketId' })
    @IsValidNumber({ message: 'Ticket ID must be a number.&&&ticketId' })
    @ApiProperty({
        description: 'Ticket ID',
        example: 115
    })
    ticketId: number;

    @ValidateIf(o => o.stateId)
    @IsValidNumber({ message: 'State ID must be a number.&&&stateId' })
    @ApiPropertyOptional({
        example: 1,
        description: 'State id',
        nullable: true
    })
    stateId: number;

    @IsOptional()
    // @ValidateIf(o => o.currentTitle)
    @MaxLength(15, { message: "wwwwwwwwwwwwww" })
    @ApiPropertyOptional({
        example: 'XYZ123',
        description: 'Current title',
        nullable: true
    })
    currentTitle?: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'New or Old',
        example: true,
    })
    isNew: boolean;

    @IsOptional()
    @ValidateIf(o => o.brandData)
    @ApiPropertyOptional({
        description: 'List of brands associated with the title',
        isArray: true,
        type: BrandDto,
    })
    @ValidateNested({ each: true })
    @Type(() => BrandDto)
    brands?: BrandDto[];

    @IsOptional()
    @ValidateIf(o => o.odometerCode)
    @IsEnum(OdometerCode, {
        message: `Select a valid odometer code.(actual,exceeds_mechanical_limits,not_actual_milage,exempt).&&&odometerCode&&&ERROR_MESSAGE`
    })
    @ApiPropertyOptional({
        enum: OdometerCode,
        description: 'Odometer code',
        default: OdometerCode.ACTUAL
    })
    odometerCode?: OdometerCode;

    @IsOptional()
    @ValidateIf(o => o.odometerReading)
    @IsNumberString()
    @ApiPropertyOptional({
        description: 'Odometer reading',
        example: '12000'
    })
    odometerReading?: string;

    @IsOptional()
    @ValidateIf(o => o.odometerUnit)
    @IsEnum(OdometerUnit, { message: `Select a valid odometer unit.(miles).&&&odometerUnit&&&ERROR_MESSAGE` })
    @ApiPropertyOptional({
        description: 'Odometer unit',
        enum: OdometerUnit,
    })
    odometerUnit?: OdometerUnit;

    @IsOptional()
    @IsPastDateValidator({ message: 'Odometer date must be a past date.&&&odometerDate&&&Odometer date must be a past date.' })
    @IsDateString()
    @ApiPropertyOptional({
        description: 'Odometer date',
        example: '2024-04-30'
    })
    odometerDate?: Date;
}
