import { Body, Controller, ValidationPipe, UseGuards, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiCookieAuth, ApiQuery } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { TitleInfoDto } from "./dto/add-title-info.dto";
import { TitleInfoService } from "./title-info.service";
import { ParseIsSummaryPipe } from "src/shared/pipes/is-summary.pipe";


@ApiTags("Title info")
@Controller("data-entry/title-info")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@ApiCookieAuth()
export class TitleInfoController {
    constructor(private readonly titleInfoService: TitleInfoService) { }

    @Post("/")
    @ApiOperation({ summary: "Save title info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Title info Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    @ApiQuery({ name: 'isSummary', required: false, type: Boolean, description: 'API called from Summary or not' })
    editTitleInfo(
        @Query('isSummary', ParseIsSummaryPipe) isSummary: boolean,
        @Body(ValidationPipe) titleInfo: TitleInfoDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.titleInfoService.saveTitleInfo(titleInfo, user.id, isSummary)
    }

}
