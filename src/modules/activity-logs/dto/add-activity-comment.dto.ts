import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength } from "class-validator";
class MentionedUserArr {

   @ApiPropertyOptional({ description: `Enter user Id` })
   userId: number;

}


export class AddActivityCommentDto {

   @IsNotEmpty({ message: "Ticket ID is required.&&&ticketId" })
   @ApiProperty({
      description: "Enter ticket ID",
      example: 1
   })
   ticketId: number;

   @IsNotEmpty({ message: "Comment is required.&&&comment" })
   @MaxLength(500, { message: "The maximum length for the comment is limited to 500 characters.&&&comment" })
   @ApiProperty({
      description: 'Please enter Name',
      example: 'Verified and processed the vehicle registration document. All details are accurate and compliant with our requirements. Ready for issuance.',
   })
   comment: string;

   @ApiPropertyOptional({ description: "Enter mentions", example: `[1]`, default: [] })
   mentions: MentionedUserArr[];
}