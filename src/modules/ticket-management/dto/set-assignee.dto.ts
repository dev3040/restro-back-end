import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';


export class SetAssigneeDto {

   @IsNotEmpty()
   @ApiProperty({
      description: 'Please enter ticket ID',
      example: '1',
   })
   ticketId: number;

   @IsNotEmpty()
   @ApiProperty({
      description: 'Please enter user ID',
      example: '1',
   })
   userId: number;


}

