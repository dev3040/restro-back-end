import {
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { TitleStates } from "src/shared/entity/title-states.entity";
import { TitleCounties } from "src/shared/entity/title-counties.entity";
import { AvatarColors } from "src/shared/entity/avatar-colors.entity";
import { ConfigMaster } from "src/shared/entity/config-master.entity";
import { In, Not } from "typeorm";

@Injectable()
export class ListingService {

    async getTitleStateList(query): Promise<AppResponse> {
        try {
            const where: any = {};
            if (query.isMaster) {
                where.code = Not(In(["GA", "GOV", "MSO", "OT"]))
            }
            const titleStates = await TitleStates.find({
                where,
                order: { order: 'ASC' },
            });
            return {
                message: "SUC_TITLE_STATES_FETCHED",
                data: titleStates
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getCounties(stateId, stateCode): Promise<AppResponse> {
        try {
            const stateExist = await TitleStates.findOne({ where: { id: stateId } });
            if (!stateExist) {
                throw new NotFoundException("ERR_STATE_NOT_FOUND&&&stateId");
            }

            const queryBuilder = TitleCounties.createQueryBuilder('county')
                .leftJoinAndSelect('county.state', 'state') // Adjust 'state' if your relation name is different
                .select(['county', 'state.code']) // Selecting county fields and state code
                .where('county.isDeleted = false')
                .andWhere('county.isActive = true');

            if (stateId) {
                queryBuilder.andWhere('county.stateId = :stateId', { stateId });
            }

            if (stateCode) {
                queryBuilder.andWhere('state.code = :stateCode', { stateCode });
            }

            const counties = await queryBuilder.getMany();

            return {
                message: "SUC_COUNTIES_FETCHED",
                data: counties
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getAvatarColors(): Promise<AppResponse> {
        try {
            const colors = await AvatarColors.find({
                order: { id: 'ASC' },
            });
            return {
                message: "SUC_AVATAR_COLORS_FETCHED",
                data: colors
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getVariableList(variableName?: string): Promise<AppResponse> {
        try {
            const configs = await ConfigMaster.find({
                where: { isDeleted: false },
                order: { id: 'ASC' },
            });
            return {
                message: "SUC_CONFIG_LIST_FETCHED",
                data: configs
            };
        } catch (error) {
            throwException(error);
        }
    }

    async saveConfigDetails(payload, user): Promise<AppResponse> {
        try {
            let config
            if (payload.id) {
                config = await ConfigMaster.findOne({ where: { id: payload.id, isDeleted: false } });
                if (!config) throw new NotFoundException(`ERR_CONFIG_NOT_FOUND&&&id`);
            }


            if (config) {
                Object.assign(config, payload);
                config.updatedBy = user.id;
                config.updatedAt = new Date();
            } else {
                config = ConfigMaster.create({
                    ...payload,
                    createdBy: user.id,
                    createdAt: new Date(),
                });
            }

            return {
                message: "SUC_COUNTY_PROCESSING_SAVED",
                data: await ConfigMaster.save(config)
            };
        } catch (error) {
            throwException(error);
        }
    }
}
