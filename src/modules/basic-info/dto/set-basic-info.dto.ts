import { IsOptional, MaxLength, ValidateIf, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VinInfoDto } from 'src/modules/ticket-management/dto/add-vin-info.dto';
import { VinErrorsInterface } from 'src/modules/vin-info/interface/vin-err.interface';

export class SetBasicInfoDto {

    @ApiProperty({
        description: 'Enter task id',
        example: 1
    })
    ticketId: number;

    @IsOptional()
    @ValidateIf(o => o.client)
    @MaxLength(15)
    @ApiPropertyOptional({
        description: 'Enter client name',
        example: '12abc'
    })
    client: string;

    @IsOptional()
    @ValidateIf(o => o.unit)
    @MaxLength(15)
    @ApiPropertyOptional({
        description: 'Enter unit',
        example: 'Unit Name'
    })
    unit: string;

    @ApiPropertyOptional({
        description: 'Enter transaction type id',
        example: 1
    })
    transactionTypeId: number;

    @ApiPropertyOptional({
        description: 'Enter customer contact info id',
        example: 1
    })
    customerContactInfoId: number | null;

    @ApiPropertyOptional({
        description: 'Enter customer id',
        example: 1
    })
    customerId: number;

    @ApiPropertyOptional({
        description: 'Enter customer transaction type'
        , example: 'Customer Transaction Type'
    })
    customerTransactionType: string | null;

    @ApiPropertyOptional({
        description: 'Indicates if it is a title',
        example: true
    })
    isTitle: boolean;

    @ApiPropertyOptional({
        description: 'Indicates if it is for registration',
        example: false
    })
    isRegistration: boolean;

    @ApiPropertyOptional({
        description: 'Indicates if it is for IRP',
        example: true
    })
    isIrp: boolean;

    @ApiPropertyOptional({
        description: 'Indicates if it is a conditional title',
        example: false
    })
    isConditionalTitle: boolean;

    @IsOptional()
    @ValidateIf(o => o.vinInfo)
    @ApiPropertyOptional({
        description: 'Enter vin info',
        example: {
            vinNumber: '1HGCM82633A004352',
            year: 2010,
            type: "Trailer",
            model: 'Accord',
            productClass: 'Sedan',
            bodyStyle: 'Sedan',
            gvwr: '5000 lbs',
            primaryColor: 'Red',
            secondaryColor: 'Black',
            cylinders: 4,
            primaryFuelType: 'Gasoline',
            secondaryFuelType: 'Electric',
            engineType: 'V6',
            noOfDoors: 4,
            gaFmvValucationYear: '2021',
            shippingWeight: '3500 lbs',
            vehicleUse: 'Personal',
            shippingInfo: 'Shipped via XYZ Transport',
            emissions: true,
            isActive: true,
        }
    })
    @ValidateNested()
    @Type(() => VinInfoDto)
    vinInfo: VinInfoDto;

    @ApiPropertyOptional({
        type: "string",
        format: "binary",
        description: "Attachments",
        example: "profile.jpg"
    })
    attachments: any[];

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Error that VIN decoder has thrown',
        example: {
            errText: "",
            suggestedVin: "",
            errDetails: ""
        }
    })
    vinError: VinErrorsInterface | null;

    @ValidateIf(o => o.hideDefaultError)
    @ApiPropertyOptional({
        description: 'Enter status of showing the default error.',
        example: true,
    })
    hideDefaultError: boolean;
}

