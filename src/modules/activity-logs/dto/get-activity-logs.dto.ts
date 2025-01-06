import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNumber } from "class-validator";


export class GetActivityLogsDto {

   @IsNumber({}, { each: true, message: "Each value in id must be a number." })
   @ArrayNotEmpty({ message: "Please enter id.&&&id&&&ERROR_MESSAGE" })
   @IsArray({ message: "Id must be an array.&&&id&&&ERROR_MESSAGE" })
   @Type(() => Number)
   @ApiProperty({
      type: [Number],
      description: "Enter array of activity log id.",
      example: [1, 2]
   })
   id: number[];
}