import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtPayload } from "../interface/jwt-payload.interface";
import { User } from "src/shared/entity/user.entity";
import { UserRepository } from "../../user/user.repository";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { Token } from "../../../shared/entity/token.entity";
import { Request } from "express";
import { throwException } from "src/shared/utility/throw-exception";

export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(UserRepository)
        private readonly userRepository: UserRepository,
        configService: ConfigService,
        private readonly dataSource: DataSource
    ) {
        super({
            passReqToCallback: true,
            ignoreExpiration: true,
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    const auth = request?.headers?.authorization?.slice(7);
                    if (!auth) {
                        return null;
                    }
                    return auth;
                }
            ]),
            secretOrKey: configService.get("jwt.secret")
        });
    }

    async validate(req: Request, payload: JwtPayload): Promise<User> {
        try {
            if (!payload) {
                throw new UnauthorizedException("ERR_PLEASE_LOGIN");
            } else if (payload.exp < Date.now() / 1000) {
                throw new UnauthorizedException("ERR_JWT_EXPIRED");
            }

            const { id } = payload;
            const user = await this.userRepository.findOne({ where: { id: id, isDeleted: false } });
            if (!user) {
                throw new UnauthorizedException("ERR_PLEASE_LOGIN");
            } else if (!user.isActive)
                throw new UnauthorizedException("ERR_INACTIVE_ACC");

            const auth = req?.headers?.authorization.slice(7);
            if (!auth) throw new UnauthorizedException();

            const findToken = await this.dataSource.manager.findOne(Token, { where: { accessToken: auth } });
            if (!findToken) throw new UnauthorizedException("ERR_PLEASE_LOGIN");

            return user;
        } catch (error) {
            throwException(error);
        }
    }
}
