import { IsNotEmpty, IsEmail, ValidationArguments } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
    @IsEmail(
        {},
        {
            message: (args: ValidationArguments) => {
                if (typeof args.value == "undefined" || args.value == "") {
                    return `Please enter your email.&&&email`;
                } else {
                    return `Please enter a valid email.&&&email`;
                }
            }
        }
    )
    @ApiProperty({
        description: "User Email",
        example: "jon.doe@gmail.com"
    })
    email: string;

    @IsNotEmpty({
        message: `Please enter your password.&&&password`
    })
    @ApiProperty({
        description: "Password",
        example: "Test123@"
    })
    password: string;
}
