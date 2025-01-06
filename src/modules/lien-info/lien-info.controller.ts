import { Body, Controller, ValidationPipe, UseGuards, Post, Delete, Param, Get, Patch, Put, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiCookieAuth, ApiQuery } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { LienInfoDto, LienInfoIdDto } from "./dto/add-lien-info.dto";
import { LienInfoService } from "./lien-info.service";
import { ParseIsSummaryPipe } from "src/shared/pipes/is-summary.pipe";


@ApiTags("Lien info")
@Controller("data-entry/lien-info")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@ApiCookieAuth()
export class LienInfoController {
    constructor(private readonly lienInfoService: LienInfoService) { }

    @Post("/")
    @ApiOperation({ summary: "Save Lien info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Lien info Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editLienInfo(
        @Body(ValidationPipe) lienInfo: LienInfoDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.lienInfoService.saveLienInfo(lienInfo, user)
    }

    @Delete("/:id")
    @ApiOperation({ summary: "Delete lien info details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteLienInfo(@Param("id") id: string, @GetUser() user: User): Promise<AppResponse> {
        return this.lienInfoService.deleteLienInfo(id, user);
    }

    @Get("/:ticketId")
    @ApiOperation({ summary: "Get lien info details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getLienInfo(@Param("ticketId") ticketId: string): Promise<AppResponse> {
        return this.lienInfoService.getLienInfo(ticketId);
    }

    @Patch("/:id")
    @ApiOperation({ summary: "No lien checked or not" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    isLienChecked(@Param("id") id: number): Promise<AppResponse> {
        return this.lienInfoService.isLienChecked(id);
    }

    @Put('save')
    @ApiOperation({ summary: "Real time save :  lien info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    @ApiQuery({ name: 'isSummary', required: false, type: Boolean, description: 'API called from Summary or not' })
    saveLienData(
        @Query('isSummary', ParseIsSummaryPipe) isSummary: boolean,
        @Query() id: LienInfoIdDto,
        @Body() lienInInfo: LienInfoDto,
        @GetUser() user): Promise<AppResponse> {
        return this.lienInfoService.saveLienData(id, lienInInfo, user.id, isSummary);
    }

}
