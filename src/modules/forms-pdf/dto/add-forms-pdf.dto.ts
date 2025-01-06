import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, MaxLength, ValidateIf } from "class-validator";
import { IsValidName } from "src/shared/decorators/name.decorator";

export class AddFormsPdfDto {
    @IsNotEmpty({ message: "Ticket ID is required.&&&ticketId" })
    @IsNumber()
    @ApiProperty({
        description: "Enter ticket ID",
        example: 2
    })
    ticketId: number;

    @ApiPropertyOptional({
        type: [Number],
        description: "Array of stamp IDs",
        example: [1, 2, 3],
    })
    @IsOptional()
    @IsInt({ each: true, message: 'Each ID must be an integer' })
    stampId?: number;

    @ApiPropertyOptional({
        type: [Number],
        description: "Array of add on stamp IDs",
        example: [1, 2, 3],
    })
    @IsOptional()
    @IsInt({ each: true, message: 'Each ID must be an integer' })
    addOnStampId?: number;

    @ApiPropertyOptional({
        type: [Number],
        description: "Array of document IDs",
        example: [1, 2],
    })
    @IsOptional()
    @IsInt({ each: true, message: 'Each ID must be an integer' })
    docIds?: number[];

    @ApiProperty({
        type: [Number],
        description: 'Array of form IDs to generate pdf',
        example: [1, 2, 3],
    })
    @IsArray()
    @IsOptional()
    @IsInt({ each: true, message: 'Each ID must be an integer' })
    formIds: number[];
}

export class AddStampDto {

    @MaxLength(50)
    @IsNotEmpty({ message: "Please enter stamp." })
    @IsValidName({ message: 'Please enter a valid stamp.&&&stamp' })
    @ApiProperty({
        description: 'Enter stamp.&&&stamp',
        example: 'GA sign',
    })
    stamp: string;

    @ValidateIf(o => o.isAddOn)
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Please enter is addOn',
        example: 'true',
    })
    isAddOn: boolean;
}

export class DeleteStampDto {
    @ApiProperty({
        type: [Number],
        description: 'Array of stamp IDs to be deleted',
        example: [1, 2, 3],
    })
    @IsArray()
    @ArrayNotEmpty({ message: 'The list of IDs should not be empty.' })
    @IsInt({ each: true, message: 'Each ID must be an integer.' })
    ids: number[];
}

export class UpdateStampDto extends PartialType(AddStampDto) { }
