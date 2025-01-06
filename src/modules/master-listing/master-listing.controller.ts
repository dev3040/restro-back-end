import {
    Controller,
    UseGuards,
    Get,
    Param,
    Query,
    Put,
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
import { FedExConfigDto } from "./dto/fedex-config.dto";

@ApiTags("Master Listing")
@Controller("list")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class ListingController {
    constructor(private readonly listingService: ListingService) { }

    @Get("/title-state")
    @ApiOperation({ summary: "Get title state list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTitleStateList(@Query() query: { isMaster: boolean }): Promise<AppResponse> {
        return this.listingService.getTitleStateList(query);
    }

    @Get("/plate-types")
    @ApiOperation({ summary: "Get plate types" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getPlateTypes(): Promise<AppResponse> {
        return this.listingService.getPlateTypes();
    }

    @Get("/fedex-services")
    @ApiOperation({ summary: "Get plate types" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getFedExServices(@Query() query: { search: string }): Promise<AppResponse> {
        return this.listingService.getFedExServices(query);
    }

    @Get("/counties/:stateId?")
    @ApiOperation({ summary: "Get counties" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getCounties(@Param("stateId") stateId?: string, @Query("stateCode") stateCode?: string): Promise<AppResponse> {
        const stateIdNumber = stateId ? parseInt(stateId, 10) : undefined;
        return this.listingService.getCounties(stateIdNumber, stateCode);
    }

    @Get("/tavt-master")
    @ApiOperation({ summary: "Get tavt taxes" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    tavtMaster(): Promise<AppResponse> {
        return this.listingService.tavtMaster();
    }

    @Get("/avatar-colors")
    @ApiOperation({ summary: "Get avatar colors" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getAvatarColors(): Promise<AppResponse> {
        return this.listingService.getAvatarColors();
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
}

@ApiTags("FedEx address configuration")
@Controller("fedex-config")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class FedExConfigController {
    constructor(private readonly listingService: ListingService) { }

    @Get("/")
    @ApiOperation({ summary: "Get fedex configuration" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTitleStateList(): Promise<AppResponse> {
        return this.listingService.getFedExConfig();
    }

    @Put("/")
    @ApiOperation({ summary: "Update fedex configuration" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    saveConfigDetails(@Body(ValidationPipe) payload: FedExConfigDto, @GetUser() user: User): Promise<AppResponse> {
        return this.listingService.saveFedExConfigDetails(payload, user);
    }
}
