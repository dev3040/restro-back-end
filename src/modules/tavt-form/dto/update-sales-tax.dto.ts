import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class SalesTaxMasterDto {
    @ApiPropertyOptional({ description: 'Unique identifier of the sales tax master record' })
    @IsOptional()
    id?: number;

    @ApiPropertyOptional({ description: 'County ID associated with the sales tax' })
    @IsOptional()
    countyId?: number;

    @ApiPropertyOptional({ description: 'City ID associated with the sales tax', nullable: true })
    @IsOptional()
    cityId?: number;

    @ApiPropertyOptional({ description: 'Sales tax rate' })
    @IsOptional()
    rate?: number;

    @ApiPropertyOptional({ description: 'Indicates if the sales tax record is active', default: true })
    @IsOptional()
    isActive?: boolean;
}
