import { Module } from '@nestjs/common';
import { FilterBookmarkService } from './filter-bookmark.service';
import { FilterBookmarkController } from './filter-bookmark.controller';
import { FilterBookmarkRepository } from './filter-bookmark.respository';

@Module({
  controllers: [FilterBookmarkController],
  providers: [FilterBookmarkService, FilterBookmarkRepository]
})
export class FilterBookmarkModule { }
