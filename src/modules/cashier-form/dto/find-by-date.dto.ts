import { IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindByDateDto {
  @ApiProperty({
    description: 'Start date for filtering (ISO date string)',
    example: '2024-01-01T00:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  startDate?: string;

  @ApiProperty({
    description: 'End date for filtering (ISO date string)',
    example: '2024-01-31T23:59:59.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date string' })
  endDate?: string;

  @ApiProperty({
    description: 'Specific date to filter by (ISO date string)',
    example: '2024-01-15T00:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date must be a valid date string' })
  date?: string;
} 