import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsOptional, Matches, MaxLength, MinLength } from 'class-validator';
import { IsValidName } from 'src/shared/decorators/name.decorator';

export class BranchesDTO {
   @ApiProperty({
      description: 'Please enter Name',
      example: 'Title',
   })
   @MaxLength(30)
   @MinLength(3)
   @IsValidName({ message: 'Please enter a valid name.&&&name' })
   name: string;

   @MaxLength(10)
   @Matches(/^[\w\/\(\)\-, ]+$/, { message: 'Please enter a valid code.&&&code' })
   @ApiPropertyOptional({
      description: 'Please enter code',
      example: 'TT',
   })
   code: string;

   @ApiProperty({
      description: 'Please enter Is active',
      example: 'true',
   })
   isActive: boolean;

   @ApiProperty({ description: 'Address', example: 'B-103' })
   @IsOptional()
   address?: string;

   @MaxLength(100)
   @ApiPropertyOptional({
      description: 'Please enter prn number',
      example: '1230',
   })
   prnNum: string;

}

export class UpdateBranchesDTO extends PartialType(BranchesDTO) { }

export class DeleteBranchesDTO {
   @ApiProperty({
      type: [Number],
      description: 'Array of add on transaction IDs to be deleted',
      example: [1, 2, 3],
   })
   @IsArray()
   @ArrayNotEmpty({ message: 'The list of IDs should not be empty' })
   @ArrayMinSize(1, { message: 'The list must contain at least one ID' })
   @IsInt({ each: true, message: 'Each ID must be an integer' })
   ids: number[];
}