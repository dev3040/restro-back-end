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
import { AddOnPricesService } from "./add-on-prices.service";
import { AddAddOnPricesDto, DeleteAddOnTransactionDto, UpdateAddOnPricesDto } from "./dto/add-add-on-prices.dto";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { ListAddOnPricesDto } from "src/shared/dtos/list-data.dto";

@ApiTags("Add on prices")
@Controller("add-on-prices")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class AddOnPricesController {
    constructor(private readonly addOnPricesService: AddOnPricesService) { }

    @Post("/add")
    @ApiOperation({ summary: "Create Add on price" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addAddOnPrices(@Body() createAddOnPrices: AddAddOnPricesDto, @GetUser() user: User): Promise<AppResponse> {
        return this.addOnPricesService.addAddOnPrices(createAddOnPrices, user);
    }

    @Get("/")
    @ApiOperation({ summary: "Get add on prices list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getAddOnPricesList(@Query() query: ListAddOnPricesDto): Promise<AppResponse> {
        return this.addOnPricesService.getAddOnPricesList(query);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get add on prices details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getAddOnPrices(@Param("id") id: string): Promise<AppResponse> {
        return this.addOnPricesService.getAddOnPrices(id);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Edit add on prices details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Add_on_prices Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editAddOnPrices(@Param("id") id: string, @Body(ValidationPipe) updateDto: UpdateAddOnPricesDto, @GetUser() user: User): Promise<AppResponse> {
        return this.addOnPricesService.editAddOnPrices(updateDto, id);
    }

    @Patch("/:id")
    @ApiOperation({ summary: "Active/ Inactive AddOnPrice" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    activeInactiveAddOnPrice(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
        return this.addOnPricesService.activeInactiveAddOnPrice(id, user);
    }

    @Delete("/")
    @ApiOperation({ summary: "Delete add on transactions" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteAddOnTransactions(@Body() deleteAddOnTransactions: DeleteAddOnTransactionDto, @GetUser() user: User): Promise<AppResponse> {
        return this.addOnPricesService.deleteAddOnTransactions(deleteAddOnTransactions, user.id);
    }

}
