import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsNotEmpty, IsNumberString, ValidateIf } from 'class-validator';

export class PageQueryDto {

    @ValidateIf(o => o.offset)
    @IsNumberString({}, { message: 'Offset contain only number' })
    @ApiPropertyOptional({
        description: 'Enter offset ',
        example: 0,
    })
    offset: number;

    @ValidateIf(o => o.limit)
    @IsNumberString({}, {
        message: 'Limit contain only number',
    })
    @ApiPropertyOptional({
        description: 'Enter limit ',
        example: 10,
    })
    limit: number;

    @IsNotEmpty({ message: "Please enter ticket id.&&&ticketId" })
    @ApiProperty({
        description: "Enter ticket ID"
    })
    ticketId: number;

    @ValidateIf(o => o.isOnlyComments)
    @IsBooleanString()
    @ApiPropertyOptional({
        description: "Indication to fetch only comments",
        example: true
    })
    isOnlyComments?: boolean;
}
