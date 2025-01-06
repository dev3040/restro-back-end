import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, MaxLength, ValidationArguments } from "class-validator";
import { ActivityTypesEnum } from "src/shared/enums/activity-type.enum";
import { activityTypeEnumValues } from "src/shared/utility/enum-helper-functions";


class MentionedUserArr {

   @ApiPropertyOptional({ description: `Enter user Id` })
   userId: number;

}

export class AddActivityDto {

   @ApiProperty({
      description: 'Enter ticket id',
      example: 1
   })
   ticketId: number;

   @IsEnum(ActivityTypesEnum, {
      message: (args: ValidationArguments) => {
         if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
            return `Please select activity type.`;
         } else {
            return `Please select a valid activity type(${activityTypeEnumValues()}).`;
         }
      }
   })
   @ApiProperty({
      description: `Activity type(${activityTypeEnumValues()})`,
      default: ActivityTypesEnum.COMMENT,
      enum: ActivityTypesEnum
   })
   type: ActivityTypesEnum;

   @IsNotEmpty({ message: "Data is required.&&&data" })
   @MaxLength(500, { message: "The maximum length for the data is limited to 500 characters.&&&data" })
   @ApiProperty({
      description: 'Please enter data',
      example: 'Verified and processed the vehicle registration document. All details are accurate and compliant with our requirements. Ready for issuance.',
   })
   data: string;

   @ApiPropertyOptional({ description: "Enter mentions", example: `[1]`, default: [] })
   mentions: MentionedUserArr[];

}


