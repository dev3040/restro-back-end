import { IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class OtpVerifyDto {
    @ApiProperty({
        description: "User Email",
        example: "jondoe30"
    })
    username: string;

    @IsNotEmpty({
        message: `Please enter your otp`
    })
    @ApiProperty({
        description: "Otp Number",
        example: "546346"
    })
    otp: string;
}
