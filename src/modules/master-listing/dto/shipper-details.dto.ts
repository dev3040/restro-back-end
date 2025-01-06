import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, MaxLength } from 'class-validator';
import { IsPhoneNumber } from 'src/shared/decorators/phone.decorator';

export class SaveShipperDetailsDto {

    @ApiProperty({ description: 'Contact name of the county', example: 'John Doe' })
    @IsOptional()
    @MaxLength(40)
    contactName?: string;

    @ApiProperty({ description: 'Company name of the county', example: 'John Doe', nullable: true })
    @IsOptional()
    @MaxLength(70)
    companyName?: string;

    @ApiProperty({ description: 'Phone number', example: '(123) 456-7890', nullable: true })
    @IsOptional()
    @IsPhoneNumber()
    phone?: string;

    @ApiProperty({ description: 'Address line one', example: 'B-103' })
    @IsOptional()
    @MaxLength(100)
    addressLineOne?: string;

    @ApiProperty({ description: 'Address line two', example: 'Play Galaxy' })
    @IsOptional()
    @MaxLength(100)
    addressLineTwo?: string;

    @ApiProperty({ description: 'City', example: 'Los Angeles' })
    @IsOptional()
    @MaxLength(100)
    city?: string;

    @ApiProperty({ description: 'State', example: 'AR' })
    @IsOptional()
    @MaxLength(100)
    state?: string;

    @ApiProperty({ description: 'Zip code', example: '284562' })
    @IsOptional()
    @MaxLength(100)
    zipCode?: string;

    @ApiProperty({ description: 'Country', example: 'GA' })
    @IsOptional()
    @MaxLength(100)
    country?: string;

}
