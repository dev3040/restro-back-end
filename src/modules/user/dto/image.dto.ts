import { IsUUID } from "class-validator";
import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";

export class ImageDetailsDto {
    @ApiPropertyOptional({
        type: "string",
        format: "binary",
        description: "profile Picture Url (Allow Only 'JPG,JPEG,PNG,SVG')",
        example: "profile.jpg"
    })
    profilePic: any;

    @IsUUID("4", { message: "please enter valid id&&&userId" })
    @ApiProperty({
        description: "User ID",
        example: "1"
    })
    userId: string;

    @ApiPropertyOptional({
        description: "Select image deleted or not",
        example: false
    })
    isDeleted: boolean;
}
