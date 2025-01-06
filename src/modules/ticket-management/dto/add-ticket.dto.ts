import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import { VinInfoDto } from './add-vin-info.dto';
import { SlugConstants } from 'src/shared/constants/common.constant';
import { VinErrorsInterface } from 'src/modules/vin-info/interface/vin-err.interface';

export class AddTicketsDto {

   @ApiProperty({
      description: 'Enter vin info',
      example: {
         vinNumber: '1HGCM82633A004352',
         year: 2010,
         type: "Trailer",
         model: 'Accord',
         productClass: 'Sedan',
         bodyStyle: 'Sedan',
         gvwr: '5000 lbs',
         primaryColor: 'Red',
         secondaryColor: 'Black',
         cylinders: 4,
         primaryFuelType: 'Gasoline',
         secondaryFuelType: 'Electric',
         engineType: 'V6',
         noOfDoors: 4,
         gaFmvValucationYear: '2021',
         shippingWeight: '3500 lbs',
         vehicleUse: 'Personal',
         shippingInfo: 'Shipped via XYZ Transport',
         emissions: true,
         isActive: true,
      },
   })
   @ValidateNested()
   @Type(() => VinInfoDto)
   vinInfo: VinInfoDto;

   @ValidateIf(o => o?.statusSlug !== SlugConstants.ticketStatusQuote)
   @IsNotEmpty()
   @ApiProperty({
      description: 'Enter ticket status id',
      example: '1',
   })
   ticketStatusId: number;

   @ValidateIf(o => o?.statusSlug !== SlugConstants.ticketStatusQuote)
   @IsNotEmpty()
   @ApiProperty({
      description: 'Enter department/team id',
      example: '1',
   })
   assignedToDeptId: number;

   @ValidateIf(o => o?.statusSlug !== SlugConstants.ticketStatusQuote)
   @IsNotEmpty()
   @ApiProperty({
      description: 'Enter Customer Id',
      example: '1',
   })
   customerId: number;

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter priority id',
      example: '1',
   })
   priorityId: number | null;

   @ValidateIf(o => o?.statusSlug !== SlugConstants.ticketStatusQuote)
   @IsNotEmpty()
   @ApiProperty({
      description: 'Enter carrier types id',
      example: '1',
   })
   carrierTypesId: number;

   @ValidateIf(o => o?.statusSlug !== SlugConstants.ticketStatusQuote)
   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter tracking id',
      example: '6463gGdds',
   })
   trackingId: string;

   @ApiPropertyOptional({
      description: 'Enter description',
      example: 'Title Creation new',
   })
   description: string[];

   @ValidateIf(o => o?.statusSlug !== SlugConstants.ticketStatusQuote)
   @IsNotEmpty()
   @ApiProperty({
      description: 'Enter date and time received',
      example: '2024-04-01 11:30',
   })
   docReceivedDate: Date;

   @ValidateIf(o => o.startDate)
   @IsDateString()
   @ApiPropertyOptional({
      description: 'Enter start date',
      example: '2024-04-25',
   })
   startDate: Date;

   @ValidateIf(o => o.endDate)
   @IsDateString()
   @ApiPropertyOptional({
      description: 'Enter end date',
      example: '2024-05-20',
   })
   endDate: Date;

   @ValidateIf(o => o.purchaseDate)
   @IsDateString()
   @ApiPropertyOptional({
      description: 'Enter purchase date',
      example: '2024-05-20',
   })
   purchaseDate: Date;

   @ValidateIf(o => o?.statusSlug !== SlugConstants.ticketStatusQuote)
   @ApiProperty({
      description: 'Enter assigned user ids',
      example: '1,2,3',
   })
   assignedUsers: any;

   @ApiPropertyOptional({
      description: 'Enter tags',
      example: 'tag1,tag2',
   })
   tags: any;

   @ApiPropertyOptional({
      description: 'Array of tag ids',
      example: `1,2`
   })
   tagIds: any;

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter tid type id',
      example: '1',
   })
   tidTypeId: number;

   @IsOptional()
   @ApiPropertyOptional({
      type: "string",
      format: "binary",
      description: "Attachments",
      example: "profile.jpg"
   })
   attachments: any[];

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter slug of the status',
      example: 'quote',
   })
   statusSlug: string;

   @ApiPropertyOptional({
      description: 'Error that VIN decoder has thrown',
      example: {
         errText: "",
         suggestedVin: "",
         errDetails: ""
      }
   })
   @IsOptional()
   vinError: VinErrorsInterface | null;

   @ValidateIf(o => o.hideDefaultError)
   @ApiPropertyOptional({
      description: 'Enter status of showing the default error.',
      example: true,
   })
   hideDefaultError: boolean;

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter transaction type',
      example: [{
         customerTransactionType: "Reg fee",
         transactionTypeId: 1
      }],
   })
   transactionType: any;

}

export class FinishTicketDto {
   @IsNotEmpty({ message: "Ticket ID is required." })
   @ApiProperty({
      description: "Enter ticket ID",
      example: 1
   })
   ticketId: number;
}


export class UpdateTicketDto extends PartialType(AddTicketsDto) { }
