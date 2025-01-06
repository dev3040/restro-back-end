import { ApiPropertyOptional } from '@nestjs/swagger';


export class ListTagsDto {

   @ApiPropertyOptional({
      description: "Enter search value"
   })
   search: string;

}

