import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsAlpha, IsNotEmpty, IsNumberString, IsOptional, IsString, Length, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { IsValidName } from 'src/shared/decorators/name.decorator';
import { IdOptions } from 'src/shared/enums/lien-info.enum';

export class LienInfoDto {
    @ApiPropertyOptional({ example: 1, description: 'id', required: false })
    @IsOptional()
    id?: number;

    @ApiPropertyOptional({ example: 1, description: 'Ticket id', required: false })
    @IsOptional()
    ticketId?: number;

    @ApiPropertyOptional({ example: 1, description: 'Lien master id', required: false })
    @IsOptional()
    lienId?: number;

    @ApiPropertyOptional({ enum: IdOptions, description: 'ID option', required: false })
    @IsOptional()
    idOption?: string;

    @ApiPropertyOptional({
        example: 'AB123456',
        description: 'The license number',
        required: false,
        maxLength: 12,
        minLength: 1,
        pattern: '/^[a-zA-Z0-9]*$/',
    })
    @IsOptional()
    @Length(1, 12)
    @Matches(/^[a-zA-Z0-9]*$/, { message: 'License number should contain only alphabets and numbers' })
    licenseNumber?: string;

    @ApiPropertyOptional({ type: String, description: 'Enter lien holder name', maxLength: 25, example: 'John Doe' })
    @IsOptional()
    @MaxLength(50)
    @MinLength(2)
    @IsValidName({ message: 'Please enter a valid holder name.&&&holderName' })
    holderName: string;

    @ApiPropertyOptional({ example: 'John', description: 'The first name', required: false, maxLength: 15 })
    @IsOptional()
    @IsAlpha()
    @Length(1, 15)
    firstName?: string;

    @ApiPropertyOptional({ example: 'Doe', description: 'The last name', required: false, maxLength: 15 })
    @IsOptional()
    @IsAlpha()
    @Length(1, 15)
    lastName?: string;

    @ApiPropertyOptional({ example: 'M', description: 'The middle name', required: false, maxLength: 15 })
    @IsOptional()
    @IsAlpha()
    @Length(1, 15)
    middleName?: string;

    @ApiPropertyOptional({ example: 'Jr', description: 'The suffix', required: false, maxLength: 8 })
    @IsOptional()
    @IsAlpha()
    @Length(1, 8)
    suffix?: string;

    @ApiPropertyOptional({
        example: false,
        description: 'Whether the lien is an ELT (Electronic Lien and Title)',
        required: false
    })
    @IsOptional()
    isElt?: boolean;

    @ApiPropertyOptional({
        example: false,
        description: 'Whether the lien is for an individual',
        required: false
    })
    @IsOptional()
    isIndividual?: boolean;

    @ApiPropertyOptional({
        example: false,
        description: 'Whether the lien is checked or not',
        required: false
    })
    @IsOptional()
    isLienChecked?: boolean;

    @ApiPropertyOptional({ type: String, description: 'Address', maxLength: 150, example: '123 Main St' })
    @IsOptional()
    address: string;

    @ApiPropertyOptional({ example: '1234', description: 'Enter lien holder ID', required: false, maxLength: 15 })
    @IsOptional()
    @IsString()
    @Length(1, 15)
    lienHolderId?: string;

}

export class LienInfoIdDto {
    @ValidateIf(o => !o.ticketId)
    @IsNumberString()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter ID.',
        example: 35,
    })
    id: number;

    @ValidateIf(o => !o.id)
    @IsNumberString()
    @IsNotEmpty({ message: 'Ticket ID is required.' })
    @ApiPropertyOptional({
        description: 'Enter ticket id.',
        example: 2,
    })
    ticketId: number;
}
