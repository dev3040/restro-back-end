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
    Patch,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { TransactionTypesService } from "./transaction-types.service";
import { AddTransactionTypesDto, DeleteTransactionDto } from "./dto/add-transaction-type.dto";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { User } from "src/shared/entity/user.entity";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { UpdateTransactionTypeDto } from "./dto/update-transaction-type.dto";
import { ListTransactionTypesDto } from "src/shared/dtos/list-data.dto";
@ApiTags("Transaction Types")
@Controller("transaction-types")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class TransactionTypesController {
    constructor(private readonly transactionTypesService: TransactionTypesService) { }

    @Post("/add")
    @ApiOperation({ summary: "Create Transaction Types" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addTransactionTypes(@Body() createTransactionTypes: AddTransactionTypesDto,
        @GetUser() user: User): Promise<AppResponse> {
        return this.transactionTypesService.addTransactionTypes(createTransactionTypes, user.id);
    }

    @Get("/")
    @ApiOperation({ summary: "Get transaction types list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTransactionTypesList(@Query() query: ListTransactionTypesDto): Promise<AppResponse> {
        return this.transactionTypesService.getTransactionTypesList(query);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get transaction types details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async getTransactionType(@Param("id") id: string): Promise<AppResponse> {
        return this.transactionTypesService.getTransactionType(id);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Edit transaction types details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "TransactionTypes Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editTransactionType(@Param("id") id: string, @Body(ValidationPipe)
    updateTransactionTypes: UpdateTransactionTypeDto,
        @GetUser() user: User): Promise<AppResponse> {
        return this.transactionTypesService.editTransactionType(updateTransactionTypes, parseInt(id), user.id);
    }

    @Patch("/:id")
    @ApiOperation({ summary: "Active/ Inactive transaction" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    activeInactiveCustomer(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
        return this.transactionTypesService.activeInactiveTransaction(id, user);
    }

    @Delete("/")
    @ApiOperation({ summary: "Delete transaction types" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteTransactionTypes(@Body() transactionTypes: DeleteTransactionDto, @GetUser() user: User): Promise<AppResponse> {
        return this.transactionTypesService.deleteTransactionTypes(transactionTypes, user.id);
    }

}
