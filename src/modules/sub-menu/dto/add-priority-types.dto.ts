import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { IsValidName } from 'src/shared/decorators/name.decorator';

export class AddPriorityTypesDto {

   @MinLength(2)
   @MaxLength(50)
   @IsNotEmpty({ message: "Name is required." })
   @IsValidName({ message: 'Please enter a valid name.&&&name' })
   @ApiProperty({
      description: 'Enter name',
      example: 'Manchurian',
   })
   name: string;

   @ApiPropertyOptional({
      description: 'Price value with a precision of 7 and scale of 3',
      example: 1234.567,
   })
   price: any;

   @ApiPropertyOptional({
      description: 'Offer',
      example: 1234.567,
   })
   offer: any;

   @ApiProperty({ description: "CategoryId", example: 1 })
   categoryId: number;

   @ApiProperty({
      description: 'Please enter Is Active',
      example: 'true',
   })
   isActive: boolean;
}

export class UpdatePriorityTypesDto extends PartialType(AddPriorityTypesDto) { }

export class DeletePriorityDto {
   @ApiProperty({
      type: [Number],
      description: 'Array of priority type IDs to be deleted',
      example: [1, 2, 3],
   })
   @IsArray()
   @ArrayNotEmpty({ message: 'The list of IDs should not be empty' })
   @ArrayMinSize(1, { message: 'The list must contain at least one ID' })
   @IsInt({ each: true, message: 'Each ID must be an integer' })
   ids: number[];
}
