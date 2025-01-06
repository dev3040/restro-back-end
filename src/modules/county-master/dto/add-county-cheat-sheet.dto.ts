import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength } from 'class-validator';
import { FedExPickupFrequency } from 'src/shared/enums/county-location.enum';


export class AddCountyCheatSheetDto {

    @IsNotEmpty()
    @ApiProperty({
        description: 'County ID',
        example: 1,
    })
    @IsInt()
    countyId: number;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Note',
        example: 'This is a note about the county cheat sheet.',
    })
    @IsString()
    note?: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Emission',
        example: false,
    })
    @IsBoolean()
    emission: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'T19cPoa',
        example: false,
    })
    @IsBoolean()
    t19cPoa: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Commercial plate form required',
        example: false,
    })
    @IsBoolean()
    commercialPlateFormRequired: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'GA dealer work after',
        example: 8,
    })
    @IsInt()
    gaDealerWorkAfter: number;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Refund policy',
        example: 'No refunds after 30 days.',
    })
    @IsString()
    @MaxLength(50)
    refundPolicy: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Trailers T22B',
        example: 'Trailers must meet T22B specifications.',
    })
    @IsString()
    @MaxLength(50)
    trailersT22B: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'POA T19c',
        example: false,
    })
    @IsBoolean()
    poaT19C: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Registration renewal period',
        example: 12,
    })
    @IsInt()
    @Max(9999, { message: "Invalid registration renewal Period." })
    registrationRenewalPeriod: number;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Replacement plate',
        example: 'Replacement plate type.',
    })
    @IsString()
    @MaxLength(50)
    replacementPlate: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Replacement sticker decal',
        example: 'Replacement sticker type.',
    })
    @IsString()
    @MaxLength(50)
    replacementStickerDecal: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Plate exchange',
        example: 'Exchange plates at designated locations only.',
    })
    @IsString()
    @MaxLength(50)
    plateExchange: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Business license',
        example: false,
    })
    @IsBoolean()
    businessLicense: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Proof of residency',
        example: false,
    })
    @IsBoolean()
    proofOfResidency: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Driver license',
        example: false,
    })
    @IsBoolean()
    driverLicense: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Letter of authorization',
        example: false,
    })
    @IsBoolean()
    letterOfAuthorization: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Leased to business and registered address commercial Business license',
        example: false,
    })
    @IsBoolean()
    leasedToBizAndRegAddComBizLic: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Business and registration address commercial business license',
        example: false
    })
    @IsBoolean()
    bizAndRegAddComBizLic: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Business and registration address residential business license',
        example: false,
    })
    @IsBoolean()
    bizAndRegAddResBizLic: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Business state change',
        example: 1,
    })
    @IsInt()
    @Max(9999, { message: "Invalid business state change." })
    businessStateChange: number;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Mailing fees',
        example: '50',
    })
    @IsInt()
    @Max(9999, { message: "Invalid mailing fees." })
    mailingFees: number;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Mailing fees required',
        example: false,
    })
    @IsBoolean()
    mailingFeesRequired: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'No blank checks',
        example: false,
    })
    @IsBoolean()
    noBlankChecks: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Send blank check only',
        example: false,
    })
    @IsBoolean()
    sendBlankCheckOnly: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'FedEx pickup frequency',
        example: FedExPickupFrequency.DAILY,
    })
    @IsEnum(FedExPickupFrequency)
    fedExPickup: FedExPickupFrequency;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Plates only to registration address',
        example: false,
    })
    @IsBoolean()
    platesOnlyToRegAddress: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Residency Individual Period',
        example: 5,
    })
    @IsInt()
    @Max(9999, { message: "Invalid residency individual period." })
    resIndPeriod: number;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Residency business and commercial period',
        example: 10,
    })
    @IsInt()
    @Max(9999, { message: "Invalid residential business and commercial period." })
    resBizAndComPeriod: number;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Leased registration address type business and residential  business license',
        example: false,
    })
    @IsBoolean()
    leasedRegAddTypeBizAndResAddResBizLic: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Leased registration address type business and residential address proof of residency',
        example: true,
    })
    @IsBoolean()
    leasedRegAddTypeBizAndResAddResProofRes: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Leased registration address type business and residential address residential driver license',
        example: true,
    })
    @IsBoolean()
    leasedRegAddTypeBizAndResAddResDriverLicense: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Leased registration address type business and residential address residential letter of authorization',
        example: false,
    })
    @IsBoolean()
    leasedRegAddTypeBizAndResAddResLetterOfAuth: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Leased registration address type business and residential address commercial business license',
        example: false,
    })
    @IsBoolean()
    leasedRegAddTypeBizAndResAddComBizLic: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Leased registration address type business and residential address commercial proof residency',
        example: true,
    })
    @IsBoolean()
    leasedRegAddTypeBizAndResAddComProofRes: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Business and registration address commercial business license',
        example: true,
    })
    @IsBoolean()
    bizAndRegAddComBusinessLicense: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Business and registration address commercial proof of residency',
        example: true,
    })
    @IsBoolean()
    bizAndRegAddComProofOfResidency: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Business and registration address residential business license',
        example: true,
    })
    @IsBoolean()
    bizAndRegAddResBusinessLicense: boolean;



}

export class UpdateCheatSheetDto extends PartialType(AddCountyCheatSheetDto) { }
