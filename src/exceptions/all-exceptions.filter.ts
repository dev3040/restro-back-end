import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from "@nestjs/common";
import { Response } from "express";
import { Translation } from "../i18n/translation.utility";

@Catch(HttpException)
export class AllHttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const getResponse = exception.getResponse();

        const lang =
            request?.body?.language_code ||
            request?.query?.language_code ||
            request?.params?.language_code ||
            request?.user?.language_code ||
            request?.headers?.language_code;
        const errors = this.filterResponse(getResponse["message"], lang);
        response
            .status(status)
            // you can manipulate the response here
            .json({
                message: errors[0]?.display_error,
                developer_errors: errors
            });
    }

    filterResponse(message: string | Array<string>, lang = "en") {
        if (!Array.isArray(message)) {
            message = [message];
        }
        const result = [];
        const mesgLength = message?.length;
        if (mesgLength) {
            for (let i = 0; i < mesgLength; i++) {
                const errors = message[i]?.split("&&&");
                if (errors?.length > 2) {
                    result.push({
                        key: errors[1],
                        error_type: "system",
                        actual_error: Translation.Translator("en", "error", errors[0]),
                        display_error: Translation.Translator(lang || "en", "error", errors[2])
                    });
                } else if (errors?.length > 0) {
                    result.push({
                        key: errors[1] || "",
                        error_type: "ui",
                        actual_error: Translation.Translator("en", "error", errors[0]),
                        display_error: Translation.Translator(lang || "en", "error", errors[0])
                    });
                } else {
                    result.push({
                        key: "",
                        error_type: "ui",
                        actual_error: errors,
                        display_error: "Something went wrong."
                    })
                }
            }
        }
        return result;
    }
}
