import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional } from "class-validator";


export class SetBillingProcessDto {

    @ApiPropertyOptional({
        description: 'id for the configuration',
        example: 1
    })
    @IsOptional()
    @IsInt()
    ticketId?: number;

    @IsOptional()
    @ApiProperty({
        description: 'Enter vin details',
        example: {
            clientUnit: 'dddd-44',
            vinNumber: '23232323232',
            year: '2023',
            make: 'ddd',
            model: 'ddd',
            tagNumber: 'xyzzz',
            expirationDate: '12/10/2024',
            plateCategory: { id: 1, plateDetails: 'vbvhfhf', categoryCode: 'dsdsd' },
            status: 'ddd',
            titleNumber: '232323',
            county: 'fulton',
            district: 'atlanta',
            color: 'black',
            gvw: '3323',
            vehicleUse: 'sasas',
            customerOne: '2112',
            customerTwo: '1212'
        },
    })
    // @ValidateNested()
    // @Type(() => SaveShipperDetailsDto)
    vinModule: any;

    @IsOptional()
    @ApiProperty({
        description: 'Enter buyer details',
        example: {
            address: "B-1,ddd"
        },
    })
    // @ValidateNested()
    // @Type(() => SaveShipperDetailsDto)
    buyerModule: any;

    @IsOptional()
    @ApiProperty({
        description: 'Enter lien details',
        example: {
            address: "B-1,ddd"
        },
    })
    // @ValidateNested()
    // @Type(() => SaveShipperDetailsDto)
    lienModule: any;

    @IsOptional()
    @ApiProperty({
        description: 'Enter fees details',
        example: [{
            fees: "Registration Fees",
            estimation: "200.000",
            actual: "150.00"
        }],
    })
    // @ValidateNested()
    // @Type(() => SaveShipperDetailsDto)
    feesModule: any;

    @IsOptional()
    @ApiProperty({
        description: 'Enter service fees details',
        example: [{
            fees: "Registration Fees",
            estimation: "200.000",
            actual: "150.00"
        }],
    })
    // @ValidateNested()
    // @Type(() => SaveShipperDetailsDto)
    serviceFeesModule: any;

    @IsOptional()
    @ApiProperty({
        description: 'Enter billing details',
        example: [{
            check: "FSDV2321",
            date: "2024-12-12",
            actual: "150.00"
        }],
    })
    // @ValidateNested()
    // @Type(() => SaveShipperDetailsDto)
    billingModule: any;

    @IsOptional()
    @ApiProperty({
        description: 'Enter transaction return details',
        example: [{
            check: "FSDV2321",
            date: "2024-12-12",
            actual: "150.00"
        }],
    })
    // @ValidateNested()
    // @Type(() => SaveShipperDetailsDto)
    transactionReturnModule: any;
}
