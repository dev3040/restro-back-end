import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, MaxLength, MinLength, Validate } from "class-validator";
import { SevenDigitsBeforeDotValidator } from "src/modules/trade-in-info/dto/add-trade-in-info.dto";
import { IsValidName } from "src/shared/decorators/name.decorator";

export class SaveTaxAbleMasterDto {

    @IsNotEmpty({ message: "Price is required." })
    @Validate(SevenDigitsBeforeDotValidator, {
        message: 'Invalid format. Must contain up to 7 digits before the decimal point and up to 3 digits after the decimal point.'
    })
    @ApiProperty({
        description: 'Please enter price',
        example: '200.380',
    })
    price: string;


    @ApiProperty({
        description: "Please enter isTaxable value",
        example: true
    })
    isTaxable: boolean;

    @IsNotEmpty({ message: "Name is required." })
    @ApiProperty({
        description: 'Please enter name.',
        example: 'FedEx',
    })
    @MaxLength(50, { message: "Name must not exceed 50 characters." })
    @MinLength(2, { message: "Name must be at least 2 characters long." })
    @IsValidName({ message: 'Please enter a valid name.&&&name' })
    name: string;

    @ApiProperty({
        description: "Select Taxable master active or not",
        example: false
    })
    isActive: boolean;

}

export class DeleteTaxAbleDto {
    @ApiProperty({
        type: [Number],
        description: 'Array of item IDs to be deleted',
        example: [1, 2, 3],
    })
    @IsArray()
    @ArrayNotEmpty({ message: 'The list of IDs should not be empty.' })
    @ArrayMinSize(1, { message: 'The list must contain at least one ID.' })
    @IsInt({ each: true, message: 'Each ID must be an integer.' })
    ids: number[];
}