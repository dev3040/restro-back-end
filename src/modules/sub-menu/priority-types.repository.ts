import { SubItems } from '../../shared/entity/sub-items.entity';
import { DataSource, Repository } from 'typeorm';
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


@Injectable()
export class PriorityTypesRepository extends Repository<SubItems> {
    constructor(readonly dataSource: DataSource) {
        super(SubItems, dataSource.createEntityManager());
    }

    async addPriorityTypes(addPriorityTypes: AddPriorityTypesDto, user: User): Promise<SubItems> {
        try {
            const subItems = await this.manager.createQueryBuilder(SubItems, "subItems")
                .leftJoinAndSelect("subItems.outletMenu", "outletMenu")
                .select(["subItems.id", "subItems.name", "subItems.price", "outletMenu"])
                .where(`(subItems.isDeleted = false)`)
                .andWhere(`(LOWER(subItems.name) = :name)`, {
                    name: `${addPriorityTypes.name.toLowerCase()}`
                })
                .getOne();
            if (subItems) {
                throw new ConflictException("ERR_PRIORITY_EXIST&&&name");
            }

            const subItems_ = new SubItems();
            subItems_.name = addPriorityTypes.name;
            subItems_.price = addPriorityTypes.price;
            subItems_.offer = addPriorityTypes.offer;
            subItems_.categoryId = addPriorityTypes.categoryId;
            subItems_.isActive = addPriorityTypes.isActive;
            subItems_.createdBy = user.id;
            const res = await subItems_.save();
            return res;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllPriorityTypes(filterDto?: any): Promise<{ sub_items: SubItems[]; page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(SubItems, "priority")
                .leftJoinAndSelect("priority.outletMenu", "outletMenu")
                .select(["priority.id", "priority.name", "priority.isActive", "priority.isActive", "priority.createdAt", "priority.order", "outletMenu"])
                .where(`(priority.isDeleted = false)`)

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
            priorityTypesExist.price = updatePriorityTypes.price;
            priorityTypesExist.offer = updatePriorityTypes.offer;
            priorityTypesExist.categoryId = updatePriorityTypes.categoryId;
            priorityTypesExist.isActive = updatePriorityTypes.isActive;
            await priorityTypesExist.save();
            return priorityTypesExist;
        } catch (error) {
            throwException(error);
        }
    }
    async deletePriorityTypes(deletePriority, userId) {
        try {
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
