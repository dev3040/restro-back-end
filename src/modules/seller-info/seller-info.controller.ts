import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { Throttle } from "@nestjs/throttler";
import { SellerInfoService } from "./seller-info.service";
import { AddSellerDto, AddSellerInfoDto, UpdateSellerInfoDto } from "./dto/add-seller-info.dto";
import { ParseIsSummaryPipe } from "src/shared/pipes/is-summary.pipe";

@ApiTags("Seller Info")
@Controller('seller-info')
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@Throttle(30, 60)
export class SellerInfoController {
    constructor(private readonly sellerInfoService: SellerInfoService) { }

    @Post()
    @ApiOperation({ summary: "Add seller info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    addSellerInfo(@Body() addTradeInInfoDto: AddSellerInfoDto, @GetUser() user): Promise<AppResponse> {
        return this.sellerInfoService.addSellerInInfo(addTradeInInfoDto, user);
    }

    @Put(':id')
    @ApiOperation({ summary: "Edit seller info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    updateSellerInfo(@Param('id') id: string, @Body() updateTradeInInfoDto: UpdateSellerInfoDto, @GetUser() user): Promise<AppResponse> {
        return this.sellerInfoService.editSellerInfo(id, updateTradeInInfoDto, user);
    }

    @Delete(':id')
    @ApiOperation({ summary: "Delete seller info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteSellerInfo(@Param('id') id: string, @GetUser() user): Promise<AppResponse> {
        return this.sellerInfoService.deleteSellerInfo(id, user);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get seller info by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getSellerInfo(@Param("id") id: string): Promise<AppResponse> {
        return this.sellerInfoService.getSellerInfo(id);
    }

    @Put('data/save')
    @ApiOperation({ summary: "Real time save : seller info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    saveSellerInfo(@Query('isSummary', ParseIsSummaryPipe) isSummary: boolean,
        @Body() seller: AddSellerDto,
        @GetUser() user): Promise<AppResponse> {
        return this.sellerInfoService.saveSellerInInfo(seller, user.id, isSummary);
    }

}