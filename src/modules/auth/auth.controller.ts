import { Body, Controller, Get, Post, Put, Query, Res, UseGuards, ValidationPipe } from "@nestjs/common";
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ResendOtpDto } from "./dto/resend-otp.dto";
import { AuthGuard } from "@nestjs/passport";
import { User } from "src/shared/entity/user.entity";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { Response } from "express";
import { OtpLeftTime } from "./interface/common.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { OtpVerifyDto } from "./dto/otp-verify.dto";


@ApiTags("Auth")
@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("login")
    @ApiOperation({ summary: "Login" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 406, description: "Not Acceptable error" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 401, description: "Invalid Login credentials." })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    signIn(
        @Res({ passthrough: true }) res: Response,
        @Body(ValidationPipe) authCredentialDto: LoginDto
    ): Promise<AppResponse> {
        return this.authService.loginUser(authCredentialDto, res);
    }

    @Get("get-otp-left-time")
    @ApiOperation({ summary: "Get otp left time" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 406, description: "Not Acceptable error" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 401, description: "Invalid Login credentials." })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getOtpLeftTime(@Query("email") email: string, @Query("otpType") otpType: string): Promise<AppResponse> {
        const data: OtpLeftTime = {
            email: email,
            otpType: otpType
        };
        return this.authService.getOtpLeftTime(data);
    }

    @Post("resend-otp")
    @ApiOperation({ summary: "Resend otp if any issue/expire otp" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 406, description: "Not Acceptable error" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 401, description: "Invalid Login credentials." })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    resendOtp(@Body(ValidationPipe) resendOtpDto: ResendOtpDto): Promise<AppResponse> {
        return this.authService.resendOtp(resendOtpDto);
    }

    @Post("otp-verify")
    @ApiOperation({ summary: "Register,Login otp verify" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 406, description: "Not Acceptable error" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 401, description: "Invalid Login credentials." })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    otpVerify(
        @Res({ passthrough: true }) res: Response,
        @Body(ValidationPipe) otpVerifyDto: OtpVerifyDto
    ): Promise<AppResponse> {
        return this.authService.otpVerify(otpVerifyDto, res);
    }

    @Post("change-password")
    @ApiOperation({ summary: "Change password if user is login" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 406, description: "Not Acceptable error" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 401, description: "Invalid Login credentials." })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    @ApiBearerAuth()
    @ApiCookieAuth()
    @UseGuards(AuthGuard("jwt"))
    changePassword(
        @Body(ValidationPipe) changePasswordData: ChangePasswordDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.authService.changePassword(changePasswordData, user);
    }

    @Post("forgot-password")
    @ApiOperation({ summary: "Change forgot password" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 406, description: "Not Acceptable error" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 401, description: "Invalid Login credentials." })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    forgotPassword(@Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto): Promise<AppResponse> {
        return this.authService.forgotPassword(forgotPasswordDto);
    }

    @Put("reset-password")
    @ApiOperation({ summary: "Reset password" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 406, description: "Not Acceptable error" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 401, description: "Invalid Login credentials." })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    resetPassword(@Body(ValidationPipe) resetPasswordDto: ResetPasswordDto): Promise<AppResponse> {
        return this.authService.resetPassword(resetPasswordDto);
    }

}
