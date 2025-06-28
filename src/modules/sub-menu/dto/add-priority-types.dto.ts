import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';
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

   @MaxLength(50)
   @IsOptional()
   @ApiProperty({
      description: 'Enter name',
      example: 'K1',
   })
   printer: string;

   @IsOptional()
   @ApiProperty({
      description: 'Enter vin details',
      example: [{
         platForm: 'Zomato',
         price: '23.00',
      }],
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

   @ApiProperty({
      description: 'Please enter BranchId',
      example: 1,
   })
   branchId: number;
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

   @ApiProperty({
      description: 'Please enter BranchId',
      example: 1,
   })
   branchId: number;
}
