import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { FilterBookmarkService } from './filter-bookmark.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AppResponse } from 'src/shared/interfaces/app-response.interface';
import { CreateFilterBookmarkDto } from './dto/create-bookmark.dto';
import { GetUser } from 'src/shared/decorators/get-user.decorator';
import { User } from 'src/shared/entity/user.entity';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

@ApiTags("Filter Bookmark")
@Controller('filter-bookmark')
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class FilterBookmarkController {
  constructor(private readonly filterBookmarkService: FilterBookmarkService) { }

  @Post()
  @ApiOperation({ summary: "Create new bookmark" })
  @ApiResponse({ status: 201, description: "Filter bookmark created successfully." })
  @ApiResponse({ status: 404, description: "Not found!" })
  @ApiResponse({ status: 422, description: "Bad Request or API error message" })
  @ApiResponse({ status: 500, description: "Internal server error!" })
  createBookmark(
    @Body() createFilterBookmarkDto: CreateFilterBookmarkDto,
    @GetUser() user: User
  ): Promise<AppResponse> {
    return this.filterBookmarkService.createBookmark(createFilterBookmarkDto, user.id)
  }

  @Get()
  @ApiOperation({ summary: "Get all filter bookmarks" })
  @ApiResponse({ status: 200, description: "Api success" })
  @ApiResponse({ status: 500, description: "Internal server error!" })
  getBookmarks(@GetUser() user: User): Promise<AppResponse> {
    return this.filterBookmarkService.getBookmarks(user.id);
  }

  @Get("/:id")
  @ApiOperation({ summary: "get filter bookmark details" })
  @ApiResponse({ status: 200, description: "Api success" })
  @ApiResponse({ status: 404, description: "Not found!" })
  @ApiResponse({ status: 500, description: "Internal server error!" })
  getBookmarkDetails(@Param("id") id: number): Promise<AppResponse> {
    return this.filterBookmarkService.getBookmarkDetails(id);
  }

  @Put("/:id")
  @ApiOperation({ summary: "Edit bookmark filter" })
  @ApiResponse({ status: 200, description: "Api success" })
  @ApiResponse({ status: 422, description: "Bad Request or API error message" })
  @ApiResponse({ status: 500, description: "Internal server error!" })
  async editBookmark(
    @Param('id') id: number,
    @Body() updateBookmarkDto: UpdateBookmarkDto,
    @GetUser() user: User
  ): Promise<AppResponse> {
    return this.filterBookmarkService.editBookmark(id, updateBookmarkDto, user.id);
  }

  @Delete("/:id")
  @ApiOperation({ summary: "Delete Filter Bookmark" })
  @ApiResponse({ status: 200, description: "Api success" })
  @ApiResponse({ status: 422, description: "Bad Request or API error message" })
  @ApiResponse({ status: 500, description: "Internal server error!" })
  deleteBookmark(@Param("id", ParseIntPipe) id: number): Promise<AppResponse> {
    return this.filterBookmarkService.deleteBookmark(id);
  }
}
