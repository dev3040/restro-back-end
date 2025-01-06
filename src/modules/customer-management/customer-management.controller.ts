import { Body, Controller, Post, Delete, ValidationPipe, Put, Param, UseGuards, Get, Query, Patch } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { CustomerManagementService } from "./customer-management.service";
import { AddCustomerDto, UpdateCustomerDto } from "./dto/add-customer.dto";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { AddContactDto, DeleteCustomersDto, UpdateContactDto } from "./dto/add-contact.dto";
import { BulkDeleteDto } from "src/shared/dtos/bulk-delete.dto";
import { ListContactsDto, ListCustomersDto } from "src/shared/dtos/list-data.dto";


@ApiTags("Customer Management")
@Controller("customer-management")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class CustomerManagementController {

    constructor(private readonly customerManagementService: CustomerManagementService) { }

    @Post("/")
    @ApiOperation({ summary: "Create Customer" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addCustomer(@Body() createCustomer: AddCustomerDto, @GetUser() user: User
    ): Promise<AppResponse> {
        return this.customerManagementService.addCustomer(createCustomer, user);
    }

    @Get("/")
    @ApiOperation({ summary: "Get customer list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getCustomerList(@Query() query: ListCustomersDto): Promise<AppResponse> {
        return this.customerManagementService.getCustomerList(query);
    }

    @Get("/analytics")
    @ApiOperation({ summary: "Customer analytics" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    customerAnalytics(): Promise<AppResponse> {
        return this.customerManagementService.customerAnalytics();
    }

    @Get("/all-customers")
    @ApiOperation({ summary: "Fetch all customers" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    fetchCustomerData(): Promise<AppResponse> {
        return this.customerManagementService.fetchCustomerData();
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get customer details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getCustomer(@Param("id") id: number): Promise<AppResponse> {
        return this.customerManagementService.getCustomer(id);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Edit customer details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Customer Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editCustomer(@Param("id") id: string, @Body(ValidationPipe) updateCustomer: UpdateCustomerDto, @GetUser() user: User): Promise<AppResponse> {
        return this.customerManagementService.editCustomer(updateCustomer, id, user);
    }

    @Patch("/:id")
    @ApiOperation({ summary: "Active/ Inactive customer" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    activeInactiveCustomer(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
        return this.customerManagementService.activeInactiveCustomer(id, user);
    }

    @Get("/latest-transaction/:id")
    @ApiOperation({ summary: "Get latest transactions" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getLatestTransaction(@Param("id") id: number): Promise<AppResponse> {
        return this.customerManagementService.getLatestTransaction(id);
    }

    @Delete("/")
    @ApiOperation({ summary: "Delete customers" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteCustomers(@Body() customers: DeleteCustomersDto, @GetUser() user: User): Promise<AppResponse> {
        return this.customerManagementService.deleteCustomers(customers, user.id);
    }
}



@ApiTags("Customer Contact")
@Controller("contact-info")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class CustomerContactController {

    constructor(private readonly customerContactService: CustomerManagementService) { }

    @Post("/")
    @ApiOperation({ summary: "Create Contact" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addContact(@Body() createContact: AddContactDto, @GetUser() user: User
    ): Promise<AppResponse> {
        return this.customerContactService.addContact(createContact, user);
    }

    @Get("/list")
    @ApiOperation({ summary: "Get contact list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getContactList(@Query() query: ListContactsDto): Promise<AppResponse> {
        return this.customerContactService.getContactList(query);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get contact details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getContact(@Param("id") id: number): Promise<AppResponse> {
        return this.customerContactService.getContact(id);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Edit contact details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editContact(@Param("id") id: string, @Body(ValidationPipe) updateCustomer: UpdateContactDto, @GetUser() user: User): Promise<AppResponse> {
        return this.customerContactService.editContact(updateCustomer, id, user);
    }

    @Patch("/:id")
    @ApiOperation({ summary: "Active/Inactive contact" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    activeInactiveContact(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
        return this.customerContactService.activeInactiveContact(id, user);
    }


    @Delete("/")
    @ApiOperation({ summary: "Delete contact" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteContact(@Body() deleteContact: BulkDeleteDto, @GetUser() user: User): Promise<AppResponse> {
        return this.customerContactService.deleteContact(deleteContact, user.id);
    }
}