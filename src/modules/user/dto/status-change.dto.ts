import { IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class StatusChangeDto {
    @IsNotEmpty({
        message: `Please enter userId`
    })
    @ApiProperty({
        description: `Enter User Id`,
        example: `1`
    })
    userId: number;

    @IsNotEmpty({
        message: `Please enter status.&&&status`
    })
    @ApiProperty({
        description: "Select status status",
        example: true
    })
    status: boolean;
}
