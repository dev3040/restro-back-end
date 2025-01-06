import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional } from "class-validator";

export class SetVinProfileDto {

    @ApiPropertyOptional({
        description: 'Enter ticketID',
        example: 1
    })
    @IsOptional()
    @IsInt()
    ticketId?: number;

    @IsOptional()
    @ApiProperty({
        description: 'Enter vehicle details.',
        example: {
            year: '2023',
            make: 'ddd',
            model: 'sedan',
            bodyStyle: 'sedan',
            productClass: 'stand',
            color: 'black',
            gvw: '3323',
            shippingWeight: "1200 lbs",
            vehicleUse: 'load',
            odometer: 'hello'
        },
    })
    vehicleDetails: any;

    @IsOptional()
    @ApiProperty({
        description: 'Enter vehicle registration details.',
        example: {
            titlePrinted: 'der',
            titlePrintedStatus: 'New'
        },
    })
    vehicleRegDetails: any;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter buyer details',
        example: {
            address: "B-1,ddd"
        },
    })
    buyerModule: any;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter lien details',
        example: {
            address: "B-1,ddd"
        },
    })
    lienDetails: any;
}