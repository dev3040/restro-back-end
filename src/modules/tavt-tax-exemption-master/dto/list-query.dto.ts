import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumberString, IsString, ValidateIf, ValidationArguments } from 'class-validator';
import { TaxExemptionTypeEnum } from 'src/shared/enums/tax-exemption.enum';

export class PageQueryDto {

    @ValidateIf(o => o.offset)
    @IsNumberString({}, { message: 'Offset contain only number' })
    @ApiPropertyOptional({
        description: 'Enter offset',
        example: 0,
    })
    offset: number;

    @ValidateIf(o => o.limit)
    @IsNumberString({}, { message: 'Limit contain only number' })
    @ApiPropertyOptional({
        description: 'Enter limit ',
        example: 10,
    })
    limit: number;

    @ValidateIf(o => o.orderBy)
    @IsString({ message: 'Order by contain only string', })
    @ApiProperty({
        description: 'Please enter order by (created_at)',
        example: 'created_at',
    })
    orderBy: string;

    @IsEnum(['DESC', 'ASC'], {
        message: (args: ValidationArguments) => {
            if (
                typeof args.value == 'undefined' || args.value == '' || args.value == null
            ) {
                return `Please select order dir.`;
            } else {
                return `Please select a valid order dir('DESC', 'ASC').`;
            }
        },
    })
    @ApiPropertyOptional({
        description: 'Please select orderdir (DESC,ASC)',
        example: 'DESC',
    })
    orderDir: string;


    @ApiPropertyOptional({
        description: "Enter search value"
    })
    search: string;

    @ApiPropertyOptional({
        description: "Select exemption type",
        example: TaxExemptionTypeEnum.TAVT
    })
    exemptionType: TaxExemptionTypeEnum

}