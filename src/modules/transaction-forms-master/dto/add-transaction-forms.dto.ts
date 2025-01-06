import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AddTransactionFormDto {

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Transaction code',
      example: ['CD', 'EB'],
   })
   @IsArray()
   @ArrayNotEmpty({ message: 'The transaction code array should not be empty' })
   @MinLength(2, { each: true, message: 'Each transaction code must be at least 2 characters long&&&transactionCode' })
   @MaxLength(10, { each: true, message: 'Each transaction code must be at most 10 characters long&&&transactionCode' })
   transactionCode: string[];

   @IsNotEmpty()
   @ApiProperty({
      description: 'Form short code',
      example: 'MV1',
   })
   @MaxLength(50)
   @MinLength(2)
   formShortCode: string;
}

export class UpdateTransactionFormDto {
   @IsOptional()
   @ApiPropertyOptional({
      description: 'Transaction code',
      example: ['CD', 'EB'],
   })
   @IsArray()
   @ArrayNotEmpty({ message: 'The transaction code array should not be empty' })
   @MinLength(2, { each: true, message: 'Each transaction code must be at least 2 characters long&&&transactionCode' })
   @MaxLength(10, { each: true, message: 'Each transaction code must be at most 10 characters long&&&transactionCode' })
   transactionCode: string[];
}

export class DeleteTransactionFormsDto {
   @ApiProperty({
      description: 'Array of form codes to be deleted',
      example: ["MV1", "MV2", "IRP"],
   })
   @IsArray()
   @ArrayNotEmpty({ message: 'The list of form codes should not be empty' })
   @ArrayMinSize(1, { message: 'The list must contain at least one from code' })
   @IsString({ each: true, message: 'Each form codes must be an string' })
   formCodes: string[];
}