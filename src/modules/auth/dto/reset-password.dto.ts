import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Matches, MaxLength, MinLength } from "class-validator";
import { IsEqualTo } from "src/shared/decorators/password.decorator";

export class ResetPasswordDto {
    @IsNotEmpty({
        message: `Please enter username`
    })
    @ApiProperty({
        description: "User Email",
        example: "jondoe30"
    })
    username: string;

    @IsNotEmpty({
        message: `Please enter your new password.&&&password`
    })
    @ApiProperty({
        description: `Enter new password`,
        example: `Test123@`
    })
    @MaxLength(20)
    @MinLength(8, { message: `New password is too short. It should be minimum 8 characters.&&&password` })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: `Your new password must be 8 characters long, should contain at least 1 uppercase, 1 lowercase, 1 numeric or special character.&&&password`
    })
    newPassword: string;

    @ApiProperty({
        description: `Enter confirm password`,
        example: `Test123@`
    })
    @IsEqualTo(`newPassword`)
    @IsNotEmpty({
        message: `Please enter your confirm password.&&&confirm_password`
    })
    confirmPassword: string;
}
