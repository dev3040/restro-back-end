import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, ValidationArguments } from 'class-validator';
import { UpdateDataFieldTypesEnum } from 'src/shared/enums/general-dto-fields.enum';

//need to delete later
export class UpdateTicketDataDto {

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter ID [priority/status]',
      example: 1,
      nullable: true
   })
   id: number | null;

   @IsEnum(['update_status', 'update_priority'], {
      message: (args: ValidationArguments) => {
         if (
            typeof args.value == 'undefined' || args.value == '' || args.value == null
         ) {
            return `Please select type.`;
         } else {
            return `Please select a valid type(update_status, update_priority).`;
         }
      },
   })
   @ApiProperty({
      description: 'Please select type (update_status, update_priority)',
      example: 'update_status',
   })
   type: UpdateDataFieldTypesEnum;


}

