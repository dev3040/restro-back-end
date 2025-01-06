import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, MaxLength, ValidateIf } from 'class-validator';

export class AddCustomerTransactionTypeDto {
    @ApiPropertyOptional({
        description: 'ID of the customer',
        example: 1,
    })
    customerId: number;

    @ApiPropertyOptional({
        description: 'ID of the transaction type',
        example: 2,
    })
    transactionTypesId: number;

    @ApiPropertyOptional({
        description: 'Type the customer transaction',
        example: 'Title Registration',
        maxLength: 100,
    })
    @MaxLength(100)
    customerTransactionType: string;

    @IsNumberString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Price associated with the transaction type',
        example: '49.99',
        type: 'decimal',
    })
    price: string;

    @ValidateIf(o => o.description)
    @ApiPropertyOptional({
        description: 'Description of the customer transaction type',
        example: '',
    })
    description: string;
}

export class UpdateCustomerTransactionTypeDto extends PartialType(AddCustomerTransactionTypeDto) {
    @ApiPropertyOptional({
        description: 'ID of the transaction type',
        example: 2,
    })
    customerTransactionTypeId: number;
}