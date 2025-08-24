import {
    Controller,
    UseGuards,
    Get,
    Put,
    Post,
    ValidationPipe,
    Body
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { ListingService } from "./master-listing.service";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { ConfigMasterDto } from "./dto/config-master.dto";

@ApiTags("Master Listing")
@Controller("list")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class ListingController {
    constructor(private readonly listingService: ListingService) { }

    @Get("/designations")
    @ApiOperation({ summary: "Get designation list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTitleStateList(): Promise<AppResponse> {
        return this.listingService.getTitleStateList();
    }

    @Get("/avatar-colors")
    @ApiOperation({ summary: "Get avatar colors" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getAvatarColors(): Promise<AppResponse> {
        return this.listingService.getAvatarColors();
    }

    @Get("/delivery-boys")
    @ApiOperation({ summary: "Get delivery boys list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getDeliveryBoys(): Promise<AppResponse> {
        return this.listingService.getDeliveryBoys();
    }
}

@ApiTags("Master Config")
@Controller("config")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class ConfigController {
    constructor(private readonly listingService: ListingService) { }

    @Get("/variables")
    @ApiOperation({ summary: "Get title state list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTitleStateList(): Promise<AppResponse> {
        return this.listingService.getVariableList();
    }

    @Put("/variables")
    @ApiOperation({ summary: "Get title state list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    saveConfigDetails(@Body(ValidationPipe) payload: ConfigMasterDto, @GetUser() user: User): Promise<AppResponse> {
        return this.listingService.saveConfigDetails(payload, user);
    }

    @Post("/reset-menu")
    @ApiOperation({ summary: "Reset menu - truncate sub-item-branch mappings and create new entries" })
    @ApiResponse({ status: 200, description: "Menu reset successful" })
    @ApiResponse({ status: 404, description: "No active sub-items or branches found" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    resetMenu(@GetUser() user: User): Promise<AppResponse> {
        return this.listingService.resetMenu(user);
    }

    
}