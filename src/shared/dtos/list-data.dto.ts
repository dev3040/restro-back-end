import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, ValidationArguments } from "class-validator";
import { IsActive } from "src/shared/enums/is-active.enum";
import { OrderDir } from "src/shared/enums/order-dir.enum";


export class ListQueryDto {
   @IsNumberString({}, { message: "Offset contain only number" })
   @IsNotEmpty({ message: "Enter offset" })
   @ApiProperty({
      description: "Enter offset ",
      example: 0
   })
   offset: number;

   @IsNumberString({}, { message: "Limit contain only number" })
   @IsNotEmpty({ message: "Enter limit" })
   @ApiProperty({
      description: "Enter limit ",
      example: 10
   })
   limit: number;

   @IsOptional()
   @IsEnum(["active", "inactive", "all"], {
      message: () => {
         return `Select a valid active status (active,inactive,all)`;
      }
   })
   @ApiPropertyOptional({
      description: "Enter active status (active,inactive,all')"
   })
   activeStatus: IsActive;

   @ApiPropertyOptional({ description: "Enter search value" })
   search: string;

   @IsEnum(["DESC", "ASC"], {
      message: (args: ValidationArguments) => {
         if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
            return `Select order dir.`;
         } else {
            return `Select a valid order dir('DESC', 'ASC').`;
         }
      }
   })
   @ApiProperty({
      description: "Select order dir (DESC,ASC)",
      example: "DESC"
   })
   orderDir: OrderDir;
}

export class ListUsersDto extends ListQueryDto {

   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id, firstName, lastName)",
      example: "id"
   })
   orderBy: string;

   @ApiPropertyOptional({ description: "Enter isDealer value" })
   isDealer: boolean;

   @ApiPropertyOptional({ description: "Enter isElt value" })
   isElt: boolean;

}

export class ListDepartmentsDto extends ListQueryDto {

   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id, name)",
      example: "id"
   })
   orderBy: string;
}

export class ListPrioritiesDto extends ListQueryDto {

   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id, name, order)",
      example: "id"
   })
   orderBy: string;
}

export class ListStatusesDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id, internalStatusName, externalStatusName, isActive)",
      example: "id"
   })
   orderBy: string;
}

export class ListCarrierTypesDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id, name)",
      example: "id"
   })
   orderBy: string;
}

export class ListAddOnPricesDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id, name, code, price)",
      example: "id"
   })
   orderBy: string;
}

export class ListTransactionTypesDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id, name, transactionCode)",
      example: "id"
   })
   orderBy: string;
}

export class ListTidTypesDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id, name)",
      example: "id"
   })
   orderBy: string;
}

export class ListFromTransactionsDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (transactionForms.id, transactionForms.formShortCode, formsPdf.formsName)",
      example: "transactionForms.id"
   })
   orderBy: string;
}

export class ListSellersDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id, name)",
      example: "id"
   })
   orderBy: string;
}

export class ListMasterLiensDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id, holderName, lienHolderId)",
      example: "id"
   })
   orderBy: string;
}

export class ListCustomersDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id, name)",
      example: "id"
   })
   orderBy: string;
}

export class ListContactsDto extends ListQueryDto {
   @ApiPropertyOptional({
      description: "Enter customer ID"
   })
   customerId: string;
}

export class ListCountiesDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id, name, code)",
      example: "id"
   })
   orderBy: string;
}

export class ListFmvDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id, vin, effectiveYear, series)",
      example: "id"
   })
   orderBy: string;
}

export class ListPlatesDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (plateMaster.id, plateMaster.categoryCode, plateTypes.plateType)",
      example: "plateMaster.id"
   })
   orderBy: string;
}

export class ListSalesTaxDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (salesTaxMaster.id, county.name)",
      example: "salesTaxMaster.id"
   })
   orderBy: string;
}

export class ListTaxableItemsDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id, name)",
      example: "id"
   })
   orderBy: string;
}

export class ListTaxExemptionsDto extends ListQueryDto {
   @IsString({ message: "Order by contain only string" })
   @ApiProperty({
      description: "Enter order by (id ,exemption)",
      example: "id"
   })
   orderBy: string;
}

