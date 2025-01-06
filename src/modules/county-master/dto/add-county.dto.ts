import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsOptional, Matches, MaxLength, MinLength } from 'class-validator';
import { IsValidName } from 'src/shared/decorators/name.decorator';

export class AddCountyDto {
   @ApiProperty({
      description: 'Please enter name',
      example: 'Title',
   })
   @MaxLength(30)
   @MinLength(2)
   @IsValidName({ message: 'Please enter a valid name.&&&name' })
   name: string;

   @IsOptional()
   @MaxLength(3)
   @Matches(/^[\w\/\(\)\-, ]+$/, { message: 'Please enter a valid code.&&&code' })
   @ApiPropertyOptional({
      description: 'Please enter code',
      example: 'TT',
   })
   code: string;

   @ApiProperty({
      description: 'Please enter state id',
      example: 2,
   })
   stateId: number;

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Please enter Is active',
      example: 'true',
   })
   isActive: boolean;


}

export class UpdateCountyDto extends PartialType(AddCountyDto) { }

export class DeleteCountiesDto {
   @ApiProperty({
      type: [Number],
      description: 'Array of counties IDs to be deleted',
      example: [1, 2, 3],
   })
   @IsArray()
   @ArrayNotEmpty({ message: 'The list of IDs should not be empty' })
   @ArrayMinSize(1, { message: 'The list must contain at least one ID' })
   @IsInt({ each: true, message: 'Each ID must be an integer' })
   ids: number[];
}
