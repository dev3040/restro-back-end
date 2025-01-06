import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, ValidationArguments } from 'class-validator';
import { ValidateNotEmpty } from 'src/shared/decorators/validate-not-empty';
import { RemoveAssignedDataFieldEnum } from 'src/shared/enums/general-dto-fields.enum';

export class RemoveAssignedDataDto {

   @ValidateNotEmpty({ constraints: { Field: 'Ticket ID' } })
   @ApiProperty({
      description: 'Enter Ticket ID',
      example: 1
   })
   ticketId: number;

   @IsEnum(RemoveAssignedDataFieldEnum, {
      message: (args: ValidationArguments) => {
         if (
            typeof args.value == 'undefined' || args.value == '' || args.value == null
         ) {
            return `Please enter field.&&&field&&&ERROR_MESSAGE`;
         } else {
            return `Please enter a valid field(tag, assignee).&&&field&&&ERROR_MESSAGE`;
         }
      },
   })
   @ApiProperty({
      description: 'Please enter field(tag, assignee).',
      example: 'tag',
   })
   field: RemoveAssignedDataFieldEnum;


}

