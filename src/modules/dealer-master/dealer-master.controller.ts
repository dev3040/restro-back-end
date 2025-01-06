import {
    Body,
    Controller,
    Post,
    Delete,
    ValidationPipe,
    Put,
    Param,
    UseGuards,
    Get,
    Query,
    Patch
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { DealerMasterService } from "./dealer-master.service";
import { AddDealerMasterDto, DeleteDealerMastersDto, UpdateDealerMasterDto } from "./dto/dealer-master.dto";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { ListSellersDto } from "src/shared/dtos/list-data.dto";

@ApiTags("Dealer Master")
@Controller("dealer-master")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class DealerMasterController {
    constructor(private readonly dealerMasterService: DealerMasterService) { }

    @Post("/add")
    @ApiOperation({ summary: "Create DealerMaster" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addDealerMaster(@Body() createDealerMaster: AddDealerMasterDto, @GetUser() user: User): Promise<AppResponse> {
        return this.dealerMasterService.addDealerMaster(createDealerMaster, user);
    }

    @Get("/")
    @ApiOperation({ summary: "Get dealer master list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getDealerMasterList(@Query() query: ListSellersDto): Promise<AppResponse> {
        return this.dealerMasterService.getDealerMasterList(query);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get dealer master details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getDealerMaster(@Param("id") id: string): Promise<AppResponse> {
        return this.dealerMasterService.getDealerMaster(id);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Edit dealer master details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "DealerMaster Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editDealerMaster(@Param("id") id: string, @GetUser() user: User, @Body(ValidationPipe) updateDealerMaster: UpdateDealerMasterDto): Promise<AppResponse> {
        return this.dealerMasterService.editDealerMaster(updateDealerMaster, id, user);
    }

    @Patch("/:id")
    @ApiOperation({ summary: "Active/ Inactive dealer" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    activeInactiveCustomer(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
        return this.dealerMasterService.activeInactiveDealer(id, user);
    }

    @Delete("/")
    @ApiOperation({ summary: "Delete dealer master details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteDealerMasters(@Body() deleteDealerMaster: DeleteDealerMastersDto, @GetUser() user: User) {
        return this.dealerMasterService.deleteDealerMasters(deleteDealerMaster, user.id);
    }

}
