import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { UserRepository } from "./user.repository";
import { SendMailerUtility } from "src/shared/utility/send-mailer.utility";

@Module({
    controllers: [UserController],
    providers: [UserService, UserRepository, SendMailerUtility]
})
export class UserModule { }
