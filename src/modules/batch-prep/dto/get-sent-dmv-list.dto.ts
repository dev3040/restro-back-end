import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, ValidateIf } from "class-validator";
import { ValidateNotEmpty } from "src/shared/decorators/validate-not-empty";
import { TicketTypes } from "src/shared/enums/county-location.enum";
import { ticketTypesEnumValues } from "src/shared/utility/enum-helper-functions";


export class GetSentToDmvListDto {

   @IsNumber({}, { message: "Offset contain only number" })
   @ValidateNotEmpty({ constraints: { field: 'Offset' } })
   @ApiProperty({
      description: "Enter offset",
      example: 0
   })
   offset: number;

   @IsNumber({}, { message: "Limit contain only number" })
   @ValidateNotEmpty({ constraints: { field: 'Limit' } })
   @ApiProperty({
      description: "Enter limit",
      example: 10
   })
   limit: number;

   @IsOptional()
   @ApiPropertyOptional({ description: "Enter search value", example: "" })
   search: string;

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter from processing date(YYYY-MM-DD)',
      example: "2024-12-10"
   })
   processingToDate: Date;

   @IsOptional()
   @ApiPropertyOptional({
      description: 'Enter to processing date(YYYY-MM-DD)',
      example: "2024-12-01"
   })
   processingFromDate: Date;

   @ValidateIf(o => o.processingTypes)
   @IsEnum(TicketTypes, { each: true, message: `Each processing type must be a valid enum value (${ticketTypesEnumValues(false)})` })
   // @ArrayUnique({ message: 'Processing types array should not contain duplicate values' })
   @Type(() => Number)
   @IsNumber({}, { each: true })
   @ApiPropertyOptional({
      description: `An array of processing types [${ticketTypesEnumValues(false)}]`,
      type: [Number],
      example: [1, 2, 3]
   })
   processingTypes: number[];

   @ValidateIf(o => o.countyIds)
   @Type(() => Number)
   @IsNumber({}, { each: true })
   @ApiPropertyOptional({
      description: 'An array of county IDs',
      example: [9, 60],
      type: [Number],
   })
   countyIds: number[];

   @ValidateIf(o => o.customerIds)
   @Type(() => Number)
   @IsNumber({}, { each: true })
   @ApiPropertyOptional({
      description: 'An array of customer IDs',
      type: [Number],
      example: [55]
   })
   customerIds: number[];

   @ValidateIf(o => o.transactionTypeIds)
   @Type(() => Number)
   @IsNumber({}, { each: true })
   @ApiPropertyOptional({
      description: 'An array of transaction type IDs',
      type: [Number],
      example: [1]
   })
   transactionTypeIds: number[];

}
