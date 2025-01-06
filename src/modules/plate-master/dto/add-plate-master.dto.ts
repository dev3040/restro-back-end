import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, IsOptional, Length, MaxLength, ValidateNested } from "class-validator";
import { AddCountySpecial } from "./county-special-form.dto"
import { Type } from "class-transformer";
export class AddPlateMasterDto {

    @IsNotEmpty({ message: "Plate details is required." })
    @ApiProperty({
        description: 'Details of the plate',
        example: 'Standard License Plate',
        maxLength: 150,
    })
    @Length(2, 150)
    plateDetails: string;

    @IsNotEmpty({ message: "Plate category code is required." })
    @ApiProperty({
        description: 'Category code for the plate',
        example: 'A1',
        maxLength: 5,
    })
    @Length(1, 5)
    categoryCode: string;

    @ApiProperty({
        description: 'Type ID of the plate',
        example: 1,
        required: false,
    })
    @IsOptional()
    plateTypeId?: number;

    @ApiProperty({
        description: 'Annual special fee for the plate',
        example: "20.50",
        required: false,
    })
    @IsNumberString()
    @MaxLength(11)
    @IsOptional()
    annualSpecialFee?: string;

    @ApiProperty({
        description: 'Manufacturing fee for the plate',
        example: "15.75",
        required: false,
    })
    @IsNumberString()
    @MaxLength(11)
    @IsOptional()
    manufacturingFee?: string;

    @ApiProperty({
        description: 'Standard fee for the plate',
        example: "10.00",
        required: false,
    })
    @IsNumberString()
    @MaxLength(11)
    @IsOptional()
    standardFee?: string;

    @ApiProperty({
        description: 'Required forms for the plate',
        example: 'Form A, Form B',
        maxLength: 70,
        required: false,
    })
    @MaxLength(70)
    @IsOptional()
    requiredForms?: string;

    @ApiProperty({
        description: 'Special qualifications for the plate',
        example: 'Must be a veteran',
        maxLength: 500,
        required: false,
    })
    @MaxLength(500)
    @IsOptional()
    specialQualifications?: string;

    @ApiProperty({
        description: 'State ID for the plate',
        example: 2,
        required: false,
    })
    @IsOptional()
    stateId?: number;

    @ApiProperty({
        description: 'Document associated with the plate',
        example: '<document>',
        required: false,
    })
    @IsOptional()
    document?: string;

    @ApiProperty({
        description: 'Site link associated with the plate',
        example: 'http://example.com',
        required: false,
    })
    @IsOptional()
    siteLink?: string;

    @ApiProperty({
        description: 'Quarter calculation',
        example: { quarter1: 0.0, quarter2: 0.0, quarter3: 0.0, quarter4: 0.0 },
        required: false,
    })
    @IsOptional()
    quarterCalc?: string;

    @ApiProperty({
        description: 'Weight range start for the plate',
        example: 1000,
        required: false,
    })
    @IsOptional()
    weightRangeStart?: number;

    @ApiProperty({
        description: 'Weight range end for the plate',
        example: 2000,
        required: false,
    })
    @IsOptional()
    weightRangeEnd?: number;

    @ApiProperty({
        description: 'Indicates if the plate is transferable',
        example: true,
    })
    isTransferable: boolean;

    @ApiProperty({
        description: 'Indicates if the plate expires in February',
        example: false,
    })
    isFebExpiration: boolean;

    @ApiProperty({
        description: 'Indicates if the plate is active',
        example: true,
    })
    isActive: boolean;

    @ApiProperty({
        description: 'Is reg quarter',
        example: true,
    })
    isRegQuarter: boolean;

    @ApiPropertyOptional({
        description: 'Enter vin info',
        example: {
            plateId: 1,
            countyId: [2],
            formName: "DSV-1"
        },
    })
    @ValidateNested()
    @Type(() => AddCountySpecial)
    countySpecialForm: AddCountySpecial[];

}

export class UpdatePlateMasterDto extends PartialType(AddPlateMasterDto) { }