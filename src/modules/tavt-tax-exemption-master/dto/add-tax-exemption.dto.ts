import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length, MaxLength, Validate, ValidateIf, ValidationArguments } from "class-validator";
import { SevenDigitsBeforeDotValidator } from "src/modules/trade-in-info/dto/add-trade-in-info.dto";
import { IsValidName } from "src/shared/decorators/name.decorator";
import { TaxExemptionTypeEnum } from "src/shared/enums/tax-exemption.enum";

export class SaveTaxExemptionMasterDto {

    @IsNotEmpty({ message: "State is required." })
    @IsInt({ message: 'State ID must be an integer' })
    @ApiProperty({
        description: 'Enter State',
        example: 1,
    })
    stateId: number;

    @IsEnum(TaxExemptionTypeEnum, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined") {
                return `Select exemption type.(TAVT =1,TAVT_SALES_TAX = 2, SALES_TAX = 3).&&&exemptionType&&&ERROR_MESSAGE`;
            } else {
                return `Select valid exemption typ(TAVT = 1,TAVT_SALES_TAX = 2, SALES_TAX = 3).&&&exemptionType&&&ERROR_MESSAGE`;
            }
        }
    })
    @ApiProperty({
        description: `Select type (TAVT = 1,TAVT_SALES_TAX = 2, SALES_TAX = 3).`,
        example: "1",
    })
    exemptionType: TaxExemptionTypeEnum;

    @IsNotEmpty({ message: "Exemption is required." })
    @IsString({ message: 'Exemption must be a string' })
    @Length(2, 100, { message: 'Exemption must be up to 100 characters long' })
    @ApiProperty({
        description: 'Enter exemption type',
        example: 'Sales Tax - ST5',
    })
    @IsValidName({ message: 'Please enter a valid exemption.&&&exemption' })
    exemption?: string;

    @ApiProperty({
        description: "Taxable master active or not",
        example: false
    })
    @IsBoolean({ message: 'Status must be a boolean value' })
    isActive: boolean;

    @IsOptional()
    @Validate(SevenDigitsBeforeDotValidator, {
        message: 'Invalid format. Rate contain up to 7 digits before the decimal point and up to 3 digits after the decimal point.'
    })
    @ApiPropertyOptional({
        description: 'Enter price',
        example: '200.38',
    })
    rate?: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: "Enter description",
        example: "Exemption for tax",
    })
    @MaxLength(300, { message: 'Description must be up to 300 characters long.' })
    description?: string;

    @IsOptional()
    @ValidateIf((o) => o.requiredForms)
    @IsString({ message: "Required forms must be a string." })
    @ApiPropertyOptional({
        description: "Enter required forms",
        example: "PT-472NS",
    })
    requiredForms?: string;

}

export class DeleteExemptionDto {
    @ApiProperty({
        type: [Number],
        description: 'Array of exemption IDs to be deleted',
        example: [1, 2, 3],
    })
    @IsArray()
    @ArrayNotEmpty({ message: 'The list of IDs should not be empty.' })
    @ArrayMinSize(1, { message: 'The list must contain at least one ID.' })
    @IsInt({ each: true, message: 'Each ID must be an integer.' })
    ids: number[];
}
