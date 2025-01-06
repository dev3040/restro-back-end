import { IsEmail, IsEnum, IsNotEmpty, ValidationArguments } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { OtpType } from "src/shared/enums/otp-type.enum";

export class ResendOtpDto {
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

    @IsEnum(OtpType, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined" || args.value == "") {
                return `Please select otp type.&&&otpType`;
            } else {
                return `Please select a valid otp type(REGISTER, LOGIN, FORGOTPASSWORD).`;
            }
        }
    })
    @ApiProperty({
        description: `Select otp type (REGISTER, LOGIN, FORGOTPASSWORD)`,
        example: OtpType[2]
    })
    @IsNotEmpty({
        message: `Please enter otp type`
    })
    otpType: OtpType;
}
