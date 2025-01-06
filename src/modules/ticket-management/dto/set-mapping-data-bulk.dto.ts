import { ApiProperty, ApiPropertyOptional, } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsBoolean, IsEnum, IsNotEmpty, ValidateIf, ValidationArguments } from 'class-validator';
import { UpdateDataFieldTypesEnum } from 'src/shared/enums/general-dto-fields.enum';

export class SetMultipleTicketsMappingDataDto {

   @Type(() => Number)
   @ArrayMinSize(1, { message: "At least one ticket ID is required.&&&ticketIds&&&ERROR_MESSAGE" })
   @ApiProperty({
      description: 'Enter IDs of Tickets that needs to be updated',
      example: [1, 2],
   })
   ticketIds: Array<number>;

   @ApiProperty({
      description: 'Enter ID (assignee user/ tag/ priority/ status/ team)',
      example: 1,
   })
   id: number;

   @ValidateIf(o => o.type === UpdateDataFieldTypesEnum.ASSIGNEE || o.type === UpdateDataFieldTypesEnum.TAG)
   @IsBoolean()
   @ApiPropertyOptional({
      description: 'Enter if action is add / remove',
      example: false
   })
   isAdd: boolean;

   @IsNotEmpty({ message: "Type is required.&&&type" })
   @IsEnum(UpdateDataFieldTypesEnum, {
      message: (args: ValidationArguments) => {
         if (typeof args.value == "undefined") {
            return `Enter type. [Valid option: assignee/ tag/ priority/ status/ team].&&&type&&&ERROR_MESSAGE`;
         } else {
            return `Enter a valid type. [Valid option: assignee/ tag/ priority/ status/ team].&&&type&&&ERROR_MESSAGE`;
         }
      }
   })
   @ApiProperty({
      description: `Enter type. [Valid option: assignee/ tag/ priority/ status/ team]`,
      example: UpdateDataFieldTypesEnum.TAG,
      enum: UpdateDataFieldTypesEnum,
   })
   type: UpdateDataFieldTypesEnum;

}

