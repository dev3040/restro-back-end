import { IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCountySpecial {
    @ApiPropertyOptional({
        description: 'The ID of the plate',
        type: Number,
        example: 123,
    })
    @IsOptional()
    plateId?: number;

    @ApiPropertyOptional({
        description: 'The ID of the county',
        type: Number,
        example: [456],
    })
    @IsOptional()
    countyIds?: number[];

    @ApiProperty({
        description: 'The name of the form',
        type: String,
        maxLength: 50,
        example: 'RegistrationForm',
    })
    @IsString()
    @Length(1, 50)
    formName: string;
}
