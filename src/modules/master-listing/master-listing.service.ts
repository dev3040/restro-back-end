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
import { SubItems } from "src/shared/entity/sub-items.entity";
import { SubItemBranchMapping } from "src/shared/entity/sub-item-branch-mapping.entity";
import { Branches } from "src/shared/entity/branches.entity";
import { DataSource } from "typeorm";

@Injectable()
export class ListingService {
    constructor(private readonly dataSource: DataSource) {}

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

    async resetMenu(user: any): Promise<AppResponse> {
        try {
            // Get all active sub-items
            const subItems = await SubItems.find({
                where: { 
                    isDeleted: false, 
                    isActive: true 
                },
                select: ['id', 'name', 'price', 'offer']
            });

            if (!subItems || subItems.length === 0) {
                throw new NotFoundException('ERR_NO_ACTIVE_SUB_ITEMS_FOUND');
            }

            // Get all active branches
            const branches = await Branches.find({
                where: { 
                    isDeleted: false, 
                    isActive: true 
                },
                select: ['id', 'name']
            });

            if (!branches || branches.length === 0) {
                throw new NotFoundException('ERR_NO_ACTIVE_BRANCHES_FOUND');
            }

            // Start transaction
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                // Truncate existing sub-item-branch mappings
                await queryRunner.manager.query('TRUNCATE TABLE master.sub_item_branch_mapping RESTART IDENTITY CASCADE');

                // Create new mappings for each sub-item with each branch
                const newMappings: SubItemBranchMapping[] = [];

                for (const subItem of subItems) {
                    for (const branch of branches) {
                        const mapping = new SubItemBranchMapping();
                        mapping.subItemId = subItem.id;
                        mapping.branchId = branch.id;
                        mapping.branchPrice = subItem.price || null;
                        mapping.branchOffer = subItem.offer || null;
                        newMappings.push(mapping);
                    }
                }

                // Save all new mappings
                await queryRunner.manager.save(SubItemBranchMapping, newMappings);

                // Commit transaction
                await queryRunner.commitTransaction();

                return {
                    message: "SUC_MENU_RESET_SUCCESSFUL",
                    data: {
                        subItemsCount: subItems.length,
                        branchesCount: branches.length,
                        mappingsCreated: newMappings.length
                    }
                };

            } catch (error) {
                // Rollback transaction on error
                await queryRunner.rollbackTransaction();
                throw error;
            } finally {
                // Release query runner
                await queryRunner.release();
            }

        } catch (error) {
            throwException(error);
        }
    }
}
