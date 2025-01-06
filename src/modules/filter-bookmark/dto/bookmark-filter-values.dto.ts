import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, ValidateIf, ValidationArguments } from 'class-validator';
import { ValidateArrayNotEmpty } from 'src/shared/decorators/validate-array-not-empty.decorator';
import { TaskGroupByEnum } from 'src/shared/enums/task-group-by.enum';
import { taskGroupByEnumValues } from 'src/shared/utility/enum-helper-functions';

export class BookmarkFilterValuesDto {
   @IsOptional()
   @ValidateIf(o => o.statusIds)
   @Type(() => Number)
   @ValidateArrayNotEmpty({ constraints: { field: 'status ID' } })
   @IsArray()
   @ApiProperty({
      description: 'Array of status IDs',
      example: [1, 2]
   })
   statusIds?: Array<number>;

   @IsOptional()
   @ValidateIf(o => o.statusIds)
   @Type(() => Number)
   @ValidateArrayNotEmpty({ constraints: { field: 'priority ID' } })
   @IsArray()
   @ApiProperty({
      description: 'Array of priority IDs',
      example: [1]
   })
   priorityIds?: Array<number>;

   @IsOptional()
   @ValidateIf(o => o.statusIds)
   @Type(() => Number)
   @ValidateArrayNotEmpty({ constraints: { field: 'tag ID' } })
   @IsArray()
   @ApiPropertyOptional({
      description: 'Array of tag IDs',
      example: [1, 2],
   })
   tagIds?: Array<number>

   @IsOptional()
   @ValidateIf(o => o.groupBy)
   @IsEnum([1, 2], {
      message: (args: ValidationArguments) => {
         if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
            return `Enter group by value. (${taskGroupByEnumValues()})&&&groupBy&&&ERROR_MESSAGE`;
         } else {
            return `Enter a valid group by value. (${taskGroupByEnumValues()})&&&groupBy&&&ERROR_MESSAGE`;
         }
      }
   })
   @ApiPropertyOptional({
      description: `Enter group by value (${taskGroupByEnumValues()}).`,
      example: 1,
   })
   groupBy?: TaskGroupByEnum;

}
