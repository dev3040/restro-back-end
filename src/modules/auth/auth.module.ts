import { JwtModule } from "@nestjs/jwt";
import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserRepository } from "../user/user.repository";
import { JwtStrategy } from "./strategy/jwt.strategy";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ResetTokenRepository } from "./reset-token.repository";
import { SendMailerUtility } from "src/shared/utility/send-mailer.utility";
import { User } from "src/shared/entity/user.entity";
import { Otp } from "src/shared/entity/otp.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Otp]),
        PassportModule.register({
            defaultStrategy: "jwt"
        }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (config: ConfigService) => {
                return {
                    secret: config.get<string>("jwt.secret"),
                    signOptions: {
                        expiresIn: config.get<number>("jwt.expire_in")
                    }
                };
            },
            inject: [ConfigService]
        })
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, SendMailerUtility, UserRepository, ResetTokenRepository],
    exports: [JwtStrategy, PassportModule]
})
export class AuthModule { }
