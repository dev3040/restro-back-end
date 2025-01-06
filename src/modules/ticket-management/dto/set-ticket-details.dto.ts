import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, ValidateIf, ValidateNested, ValidationArguments } from "class-validator";
import { VinInfoDto } from "./add-vin-info.dto";
import { VehicleUsageType } from "src/shared/enums/vehicle-usage-type";
import { VinErrorsInterface } from "src/modules/vin-info/interface/vin-err.interface";
import { CountyProcessingTypes } from "src/shared/enums/county-location.enum";

export class SetTicketDetailsDto {

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter Task ID',
      example: 10,
   })
   ticketId: number;

   @IsOptional()
   @ApiProperty({
      description: 'Enter Ticket status id',
      example: 1,
   })
   ticketStatusId: number;

   @IsOptional({ message: "Please enter assigned to department id" })
   @ApiPropertyOptional({
      description: 'Enter assigned to department id',
      example: 1,
      nullable: false
   })
   assignedToDeptId: number;

   @ValidateIf(o => !o.ticketId)
   @IsNotEmpty()
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
         vehicleUse: VehicleUsageType.COMMERCIALS,
         shippingInfo: 'Shipped via XYZ Transport',
         emissions: true,
         isActive: true,
      },
   })
   @ValidateNested()
   @Type(() => VinInfoDto)
   vinInfo: VinInfoDto;

   @ApiProperty({
      description: 'Enter active status',
      example: true,
   })
   isActive: boolean;

   @ApiPropertyOptional({
      description: 'Enter customer Id',
      example: 1,
   })
   customerId: number;

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter priority id',
      example: 1,
   })
   priorityId: number | null;

   @ApiPropertyOptional({
      description: 'Enter carrier types id',
      example: 1,
   })
   carrierTypesId: number;

   @ApiPropertyOptional({
      description: 'Enter tracking id',
      example: '6463gGdds',
   })
   trackingId: string;

   @IsOptional()
   @ApiPropertyOptional({
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

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter tid type id',
      example: 1,
   })
   tidTypeId: number;

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Error that VIN decoder has thrown',
      example: {
         errText: "",
         suggestedVin: "",
         errDetails: ""
      }
   })
   vinError: VinErrorsInterface | null;

   @IsOptional()
   @IsEnum(CountyProcessingTypes, {
      message: (args: ValidationArguments) => {
         if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
            return `Select processing type.(1-Walk, 2-Drop, 3-Mail).&&&type&&&ERROR_MESSAGE`;
         } else {
            return `Select a valid processing type(1-Walk, 2-Drop, 3-Mail).&&&type&&&ERROR_MESSAGE`;
         }
      }
   })
   @ApiPropertyOptional({
      description: `Processing type(1-Walk, 2-Drop, 3-Mail)`,
      example: CountyProcessingTypes.WALK,
   })
   processingType: CountyProcessingTypes;

   @ValidateIf(o => o.hideDefaultError)
   @ApiPropertyOptional({
      description: 'Enter status of showing the default error.',
      example: true,
   })
   hideDefaultError: boolean;
}