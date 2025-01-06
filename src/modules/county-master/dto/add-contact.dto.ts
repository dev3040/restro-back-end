import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, MaxLength, ValidateIf, ValidationArguments } from 'class-validator';
import { IsValidName } from 'src/shared/decorators/name.decorator';
import { IsPhoneNumber } from 'src/shared/decorators/phone.decorator';

export class AddContactDto {

   @IsNotEmpty({ message: "Please enter county id.&&&countyId" })
   @ApiProperty({
      description: 'ID of the county',
      example: 1,
   })
   countyId: number;

   @MaxLength(40)
   @IsNotEmpty({ message: "Please enter name" })
   @IsValidName({ message: 'Please enter a valid name.&&&name' })
   @ApiProperty({
      description: 'Enter name.&&&name',
      example: 'Jon Doe',
   })
   name: string;

   @IsOptional()
   @MaxLength(40)
   @IsValidName({ message: 'Please enter a valid title.&&&title' })
   @ApiProperty({
      description: 'Enter title.&&&title',
      example: 'Manager',
   })
   title: string;

   @IsOptional()
   @ValidateIf(o => o.email)
   @MaxLength(70)
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

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter phone',
      example: '(123) 456-7890',
   })
   @IsPhoneNumber()
   phone: string;

   @IsOptional()
   @ValidateIf(o => o.isActive)
   @IsBoolean()
   @ApiProperty({
      description: "Select contact type active or not",
      example: true,
      default: true
   })
   isActive: boolean;

   @IsOptional()
   @ValidateIf(o => o.isPrimary)
   @IsBoolean()
   @ApiPropertyOptional({
      description: "Select contact type primary or not",
      example: false,
      default: false
   })
   isPrimary: boolean;

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter general notes',
      example: ""
   })
   address: string;


   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter general notes',
      example: ""
   })
   notes: string;
}

export class UpdateContactDto extends PartialType(AddContactDto) { }
