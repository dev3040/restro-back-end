import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNumberString, IsOptional, MaxLength, ValidateIf, ValidationArguments } from "class-validator";
import { TransactionReturnTypeEnum } from "src/shared/enums/transaction-return-type.enum";

export class TransactionReturnDto {
   @ValidateIf(o => o.transactionReturnType !== undefined)
   @IsEnum(TransactionReturnTypeEnum, {
      message: (args: ValidationArguments) => {
         if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
            return `Select note type.(1-Customer provided label back to them, 2-Customer provided label to their Client, 3-Customer will pickup, 4-Ship back to Customer + Charge Fee, 5-Ship back to Customer - Request Label, 6-Ship to Client/Enter address information + Charge Fee, 7-County mailed Reg/Plate to Driver, 8-Driver picked up Reg/Plate at County - No fee).&&&type&&&ERROR_MESSAGE`;
         } else {
            return `Select a valid note type(1-Customer provided label back to them, 2-Customer provided label to their Client, 3-Customer will pickup, 4-Ship back to Customer + Charge Fee, 5-Ship back to Customer - Request Label, 6-Ship to Client/Enter address information + Charge Fee, 7-County mailed Reg/Plate to Driver, 8-Driver picked up Reg/Plate at County - No fee).&&&type&&&ERROR_MESSAGE`;
         }
      }
   })
   @ApiPropertyOptional({
      description: `Transaction return type(1-Customer provided label back to them, 2-Customer provided label to their Client, 3-Customer will pickup, 4-Ship back to Customer + Charge Fee, 5-Ship back to Customer - Request Label, 6-Ship to Client/Enter address information + Charge Fee, 7-County mailed Reg/Plate to Driver, 8-Driver picked up Reg/Plate at County - No fee).`,
      example: TransactionReturnTypeEnum.CUS_WILL_PICKUP,
   })
   transactionReturnType: TransactionReturnTypeEnum;

   @IsOptional()
   @ValidateIf(o => o.address)
   @MaxLength(500, { message: "address Maximum 500 characters are allowed.&&&address" })
   @ApiPropertyOptional({
      description: 'Address',
      example: '123 Main St'
   })
   address: string;

   @ValidateIf(o => o.isDifferentAddress)
   @IsBoolean()
   @ApiPropertyOptional({
      description: 'Select if address is different or not',
      example: 'true',
   })
   isDifferentAddress: boolean;

   @ValidateIf(o => o.expressMailFees)
   @IsNumberString()
   @ApiPropertyOptional({
      description: 'Enter express mail fees',
      example: '200.30',
   })
   expressMailFees: string;

   @IsOptional()
   @ValidateIf(o => o.trackingLabel !== undefined)
   @MaxLength(20, { message: "trackingLabel Maximum 20 characters are allowed.&&&trackingLabel" })
   @ApiPropertyOptional({
      description: 'Tracking label',
      example: '123 Main St'
   })
   trackingLabel: string;
}
