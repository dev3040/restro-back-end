import { MailerService } from "@nestjs-modules/mailer";

export class SendEmailUtility {
    constructor(private readonly mailerService: MailerService) {}

    async LoginOtpSend() {
        await this.mailerService.sendMail({
            template: "./sample",
            context: {
                otp: "otp"
            },
            subject: `Sample Email`,
            to: "rajesh@itoneclick.com"
        });
    }
}
