import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { User } from "../entity/user.entity";

// to get logged in user details from token
export const GetUser = createParamDecorator((data: any, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
