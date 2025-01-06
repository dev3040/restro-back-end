import { Body, Controller, ValidationPipe, UseGuards, Post, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiCookieAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { CreateInsuranceDto } from "./dto/add-insurance-info.dto";
import { InsuranceInfoService } from "./insurance-info.service";


@ApiTags("Insurance info")
@Controller("data-entry/insurance-info")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@ApiCookieAuth()
export class InsuranceInfoController {
    constructor(private readonly insuranceInfoService: InsuranceInfoService) { }

    @Post("/")
    @ApiOperation({ summary: "Save insurance info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Insurance info Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editInsuranceInfo(
        @Body(ValidationPipe) insuranceInfo: CreateInsuranceDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.insuranceInfoService.saveInsuranceInfo(insuranceInfo, user.id)
    }

    @Get("/:ticketId")
    @ApiOperation({ summary: "Get insurance info details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    insuranceInfo(@Param("ticketId") ticketId: string): Promise<AppResponse> {
        return this.insuranceInfoService.getInsuranceInfo(ticketId);
    }
}
