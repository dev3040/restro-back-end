import { IsNumberString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrationInfoDto {
    @ApiPropertyOptional({
        description: 'ID of the ticket',
        example: 12345,
    })
    @IsOptional()
    ticketId?: number;

    @ApiPropertyOptional({
        description: 'ID of the plate type',
        example: 2,
    })
    @IsOptional()
    plateTypeId?: number;

    @ApiPropertyOptional({
        description: 'Indicates if the plate is being transferred',
        example: false,
    })
    @IsOptional()
    plateTransfer?: boolean;

    @ApiPropertyOptional({
        description: 'Number of the plate',
        example: 'ABC123',
    })
    @IsOptional()
    @MaxLength(30)
    plateNumber?: string;

    @ApiPropertyOptional({
        description: 'Expiration date of the registration',
        example: '2023-12-31',
    })
    @IsOptional()
    expirationDate?: string;

    @ApiPropertyOptional({
        description: 'Gross vehicle weight',
        example: '3500',
    })
    @IsOptional()
    @MaxLength(100)
    gvw?: string;

    @ApiPropertyOptional({
        description: 'Indicates if the vehicle is veteran exempt',
        example: false,
    })
    @IsOptional()
    veteranExempt?: boolean;

    @ApiPropertyOptional({
        description: 'Initial total cost of the registration',
        example: 123.456,
    })
    @IsNumberString()
    @MaxLength(10)
    @IsOptional()
    initialTotalCost?: string;

    @ApiPropertyOptional({
        description: 'Indicates if the emission has been verified',
        example: true,
    })
    @IsOptional()
    emissionVerified?: boolean;

    @ApiPropertyOptional({
        description: 'Indicates if the registration is renewed for two years',
        example: false,
    })
    @IsOptional()
    isRenewTwoYears?: boolean;

    @ApiPropertyOptional({
        description: 'Indicates if there is a $50 highway impact',
        example: false,
    })
    @IsOptional()
    isHighwayImpact50?: boolean;

    @ApiPropertyOptional({
        description: 'Indicates if there is a $100 highway impact',
        example: false,
    })
    @IsOptional()
    isHighwayImpact100?: boolean;

    @ApiPropertyOptional({
        description: 'Indicates if there is an alternative fuel fee',
        example: false,
    })
    @IsOptional()
    isAlternativeFuelFee?: boolean;

    @ApiPropertyOptional({
        description: 'Indicates if the registration is renewed for two years with an exemption',
        example: false,
    })
    @IsOptional()
    isRenewTwoYearsRegExp?: boolean;

    @ApiPropertyOptional({
        description: 'Indicates if the vehicle is for hire',
        example: false,
    })
    @IsOptional()
    isForHire?: boolean;

    @ApiPropertyOptional({
        description: 'Indicates if the vehicle is for 2290',
        example: false,
    })
    @IsOptional()
    is2290?: boolean;

    @ApiPropertyOptional({
        description: 'Value for line 2209',
        example: 10,
    })
    @IsOptional()
    line2209?: number;

    @ApiPropertyOptional({
        description: 'Mailing address for the registration',
        example: '123 Main St, Anytown, USA',
    })
    @IsOptional()
    mailingAddress?: string;
}
