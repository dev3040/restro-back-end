import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { ConfigModule, ConfigService } from "@nestjs/config";

export const mailConfig = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
        transport: {
            host: configService.get("email.host"),
            port: configService.get("email.port"),
            ignoreTLS: true,
            secure: configService.get("email.secure"),
            auth: {
                user: configService.get("email.user"),
                pass: configService.get("email.pass")
            }
        },
        preview: configService.get("server.env") == "development",
        defaults: {
            from: `"Tags & Titles" <${configService.get("email.user")}>`
        },
        template: {
            dir: "src/shared/email_templates",
            adapter: new HandlebarsAdapter(),
            options: {
                strict: true
            }
        }
    })
};
