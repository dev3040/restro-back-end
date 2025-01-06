import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, Matches, Max, Min } from "class-validator";
import { CountyProcessingTypes, WorksType } from "src/shared/enums/county-location.enum";

export class CountyProcessingDto {
    @IsOptional()
    @IsEnum(CountyProcessingTypes, {
        message: "Select a valid processing type(1-Walk, 2-Drop, 3-Mail).&&&type&&&ERROR_MESSAGE"
    })
    @ApiPropertyOptional({
        description: `Processing type(1-Walk, 2-Drop, 3-Mail)`,
        example: CountyProcessingTypes.WALK,
    })
    type: CountyProcessingTypes;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    @ApiPropertyOptional({
        description: 'Total count',
        example: 1,
    })
    titleOrRenewalTotal: number;

    @IsOptional()
    @IsEnum(WorksType, {
        message: 'Select a valid work type. (1-Title or Renewal, 2-Title and Renewal, 3-Combined, 4-Total title and renewal).&&&type&&&ERROR_MESSAGE',
    })
    @ApiPropertyOptional({
        description: `Work type(1-Title or Renewal, 2-Title and Renewal, 3-Combined, 4-Total title and renewal)`,
        example: WorksType.TITLE_AND_RENEWAL,
    })
    worksType: WorksType;

    @IsOptional()
    @IsEnum(WorksType, {
        message: 'Select a valid work type. (1-Title or Renewal, 2-Title and Renewal, 3-Combined, 4-Total title and renewal).&&&type&&&ERROR_MESSAGE',
    })
    @ApiPropertyOptional({
        description: `Work type(1-Title or Renewal, 2-Title and Renewal, 3-Combined, 4-Total title and renewal)`,
        example: WorksType.TITLE_AND_RENEWAL,
    })
    dropWorksType: WorksType;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(10)
    @ApiPropertyOptional({
        description: 'Title Works',
        example: 1,
    })
    titleWorks: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(10)
    @ApiPropertyOptional({
        description: 'Title Works',
        example: 1,
    })
    dropTitleWorks: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(10)
    @ApiPropertyOptional({
        description: 'Renewal Works',
        example: 1,
    })
    renewalWorks: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(10)
    @ApiPropertyOptional({
        description: 'Renewal Works',
        example: 1,
    })
    dropRenewalWorks: number;

    @IsOptional()
    @Matches(/^many$|^\d+$/, {
        message: 'Work Rounds must be a number or the string "many"',
    })
    @ApiPropertyOptional({
        description: 'Work Rounds',
        example: 'many',
    })
    workRounds: number | string;

    @IsOptional()
    @Matches(/^many$|^\d+$/, {
        message: 'Work Rounds must be a number or the string "many"',
    })
    @ApiPropertyOptional({
        description: 'Work Rounds',
        example: 'many',
    })
    dropWorkRounds: number | string;

    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({
        description: 'Check transaction per work',
        example: true,
    })
    isTransactionPerWork: boolean;

    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({
        description: 'Check for duplicate round',
        example: true,
    })
    isDuplicateRound: boolean;

    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({
        description: 'Check for drop duplicate round',
        example: true,
    })
    isDropDuplicateRound: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(10)
    @ApiPropertyOptional({
        description: 'Check Count',
        example: 1,
    })
    checkCount: number;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Instruction',
        example: "instruction",
    })
    notes: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Instruction',
        example: "instruction",
    })
    dropNotes: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'city',
        example: "roswell",
    })
    city: string;

    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({
        description: 'Minimum check',
        example: true,
    })
    isMin: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    @ApiPropertyOptional({
        description: 'Total count',
        example: 1,
    })
    dropTitleOrRenewalTotal: number;

    @ApiProperty({
        description: 'ID of the row',
        example: 1,
    })
    @IsOptional()
    id: number;
}


export class CountyTransactionWorkDto {
    @IsNotEmpty()
    @IsInt()
    @Min(0)
    @Max(10)
    @ApiProperty({
        description: 'Check Count',
        example: 1,
    })
    checkCount: number;
}