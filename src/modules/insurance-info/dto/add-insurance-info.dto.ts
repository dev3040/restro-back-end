import { IsInt, IsEnum, IsOptional, IsDateString, MaxLength, IsNotEmpty, MinLength, ValidateIf } from 'class-validator';
import { InsuranceType } from 'src/shared/enums/insurance-info.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidName } from 'src/shared/decorators/name.decorator';

export class CreateInsuranceDto {

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    example: 1,
    description: 'Ticket ID',
  })
  ticketId: number;

  @ApiProperty({
    example: InsuranceType.BINDER,
    enum: InsuranceType,
    description: 'Type of insurance',
  })
  @IsOptional()
  @IsEnum(InsuranceType)
  type: InsuranceType;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    example: '2024-12-31',
    description: 'Expiration date',
  })
  expirationDate?: Date;

  @ValidateIf(o => o.companyName)
  @IsOptional()
  @IsValidName({ message: 'Please enter a valid company name.&&&companyName' })
  @MinLength(2, { message: 'Company name must be at least 2 characters long.&&&companyName' })
  @MaxLength(250, { message: 'Maximum 250 characters are allowed.&&&companyName' })
  @ApiPropertyOptional({
    example: 'Amazon',
    description: 'Name of the insurance company',
  })
  companyName?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Effective date',
  })
  effectiveDate?: Date;

  @MaxLength(30)
  @IsOptional()
  @ApiPropertyOptional({
    example: '456789',
    description: 'Policy number',
  })
  policyNumber?: number;
}
