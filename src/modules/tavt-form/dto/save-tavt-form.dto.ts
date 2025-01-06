import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { OtherFeesDto } from './other-fees.dto';
import { Type } from 'class-transformer';

export class TavtFormDto {
    @ApiPropertyOptional({
        example: 123,
        description: 'The identifier of the related ticket.',
    })
    @IsOptional()
    ticketId: number;
    
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(10)
    @ApiPropertyOptional({
        description: 'Check count',
        example: 1,
    })
    checkCount: number;

    @ApiPropertyOptional({
        example: false,
        description: 'Indicates if the form is related to a sales transaction.',
        default: false,
    })
    @IsOptional()
    isSales: boolean;

    @ApiPropertyOptional({
        example: false,
        description: 'Activity log flag.',
        default: false,
    })
    @IsOptional()
    isNotLog: boolean;

    @ApiPropertyOptional({
        example: '2024-07-10',
        description: 'The date when the form was received.',
    })
    @IsOptional()
    arrivalDate: Date;

    @ApiPropertyOptional({
        example: 15000.000,
        description: 'The sales price of the item in the form.',
    })
    @IsOptional()
    salesPrice: number;

    @ApiPropertyOptional({
        example: 1000.000,
        description: 'The rebates applied to the sales price.',
    })
    @IsOptional()
    rebates: number;

    @ApiPropertyOptional({
        example: 500.000,
        description: 'The discount applied to the sales price.',
    })
    @IsOptional()
    discount: number;

    @ApiPropertyOptional({
        example: 200.000,
        description: 'The cost of accessories included in the sales price.',
    })
    @IsOptional()
    accessories: number;

    @ApiPropertyOptional({
        example: 50.000,
        description: 'The administration fees included in the sales price.',
    })
    @IsOptional()
    administrationFees: number;

    @ApiPropertyOptional({
        example: 50.000,
        description: 'The agreed upon value.',
    })
    @IsOptional()
    agreedUponValue: number;

    @ApiPropertyOptional({
        example: 50.000,
        description: 'The depreciation value.',
    })
    @IsOptional()
    depreciation: number;

    @ApiPropertyOptional({
        example: 50.000,
        description: 'The amortized value.',
    })
    @IsOptional()
    amortized: number;

    @ApiPropertyOptional({
        example: 50.000,
        description: 'The down payment.',
    })
    @IsOptional()
    downPayment: number;

    @ApiPropertyOptional({
        example: 100.000,
        description: 'The dealer handling fees included in the sales price.',
    })
    @IsOptional()
    dealerHandling: number;

    @ApiPropertyOptional({
        example: 75.000,
        description: 'The delivery fees included in the sales price.',
    })
    @IsOptional()
    deliveryFees: number;

    @ApiPropertyOptional({
        example: 30.000,
        description: 'The documentation fees included in the sales price.',
    })
    @IsOptional()
    documentationFees: number;

    @ApiPropertyOptional({
        example: 40.000,
        description: 'The shipping and handling fees included in the sales price.',
    })
    @IsOptional()
    shippingHandlingFees: number;

    @ApiProperty({
        example: 1,
        description: 'The unique identifier for the tax exemption.',
    })
    taxExemptionId: number;

    @ApiPropertyOptional({
        example: 800.000,
        description: 'The TAVT (Title Ad Valorem Tax) value.',
    })
    @IsOptional()
    tavtValue: number;

    @ApiPropertyOptional({
        example: 5.000,
        description: 'The percentage rate of the TAVT.',
    })
    @IsOptional()
    tavtPercentage: number;

    @ApiPropertyOptional({
        example: 50.000,
        description: 'The penalty amount for the dealer related to TAVT.',
    })
    @IsOptional()
    tavtDealerPenalty: number;

    @ApiPropertyOptional({
        example: 0.500,
        description: 'The percentage rate of the dealer penalty related to TAVT.',
    })
    @IsOptional()
    tavtDealerPenaltyPercentage: number;

    @ApiPropertyOptional({
        example: 0.500,
        description: 'The percentage rate of the dealer penalty related to Valorem.',
    })
    @IsOptional()
    valoremPenaltyPercentage: number;

    @ApiPropertyOptional({
        example: 30.000,
        description: 'The fees related to the title.',
    })
    @IsOptional()
    titleFees: number;

    @ApiPropertyOptional({
        example: 10.000,
        description: 'The penalty for late title processing.',
    })
    @IsOptional()
    titleLatePenalty: number;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Tavt other fees',
        example: [{
            id: 1,
            formId: 123,
            otherFeesId: 456,
            price: 1234.567,
        }],
    })
    @ValidateNested()
    @Type(() => OtherFeesDto)
    otherFees: OtherFeesDto[];

    @ApiPropertyOptional({
        example: 5.000,
        description: 'Enter sales tax percentage.',
    })
    @IsOptional()
    salesTaxPercentage: number;

    @ApiPropertyOptional({
        example: 5.000,
        description: 'Enter our fees',
    })
    @IsOptional()
    ourFees: number;

    @ApiPropertyOptional({
        example: [{}],
        description: 'Enter valorem calculation',
    })
    @IsOptional()
    valoremCalc: string;

}
