import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, MaxLength } from 'class-validator';

export class SaveAddressDto {

    @ApiPropertyOptional({ description: 'Address line one', example: 'B-103' })
    @IsOptional()
    @MaxLength(100)
    addressLineOne?: string;

    @ApiPropertyOptional({ description: 'Address line two', example: 'Play Galaxy' })
    @IsOptional()
    @MaxLength(100)
    addressLineTwo?: string;

    @ApiPropertyOptional({ description: 'City', example: 'Los Angeles' })
    @IsOptional()
    @MaxLength(100)
    city?: string;

    @ApiPropertyOptional({ description: 'State', example: 'AR' })
    @IsOptional()
    @MaxLength(100)
    state?: string;

    @ApiPropertyOptional({ description: 'Zip code', example: '284562' })
    @IsOptional()
    @MaxLength(100)
    zipCode?: string;

    @ApiPropertyOptional({ description: 'Country', example: 'GA' })
    @IsOptional()
    @MaxLength(100)
    country?: string;

}
