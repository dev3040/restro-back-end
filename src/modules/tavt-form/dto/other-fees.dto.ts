import { ApiPropertyOptional } from '@nestjs/swagger';

export class OtherFeesDto {
  @ApiPropertyOptional({
    description: 'Unique identifier of the record',
    example: 1,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'Identifier of the associated form',
    example: 123,
  })
  formId: number;

  @ApiPropertyOptional({
    description: 'Identifier of the associated other fees',
    example: 456,
  })
  otherFeesId: number;

  @ApiPropertyOptional({
    description: 'Price value with a precision of 7 and scale of 3',
    example: 1234.567,
  })
  price: number;
  
}
