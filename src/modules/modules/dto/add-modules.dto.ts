import { ApiProperty, PartialType } from '@nestjs/swagger';
import { MaxLength, MinLength } from 'class-validator';
import { IsValidName } from 'src/shared/decorators/name.decorator';

export class AddModulesDto {
   @ApiProperty({
      description: 'Please enter Name',
      example: 'Document Upload',
   })
   @MaxLength(30)
   @MinLength(3)
   @IsValidName({ message: 'Please enter a valid name.&&&name' })
   name: string | null;

   @ApiProperty({
      description: 'Please enter Module Id',
      example: '1',
   })
   moduleId: number | null;

}

export class UpdateModulesDto extends PartialType(AddModulesDto) { }
