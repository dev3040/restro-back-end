import { IsNotEmpty, IsEmail, MinLength, MaxLength, Matches, ValidationArguments, IsOptional, IsPhoneNumber } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEqualTo } from "../../../shared/decorators/password.decorator";
import { IsValidName } from "src/shared/decorators/name.decorator";

export class SignupUserDto {

    @IsNotEmpty({
        message: `Please enter first name.&&&firstName`
    })
    @ApiProperty({
        description: `Enter First Name`,
        example: `Jon`
    })
    @MaxLength(30)
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
    @MaxLength(30)
    @MinLength(3)
    @IsValidName({ message: 'Please enter a valid last name.&&&lastName' })
    lastName: string;

    @IsEmail(
        {},
        {
            message: (args: ValidationArguments) => {
                if (typeof args.value == "undefined" || args.value == "") {
                    return `Please enter email.&&&email`;
                } else {
                    return `Please enter a valid email.&&&email`;
                }
            }
        }
    )
    @ApiProperty({
        description: `Enter Email`,
        example: `jon.doe@gmail.com`
    })
    email: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter  phone.',
        example: '(123) 456-7890',
    })
    @IsPhoneNumber()
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
    @IsNotEmpty({
        message: `Please enter confirm password.&&&confirmPassword`
    })
    confirmPassword: string;

    @ApiProperty({
        description: `Enter branch Id`,
        example: 1
    })
    @IsNotEmpty({
        message: `Please enter branch Id`,
    })
    branchId: number;

}
