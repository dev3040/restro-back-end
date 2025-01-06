import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, MaxLength, MinLength } from 'class-validator';


export class UploadDocDto {
   @ApiProperty({
      type: "string",
      format: "binary",
      description: "Attachments csv only",
      example: "profile.csv"
   })
   attachment: any[];

   @ApiProperty({ example: 2024, description: 'The year for the mill rate' })
   @IsNumberString()
   @MaxLength(4)
   @MinLength(4)
   year: string;
}
