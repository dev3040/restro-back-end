import { ApiProperty, PartialType } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { IsValidName } from 'src/shared/decorators/name.decorator';

export class AddDepartmentDto {

   @IsNotEmpty({ message: "Name is required." })
   @ApiProperty({
      description: 'Enter Name',
      example: 'Data Entry',
   })
   @MaxLength(50)
   @MinLength(2)
   @IsValidName({ message: 'Please enter a valid name.&&&name' })
   name: string;

   @ApiProperty({
      description: "Select department type active or not",
      example: false
   })
   isActive: boolean;


}

export class UpdateDepartmentDto extends PartialType(AddDepartmentDto) { }

export class DeleteDepartmentsDto {
   @ApiProperty({
      type: [Number],
      description: 'Array of department IDs to be deleted',
      example: [1, 2, 3],
   })
   @IsArray()
   @ArrayNotEmpty({ message: 'The list of IDs should not be empty' })
   @ArrayMinSize(1, { message: 'The list must contain at least one ID' })
   @IsInt({ each: true, message: 'Each ID must be an integer' })
   ids: number[];
}