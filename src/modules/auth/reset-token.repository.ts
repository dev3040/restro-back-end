import { Injectable } from "@nestjs/common";
import { ResetPasswordToken } from "src/shared/entity/reset-password-token.entity";
import { DataSource, Repository } from "typeorm";
import { ResetToken } from "./interface/common.interface";

@Injectable()
export class ResetTokenRepository extends Repository<ResetPasswordToken> {
    constructor(readonly dataSource: DataSource) {
        super(ResetPasswordToken, dataSource.createEntityManager());
    }

    async findToken(resetTokenObj: ResetToken) {
        try {
            const { resetToken, userId } = resetTokenObj;
            const result = await this.manager
                .createQueryBuilder(ResetPasswordToken, "resetToken")
                .leftJoinAndSelect("resetToken.user", "user")
                .select(["resetToken", "user"])
                .where("resetToken.token =:token", { token: resetToken })
                .andWhere("resetToken.user_id =:userId", { userId })
                .getOne();

            return result;
        } catch (e) {
            console.log("error", e);
        }
    }
}
