import { IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
    @IsNotEmpty()
    @ApiProperty({
        description: "User Email",
        example: "jondoe30"
    })
    username: string;

    @IsNotEmpty({
        message: `Please enter your password.&&&password`
    })
    @ApiProperty({
        description: "Password",
        example: "Test123@"
    })
    password: string;
}
