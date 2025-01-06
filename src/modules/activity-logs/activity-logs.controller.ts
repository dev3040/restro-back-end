import { Body, Controller, Get, Param, Post, Query, UseGuards, } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PageQueryDto } from "./dto/list-query.dto";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { ActivityLogsService } from "./activity-logs.service";
import { AuthGuard } from "@nestjs/passport";
import { AddActivityCommentDto } from "./dto/add-activity-comment.dto";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { GetActivityLogsDto } from "./dto/get-activity-logs.dto";

@ApiTags("Activity Logs")
@Controller("activity-logs")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()

export class ActivityLogsController {
   constructor(private readonly activityLogsService: ActivityLogsService) { }

   @Post("/logs")
   @ApiOperation({ summary: "Show More Functionality : Only Logs Data Based On Given IDs" })
   @ApiResponse({ status: 200, description: "Api success" })
   @ApiResponse({ status: 422, description: "Bad Request or API error message" })
   @ApiResponse({ status: 404, description: "Not found!" })
   @ApiResponse({ status: 500, description: "Internal server error!" })
   getActivityLogs(@Body() dto: GetActivityLogsDto): Promise<AppResponse> {
      return this.activityLogsService.getActivityLogs(dto);
   }

   @Get("/comments")
   @ApiOperation({ summary: "Show More Functionality : Only Comments" })
   @ApiResponse({ status: 200, description: "Api success" })
   @ApiResponse({ status: 422, description: "Bad Request or API error message" })
   @ApiResponse({ status: 404, description: "Not found!" })
   @ApiResponse({ status: 500, description: "Internal server error!" })
   getActivityComments(@Query() query: PageQueryDto): Promise<AppResponse> {
      return this.activityLogsService.getActivityComments(query);
   }

   @Post("/")
   @ApiOperation({ summary: "Add activity comment" })
   @ApiResponse({ status: 200, description: "Api success" })
   @ApiResponse({ status: 422, description: "Bad Request or API error message" })
   @ApiResponse({ status: 500, description: "Internal server error!" })
   async addActivityComment(
      @Body() addComment: AddActivityCommentDto, @GetUser() user: User
   ): Promise<AppResponse> {
      return this.activityLogsService.addActivityComment(addComment, user);
   }

   @Get("/:ticketId")
   @ApiOperation({ summary: "Get comments & notes data of the ticket" })
   @ApiResponse({ status: 200, description: "Api success" })
   @ApiResponse({ status: 500, description: "Internal server error!" })
   getCommentsAndNotes(@Param("ticketId") ticketId: number): Promise<AppResponse> {
      return this.activityLogsService.getCommentsAndNotes(ticketId);
   }
}