import { ApiProperty, PartialType } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { IsValidName } from 'src/shared/decorators/name.decorator';

export class AddTicketStatusDto {

   @MinLength(2)
   @MaxLength(50)
   @IsNotEmpty({ message: "Internal status name is required." })
   @ApiProperty({
      description: 'Please enter Internal Status Name.&&&internalStatusName',
      example: 'Ticket creation',
   })
   @IsValidName({ message: 'Please enter a valid internal status name.&&&internalStatusName' })
   internalStatusName: string;

   @MinLength(2)
   @MaxLength(50)
   @IsNotEmpty({ message: "External status name is required." })
   @ApiProperty({
      description: 'Please enter External Status Name',
      example: 'In process',
   })
   @IsValidName({ message: 'Please enter a valid external status name.&&&externalStatusName' })
   externalStatusName: string;

   @ApiProperty({
      description: "Select status active or not",
      example: false
   })
   isActive: boolean;

}

export class UpdateTicketStatusDto extends PartialType(AddTicketStatusDto) { }

export class DeleteTicketStatusDto {
   @ApiProperty({
      type: [Number],
      description: 'Array of ticket status IDs to be deleted',
      example: [1, 2, 3],
   })
   @IsArray()
   @ArrayNotEmpty({ message: 'The list of IDs should not be empty.' })
   @ArrayMinSize(1, { message: 'The list must contain at least one ID.' })
   @IsInt({ each: true, message: 'Each ID must be an integer.' })
   ids: number[];
}