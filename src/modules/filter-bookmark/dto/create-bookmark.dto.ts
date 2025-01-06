import { ApiProperty } from "@nestjs/swagger";
import { IsArray, ValidateNested } from "class-validator";
import { CommonConst, FilterBookmarkConst } from "src/shared/constants/common.constant";
import { BookmarkFilterValuesDto } from "./bookmark-filter-values.dto";
import { Type } from "class-transformer";
import { ValidateMaxLength } from "src/shared/decorators/validate-max-length";
import { ValidateNotEmpty } from "src/shared/decorators/validate-not-empty";
import { ValidateArrayNotEmpty } from "src/shared/decorators/validate-array-not-empty.decorator";
import { ValidateObjectNotEmpty } from "src/shared/decorators/validate-not-empty-object.decorator";
import { ValidateMinLength } from "src/shared/decorators/validate-min-length";

export class CreateFilterBookmarkDto {

   @ValidateNotEmpty({ constraints: { field: 'Name' } })
   @ValidateMinLength(CommonConst.minStringLength,
      { constraints: { field: 'Name', limit: CommonConst.minStringLength } }
   )
   @ValidateMaxLength(FilterBookmarkConst.nameLength,
      { constraints: { field: 'Name', limit: FilterBookmarkConst.nameLength } }
   )
   @ApiProperty({
      example: 'Title view',
      description: 'Filter bookmark name',
   })
   name: string;

   @Type(() => Number)
   @ValidateArrayNotEmpty({ constraints: { field: 'team ID' } })
   @IsArray()
   @ApiProperty({
      description: 'Array of team ID',
      example: [1, 2, 3],
   })
   teamIds: Array<number>;

   @Type(() => BookmarkFilterValuesDto)
   @ValidateNested()
   @ValidateObjectNotEmpty({
      constraints: {
         field: "Filter data", requiredFields: ['statusIds', 'priorityIds', 'tagIds', 'groupBy']
      }
   })
   @ApiProperty({
      example: {
         groupBy: null,
         priorityIds: [1],
         statusIds: [1, 2],
         tagIds: [1, 2]
      },
      description: 'Payload of filter values'
   })
   filterData: BookmarkFilterValuesDto;

}