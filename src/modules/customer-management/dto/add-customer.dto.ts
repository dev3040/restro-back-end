import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsOptional, MaxLength, ValidateIf, ValidateNested, ValidationArguments } from 'class-validator';
import { AddCustomerTransactionTypeDto, UpdateCustomerTransactionTypeDto } from './add-customer-transaction-type.dto';
import { Type } from 'class-transformer';
import { IsValidName } from 'src/shared/decorators/name.decorator';
import { IsPhoneNumber } from 'src/shared/decorators/phone.decorator';


class HelpFulLink {
   @ApiProperty({ description: 'URL of the helpful link', example: 'www.google.com' })
   linkUrl: string;

   @ApiProperty({ description: 'Description of the link', example: 'Search Engine' })
   description: string;
}
export class AddCustomerDto {

   @MaxLength(150)
   @IsValidName({ message: 'Please enter a valid name.&&&name' })
   @ApiProperty({
      description: 'Enter Customer name.&&&name',
      example: 'Jon Doe',
   })
   name: string;

   @ValidateIf(o => o.shortName)
   @MaxLength(10)
   @IsValidName({ message: 'Please enter a valid shortName.&&&shortName' })
   @ApiPropertyOptional({
      description: 'Enter customer short name.&&&shortName',
      example: 'JD',
   })
   shortName: string | null;

   @ValidateIf(o => o.email)
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
   @ApiPropertyOptional({
      description: 'Enter Email',
      example: 'jon@gmail.com',
   })
   email: string;

   @ValidateIf(o => o.phone)
   @ApiProperty({
      description: 'Enter Phone number',
      example: '(123) 456-7890',
   })
   @IsPhoneNumber()
   phone: string;

   @ApiProperty({
      description: "Select customer type active or not",
      example: false
   })
   isActive: boolean;

   @ApiPropertyOptional({
      description: 'Helpful links',
      type: [HelpFulLink],
      example: [
         { linkUrl: 'www.google.com', description: 'Search Engine' },
         { linkUrl: 'www.facebook.com', description: 'Social Media Platform' },
      ],
   })
   helpFulLinks: HelpFulLink[];

   @ValidateIf(o => o.transactionTypes)
   @ApiPropertyOptional({
      description: 'Please add transaction types { Set value [] for automatic mapping with all transaction types}',
      example: [
         {
            transactionTypesId: 5,
            customerTransactionType: "Title Registration",
            price: "15.75",
            description: ""
         }
      ]
   })
   @ValidateNested()
   @Type(() => AddCustomerTransactionTypeDto)
   transactionTypes: AddCustomerTransactionTypeDto[];

   @ValidateIf(o => o.primaryLocation)
   @MaxLength(500)
   @ApiPropertyOptional({
      description: 'Enter primary location',
      example: '1140, COMMERCE DR STE 100',
   })
   primaryLocation: string | null;

   @ValidateIf(o => o.fax)
   @MaxLength(10)
   @ApiPropertyOptional({
      description: 'Enter fax',
      example: '2211221112',
   })
   fax: string | null;

   @ValidateIf(o => o.customerNote)
   @MaxLength(300)
   @ApiPropertyOptional({
      description: 'Enter customer note',
      example: '',
   })
   customerNote: string | null;

   @ValidateIf(o => o.billingNote)
   @MaxLength(300)
   @ApiPropertyOptional({
      description: 'Enter billing note',
      example: '',
   })
   billingNote: string | null;

   @ValidateIf(o => o.paymentTerms)
   @MaxLength(100)
   @ApiPropertyOptional({
      description: 'Enter paymnet terms',
      example: '',
   })
   paymentTerms: string | null;

   @ValidateIf(o => o.vendorNumber)
   @MaxLength(100)
   @ApiPropertyOptional({
      description: 'Enter vendor number',
      example: '1123122133',
   })
   vendorNumber: string | null;
}

export class UpdateCustomerDto extends PartialType(AddCustomerDto) {

   @ApiProperty({
      description: 'Please add or update transaction types for the customer',
      example: [
         {
            customerTransactionTypeId: 6,
            customerTransactionType: "Title Registration",
            price: "15.75",
            description: ""
         },
         {
            customerTransactionTypeId: 5,
            customerTransactionType: "Title Registration",
            price: "15.75",
            description: ""
         }
      ]
   })
   @IsOptional()
   @ValidateNested({ each: true })
   @Type(() => UpdateCustomerTransactionTypeDto)
   transactionTypes?: any[];

}
