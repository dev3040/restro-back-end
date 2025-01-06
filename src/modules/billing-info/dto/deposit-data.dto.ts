import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, MaxLength, ValidateIf, ValidationArguments } from "class-validator";
import { IsNotFutureDate } from "src/shared/decorators/not-future-date.decorator";
import { BillingDepositTypesEnum } from "src/shared/enums/billing-deposit-type.enum";

export class DepositDto {
   @IsOptional()
   @ValidateIf(o => o.id)
   @ApiPropertyOptional({
      description: 'ID',
   })
   id: number

   @ValidateIf(o => o.type)
   @IsEnum(BillingDepositTypesEnum, {
      message: (args: ValidationArguments) => {
         if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
            return `Select deposit to type.(1=Deposit to Us,2=Deposit to county).&&&type&&&ERROR_MESSAGE`;
         } else {
            return `Select a valid deposit to type(1=Deposit to Us,2=Deposit to county).&&&type&&&ERROR_MESSAGE`;
         }
      }
   })
   @ApiPropertyOptional({
      description: `Deposit type(1=Deposit to Us,2=Deposit to county).`,
      example: BillingDepositTypesEnum.COUNTY,
   })
   type: BillingDepositTypesEnum

   @IsOptional()
   @ValidateIf(o => o.chequeNumber)
   @MaxLength(25, { message: "chequeNumber Maximum 25 characters are allowed.&&&chequeNumber" })
   @ApiPropertyOptional({
      description: 'Cheque number',
   })
   chequeNumber: string

   @IsOptional()
   @ValidateIf(o => o.amount)
   @ApiPropertyOptional({
      description: 'Amount',
   })
   amount: string

   @IsOptional()
   @IsDateString()
   @IsNotFutureDate({ message: 'Received date can not be in the future.&&&receivedDate' })
   @ApiPropertyOptional({
      description: 'Received date',
   })
   receivedDate: string;
}