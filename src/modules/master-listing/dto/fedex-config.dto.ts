import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, ValidateNested } from "class-validator";
import { SaveShipperDetailsDto } from "./shipper-details.dto";
import { SaveFedExAddressDto } from "src/modules/county-master/dto/save-fedex-address.dto";


export class FedExConfigDto {

    @ApiPropertyOptional({
        description: 'id for the configuration',
        example: 1
    })
    @IsOptional()
    @IsInt()
    id?: number;

    @IsOptional()
    @ApiProperty({
        description: 'Enter shipper details',
        example: {
            "contactName": "John Doe",
            "companyName": "Galaxy Shipping Co.",
            "phone": "9426649",
            "addressLineOne": "B-103",
            "addressLineTwo": "Play Galaxy",
            "city": "Los Angeles",
            "state": "AR",
            "zipCode": "284562",
            "county": "GA"
        },
    })
    @ValidateNested()
    @Type(() => SaveShipperDetailsDto)
    fromShipper: SaveFedExAddressDto;

    @IsOptional()
    @ApiProperty({
        description: 'Enter shipper details',
        example: {
            "contactName": "John Doe",
            "companyName": "Galaxy Shipping Co.",
            "phone": "9426649",
            "addressLineOne": "B-103",
            "addressLineTwo": "Play Galaxy",
            "city": "Los Angeles",
            "state": "AR",
            "zipCode": "284562",
            "county": "GA"
        },
    })
    @ValidateNested()
    @Type(() => SaveShipperDetailsDto)
    returnShipper: SaveFedExAddressDto;

    @IsOptional()
    @ApiProperty({
        description: 'Enter Recipient details',
        example: {
            "contactName": "John Doe",
            "companyName": "Galaxy Shipping Co.",
            "phone": "9426649",
            "addressLineOne": "B-103",
            "addressLineTwo": "Play Galaxy",
            "city": "Los Angeles",
            "state": "AR",
            "zipCode": "284562",
            "county": "GA"
        },
    })
    @ValidateNested()
    @Type(() => SaveShipperDetailsDto)
    returnRecipient: SaveFedExAddressDto;
}
