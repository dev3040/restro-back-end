import { ApiProperty, PartialType } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';
import { IsValidName } from 'src/shared/decorators/name.decorator';

export class AddCarrierTypeDto {

   @IsNotEmpty({ message: "Name is required." })
   @ApiProperty({
      description: 'Enter Name',
      example: 'FedEx',
   })
   @MinLength(3)
   @MaxLength(50)
   @IsValidName({ message: 'Please enter a valid name.&&&name' })
   name: string;

   @ApiProperty({
      description: "Select carrier type active or not",
      example: false
   })
   isActive: boolean;

   @MaxLength(50)
   @IsOptional()
   @ApiProperty({
      description: 'Enter name',
      example: 'K1',
   })
   printer: string;

}

export class UpdateCarrierTypeDto extends PartialType(AddCarrierTypeDto) { }

export class DeleteCarrierTypesDto {
   @ApiProperty({
      type: [Number],
      description: 'Array of carrier type IDs to be deleted',
      example: [1, 2, 3],
   })
   @IsArray()
   @ArrayNotEmpty({ message: 'The list of IDs should not be empty' })
   @ArrayMinSize(1, { message: 'The list must contain at least one ID' })
   @IsInt({ each: true, message: 'Each ID must be an integer' })
   ids: number[];
}

