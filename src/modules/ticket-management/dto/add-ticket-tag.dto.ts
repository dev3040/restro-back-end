import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';


export class AddTicketTagDto {

   @IsNotEmpty()
   @ApiProperty({
      description: 'Please enter ticket id',
      example: '1',
   })
   ticketId: number;

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter a tag',
      example: `newTag1`
   })
   tag: string;

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter a tag id',
      example: `1`
   })
   tagId: number;

}

