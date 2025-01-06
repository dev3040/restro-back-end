import { Body, Controller, Post, Delete, ValidationPipe, Put, Param, Get, Query, UploadedFiles, UseInterceptors, Res, Patch, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { TicketManagementService } from "./ticket-management.service";
import { AddTicketsDto, FinishTicketDto } from "./dto/add-ticket.dto";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { GlobalSearchPageQueryDto, PageQueryDto } from "./dto/list-query.dto";
import { SetAssigneeDto } from "./dto/set-assignee.dto";
import { ListUsersForTicketDto } from "./dto/list-users-for-ticket.dto";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ListTagsDto } from "./dto/list-tags.dto";
import { AddTicketTagDto } from "./dto/add-ticket-tag.dto";
import { ListDocumentDto, UploadDocumentsDto } from "./dto/upload-doc.dto";
import { UpdateTicketDataDto } from "./dto/update-ticket-data.dto";
import { SetTicketDetailsDto } from "./dto/set-ticket-details.dto";
import { GetFormsDto } from "./dto/get-forms.dto";
import { SetDocumentDescriptionDto } from "./dto/set-media-description.dto";
import { StateTransferDto } from "./dto/state-transfer.dto";
import { AuthGuard } from "@nestjs/passport";
import { DeleteTicketsDto } from "./dto/delete-tickets.dto";
import { ParseIsSummaryPipe } from "src/shared/pipes/is-summary.pipe";
import { BulkDeleteDto } from "src/shared/dtos/bulk-delete.dto";
import { RemoveAssignedDataDto } from "./dto/remove-assigned-data.dto";
import { SetMultipleTicketsMappingDataDto } from "./dto/set-mapping-data-bulk.dto";
import { AddActivityDto } from "./dto/add-activity.dto";

@ApiTags("Tickets Management")
@Controller("ticket-management")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class TicketManagementController {
    constructor(private readonly ticketsService: TicketManagementService) { }

    @Post("/")
    @UseInterceptors(FilesInterceptor('attachments'))
    @ApiConsumes("multipart/form-data")
    @ApiOperation({ summary: "Create Ticket" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addTicket(@UploadedFiles() files, @Body() createTickets: AddTicketsDto, @GetUser() user: User): Promise<AppResponse> {
        return this.ticketsService.addTicket(createTickets, user, files);
    }

    @Get("/")
    @ApiOperation({ summary: "Get ticket list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTicketList(@Query() query: PageQueryDto, @GetUser() user: User): Promise<AppResponse> {
        return this.ticketsService.getTicketList(query, user.id);
    }

    // @Post("/test-new")
    @ApiOperation({ summary: "Get ticket list {Test API}" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTicketListTest(@Body() query: PageQueryDto, @GetUser() user: User): Promise<AppResponse> {
        return this.ticketsService.getTicketListTest(query, user.id);
    }

    //need to delete later
    @Get("/test")
    @ApiOperation({ summary: "Test API for Get ticket list with grouping" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    testTicket(@Query() query: PageQueryDto, @GetUser() user: User): Promise<AppResponse> {
        return this.ticketsService.testTicket(query, user.id);
    }

    @Get("/task-analytics")
    @ApiOperation({ summary: "Ticket analytics" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTicketAnalytics(): Promise<AppResponse> {
        return this.ticketsService.getTicketAnalytics();
    }

    @Get("/global-search")
    @ApiOperation({ summary: "Get ticket list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getFuzzyTicketList(@Query() query: GlobalSearchPageQueryDto, @GetUser() user: User): Promise<AppResponse> {
        return this.ticketsService.getFuzzyTicketList(query, user.id);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get ticket details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTicket(@Param("id") id: string): Promise<AppResponse> {
        return this.ticketsService.getTicket(id);
    }

    @Delete("/document")
    @ApiOperation({ summary: "Delete document" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteDocument(@Body() deleteDocument: BulkDeleteDto, @GetUser() user: User, @Query() query: { isBilling: number }): Promise<AppResponse> {
        return this.ticketsService.deleteDocument(deleteDocument, user.id, query);
    }

    //need to delete later
    @Delete('/assigned-data')
    @ApiOperation({ summary: "Delete multiple assignees/tags" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    removeAssignedData(
        @Body() dto: RemoveAssignedDataDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.ticketsService.removeAssignedData(dto, user.id);
    }

    @Put("/bulk-update")
    @ApiOperation({ summary: "Bulk Update Tickets [Assignee user/ Tag/ Priority/ Status/ Team]" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async bulkUpdateTickets(
        @Body(ValidationPipe) dto: SetMultipleTicketsMappingDataDto, @GetUser() user: User
    ): Promise<AppResponse> {
        return this.ticketsService.bulkUpdateTickets(dto, user.id);
    }

    // Need to delete later
    @Put("/update-ticket-data/:ticketId")
    @ApiOperation({ summary: "Update ticket data" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "TicketStatus Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async updateTicketData(
        @Param("ticketId") ticketId: number,
        @Body(ValidationPipe) dto: UpdateTicketDataDto, @GetUser() user: User): Promise<AppResponse> {
        return this.ticketsService.updateTicketData(dto, ticketId, user.id);
    }

    @Post("/set-assignee")
    @ApiOperation({ summary: "Add/remove assignee for particular ticket" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async setAssignee(
        @Body() setAssignee: SetAssigneeDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.ticketsService.setAssignee(setAssignee, user.id);
    }

    @Get("/assignee/list-users")
    @ApiOperation({ summary: "Get users for ticket" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    listUsersForTicket(@Query() query: ListUsersForTicketDto): Promise<AppResponse> {
        return this.ticketsService.listUsersForTicket(query);
    }

    @Get("/document/:id")
    @ApiOperation({ summary: "Download Document" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    downloadDOcument(@Param("id") id: string, @Query() query: ListDocumentDto, @Res() res: Response): Promise<any> {
        return this.ticketsService.downloadDocument(id, res, query);
    }

    @Get("/document/ticket/:ticketId")
    @ApiOperation({ summary: "Get Ticket Specific Documents" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTicketDocs(@Param("ticketId") ticketId: number, @Query() query: ListDocumentDto): Promise<any> {
        return this.ticketsService.getTicketDocs(ticketId, query);
    }

    @Put("/set-task-details")
    @ApiOperation({ summary: "Real time save : Task" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Tickets Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    @ApiQuery({
        name: 'isSummary', required: false, type: Boolean, description: 'API called from Summary or not'
    })
    setTicketDetails(
        @Query('isSummary', ParseIsSummaryPipe) isSummary: boolean,
        @Body(ValidationPipe) updateTickets: SetTicketDetailsDto,
        @GetUser() user: User,
    ): Promise<AppResponse> {
        return this.ticketsService.setTicketDetails(updateTickets, user.id, isSummary);
    }

    @Post("/tags")
    @ApiOperation({ summary: "Add tag for a particular ticket " })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addTicketTag(
        @Body() addTicketTagDto: AddTicketTagDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.ticketsService.addTicketTag(addTicketTagDto, user.id);
    }

    @Get("/tags/list")
    @ApiOperation({ summary: "All tags list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    listTags(@Query() query: ListTagsDto): Promise<AppResponse> {
        return this.ticketsService.listTags(query);
    }

    @Delete("/:ticketId/:tagId")
    @ApiOperation({ summary: "Delete tag of a particular ticket" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteTicketTag(
        @Param("ticketId") ticketId: number,
        @Param("tagId") tagId: number,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.ticketsService.deleteTicketTag(ticketId, tagId, user.id);
    }

    @Post("/:id/upload-documents")
    @ApiOperation({ summary: "Upload documents" })
    @UseInterceptors(FilesInterceptor('attachments'))
    @ApiConsumes("multipart/form-data")
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Tickets Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    uploadDocuments(
        @Param("id") id: string,
        @UploadedFiles() files,
        @Body(ValidationPipe) upload: UploadDocumentsDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.ticketsService.uploadDocuments(id, user, files, upload);
    }

    @Put("/document-description/:documentId")
    @ApiOperation({ summary: "Set document description" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Tickets Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editDocumentDescription(
        @Param("documentId") documentId: number,
        @Body(ValidationPipe) setDocumentDescription: SetDocumentDescriptionDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.ticketsService.editMediaDescription(setDocumentDescription, documentId, user.id);
    }

    @Get("/tags/:ticketId")
    @ApiOperation({ summary: "List of all ticket specific tags" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async listTicketTags(@Param("ticketId") ticketId: number,): Promise<AppResponse> {
        return this.ticketsService.listTicketTags(ticketId);
    }

    @Get("/get-forms/:ticketId")
    @ApiOperation({ summary: "Get all forms details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async getFormsDetail(@Param("ticketId") ticketId: number,): Promise<AppResponse> {
        return this.ticketsService.getFormsDetail(ticketId);
    }

    @Get("/forms/data")
    @ApiOperation({ summary: "Get all forms details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async getForms(@Query() forms: GetFormsDto): Promise<AppResponse> {
        return this.ticketsService.getForms(forms);
    }

    @Patch("/:id")
    @ApiOperation({ summary: "State transfer or not" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    stateTransfer(@Param("id") id: number, @Body() body: StateTransferDto): Promise<AppResponse> {
        return this.ticketsService.stateTransfer(id, body);
    }

    @Get("state-transfer/:id")
    @ApiOperation({ summary: "Get state transfer" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getStateTransfer(@Param("id") id: number): Promise<AppResponse> {
        return this.ticketsService.getStateTransfer(id);
    }

    @Delete()
    @ApiOperation({ summary: "Delete tickets" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteTickets(
        @Body() deleteTicketsDto: DeleteTicketsDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.ticketsService.deleteTickets(deleteTicketsDto, user.id);
    }

    @Post("/finish-ticket")
    @ApiOperation({ summary: "submit ticket for batch prep" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async finishTicket(@Body() dto: FinishTicketDto, @GetUser() user: User): Promise<AppResponse> {
        return this.ticketsService.finishTicket(dto, user);
    }

    @Post("/return-label/:ticketId")
    @ApiOperation({ summary: "submit ticket for batch prep" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async generateReturnLabel(@Param("ticketId") ticketId: number, @GetUser() user: User): Promise<AppResponse> {
        return this.ticketsService.generateReturnLabel(ticketId, user);
    }

    @Post("/activity")
    @ApiOperation({ summary: "Add comment/note for the particular ticket" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addActivity(@Body() dto: AddActivityDto, @GetUser() user: User): Promise<AppResponse> {
        return this.ticketsService.addActivity(dto, user.id);
    }

    @Get("/history/:ticketId")
    @ApiOperation({ summary: "Get ticket history" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getHistory(@Param("ticketId") ticketId: number): Promise<AppResponse> {
        return this.ticketsService.getHistory(ticketId);
    }
}