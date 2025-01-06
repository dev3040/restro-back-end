import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { VehicleUsageType } from 'src/shared/enums/vehicle-usage-type';
import { VehicleUsedType } from 'src/shared/enums/vehicle-used.enum';
import { AddFMVMasterDTO } from './add-fmv-master.dto';
import { Type } from 'class-transformer';


export class SetVinInfoDto {

    @IsOptional()
    @ValidateIf(o => o.vinNumber)
    @MaxLength(17, { message: "VIN is too long. It should be maximum 17 characters.&&&vinNumber" })
    @MinLength(8, { message: "VIN is too short. It should be minimum 8 characters.&&&vinNumber" })
    @ApiProperty({
        description: 'Please enter VIN',
        example: '1FTYE1Y85PKB27846',
    })
    vinNumber: string;

    @IsNotEmpty()
    @ApiProperty({
        description: 'Please enter Ticket id',
        example: 115,
    })
    ticketId: number;

    @ApiPropertyOptional({ description: 'Year of manufacture', example: 2010 })
    @IsOptional()
    year: number;

    @ApiPropertyOptional({ description: 'Model of the vehicle', example: 'Ford' })
    @IsString()
    @IsOptional()
    model: string;

    @ApiPropertyOptional({ description: 'Make of the vehicle', example: 'Accord' })
    @IsString()
    @IsOptional()
    make: string;

    @ApiPropertyOptional({ description: 'Product class of the vehicle', example: 'Sedan' })
    @IsOptional()
    @IsString()
    productClass: string;

    @ApiPropertyOptional({ description: 'type of the vehicle', example: 'Trailer' })
    @IsOptional()
    @IsString()
    type: string;

    @ApiPropertyOptional({ description: 'Body style of the vehicle', example: 'Sedan' })
    @IsOptional()
    @IsString()
    bodyStyle?: string;

    @ApiPropertyOptional({ description: 'Gross Vehicle Weight Rating', example: '5000 lbs' })
    @IsOptional()
    @IsString()
    gvwr: string;

    @ApiPropertyOptional({ description: 'Gross Vehicle Weight', example: '5000lbs' })
    @IsOptional()
    @IsString()
    gvw: string;

    @ApiPropertyOptional({ description: 'Primary color of the vehicle', example: 1 })
    @IsOptional()
    primaryColorId?: number;

    @ApiPropertyOptional({ description: 'Secondary color of the vehicle', example: 1 })
    @IsOptional()
    secondaryColorId?: number;

    @ApiPropertyOptional({ description: 'Number of cylinders in the engine', example: 4 })
    cylinders?: number;

    @ApiPropertyOptional({ description: 'Primary fuel type of the vehicle', example: 'Gasoline' })
    @IsOptional()
    @IsString()
    primaryFuelType: string;

    @ApiPropertyOptional({ description: 'Secondary fuel type of the vehicle', example: 'Electric' })
    @IsOptional()
    @IsString()
    secondaryFuelType?: string;

    @ApiPropertyOptional({ description: 'Type of engine', example: 'V6' })
    @IsOptional()
    @IsString()
    engineType?: string;

    @ApiPropertyOptional({ description: 'Number of doors in the vehicle', example: 4 })
    @IsOptional()
    noOfDoors?: number;

    @ApiPropertyOptional({ description: 'Year of valuation for Georgia fair market value', example: '2021' })
    @IsOptional()
    @IsString()
    gaFmvValucationYear?: string;

    @ApiPropertyOptional({ description: 'Type of vehicle (new ,used)', enum: VehicleUsedType, example: 'used' })
    @IsOptional()
    @IsEnum(['new', 'used'], {
        message: () => {
            return `Please select valid vehicle type(new, used).&&&vehicleNewUsed&&&ERROR_MESSAGE`;
        },
    })
    vehicleNewUsed?: VehicleUsedType;

    @ApiPropertyOptional({ description: 'Shipping weight of the vehicle', example: '3500 lbs' })
    @IsOptional()
    @IsString()
    shippingWeight?: string;

    @ApiPropertyOptional({ description: 'Type of vehicle usage', enum: VehicleUsageType, example: 'private' })
    @IsOptional()
    @IsEnum(['commercials', 'private'], {
        message: () => {
            return `Please select valid vehicle use(commercials, private).&&&vehicleUse&&&ERROR_MESSAGE`;
        },
    })
    vehicleUse?: VehicleUsageType;

    @ApiPropertyOptional({ description: 'Additional shipping information', example: 'Shipped via which transport' })
    @IsOptional()
    @IsString()
    shippingInfo?: string;

    @ApiPropertyOptional({ description: 'Whether emissions testing is required', example: true })
    @IsOptional()
    emissions: boolean;

    @ApiPropertyOptional({ description: 'Whether the token is active', example: true })
    @IsOptional()
    isActive?: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Please enter fmv valucation data',
        example: [{
            year: 2022,
            price: "1000.50",
            valueType: 'Type A',
            source: 'Source X',
            dateEntered: '2024-04-23',
            vinFirstHalf: 'ABC12345'
        }],
    })
    @ValidateNested()
    @Type(() => AddFMVMasterDTO)
    fmvMasters: AddFMVMasterDTO[];
}
