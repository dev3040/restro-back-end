import { ApiProperty } from '@nestjs/swagger';


export class SetDocumentDescriptionDto {

   @ApiProperty({
      description: 'Enter description',
      example: 'Plate transfer related document.',
   })
   description: string;
}
