import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
    @ApiProperty({ description: 'Payment date' })
    @IsDateString()
    @IsNotEmpty()
    paymentDate: string;

    @ApiProperty({ description: 'Payment recipient' })
    @IsString()
    @IsNotEmpty()
    paymentTo: string;

    @ApiProperty({ description: 'Payment amount' })
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @ApiProperty({ description: 'Branch ID' })
    @IsNumber()
    @IsNotEmpty()
    branchId: number;

    @ApiProperty({ description: 'Additional remarks', required: false })
    @IsString()
    @IsOptional()
    remarks?: string;
} 