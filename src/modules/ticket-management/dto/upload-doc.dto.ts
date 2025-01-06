import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsEnum, IsOptional, ValidateIf, ValidationArguments } from 'class-validator';
import { FormType } from 'src/shared/enums/form-type.enum';


export class UploadDocumentsDto {
   @ApiProperty({
      type: "string",
      format: "binary",
      description: "Attachments",
      example: "profile.jpg"
   })
   attachments: any[];

   @ApiPropertyOptional({
      description: 'Enter description',
      example: ['Plate transfer related documents'],
   })
   description: string[];

   @ValidateIf(o => o.formType !== undefined)
   @IsEnum(([FormType.TICKET_INFO_FORM, FormType.BILLING_PROCESS, FormType.BILLING_INFO_FORM, FormType.BASIC_INFO_FORM, FormType.SIGNED_DOCUMENT]), {
      message: (args: ValidationArguments) => {
         if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
            return `Enter form type (ticket, billingInfo, basicInfo, signedDocument).&&&formType&&&ERROR_MESSAGE`;
         } else {
            return `Enter a valid form type (ticket, billingInfo, basicInfo, signedDocument).&&&formType&&&ERROR_MESSAGE`;
         }
      }
   })
   @ApiPropertyOptional({
      description: 'Form Type',
      example: FormType.TICKET_INFO_FORM,
      default: FormType.TICKET_INFO_FORM,
   })
   formType: FormType;

   @ApiPropertyOptional({
      description: 'Signed doc or not',
      example: 'true',
   })
   @IsOptional()
   @IsBooleanString()
   isSigned: boolean;

   @ApiPropertyOptional({
      description: 'Billing doc or not',
      example: 'true',
   })
   @IsOptional()
   @IsBooleanString()
   isBillingDoc: boolean;

}

export class ListDocumentDto {

   @ApiPropertyOptional({
      description: "Enter search value"
   })
   isSigned: boolean;

   @ApiPropertyOptional({
      description: 'Billing doc or not',
      example: 'true',
   })
   isBillingDoc: boolean;

   @ApiPropertyOptional({
      description: "Enter search value"
   })
   isFedExLabel: boolean;

}

