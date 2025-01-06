import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsOptional } from "class-validator";

export class BulkDeleteDto {
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

   @IsOptional()
   @IsInt({ message: 'Each ID must be an integer' })
   @ApiPropertyOptional({
      description: 'Ticket id',
      example: 2,
   })
   ticketId: number;
}
