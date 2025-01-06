import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { AddBuyerInfoDto, DeleteBuyerInfo, UpdateBuyerInfoDto } from "./dto/add-buyer-info.dto";
import { BuyerInfoService } from "./buyer-info.service";
import { ParseIsSummaryPipe } from "src/shared/pipes/is-summary.pipe";
import { User } from "src/shared/entity/user.entity";


@ApiTags("Buyer Info")
@Controller('buyer-info')
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@Throttle(30, 60)
export class BuyerInfoController {
    constructor(private readonly buyerInfoService: BuyerInfoService) { }

    @Post()
    @ApiOperation({ summary: "Add buyer info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    addBuyerInfo(@Body() addBuyerInfoDto: AddBuyerInfoDto, @GetUser() user): Promise<AppResponse> {
        return this.buyerInfoService.addBuyerInInfo(addBuyerInfoDto, user);
    }

    @Put(':id')
    @ApiOperation({ summary: "Edit buyer info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    updateBuyerInfo(@Param('id') id: string, @Body() updateBuyerInfoDto: UpdateBuyerInfoDto, @GetUser() user): Promise<AppResponse> {
        return this.buyerInfoService.editBuyerInfo(id, updateBuyerInfoDto, user);
    }

    @Delete('/')
    @ApiOperation({ summary: "Delete buyer info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteBuyerInfo(@Body() buyerDto: DeleteBuyerInfo): Promise<AppResponse> {
        return this.buyerInfoService.deleteBuyerInfo(buyerDto);
    }

    @Get("/:id")
    @SkipThrottle()
    @ApiOperation({ summary: "Get buyer info by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getBuyerInfo(@Param("id") id: string): Promise<AppResponse> {
        return this.buyerInfoService.getBuyerInfo(id);
    }

    @Post('save')
    @ApiOperation({ summary: "Real Time Save: Buyer Info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    @ApiQuery({ name: 'isSummary', required: false, type: Boolean, description: 'API called from Summary or not' })
    saveBuyerInfo(
        @Query('isSummary', ParseIsSummaryPipe) isSummary: boolean,
        @Body() addBuyerInfoDto: AddBuyerInfoDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.buyerInfoService.saveBuyerInfo(addBuyerInfoDto, user.id, isSummary);
    }

    @Delete('/purchaseType/:id')
    @ApiOperation({ summary: "Delete buyer info based on purchase type" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteBuyer(@Param("id") id: string): Promise<AppResponse> {
        return this.buyerInfoService.deletePurchaseTypeData(id);
    }

}

