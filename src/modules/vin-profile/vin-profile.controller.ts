import { Body, Controller, Get, Param, Post, Put, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { VinProfileService } from "./vin-profile.service";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { SetVinProfileDto } from "./dto/set-vin-profile.dto";
import { VinProfileDocsDto } from "./dto/download-docs.dto";

@ApiTags("Vin Profile")
@Controller("data-entry/vin-profile")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@ApiCookieAuth()
export class VinProfileController {
    constructor(private readonly vinProfileService: VinProfileService) { }

    @Get(":ticketId")
    @ApiOperation({ summary: "Get vin profile details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 409, description: "Vin profile Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getVinProfileDetails(@Param('ticketId') ticketId: number): Promise<AppResponse> {
        return this.vinProfileService.fetchVinProfileDetails(ticketId)
    }

    @Put()
    @ApiOperation({ summary: "Save Billing Process" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async saveVinProfile(
        @Body() payload: SetVinProfileDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.vinProfileService.setVinProfile(payload, user.id);
    }

    @Post("/documents")
    @ApiOperation({ summary: "Download vin profile documents" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    downloadVinProfileDocs(@Body() docs: VinProfileDocsDto, @Res() res: Response): Promise<any> {
        return this.vinProfileService.downloadDocument(docs, res,);
    }

    @Post("/preview")
    @ApiOperation({ summary: "Preview vin profile documents" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    previewVinProfileDocs(@Body() docs: VinProfileDocsDto): Promise<any> {
        return this.vinProfileService.previewDocuments(docs);
    }

}