import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class CreateBillingDto {
    @ApiProperty({
        description: 'JSON object containing billing calculation details',
        example: {
            items: [
                { id: 1, name: 'Burger', price: 10.99, quantity: 2 },
                { id: 2, name: 'Fries', price: 4.99, quantity: 1 }
            ],
            taxes: { gst: 2.5, serviceTax: 1.5 }
        },
        required: false
    })
    @IsOptional()
    billingCalc?: any;

    @ApiProperty({
        description: 'Whether this order is for take away',
        example: true,
        required: false
    })
    @IsBoolean()
    @IsOptional()
    isTakeAway?: boolean;

    @ApiProperty({
        description: 'Whether this order is for home delivery',
        example: false,
        required: false
    })
    @IsBoolean()
    @IsOptional()
    isHomeDelivery?: boolean;

    @ApiProperty({
        description: 'Sub total amount (before discount)',
        example: 26.97,
        required: false
    })
    @IsOptional()
    subTotal?: number;

    @ApiProperty({
        description: 'Discount amount',
        example: 2.5,
        required: false
    })
    @IsOptional()
    discount?: number;

    @ApiProperty({
        description: 'Delivery personnel ID',
        example: 5,
        required: false
    })
    @IsOptional()
    deliveryBoyId?: number;

    @ApiProperty({
        description: 'Branch ID',
        example: 1,
        required: true
    })
    branchId: number;

    @ApiProperty({
        description: 'Payment method ID',
        example: 2,
        required: false
    })
    @IsOptional()
    paymentMethodId?: number;

    @ApiProperty({
        description: 'Table number',
        example: 'T15',
        required: false
    })
    @IsOptional()
    tableNo?: string;

    @ApiProperty({
        description: 'Whether the payment is pending',
        example: false,
        required: false
    })
    @IsOptional()
    isPendingPayment?: boolean;

    @ApiProperty({
        description: 'Customer ID',
        example: 123,
        required: false
    })
    @IsOptional()
    customerId?: number;

    @ApiProperty({
        description: 'Additional remarks or notes for the billing',
        example: 'Special instructions for preparation',
        required: false
    })
    @IsOptional()
    remarks?: string;
} 