import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, Validate, ValidateNested } from 'class-validator';
import { VehicleUsageType } from 'src/shared/enums/vehicle-usage-type';
import { VehicleUsedType } from 'src/shared/enums/vehicle-used.enum';
import { AddFMVMasterDTO } from './add-fmv-master.dto';
import { SevenDigitsBeforeDotValidator } from 'src/modules/trade-in-info/dto/add-trade-in-info.dto';

export class VinInfoDto {
    @IsNotEmpty()
    // @MaxLength(17, { message: "VIN is too long. It should be maximum 17 characters.&&&vinNumber" })
    // @MinLength(8, { message: "VIN is too short. It should be minimum 8 characters.&&&vinNumber" })
    @ApiProperty({
        description: 'Please enter VIN',
        example: '1FTYE1Y85PKB27846',
    })
    vinNumber: string;

    @ApiProperty({ description: 'Year of manufacture', example: 2010 })
    @IsOptional()
    year: number;

    @ApiProperty({ description: 'Model of the vehicle', example: 'Ford' })
    @IsString()
    @IsOptional()
    model: string;

    @ApiProperty({ description: 'Make of the vehicle', example: 'Accord' })
    @IsString()
    @IsOptional()
    make: string;

    @ApiProperty({ description: 'Product class of the vehicle', example: 'Sedan' })
    @IsOptional()
    @IsString()
    productClass: string;

    @ApiProperty({ description: 'type of the vehicle', example: 'Trailer' })
    @IsOptional()
    @IsString()
    type: string;

    @ApiProperty({ description: 'Body style of the vehicle', example: 'Sedan' })
    @IsOptional()
    @IsString()
    bodyStyle?: string;

    @ApiProperty({ description: 'Gross Vehicle Weight Rating', example: '5000 lbs' })
    @IsOptional()
    @IsString()
    gvwr: string;

    @ApiProperty({ description: 'Gross Vehicle Weight', example: '5000lbs' })
    @IsOptional()
    @IsString()
    gvw: string;

    @ApiProperty({ description: 'Primary color of the vehicle', example: 1 })
    @IsOptional()
    primaryColorId?: number;

    @ApiProperty({ description: 'Secondary color of the vehicle', example: 1 })
    @IsOptional()
    secondaryColorId?: number;

    @ApiProperty({ description: 'Number of cylinders in the engine', example: 4 })
    cylinders?: number;

    @ApiProperty({ description: 'Primary fuel type of the vehicle', example: 'Gasoline' })
    @IsOptional()
    @IsString()
    primaryFuelType: string;

    @ApiProperty({ description: 'Secondary fuel type of the vehicle', example: 'Electric' })
    @IsOptional()
    @IsString()
    secondaryFuelType?: string;

    @ApiProperty({ description: 'Type of engine', example: 'V6' })
    @IsOptional()
    @IsString()
    engineType?: string;

    @ApiProperty({ description: 'Number of doors in the vehicle', example: 4 })
    @IsOptional()
    noOfDoors?: number;

    @ApiProperty({ description: 'Year of valuation for Georgia fair market value', example: '2021' })
    @IsOptional()
    @IsString()
    gaFmvValucationYear?: string;

    @ApiProperty({ description: 'Type of vehicle (new ,used)', enum: VehicleUsedType, example: 'used' })
    @IsOptional()
    @IsEnum(['new', 'used'], {
        message: () => {
            return `Please select a valid vehicle type(new, used).`;
        },
    })
    vehicleNewUsed?: VehicleUsedType;

    @ApiProperty({ description: 'Shipping weight of the vehicle', example: '3500 lbs' })
    @IsOptional()
    @IsString()
    shippingWeight?: string;

    @ApiProperty({ description: 'Type of vehicle usage', enum: VehicleUsageType, example: 'private' })
    @IsOptional()
    @IsEnum(['commercials', 'private'], {
        message: () => {
            return `Please select a valid vehicle use(commercials, private).&&&vehicleUse`;
        },
    })
    vehicleUse?: VehicleUsageType;

    @ApiProperty({ description: 'Additional shipping information', example: 'Shipped via which transport' })
    @IsOptional()
    @IsString()
    shippingInfo?: string;

    @ApiProperty({ description: 'Whether emissions testing is required', example: true })
    @IsOptional()
    emissions: boolean;

    @ApiProperty({ description: 'Whether the token is active', example: true })
    @IsOptional()
    isActive?: boolean;
}

export class UpdateVinInfoDto extends PartialType(VinInfoDto) {
    @IsOptional()
    @MaxLength(17, { message: "VIN number is too long. It should be maximum 17 characters.&&&vinNumber" })
    @MinLength(8, { message: "VIN number is too short. It should be minimum 8 characters.&&&vinNumber" })
    @ApiProperty({
        description: 'Please enter Vin number',
        example: '1FTYE1Y85PKB27846',
    })
    vinNumber: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Please enter fmv valucation data',
        example: [{
            year: 2022,
            price: "1000.50",
            valueType: 'Type A',
            source: 'Source X',
            dateEntered: '2024-04-23',
            vinFirstHalf: 'ABC12345',
            series: "SCOOTER"
        }],
    })
    @ValidateNested()
    @Type(() => AddFMVMasterDTO)
    fmvMasters: AddFMVMasterDTO[];

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Please enter ticket id',
        example: '5J8YD9H4-N',
    })
    ticketId: number;
}

export class UpdatePdfDataDto {

    @IsOptional()
    @MaxLength(17, { message: "VIN number is too long. It should be maximum 17 characters.&&&vinNumber" })
    @MinLength(8, { message: "VIN number is too short. It should be minimum 8 characters.&&&vinNumber" })
    @ApiPropertyOptional({
        description: 'Please enter Vin number',
        example: '5J8YD9H4-N',
    })
    vinNumber: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Please enter ticket id',
        example: '5J8YD9H4-N',
    })
    ticketId: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    @ApiPropertyOptional({
        description: 'Please enter year',
        example: 2018,
    })
    year?: number;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({
        description: 'Please enter series',
        example: "BASE",
    })
    series?: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter last Odometer Reading.',
        example: '1234567.908',
        default: '0.0'
    })
    @Validate(SevenDigitsBeforeDotValidator, {
        message: 'Invalid format. Must contain up to 7 digits before the decimal point and up to 3 digits after the decimal point.'
    })
    price?: string;


}
