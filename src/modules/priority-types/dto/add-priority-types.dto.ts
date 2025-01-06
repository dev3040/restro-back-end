import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { IsValidName } from 'src/shared/decorators/name.decorator';

export class AddPriorityTypesDto {

   @MinLength(2)
   @MaxLength(50)
   @IsNotEmpty({ message: "Name is required." })
   @IsValidName({ message: 'Please enter a valid name.&&&name' })
   @ApiProperty({
      description: 'Enter name',
      example: 'High',
   })
   name: string;

   @ValidateIf(o => o.colorCode)
   @MinLength(2)
   @MaxLength(30)
   @IsValidName({ message: 'Please enter a valid color code.&&&colorCode' })
   @ApiPropertyOptional({
      description: 'Please enter color code',
      example: '#FFFFF',
   })
   colorCode: string;

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
