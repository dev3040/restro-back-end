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
import { CustomerService } from "./customer-management..service";
import { AddCustomerDto, DeleteCustomersDto, UpdateCustomerDto } from "./dto/add-customer.dto";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { ListDepartmentsDto } from "../../shared/dtos/list-data.dto";

@ApiTags("Customer Management")
@Controller("customer-management")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class CustomerController {
    constructor(private readonly customerService: CustomerService) { }

    @Post("/")
    @ApiOperation({ summary: "Create Department" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addDepartment(
        @Body() createDepartments: AddCustomerDto, @GetUser() user: User
    ): Promise<AppResponse> {
        return this.customerService.addDepartment(createDepartments, user);
    }

    @Get("/")
    @ApiOperation({ summary: "Get department list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getDepartmentList(@Query() query: ListDepartmentsDto): Promise<AppResponse> {
        return this.customerService.getDepartmentList(query);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get departments details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getDepartment(@Param("id") id: number): Promise<AppResponse> {
        return this.customerService.getDepartment(id);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Edit departments details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Departments Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editDepartment(
        @Param("id") id: number, @Body(ValidationPipe) updateDepartments: UpdateCustomerDto, @GetUser() user: User
    ): Promise<AppResponse> {
        return this.customerService.editDepartment(updateDepartments, id, user);
    }

    @Delete("/")
    @ApiOperation({ summary: "Delete departments" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteDepartments(@Body() deleteDepartment: DeleteCustomersDto, @GetUser() user: User): Promise<AppResponse> {
        return this.customerService.deleteDepartments(deleteDepartment, user.id);
    }

}
