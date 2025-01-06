import { Body, Controller, Post, Param, UseGuards, UseInterceptors, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiCookieAuth, ApiConsumes, ApiQuery } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { BasicInfoService } from "./basic-info.service";
import { FilesInterceptor } from "@nestjs/platform-express";
import { SetBasicInfoDto } from "./dto/set-basic-info.dto";
import { ParseIsSummaryPipe } from "src/shared/pipes/is-summary.pipe";


@ApiTags("Basic Info")
@Controller("data-entry/basic-info")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@ApiCookieAuth()
export class BasicInfoController {
    constructor(private readonly basicInfoService: BasicInfoService) { }

    @Get("/:ticketId")
    @ApiOperation({ summary: "Get carrier type details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getCarrierType(
        @Param("ticketId") ticketId: number
    ): Promise<AppResponse> {
        return this.basicInfoService.getBasicInfo(ticketId);
    }

    @Post("/set")
    @UseInterceptors(FilesInterceptor('attachments'))
    @ApiConsumes("multipart/form-data")
    @ApiOperation({ summary: "Save basic info " })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    @ApiQuery({ name: 'isSummary', required: false, type: Boolean, description: 'API called from Summary or not' })
    async setBasicInfo(
        @Query('isSummary', ParseIsSummaryPipe) isSummary: boolean,
        @Body() setBasicInfoDto: SetBasicInfoDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.basicInfoService.setBasicInfo(setBasicInfoDto, user.id, isSummary);
    }
}
