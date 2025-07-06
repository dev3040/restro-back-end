import { IsOptional, IsObject, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCashierFormDto {
  @ApiProperty({
    description: 'JSON data for the cashier form',
    example: { formData: 'updated data', fields: ['field1', 'field2'] },
    required: false
  })
  @IsOptional()
  @IsObject({ message: 'Data must be a valid JSON object' })
  data?: any;

  @ApiProperty({
    description: 'Generated date for the cashier form',
    example: '2024-01-15T10:30:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Generated date must be a valid date string' })
  generated_date?: string;

  @ApiProperty({
    description: 'Is half day for the cashier form',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Is half day must be a valid boolean' })
  isHalfDay?: boolean;

  @ApiProperty({
    description: 'Branch ID for the cashier form',
    example: 1,
    required: false
  })
  @IsOptional()
  branchId?: number;
} 