import { ApiProperty } from "@nestjs/swagger";

export class ForgotPasswordDto {
    @ApiProperty({
        description: "User Email",
        example: "jondoe30"
    })
    username: string;

}
