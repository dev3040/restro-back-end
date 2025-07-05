import { SubItems } from '../../shared/entity/sub-items.entity';
import { DataSource, In, Repository } from 'typeorm';
import {
    ConflictException,
    Injectable, NotFoundException,
} from '@nestjs/common';
import { AddPriorityTypesDto, UpdatePriorityTypesDto } from './dto/add-priority-types.dto';
import { throwException } from "../../shared/utility/throw-exception";
import { User } from 'src/shared/entity/user.entity';
import { IsActive } from 'src/shared/enums/is-active.enum';
import { commonDeleteHandler } from 'src/shared/utility/common-function.methods';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';
import { SubItemBranchMapping } from 'src/shared/entity/sub-item-branch-mapping.entity';
import { Branches } from 'src/shared/entity/branches.entity';


@Injectable()
export class PriorityTypesRepository extends Repository<SubItems> {
    constructor(readonly dataSource: DataSource) {
        super(SubItems, dataSource.createEntityManager());
    }

    async addPriorityTypes(addPriorityTypes: AddPriorityTypesDto, user: User): Promise<SubItems> {
        try {
            // Check for duplicate name
            const existingItem = await this.manager.createQueryBuilder(SubItems, "subItems")
                .select(["subItems.id", "subItems.name"])
                .where(`(subItems.isDeleted = false)`)
                .andWhere(`(LOWER(subItems.name) = :name)`, {
                    name: `${addPriorityTypes.name.toLowerCase()}`
                })
                .getOne();

            if (existingItem) {
                throw new ConflictException("ERR_PRIORITY_EXIST&&&name");
            }

            // Create new priority type
            const subItems_ = new SubItems();
            subItems_.name = addPriorityTypes.name;
            subItems_.printer = addPriorityTypes.printer;
            subItems_.price = addPriorityTypes.price;
            subItems_.offer = addPriorityTypes.offer;
            subItems_.categoryId = addPriorityTypes.categoryId;
            subItems_.isActive = addPriorityTypes.isActive;
            subItems_.createdBy = user.id;

            // Save the sub item first to get the ID
            const savedSubItem = await subItems_.save();

            if (!addPriorityTypes.branchId) {
                // If no specific branch ID, assign to all active branches
                const allBranches = await this.manager.createQueryBuilder(Branches, "branches")
                    .select(["branches.id"])
                    .where("branches.isActive = true")
                    .andWhere("branches.isDeleted = false")
                    .getMany();

                // Create sub-item-branch mappings for all branches
                const branchMappings = allBranches.map(branch => {
                    const subItemBranchMapping = new SubItemBranchMapping();
                    subItemBranchMapping.branchId = branch.id;
                    subItemBranchMapping.subItemId = savedSubItem.id;
                    subItemBranchMapping.branchPrice = addPriorityTypes.price;
                    subItemBranchMapping.branchOffer = addPriorityTypes.offer;
                    return subItemBranchMapping;
                });

                // Save all branch mappings
                await this.manager.save(SubItemBranchMapping, branchMappings);
            } else {
                // If specific branch ID is provided, create mapping for that branch only
                const subItemBranchMapping = new SubItemBranchMapping();
                subItemBranchMapping.branchId = addPriorityTypes.branchId;
                subItemBranchMapping.subItemId = savedSubItem.id;
                subItemBranchMapping.branchPrice = addPriorityTypes.price;
                subItemBranchMapping.branchOffer = addPriorityTypes.offer;
                await subItemBranchMapping.save();
            }

            return savedSubItem;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllPriorityTypes(filterDto?: any): Promise<{ sub_items: SubItems[]; page: object }> {
        try {
            let listQuery
            if (filterDto?.branchId) {
                listQuery = this.manager.createQueryBuilder(SubItems, "priority")
                    .leftJoinAndSelect("priority.outletMenu", "outletMenu")
                    .innerJoinAndSelect("priority.subItemBranchMapping", "subItemBranchMapping", "subItemBranchMapping.branchId = :branchId", { branchId: filterDto.branchId })
                    .select(["priority.id", "priority.name", "priority.offer", "priority.price", "priority.isActive",
                        "priority.isActive", "priority.createdAt", "priority.order", "priority.printer", "outletMenu", "subItemBranchMapping"])
                    .where(`(priority.isDeleted = false)`)
            } else {
                listQuery = this.manager.createQueryBuilder(SubItems, "priority")
                    .leftJoinAndSelect("priority.outletMenu", "outletMenu")
                    .select(["priority.id", "priority.name", "priority.offer", "priority.price", "priority.isActive",
                        "priority.isActive", "priority.createdAt", "priority.order", "priority.printer", "outletMenu"])
                    .where(`(priority.isDeleted = false)`)
            }

            if (filterDto?.search) {
                listQuery.andWhere("(priority.name ilike :search)", { search: `%${filterDto.search}%` });
            }

            if (filterDto?.activeStatus == IsActive.ACTIVE) {
                listQuery.andWhere("(priority.isActive = true)")
            }
            if (filterDto?.activeStatus == IsActive.INACTIVE) {
                listQuery.andWhere("(priority.isActive = false)")
            }

            if (filterDto) {
                listQuery.skip(filterDto.offset * filterDto.limit);
                listQuery.take(filterDto.limit);
                listQuery.orderBy(`priority.${filterDto.orderBy}`, filterDto.orderDir);
            }
            const priorityTypesWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = priorityTypesWithCount[1];
            }

            return { sub_items: priorityTypesWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async editPriorityTypes(updatePriorityTypes: UpdatePriorityTypesDto, id): Promise<SubItems> {
        try {
            // Check user exists with given ID
            const priorityTypesExist = await this.findOne({ where: { id: id, isDeleted: false } });
            if (!priorityTypesExist) throw new NotFoundException(`ERR_PRIORITY_NOT_FOUND`);

            if (updatePriorityTypes?.name) {
                const subItems = await this.manager.createQueryBuilder(SubItems, "subItems")
                    .select(["subItems.id", "subItems.name"])
                    .where(`(LOWER(subItems.name) = :name)`, {
                        name: `${updatePriorityTypes.name.toLowerCase()}`
                    })
                    .andWhere(`(subItems.isDeleted = false)`)
                    .andWhere(`(subItems.id != :id)`, { id })
                    .getOne();
                if (subItems) {
                    throw new ConflictException("ERR_PRIORITY_EXIST&&&name");
                }

                priorityTypesExist.name = updatePriorityTypes.name;

            }
            priorityTypesExist.printer = updatePriorityTypes.printer;
            priorityTypesExist.categoryId = updatePriorityTypes.categoryId;
            priorityTypesExist.isActive = updatePriorityTypes.isActive;
            if (updatePriorityTypes.branchId) {
                const subItemBranchMapping = await this.manager.createQueryBuilder(SubItemBranchMapping, "subItemBranchMapping")
                    .where(`(subItemBranchMapping.subItemId = :subItemId)`, { subItemId: id })
                    .getOne();
                if (subItemBranchMapping) {
                    subItemBranchMapping.branchId = updatePriorityTypes.branchId;
                    subItemBranchMapping.branchPrice = updatePriorityTypes.price;
                    subItemBranchMapping.branchOffer = updatePriorityTypes.offer;
                    await subItemBranchMapping.save();
                }
            } else {
                priorityTypesExist.price = updatePriorityTypes.price;
                priorityTypesExist.offer = updatePriorityTypes.offer;
            }
            await priorityTypesExist.save();
            return priorityTypesExist;
        } catch (error) {
            throwException(error);
        }
    }
    async deletePriorityTypes(deletePriority, userId) {
        try {
            if (deletePriority.branchId) {
                const priorityTypesExist = await this.findOne({ where: { id: In(deletePriority.ids), isDeleted: false } });
                if (!priorityTypesExist) throw new NotFoundException(`ERR_PRIORITY_NOT_FOUND`);
                const subItemBranchMapping = await this.manager.createQueryBuilder(SubItemBranchMapping, "subItemBranchMapping")
                    .where(`(subItemBranchMapping.subItemId = :subItemId)`, { subItemId: deletePriority.ids })
                    .getOne();
                if (subItemBranchMapping) {
                    await subItemBranchMapping.remove();
                }
                return {
                    message: success.SUC_PRIORITY_DELETED,
                    data: {}
                };
            }
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                SubItems,
                deletePriority,
                userId,
                success.SUC_PRIORITY_DELETED,
                error.ERR_PRIORITY_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}
