import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, Matches, Validate, ValidateIf } from 'class-validator';
import { SevenDigitsBeforeDotValidator } from 'src/modules/trade-in-info/dto/add-trade-in-info.dto';
import { CommonConst, TransactionTypeConst } from 'src/shared/constants/common.constant';
import { ValidateArrayNotEmpty } from 'src/shared/decorators/validate-array-not-empty.decorator';
import { ValidateMaxLength } from 'src/shared/decorators/validate-max-length';
import { ValidateMinLength } from 'src/shared/decorators/validate-min-length';
import { ValidateNotEmpty } from 'src/shared/decorators/validate-not-empty';

export class AddTransactionTypesDto {

   @ValidateNotEmpty({ constraints: { Field: "Name" } })
   @ValidateMaxLength(TransactionTypeConst.nameLength,
      { constraints: { field: 'Name', limit: TransactionTypeConst.nameLength } }
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

   @Type(() => Number)
   @ValidateArrayNotEmpty({ constraints: { field: 'team ID' } })
   @IsArray()
   @ApiProperty({
      description: 'Array of team ID',
      example: [1, 2, 3],
   })
   teamIds: Array<number>;

}

export class DeleteTransactionDto {

   @ApiProperty({
      type: [Number],
      description: 'Array of transaction type IDs to be deleted',
      example: [1, 2, 3],
   })
   @IsArray()
   @ValidateArrayNotEmpty({ constraints: { field: 'transaction type ID' } })
   @IsInt({ each: true, message: 'Each ID must be an integer' })
   ids: number[];
}