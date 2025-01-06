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
    Patch,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { AddTicketStatusDto, DeleteTicketStatusDto, UpdateTicketStatusDto } from "./dto/add-ticket-status.dto";
import { TicketStatusService } from "./ticket-status.service";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { ListStatusesDto } from "src/shared/dtos/list-data.dto";


@ApiTags("Ticket Status Management")
@Controller("ticket-status")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class TicketStatusController {
    constructor(private readonly ticketStatusService: TicketStatusService) { }

    @Post()
    @ApiOperation({ summary: "Create Ticket Status" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addTicketStatus(
        @Body() createTicketStatus: AddTicketStatusDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.ticketStatusService.addTicketStatus(createTicketStatus, user);
    }

    @Get("/")
    @ApiOperation({ summary: "Get Ticket Status List" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTicketStatusList(@Query() query: ListStatusesDto): Promise<AppResponse> {
        return this.ticketStatusService.getTicketStatusList(query);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get ticket Status details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTicketStatus(@Param("id") id: number): Promise<AppResponse> {
        return this.ticketStatusService.getTicketStatus(id);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Edit Ticket Status Details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "TicketStatus Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editTicketStatus(
        @Param("id") id: number,
        @Body(ValidationPipe) updateTicketStatus: UpdateTicketStatusDto, @GetUser() user: User): Promise<AppResponse> {
        return this.ticketStatusService.editTicketStatus(updateTicketStatus, id, user);
    }

    @Delete("/:id")
    @ApiOperation({ summary: "Delete Ticket Status Details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteTicketStatus(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
        return this.ticketStatusService.deleteTicketStatus(id, user);
    }

    @Patch("/:id")
    @ApiOperation({ summary: "Active/ Inactive Ticket Status" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    activeInactiveTicketStatus(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
        return this.ticketStatusService.activeInactiveTicketStatus(id, user);
    }

    @Delete("/")
    @ApiOperation({ summary: "Delete Ticket Statuses" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    removeTicketStatuses(@Body() ticketStatuses: DeleteTicketStatusDto, @GetUser() user: User): Promise<AppResponse> {
        return this.ticketStatusService.removeTicketStatuses(ticketStatuses, user.id);
    }

}
