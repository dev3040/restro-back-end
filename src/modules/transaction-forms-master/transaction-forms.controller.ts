import {
    Body,
    Controller,
    Post,
    ValidationPipe,
    Put,
    Param,
    UseGuards,
    Get,
    Query,
    Delete,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { TransactionFormsService } from "./transaction-forms.service";
import { AddTransactionFormDto, DeleteTransactionFormsDto, UpdateTransactionFormDto } from "./dto/add-transaction-forms.dto";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { ListFromTransactionsDto } from "src/shared/dtos/list-data.dto";

@ApiTags("Transaction forms")
@Controller("transaction-forms")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class TransactionFormsController {
    constructor(private readonly transactionFormsService: TransactionFormsService) { }

    @Post("/")
    @ApiOperation({ summary: "Create transaction form" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 400, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addTransactionForm(
        @Body() createTransactionForms: AddTransactionFormDto, @GetUser() user: User
    ): Promise<AppResponse> {
        return this.transactionFormsService.addTransactionForm(createTransactionForms, user);
    }

    @Get("/")
    @ApiOperation({ summary: "Get transaction form list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 400, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTransactionFormList(@Query() query: ListFromTransactionsDto): Promise<AppResponse> {
        return this.transactionFormsService.getTransactionFormList(query);
    }

    @Get("/:formShortCode")
    @ApiOperation({ summary: "Get transaction form details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 400, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTransactionForm(@Param("formShortCode") code: string): Promise<AppResponse> {
        return this.transactionFormsService.getTransactionForm(code);
    }

    @Put("/:formShortCode")
    @ApiOperation({ summary: "Edit transaction form details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 400, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editTransactionForm(
        @Param("formShortCode") code: string, @Body(ValidationPipe) updateTransactionForms: UpdateTransactionFormDto, @GetUser() user: User
    ): Promise<AppResponse> {
        return this.transactionFormsService.editTransactionForm(updateTransactionForms, code, user);
    }

    @Delete("/")
    @ApiOperation({ summary: "Delete transaction forms" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteTransactionForms(@Body() deleteTransactionForms: DeleteTransactionFormsDto, @GetUser() user: User): Promise<AppResponse> {
        return this.transactionFormsService.deleteTransactionForms(deleteTransactionForms, user.id);
    }

}
