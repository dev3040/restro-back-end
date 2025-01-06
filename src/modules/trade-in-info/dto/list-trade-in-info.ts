import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class QueryDto {

    @IsNotEmpty({ message: "Please enter ticketId" })
    @ApiProperty({
        description: "Enter ticketId.",
        example: 0
    })
    ticketId: number;
}