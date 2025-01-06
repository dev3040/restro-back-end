import { ApiProperty, PartialType } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';
import { IsValidName } from 'src/shared/decorators/name.decorator';

export class AddLienMasterDto {

   @ApiProperty({ type: String, description: 'Enter lien holder name', maxLength: 25, example: 'John Doe' })
   @MaxLength(50)
   @MinLength(2)
   @IsValidName({ message: 'Please enter a valid company name.&&&holderName' })
   @IsNotEmpty({ message: "Lien holder name is required." })
   holderName: string;

   @ApiProperty({ type: String, description: 'Address', maxLength: 300, example: '123 Main St' })
   @IsNotEmpty({ message: "Address is required." })
   address: string;

   @ApiProperty({
      description: "Select lien active or not",
      example: false
   })
   @IsOptional()
   isActive: boolean;

   @ApiProperty({
      description: "Select ELT lien holder",
      example: false
   })
   @IsOptional()
   isElt: boolean;

   @ApiProperty({ example: '1234', description: 'Enter lien holder ID', required: false, maxLength: 15 })
   @IsOptional()
   @IsString()
   @Length(1, 15)
   lienHolderId?: string;

}

export class UpdateLienMasterDto extends PartialType(AddLienMasterDto) { }

export class DeleteLienMastersDto {
   @ApiProperty({
      type: [Number],
      description: 'Array of lien master IDs to be deleted',
      example: [1, 2, 3],
   })
   @IsArray()
   @ArrayNotEmpty({ message: 'The list of IDs should not be empty' })
   @ArrayMinSize(1, { message: 'The list must contain at least one ID' })
   @IsInt({ each: true, message: 'Each ID must be an integer' })
   ids: number[];
}