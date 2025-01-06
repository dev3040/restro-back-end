import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class YearlyRateDto {
  @IsOptional()
  @ApiPropertyOptional({
      description: 'FMV master id',
      example: 1,
      required: false,
  })
  id?: number;

  @ApiProperty({ example: 2024, description: 'The year for the mill rate' })
  @IsNumberString()
  @MaxLength(4)
  @MinLength(4)
  year: string;

  @ApiProperty({ example: 10.20, description: 'The mill rate for the year' })
  @IsNumberString()
  millRate: string;
}
