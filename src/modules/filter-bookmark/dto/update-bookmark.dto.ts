import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, ValidateIf, ValidateNested } from 'class-validator';
import { CommonConst, FilterBookmarkConst } from 'src/shared/constants/common.constant';
import { ValidateMaxLength } from 'src/shared/decorators/validate-max-length';
import { ValidateMinLength } from 'src/shared/decorators/validate-min-length';
import { BookmarkFilterValuesDto } from './bookmark-filter-values.dto';
import { ValidateObjectNotEmpty } from 'src/shared/decorators/validate-not-empty-object.decorator';

class TeamData {

   @IsNumber()
   teamId: number;

   @IsBoolean()
   isAdd: boolean;

}


export class UpdateBookmarkDto {

   @ValidateIf(o => o.name)
   @ValidateMinLength(CommonConst.minStringLength,
      { constraints: { field: 'Name', limit: CommonConst.minStringLength } }
   )
   @ValidateMaxLength(FilterBookmarkConst.nameLength,
      { constraints: { field: 'Name', limit: FilterBookmarkConst.nameLength } }
   )
   @ApiProperty({
      description: 'Filter bookmark name',
      example: 'Renewal view'
   })
   name: string;

   @Type(() => BookmarkFilterValuesDto)
   @ValidateNested()
   @ValidateObjectNotEmpty({
      constraints: { field: "Filter data", requiredFields: ['statusIds', 'priorityIds', 'tagIds', 'groupBy'] }
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

   @Type(() => TeamData)
   @ValidateNested({ each: true })
   @ValidateIf(o => o.teamData)
   @IsArray()
   @ApiPropertyOptional({
      description: 'Array of team ID with add/remove flag',
      example: [{
         teamId: 1,
         isAdd: false
      }],
   })
   teamData: TeamData[];

}