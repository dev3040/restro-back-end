import {
    Injectable,
    NotAcceptableException,
    NotFoundException,
    UnauthorizedException,
    BadRequestException,
    ConflictException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UserRepository } from "src/modules//user/user.repository";
import { LoginDto } from "./dto/login.dto";
import { JwtPayload, RefreshTokenPayload } from "./interface/jwt-payload.interface";
import { Otp } from "src/shared/entity/otp.entity";
import { OtpType } from "src/shared/enums/otp-type.enum";
import { SendMailerUtility } from "src/shared/utility/send-mailer.utility";
import { GenerateOtpNumber } from "src/shared/utility/generate-otp.utility";
import { ResendOtpDto } from "./dto/resend-otp.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Token } from "src/shared/entity/token.entity";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { Response } from "express";
import { OtpLeftTime } from "./interface/common.interface";
import { OtpVerifyDto } from "./dto/otp-verify.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";


@Injectable()
export class AuthService {
    private readonly otpExpireTime: number;

    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
        private readonly mailerService: SendMailerUtility,
        private readonly configService: ConfigService,
        @InjectRepository(Otp)
        private readonly otpRepository: Repository<Otp>,
    ) {
        this.otpExpireTime = this.configService.get<number>("app.otp.expire_time");
    }


    async loginUser(loginUser: LoginDto, res): Promise<AppResponse> {
        try {
            const { username, password } = loginUser;

            const user = await this.userRepository
                .createQueryBuilder('user')
                .select([
                    'user.id',
                    'user.isActive',
                    'user.salt',
                    'user.password',
                    'user.isDeleted',
                    'user.firstName',
                    'user.username',
                    'user.lastName',
                    'designation.id',
                    'designation.name',
                    'branch.name',
                    'branch.id'

                ])
                .leftJoinAndSelect('user.designation', 'designation')
                .leftJoinAndSelect("user.branch", "branch")
                .where('LOWER(user.username) = :username', { username: username.toLowerCase() })
                .orderBy('user.id', 'DESC')
                .getOne();

                console.log('user: ', user);
            if (!user) {
                throw new UnauthorizedException(`ERR_INVALID_PASSWORD&&&username`);
            } else if (user.isDeleted) {
                throw new UnauthorizedException(`ERR_DELETED_ACC`);
            } else if (!user.isActive) {
                throw new UnauthorizedException(`ERR_INACTIVE_ACC`);
            }
            if (await user.validatePassword(password)) {
                const { accessToken, refreshToken } = this.generateJWTToken(user, res);

                await this.storeLoginToken(accessToken, refreshToken, user.id);
                delete user.password
                delete user.salt
                delete user.isDeleted
                delete user.isActive

                return {
                    data: {
                        user_id: user,
                        access_token: accessToken,
                        refresh_token: refreshToken
                    },
                    message: "SUC_LOGIN"
                };

            } else {
                throw new UnauthorizedException(`ERR_INVALID_PASSWORD`)
            }
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Get Otp left time
     */
    async getOtpLeftTime(data: OtpLeftTime): Promise<AppResponse> {
        try {
            const { username, otpType } = data;
            const getUser = await this.userRepository.findOne({ where: { username: username.toLocaleLowerCase() } });
            if (!getUser) {
                throw new NotFoundException(`ERR_USER_NOT_FOUND&&&username`);
            }
            const otpObj: OtpLeftTime = {
                username: username,
                otpType: otpType
            };
            const getOtpDetails = await this.userRepository.getOtpLeftTime(otpObj);
            const currentTime = new Date().getTime();

            if (currentTime > getOtpDetails.expireTime) {
                throw new NotAcceptableException("EXPIRE_LINK");
            }
            const leftTime = Math.trunc((getOtpDetails.expireTime - currentTime) * 0.001);
            return {
                message: "Otp left time",
                data: { leftTime }
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Resend OTP generate
     */
    async resendOtp(resendOtp: ResendOtpDto): Promise<AppResponse> {
        try {
            const { username, otpType } = resendOtp;
            const user = await this.userRepository.findOne({ where: { username: username.toLocaleLowerCase() } }); // user by username

            if (!user) {
                throw new NotFoundException("ERR_USER_NOT_FOUND&&&username");
            }

            // Delete all existing OTPs for this user and type
            await this.otpRepository.delete({ userId: user.id, type: +OtpType[otpType] });
            // Generate new OTP
            const generateOtp = GenerateOtpNumber.generateOtp();
            const expireTime = new Date().getTime() + this.otpExpireTime * 60000;

            // Create new OTP instance
            const otp = new Otp();
            otp.userId = user.id;
            otp.otp = generateOtp;
            otp.expireTime = expireTime;
            otp.type = +OtpType[otpType];

            // Save the new OTP to the database
            await this.otpRepository.save(otp);

            // Send the new OTP via username
            await this.mailerService.ResetPasswordOtp(user, generateOtp);

            return {
                message: "SUC_RESET_PASS_OTP",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Change password if user is login
     */
    async changePassword(changePasswordDto: ChangePasswordDto, user): Promise<AppResponse> {
        try {
            const { oldPassword, newPassword } = changePasswordDto;

            const userId = user.id;
            const findUser = await this.userRepository.findOne({
                select: ['id', 'password', 'salt'],
                where: { id: userId }
            });

            const hashPassword = await bcrypt.hash(oldPassword, findUser.salt);

            if (hashPassword == findUser.password) {
                const salt = await bcrypt.genSalt();
                findUser.password = await bcrypt.hash(newPassword, salt);
                findUser.salt = salt;

                await findUser.save();
            } else {
                throw new NotAcceptableException("NOT_MATCH_PASSWORD");
            }

            return {
                message: "SUC_CHANGE_PASS",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<AppResponse> {
        try {
            const { username } = forgotPasswordDto;

            const user = await this.userRepository.findOne({
                select: ['id', 'username', 'isActive', 'isDeleted', "firstName", "lastName"],
                where: {
                    username: username.toLocaleLowerCase(),
                    isDeleted: false
                }
            });
            if (!user) {
                throw new NotFoundException("ERR_USER_NOT_FOUND&&&username");
            } else if (!user.isActive) {
                throw new NotAcceptableException("ERR_INACTIVE_ACC");
            }

            const generateOtp = GenerateOtpNumber.generateOtp();
            const expireTime = new Date().getTime() + this.otpExpireTime * 60000;

            const otp = new Otp();
            otp.user = user;
            otp.otp = generateOtp;
            otp.expireTime = expireTime;
            otp.type = +OtpType["FORGOTPASSWORD"];
            await otp.save();

            await this.mailerService.ResetPasswordOtp(user, generateOtp);

            return {
                message: "SUC_RESET_PASS_OTP",
                data: {}
            };

        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Reset password
     */
    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<AppResponse> {
        try {
            const { username, newPassword } = resetPasswordDto;
            let user = await this.userRepository.findOne({
                select: ['id', 'isActive', 'password', 'salt', 'password'],
                where: { username: username.toLocaleLowerCase() }
            });
            if (!user) {
                throw new NotFoundException(`NOT_FOUND`);
            } else if (!user.isActive) {
                throw new NotAcceptableException(`NOT_ACTIVE`);
            } else if (await user.validatePassword(resetPasswordDto.newPassword)) {
                throw new ConflictException(`ERR_RESET_OLD_PASSWORD&&&newPassword`)
            }

            const salt = await bcrypt.genSalt();
            user.password = await bcrypt.hash(newPassword, salt);
            user.salt = salt;
            await user.save();
            return {
                message: "SUC_RESET_PASS",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async otpVerify(otpVerifyDto: OtpVerifyDto, res): Promise<AppResponse> {
        try {
            const { username, otp } = otpVerifyDto;
            const user = await this.userRepository.findOne({
                select: ['id', 'username'],
                where: { username: username.toLocaleLowerCase(), isDeleted: false }
            });
            if (!user) {
                throw new NotFoundException(`ERR_USER_NOT_FOUND&&&username`);
            }

            const currentTime = new Date().getTime();
            const findOtp = await this.userRepository.getOtpData({
                userId: user.id,
                otp: otp,
                otpType: OtpType.FORGOTPASSWORD
            });
            if (!findOtp) {
                throw new NotFoundException(`WRONG_OTP`);
            } else if (currentTime > findOtp.expireTime) {
                throw new NotFoundException(`EXPIRE_OTP`);
            }

            return {
                message: "SUC_OTP_VERIFICATION",
                data: {
                    user: { username: user.username }
                }
            };
        } catch (error) {
            throwException(error);
        }
    }

    generateJWTToken(user, res: Response): { accessToken: string; refreshToken: string } {
        const payload: JwtPayload = {
            id: user.id,
            username: user.username,
            userFullName: user.firstName + " " + user.lastName,
            firstName: user.firstName,
            date: Date.now().toString(),
            lastName: user.lastName,
            isActive: user.isActive
        };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get("jwt.secret"),
            expiresIn: this.configService.get("jwt.expire_in")
        });

        const refreshTokenConfig = this.configService.get("refresh_token");
        const refreshPayload: RefreshTokenPayload = {
            id: user.id,
            username: user.username,
            date: Date.now().toString(),
            userFullName: user.firstName + " " + user.lastName
        };

        const refreshToken = this.jwtService.sign(
            { refreshPayload },
            { secret: refreshTokenConfig.secret, expiresIn: refreshTokenConfig.expire_in }
        );
        const auth = {
            accessToken,
            refreshToken
        };
        // Set cookies for both tokens
        res.cookie("auth", auth, {
            signed: true,
            httpOnly: true,
            maxAge: this.configService.get("refresh_token.expire_in"),
            secure: this.configService.get("server.env") === "production" ? true : false // !disable if testing on postman
        });

        return { accessToken, refreshToken };
    }

    generateRefreshToken(user) {
        const refreshTokenConfig = this.configService.get("refresh_token");
        const payload: RefreshTokenPayload = {
            id: user.id,
            username: user.username,
            userFullName: user.firstName + " " + user.lastName,
            date: Date.now().toString()
        };

        const refreshToken = this.jwtService.sign(
            { payload },
            { secret: refreshTokenConfig.secret, expiresIn: refreshTokenConfig.expire_in }
        );

        const token = refreshToken;
        return token;
    }

    async storeLoginToken(accessToken, refreshToken, userId): Promise<void> {
        try {
            const token = new Token();

            token.accessToken = accessToken;
            token.refreshToken = refreshToken;
            token.userId = userId;

            await token.save();
        } catch (error) {
            throwException(error);
        }
    }

    async storeRefreshToken(refreshToken, userId) {
        const user = await this.userRepository.findOne({
            where: {
                id: userId
            }
        });
        try {
            await user.save();
        } catch (e) {
            throw new BadRequestException(e);
        }
    }
}
