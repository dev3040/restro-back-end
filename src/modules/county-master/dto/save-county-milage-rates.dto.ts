import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { YearlyRateDto } from './yearly-rates.dto';
export class SaveCountyRatesDto {

   @ApiProperty({ example: 1, description: 'Id of rate' })
   @IsOptional()
   id: number;

   @ApiProperty({ example: 'District Name', description: 'The name of the district', required: false })
   @IsOptional()
   districtName?: string;

   @ApiProperty({ example: 5, description: 'The tax district' })
   @IsOptional()
   taxDistrict: number;

   @ApiProperty({
      example: [{ year: 2024, millRate: 10.20 }],
      description: 'The list of yearly mill rates',
      required: false,
   })
   @ValidateNested({ each: true })
   @Type(() => YearlyRateDto)
   @IsOptional()
   millRates?: YearlyRateDto[];

}
