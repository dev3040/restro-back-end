import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, MaxLength, ValidateNested } from 'class-validator';
import { IsPhoneNumber } from 'src/shared/decorators/phone.decorator';
import { SaveAddressDto } from './fedex-address.dto';

export class SaveFedExAddressDto {

   @ApiProperty({ description: 'Contact name of the county', example: 'John Doe' })
   @IsOptional()
   @MaxLength(40)
   contactName?: string;

   @ApiProperty({ description: 'Company name of the county', example: 'John Doe', nullable: true })
   @IsOptional()
   @MaxLength(70)
   companyName?: string;

   @ApiProperty({ description: 'Phone number', example: '(123) 456-7890', nullable: true })
   @IsOptional()
   @IsPhoneNumber()
   phone?: string;

   @ApiPropertyOptional({
      description: 'Shipping address',
      example: {
         "addressLineOne": "B-103",
         "addressLineTwo": "Play Galaxy",
         "city": "Los Angeles",
         "state": "AR",
         "zipCode": "284562",
         "country": "GA"
      },
      nullable: true
   })
   @IsOptional()
   @ValidateNested()
   @Type(() => SaveAddressDto)
   location: SaveAddressDto;

   @ApiProperty({
      example: 1,
      description: 'Service type',
   })
   @IsOptional()
   serviceTypeId: number;

   @ApiProperty({ description: 'Delete data', example: true, nullable: true })
   @IsOptional()
   isDeleted?: string;
}
