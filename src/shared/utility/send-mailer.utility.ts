import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";

@Injectable()
export class SendMailerUtility {
    constructor(private readonly mailerService: MailerService) { }

    // Send login otp to user email address
    async LoginOtpSend(user, otp) {
        await this.mailerService.sendMail({
            template: "./login-otp",
            context: {
                otp: otp
            },
            subject: `OTP - Login verification`,
            to: user.email
        });
    }

    // Send reset password email to user
    async ResetPasswordOtp(user, otp) {
        const currentYear = new Date().getFullYear();
        await this.mailerService.sendMail({
            template: "./reset-pswd.html",
            context: {
                otp: otp,
                user: `${user.firstName} ${user.lastName}`,
                year: currentYear
            },
            subject: `Forgot Password`,
            to: user.email
        });
    }
}
