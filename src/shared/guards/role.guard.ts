import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get<number[]>("roles", context.getHandler());
        if (!roles?.length) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (roles.includes(user.roleId)) return true;
        else {
            throw new ForbiddenException(`NOT_ALLOWED_TO_ACCESS`);
        }
    }
}
