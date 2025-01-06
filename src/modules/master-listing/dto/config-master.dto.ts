import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Length } from 'class-validator';

export class ConfigMasterDto {

    @ApiPropertyOptional({
        description: 'id for the configuration',
        example: 1
    })
    @IsOptional()
    @IsInt()
    id?: number;

    @ApiPropertyOptional({
        description: 'Name of the configuration variable',
        example: 'maxUserLimit',
        maxLength: 100
    })
    @IsOptional()
    @IsString()
    @Length(1, 100)
    variableName?: string;

    @ApiPropertyOptional({
        description: 'Value associated with the configuration variable',
        example: 100
    })
    @IsOptional()
    @IsInt()
    value?: number;

    @ApiPropertyOptional({
        description: 'Indicates if the configuration is deleted',
        example: false
    })
    @IsOptional()
    @IsBoolean()
    isDeleted?: boolean;

    @ApiPropertyOptional({
        description: 'Indicates if the configuration is active',
        example: true
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
