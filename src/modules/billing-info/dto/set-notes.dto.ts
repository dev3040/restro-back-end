import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, MaxLength, ValidateIf } from "class-validator";

export class SetBillingNotesDto {

   @IsOptional()
   @ValidateIf(o => !o.id)
   @ApiPropertyOptional({
      description: 'Enter ticket id',
      example: 1
   })
   ticketId: number;

   @ValidateIf(o => o.billingNote)
   @MaxLength(500, { message: "Maximum 500 Characters are allowed.&&&billingNote" })
   @ApiPropertyOptional({
      description: 'Enter billing note',
      example: "This is a test billing note."
   })
   billingNote: string;

   @ValidateIf(o => o.runnerNote)
   @MaxLength(300, { message: "Maximum 300 Characters are allowed.&&&runnerNote" })
   @ApiPropertyOptional({
      description: 'Enter billing note',
      example: "This is a test runner note."
   })
   runnerNote: string;

}