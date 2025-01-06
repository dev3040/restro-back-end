import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';


export class DeleteTicketsDto {

   @Type(() => Number)
   @ApiProperty({
      description: 'Enter IDs of Tickets that needs to be updated',
      example: [1, 2],
   })
   ticketIds: Array<number>;
}