import { IsNumberString, IsOptional, MaxLength, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AddFMVMasterDTO {

    @IsOptional()
    @ApiPropertyOptional({
        description: 'FMV master id',
        example: 1,
        required: false,
    })
    id?: number;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Ticket id',
        example: 1,
        required: false,
    })
    ticketId?: number;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Vin id',
        example: 1,
        required: false,
    })
    vinId?: number;

    @IsOptional()
    @ValidateIf((o) => o.year)
    @MaxLength(4, { message: 'The year must be in four digit.' })
    @ApiPropertyOptional({
        description: 'Year of the valucation',
        example: 2022,
        required: false,
    })
    year?: string;

    @IsOptional()
    @ValidateIf((o) => o.price)
    @IsNumberString()
    @MaxLength(10)
    @ApiPropertyOptional({
        description: 'Price of the valucation',
        example: 1000.50,
        required: false,
    })
    price?: string;

    @IsOptional()
    @ValidateIf((o) => o.valueType)
    @MaxLength(15)
    @ApiPropertyOptional({
        description: 'Type of the valucation',
        example: 'Type A',
        required: false,
    })
    valueType?: string;

    @IsOptional()
    @ValidateIf((o) => o.source)
    @MaxLength(15)
    @ApiPropertyOptional({
        description: 'Source of the valucation',
        example: 'Source X',
        required: false,
    })
    source?: string;

    @IsOptional()
    @ValidateIf((o) => o.dateEntered)
    @ApiPropertyOptional({
        description: 'Date of the valucation',
        example: '2024-04-23',
        required: false,
    })
    dateEntered?: string;

    @IsOptional()
    @ValidateIf((o) => o.vinFirstHalf)
    @MaxLength(8)
    @ApiPropertyOptional({
        description: 'First half of the vin',
        example: 'ABC12345',
        required: false,
    })
    vinFirstHalf?: string;

    @IsOptional()
    @ValidateIf((o) => o.document)
    @ApiPropertyOptional({
        description: 'First half of the vin',
        example: 'ABC12345',
        required: false,
    })
    document?: string;

    @IsOptional()
    @ValidateIf((o) => o.series)
    @MaxLength(50)
    @ApiPropertyOptional({
        description: 'Series of the vin',
        example: 'SCOOTER',
        required: false,
    })
    series?: string;

    @IsOptional()
    @ValidateIf((o) => o.year)
    @MaxLength(4, { message: 'The year must be in four digit.' })
    @ApiPropertyOptional({
        description: 'Effective year of the valucation',
        example: 2022,
        required: false,
    })
    effectiveYear?: string;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Whether it coming from master', example: true })
    isMaster?: boolean;
}
