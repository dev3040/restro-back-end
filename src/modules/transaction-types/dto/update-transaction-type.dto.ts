import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, Matches, Validate, ValidateIf, ValidateNested } from 'class-validator';
import { SevenDigitsBeforeDotValidator } from 'src/modules/trade-in-info/dto/add-trade-in-info.dto';
import { CommonConst, TransactionTypeConst } from 'src/shared/constants/common.constant';
import { ValidateMaxLength } from 'src/shared/decorators/validate-max-length';
import { ValidateMinLength } from 'src/shared/decorators/validate-min-length';
import { ValidateNotEmpty } from 'src/shared/decorators/validate-not-empty';

class TeamData {

   @IsNumber()
   teamId: number;

   @IsBoolean()
   isAdd: boolean;

}


export class UpdateTransactionTypeDto {

   @ValidateNotEmpty({ constraints: { Field: "Name" } })
   @ValidateMaxLength(CommonConst.maxStringLength,
      { constraints: { field: 'Name', limit: CommonConst.maxStringLength } }
   )
   @ValidateMinLength(CommonConst.minStringLength,
      { constraints: { field: 'Name', limit: CommonConst.minStringLength } }
   )
   @ApiProperty({
      description: 'Enter name',
      example: 'Title',
   })
   @Matches(/^[\w\/\(\)\-, ]+$/, { message: 'Enter a valid name.&&&name' })
   name: string;

   @ValidateIf(o => o.transactionCode)
   @ValidateMaxLength(TransactionTypeConst.codeLength,
      { constraints: { field: 'Transaction code', limit: TransactionTypeConst.codeLength } }
   )
   @Matches(/^[\w\/\(\)\-, ]+$/, { message: 'Enter a valid transaction code.&&&transactionCode' })
   @ApiPropertyOptional({
      description: 'Enter transaction code',
      example: 'TT',
   })
   transactionCode: string;

   @ValidateNotEmpty({ constraints: { Field: "Price" } })
   @ApiProperty({
      description: 'Price associated with the transaction type',
      example: "49.000",
      type: 'decimal',
   })
   @Validate(SevenDigitsBeforeDotValidator, {
      message: 'Invalid format. Must contain up to 7 digits before the decimal point and up to 3 digits after the decimal point.'
   })
   price: string;

   @ValidateNotEmpty({ constraints: { Field: "State" } })
   @ValidateMaxLength(TransactionTypeConst.stateLength,
      { constraints: { field: 'State', limit: TransactionTypeConst.stateLength } }
   )
   @ApiProperty({
      description: 'Enter state',
      example: 'GA',
   })
   state: string;

   @ApiProperty({
      description: 'Active status',
      example: 'true',
   })
   isActive: boolean;

   @ValidateIf(o => o.teamData)
   @Type(() => TeamData)
   @IsArray()
   @ValidateNested()
   @ApiPropertyOptional({
      description: 'Array of team ID with add/remove flag',
      example: [{
         teamId: 1,
         isAdd: false
      }],
   })
   teamData: TeamData[];

}