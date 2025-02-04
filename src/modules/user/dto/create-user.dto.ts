import { IsNotEmpty, MinLength, MaxLength, Matches, IsArray, ArrayNotEmpty, ArrayMinSize, IsInt, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEqualTo } from "../../../shared/decorators/password.decorator";
import { IsValidName } from "src/shared/decorators/name.decorator";

export class CreateUserDto {

    @IsNotEmpty({
        message: `Please enter first name.&&&firstName`
    })
    @ApiProperty({
        description: `Enter First Name`,
        example: `Jon`
    })
    @MaxLength(50)
    @MinLength(2)
    @IsValidName({ message: 'Please enter a valid first name.&&&firstName' })
    firstName: string;

    @IsNotEmpty({
        message: `Please enter last name.&&&lastName`
    })
    @ApiProperty({
        description: `Enter Last Name`,
        example: `Doe`
    })
    @MaxLength(50)
    @MinLength(2)
    @IsValidName({ message: 'Please enter a valid last name.&&&lastName' })
    lastName: string;

    @IsNotEmpty()
    @ApiProperty({
        description: `Enter Email Id`,
        example: `jondoe30`
    })
    username: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter  phone.',
        example: '(123) 456-7890',
    })
    phone: string;

    @IsNotEmpty({
        message: `Please enter password.&&&password`
    })
    @ApiProperty({
        description: `Enter Password`,
        example: `Test123@`
    })

    @MaxLength(20)
    @MinLength(8, { message: `Password is too short. It should be minimum 8 characters.&&&password` })
    @Matches(/^(?!.*\s)(?=.*\d)(?=.*\W+)(?=.*[A-Z])(?=.*[a-z]).{8,20}$/, {
        message: `Your password must be 8 characters long, should contain at least 1 uppercase, 1 lowercase, 1 numeric or special character.&&&password`
    })
    password: string;

    @ApiProperty({
        description: `Enter confirm password`,
        example: `Test123@`
    })
    @IsEqualTo(`password`)
    @IsNotEmpty({ message: `Please enter confirm password.&&&confirmPassword` })
    confirmPassword: string;

    @ApiProperty({ description: "Branch", example: 1 })
    branchId: number;
    
    @ApiProperty({ description: "Branch", example: 1 })
    @IsNotEmpty({
        message: `Please enter designation Id`,
    })
    designationId: number;
}

export class DeleteUsersDto {
    @ApiProperty({
        type: [Number],
        description: 'Array of user IDs to be deleted',
        example: [1, 2, 3],
    })
    @IsArray()
    @ArrayNotEmpty({ message: 'The list of IDs should not be empty.' })
    @ArrayMinSize(1, { message: 'The list must contain at least one ID.' })
    @IsInt({ each: true, message: 'Each ID must be an integer.' })
    ids: number[];
}