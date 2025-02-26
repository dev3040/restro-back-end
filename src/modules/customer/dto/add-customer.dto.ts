import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AddCustomerDto {
    @IsNotEmpty({ message: "Name is required." })
    @ApiProperty({ description: 'Enter customer name', example: 'John Doe' })
    @MaxLength(150)
    @MinLength(2)
    @IsString()
    name: string;

    @IsOptional()
    @IsEmail({}, { message: 'Invalid email format.' })
    @ApiProperty({ description: 'Customer email', example: 'john.doe@example.com', required: false })
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    @ApiProperty({ description: 'Customer phone number', example: '+1234567890', required: false })
    phone?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Customer address', example: '123 Main St', required: false })
    address?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'State', example: 'California', required: false })
    state?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Street', example: 'Sunset Blvd', required: false })
    street?: string;

    @IsOptional()
    @IsDateString()
    @ApiProperty({ description: 'Birth date', example: '1990-05-15' })
    birthDate: string;

    @IsOptional()
    @IsDateString()
    @ApiProperty({ description: 'Anniversary date', example: '2015-06-20' })
    anniversaryDate: string;

    @IsBoolean()
    @ApiProperty({ description: 'Is customer active', example: true })
    isActive: boolean;
}

export class UpdateCustomerDto extends PartialType(AddCustomerDto) {}

export class DeleteCustomersDto {
    @ApiProperty({
        type: [Number],
        description: 'Array of customer IDs to be deleted',
        example: [1, 2, 3],
    })
    @IsArray()
    @IsNotEmpty({ message: 'The list of IDs should not be empty' })
    @IsInt({ each: true, message: 'Each ID must be an integer' })
    ids: number[];
}
