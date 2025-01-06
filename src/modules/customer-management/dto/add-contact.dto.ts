import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, MaxLength, ValidateIf, ValidationArguments } from 'class-validator';
import { IsValidName } from 'src/shared/decorators/name.decorator';
import { IsPhoneNumber } from 'src/shared/decorators/phone.decorator';

export class AddContactDto {

   @IsNotEmpty({ message: "Please enter customer id.&&&customerId" })
   @ApiProperty({
      description: 'ID of the customer',
      example: 1,
   })
   customerId: number;

   @MaxLength(150)
   @IsNotEmpty({ message: "Please enter name" })
   @IsValidName({ message: 'Please enter a valid name.&&&name' })
   @ApiProperty({
      description: 'Enter name.&&&name',
      example: 'Jon Doe',
   })
   name: string;

   @IsNotEmpty({ message: "Please enter role.&&&role" })
   @MaxLength(50)
   @IsValidName({ message: 'Please enter a valid role.&&&role' })
   @ApiProperty({
      description: 'Enter role.&&&role',
      example: 'Manager',
   })
   role: string;

   @ValidateIf(o => o.email)
   @MaxLength(50)
   @IsEmail({}, {
      message: (args: ValidationArguments) => {
         if (typeof args.value == "undefined" || args.value == "") {
            return `Enter email.&&&email`;
         } else {
            return `Please enter a valid email.&&&email`;
         }
      }
   })
   @ApiPropertyOptional({
      description: 'Enter email',
      example: 'jon@gmail.com',
   })
   email: string;

   @ValidateIf(o => o.email)
   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter phone',
      example: '(123) 456-7890',
   })
   @IsPhoneNumber()
   phone: string;

   @ValidateIf(o => o.isActive)
   @IsBoolean()
   @ApiProperty({
      description: "Select contact type active or not",
      example: true,
      default: true
   })
   isActive: boolean;

   @ValidateIf(o => o.isPrimary)
   @IsBoolean()
   @ApiPropertyOptional({
      description: "Select contact type primary or not",
      example: false,
      default: false
   })
   isPrimary: boolean;

   @ValidateIf(o => o.billingNotes)
   @MaxLength(300)
   @ApiPropertyOptional({
      description: 'Enter billing notes',
      example: ""
   })
   billingNotes: string;

   @ValidateIf(o => o.generalNotes)
   @MaxLength(300)
   @ApiPropertyOptional({
      description: 'Enter general notes',
      example: ""
   })
   generalNotes: string;
}

export class UpdateContactDto extends PartialType(AddContactDto) { }

export class DeleteCustomersDto {
   @ApiProperty({
      type: [Number],
      description: 'Array of customer IDs to be deleted',
      example: [1, 2, 3],
   })
   @IsArray()
   @ArrayNotEmpty({ message: 'The list of IDs should not be empty.' })
   @ArrayMinSize(1, { message: 'The list must contain at least one ID.' })
   @IsInt({ each: true, message: 'Each ID must be an integer.' })
   ids: number[];
}



