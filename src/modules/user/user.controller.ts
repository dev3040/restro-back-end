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
import { SkipThrottle } from "@nestjs/throttler";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiCookieAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { UserService } from "./user.service";
import { UpdateUserDto } from "./dto/edit-user.dto";
import { GetUser } from "../../shared/decorators/get-user.decorator";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { EditUser } from "./interface/common.interface";
import { User } from "src/shared/entity/user.entity";
import { SignupUserDto } from "./dto/sign-up-user.dto";
import { CreateUserDto, DeleteUsersDto } from "./dto/create-user.dto";
import { ListUsersDto } from "src/shared/dtos/list-data.dto";

@SkipThrottle()
@ApiTags("User")
@Controller("user")
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post("/sign-up")
    @ApiOperation({ summary: "Sign up" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "User Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    signUp(@Body(ValidationPipe) createUser: SignupUserDto): Promise<AppResponse> {
        return this.userService.signUp(createUser);
    }

    @Post("/add")
    @ApiBearerAuth()
    @ApiCookieAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "Add user" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "User Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    addUser(@Body(ValidationPipe) createUser: CreateUserDto, @GetUser() user: User): Promise<AppResponse> {
        return this.userService.createUser(createUser);
    }

    @Get("/:id")
    @ApiBearerAuth()
    @ApiCookieAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "Get user details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "User Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getUser(@Param("id") id: number): Promise<AppResponse> {
        return this.userService.getUser(id);
    }

    @Put("/:id")
    @ApiBearerAuth()
    @ApiCookieAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "Edit user details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "User Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editUser(
        @Param("id") id: number,
        @Body(ValidationPipe) updateUser: UpdateUserDto,
        @GetUser() user
    ): Promise<AppResponse> {
        const data: EditUser = {
            userId: id,
            loginUserId: user.id
        };
        return this.userService.editUser(updateUser, data);
    }

    @Get("/")
    @ApiBearerAuth()
    @ApiCookieAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "Get user list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "User Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getUserList(@Query() query: ListUsersDto): Promise<AppResponse> {
        return this.userService.getUserList(query);
    }

    @Patch("/:id")
    @ApiBearerAuth()
    @ApiCookieAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "Edit user active status" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editUserStatus(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
        return this.userService.activeInactiveUser(id, user);
    }

    @Delete("/:userId/:departmentId")
    @ApiBearerAuth()
    @ApiCookieAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "Delete department of a particular user" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteUsrDepartment(
        @Param("userId") userId: number,
        @Param("departmentId") departmentId: number,
    ): Promise<AppResponse> {
        return this.userService.deleteUserDepartment(userId, departmentId);
    }

    @Delete("/")
    @ApiBearerAuth()
    @ApiCookieAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "Delete users" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteUsers(@Body() deleteUsers: DeleteUsersDto, @GetUser() user: User): Promise<AppResponse> {
        return this.userService.deleteUsers(deleteUsers, user.id);
    }

}
