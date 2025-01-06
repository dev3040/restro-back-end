import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import jwt_decode from "jwt-decode";

export const LogInUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    let authorization = request.headers.authorization || "";
    if (authorization) {
        authorization = jwt_decode(authorization);
    }
    return authorization;
});
