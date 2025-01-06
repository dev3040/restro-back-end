import { Body, Controller, Delete, Get, Param, Put, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { TradeInInfoService } from "./trade-in-info.service";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { TradeInIdDto, UpdateTradeInInfoDto } from "./dto/add-trade-in-info.dto";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { QueryDto } from "./dto/list-trade-in-info";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { ParseIsSummaryPipe } from "src/shared/pipes/is-summary.pipe";

@ApiTags("Trade In Info")
@Controller('trade-in-info')
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@Throttle(30, 60)
export class TradeInInfoController {
    constructor(private readonly tradeInInfoService: TradeInInfoService) { }

    @Delete(':id')
    @ApiOperation({ summary: "Delete Trade In Info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteTradeInInfo(@Param('id') id: string, @GetUser() user): Promise<AppResponse> {
        return this.tradeInInfoService.deleteTradeInInfo(id, user);
    }

    @Get()
    @SkipThrottle()
    @ApiOperation({ summary: "Get TradeInInfo list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTidTypeList(@Query() query: QueryDto): Promise<AppResponse> {
        return this.tradeInInfoService.getTradeInInfoList(query);
    }

    @Put('data/save')
    @ApiOperation({ summary: "Save Trade In Info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    @ApiQuery({ name: 'isSummary', required: false, type: Boolean, description: 'API called from Summary or not' })
    saveTradeInInfo(
        @Query('isSummary', ParseIsSummaryPipe) isSummary: boolean,
        @Query() id: TradeInIdDto,
        @Body() tradeInInfo: UpdateTradeInInfoDto,
        @GetUser() user
    ): Promise<AppResponse> {
        return this.tradeInInfoService.saveTradeInInfo(id, tradeInInfo, user, isSummary);
    }
}