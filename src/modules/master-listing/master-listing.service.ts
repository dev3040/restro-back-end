import {
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { AvatarColors } from "src/shared/entity/avatar-colors.entity";
import { ConfigMaster } from "src/shared/entity/config-master.entity";
import { Designation } from "src/shared/entity/designation.entity";
import { DeliveryBoy } from "../../shared/entity/delivery-boy.entity";

@Injectable()
export class ListingService {

    async getTitleStateList(): Promise<AppResponse> {
        try {
            const where: any = {};
            const designation = await Designation.find({
                where,
                order: { order: 'ASC' },
            });
            return {
                message: "SUC_TITLE_STATES_FETCHED",
                data: designation
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

    async getDeliveryBoys(): Promise<AppResponse> {
        try {
            const deliveryBoys = await DeliveryBoy.find({
                where: { isDeleted: false },
                order: { createdAt: 'DESC' }
            });

            const response = deliveryBoys.map(boy => ({
                id: boy.id,
                empId: boy.empId,
                name: boy.name,
                phone: boy.phone,
                isActive: boy.isActive,
                createdAt: boy.createdAt,
                updatedAt: boy.updatedAt
            }));

            return {
                message: "Delivery boys fetched successfully",
                data: response
            };
        } catch (error) {
            throwException(error);
        }
    }
}
