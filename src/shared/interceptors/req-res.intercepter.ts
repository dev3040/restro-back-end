import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Translation } from "../../i18n/translation.utility";
@Injectable()
export class ReqResInterceptor implements NestInterceptor {
    public intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((res) => {
                const request = _context.switchToHttp().getRequest();
                const lang =
                    request?.body?.language_code ||
                    request?.query?.language_code ||
                    request?.params?.language_code ||
                    request?.user?.language_code ||
                    request?.headers?.language_code;

                if (res?.message) {
                    res.message = Translation.Translator(lang || "en", "success", res.message);
                }
                return res;
            })
        );
    }
}
