import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class SaveCountyLinksDto {
    @ApiProperty({
        description: 'ID of the county',
        example: 1,
    })
    @IsOptional()
    countyId: number;

    @ApiProperty({ description: 'Name of the entity', example: 'John Doe', nullable: true })
    @IsOptional()
    linkUrl?: string;

    @ApiProperty({ description: 'Phone number', example: '123-456-7890', nullable: true })
    @IsOptional()
    description?: string;
}
