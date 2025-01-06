import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, MaxLength, ValidateNested, ValidationArguments } from 'class-validator';
import { CountyMainLocation } from 'src/shared/enums/county-location.enum';
import { SaveFedExAddressDto } from './save-fedex-address.dto';
import { IsPhoneNumber } from 'src/shared/decorators/phone.decorator';

export class SaveCountyProfileDto {

   @ApiProperty({ description: 'Name of the entity', example: 'John Doe', nullable: true })
   @IsOptional()
   @MaxLength(40)
   name?: string;

   @ApiProperty({ description: 'Phone number', example: '(123) 456-7890', nullable: true })
   @IsOptional()
   @IsPhoneNumber()
   phone?: string;

   @ApiProperty({ description: 'Email address', example: 'example@example.com', nullable: true })
   @IsOptional()
   @IsEmail({}, {
      message: (args: ValidationArguments) => {
         if (typeof args.value == "undefined" || args.value == "") {
            return `Enter Email.&&&email`;
         } else {
            return `Enter a valid email.&&&email`;
         }
      }
   })
   email?: string;

   @ApiProperty({ description: 'Address', example: '1234 Main St', nullable: true })
   @IsOptional()
   address?: string;

   @ApiProperty({ description: 'Physical address', example: { notes: "example", address: '1234 Main St' }, nullable: true })
   @IsOptional()
   physicalAddress?: string;

   @ApiProperty({ description: 'Mailing address', example: '1234 Main St', nullable: true })
   @IsOptional()
   mailingAddress?: string;

   @ApiProperty({ description: 'Shipping address', example: '1234 Main St', nullable: true })
   @IsOptional()
   shippingAddress?: string;

   @ApiProperty({
      example: CountyMainLocation.PHYSICAL_ADDRESS,
      enum: CountyMainLocation,
      description: 'Main address selection',
   })
   @IsOptional()
   @IsEnum(CountyMainLocation)
   mainLocation: CountyMainLocation;

   @ApiProperty({ description: 'Notes', example: 'Example', nullable: true })
   @IsOptional()
   notes?: string;

   @ApiProperty({ description: 'Role', example: 'Professor', nullable: true })
   @IsOptional()
   @MaxLength(100)
   role?: string;

   @IsOptional()
   @ApiProperty({
      description: 'Enter fedex address',
      example: {
         contactName: 'John Doe',
         companyName: 'Example Company',
         phone: '(123) 456-7890',
         location: '1234 Main St',
         serviceTypeId: 1,
      },
   })
   @ValidateNested()
   @Type(() => SaveFedExAddressDto)
   fedExAddress: SaveFedExAddressDto;
}
