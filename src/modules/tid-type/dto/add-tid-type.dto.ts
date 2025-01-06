import { ApiProperty, PartialType } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { IsValidName } from 'src/shared/decorators/name.decorator';

export class AddTidTypeDto {

   @IsNotEmpty({
      message: "Name is required."
   })
   @MinLength(2)
   @MaxLength(50)
   @IsValidName({ message: 'Please enter a valid name.&&&name' })
   @ApiProperty({
      description: 'Enter Name',
      example: 'FedEx',
   })
   name: string;
}

export class UpdateTidTypeDto extends PartialType(AddTidTypeDto) { }

export class DeleteTidTypesDto {
   @ApiProperty({
      type: [Number],
      description: 'Array of TID type IDs to be deleted',
      example: [1, 2, 3],
   })
   @IsArray()
   @ArrayNotEmpty({ message: 'The list of IDs should not be empty.' })
   @ArrayMinSize(1, { message: 'The list must contain at least one ID.' })
   @IsInt({ each: true, message: 'Each ID must be an integer.' })
   ids: number[];
}