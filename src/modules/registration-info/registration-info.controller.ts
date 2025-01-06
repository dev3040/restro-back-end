import { Body, Controller, ValidationPipe, UseGuards, Get, Param, Put } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiCookieAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { RegistrationInfoDto } from "./dto/add-registration-info.dto";
import { RegistrationInfoService } from "./registration-info.service";


@ApiTags("Registration info")
@Controller("data-entry/registration-info")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@ApiCookieAuth()
export class RegistrationInfoController {
    constructor(private readonly registrationInfoService: RegistrationInfoService) { }

    @Put("/")
    @ApiOperation({ summary: "Save title info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Title info Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    saveRegInfo(
        @Body(ValidationPipe) regInfo: RegistrationInfoDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.registrationInfoService.saveRegInfo(regInfo, user.id)
    }

    @Get("/:ticketId")
    @ApiOperation({ summary: "Get registration info form" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getRegInfo(@Param("ticketId") ticketId: string): Promise<AppResponse> {
        return this.registrationInfoService.getRegInfo(ticketId);
    }

    @Get("calc-info/:ticketId")
    @ApiOperation({ summary: "Get registration info form" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getCalcInfo(@Param("ticketId") ticketId: string): Promise<AppResponse> {
        return this.registrationInfoService.getCalcInfo(ticketId);
    }

}
