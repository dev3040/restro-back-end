import { IsEmail, ValidationArguments, IsOptional, MaxLength, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsValidName } from "src/shared/decorators/name.decorator";

export class UpdateUserDto {
    @IsOptional()
    @ApiProperty({
        description: `Enter First Name`,
        example: `Jon`
    })
    @MaxLength(30)
    @MinLength(2)
    @IsValidName({ message: 'Please enter a valid first name.&&&firstName' })
    firstName: string;

    @IsOptional()
    @ApiProperty({
        description: `Enter Last Name`,
        example: `Doe`
    })
    @MaxLength(30)
    @MinLength(2)
    @IsValidName({ message: 'Please enter a valid last name.&&&lastName' })
    lastName: string;

    @IsOptional()
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
    @IsOptional()
    @ApiProperty({
        description: `Enter Email Id`,
        example: `jon.doe@gmail.com`
    })
    email: string;

    @IsOptional()
    @ApiProperty({
        description: `Enter Active status`,
        example: `true`
    })
    isActive: boolean;

    @IsOptional()
    @ApiPropertyOptional({ description: `Enter branch Id` })
    branchId: number;
}
