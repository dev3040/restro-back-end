import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ValidateIf, ValidateNested } from "class-validator";
import { BillingDepositTypesEnum } from "src/shared/enums/billing-deposit-type.enum";
import { TransactionReturnTypeEnum } from "src/shared/enums/transaction-return-type.enum";
import { TransactionReturnDto } from "./transaction-return-type.dto";
import { DepositDto } from "./deposit-data.dto";
import { Type } from "class-transformer";

export class SetBillingInfoDto {

   @ApiProperty({
      description: 'Enter ticket id',
      example: 1
   })
   ticketId: number;

   @ValidateIf(o => o.transactionReturnData)
   @ApiPropertyOptional({
      description: 'Enter transaction return data',
      example: {
         transactionReturnType: TransactionReturnTypeEnum.COUNTY_MAILED_REG_OR_PLATE_TO_DRIVER,
         isDifferentAddress: true,
         address: "123 Main St",
         expressMailFees: "1000.000",
         trackingLabel: "Htrqs312"
      }
   })
   @Type(() => TransactionReturnDto)
   @ValidateNested()
   transactionReturnData: TransactionReturnDto

   @ValidateIf(o => o.depositData)
   @ApiPropertyOptional({
      description: 'Enter deposit data',
      example: {
         id: null,
         type: BillingDepositTypesEnum.US,
         chequeNumber: "1001",
         amount: "1000.00",
         receivedDate: "2024-05-20"
      }
   })
   @ValidateNested()
   @Type(() => DepositDto)
   depositsData: DepositDto

}


