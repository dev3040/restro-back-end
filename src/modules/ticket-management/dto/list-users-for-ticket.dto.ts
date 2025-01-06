import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class ListUsersForTicketDto {

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Please enter Ticket ID',
      example: '1',
   })
   ticketId: number;

   @ApiPropertyOptional({
      description: "Enter search value"
   })
   search: string;

}

