import { ApiPropertyOptional } from "@nestjs/swagger";

export class FileDto {
    @ApiPropertyOptional({
        description: "User profile pic",
        example: "abc.jpg"
    })
    profilePic: any;
}
