import { PriorityTypes } from '../../shared/entity/priority-types.entity';
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
export class PriorityTypesRepository extends Repository<PriorityTypes> {
    constructor(readonly dataSource: DataSource) {
        super(PriorityTypes, dataSource.createEntityManager());
    }

    async addPriorityTypes(addPriorityTypes: AddPriorityTypesDto, user: User): Promise<PriorityTypes> {
        try {
            const priorityType = await this.manager.createQueryBuilder(PriorityTypes, "priorityType")
                .select(["priorityType.id", "priorityType.name"])
                .where(`(priorityType.isDeleted = false)`)
                .andWhere(`(LOWER(priorityType.name) = :name)`, {
                    name: `${addPriorityTypes.name.toLowerCase()}`
                })
                .getOne();
            if (priorityType) {
                throw new ConflictException("ERR_PRIORITY_EXIST&&&name");
            }

            const priorityTypes = new PriorityTypes();
            priorityTypes.name = addPriorityTypes.name;
            priorityTypes.isActive = addPriorityTypes.isActive;
            priorityTypes.colorCode = addPriorityTypes.colorCode;
            priorityTypes.createdBy = user.id;
            const res = await priorityTypes.save();
            return res;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllPriorityTypes(filterDto?: any): Promise<{ priority_types: PriorityTypes[]; page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(PriorityTypes, "priority")
                .select(["priority.id", "priority.name", "priority.colorCode", "priority.isActive", "priority.isActive", "priority.createdAt", "priority.order"])
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

            return { priority_types: priorityTypesWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async editPriorityTypes(updatePriorityTypes: UpdatePriorityTypesDto, id): Promise<PriorityTypes> {
        try {
            // Check user exists with given ID
            const priorityTypesExist = await this.findOne({ where: { id: id, isDeleted: false } });
            if (!priorityTypesExist) throw new NotFoundException(`ERR_PRIORITY_NOT_FOUND`);

            if (updatePriorityTypes?.name) {
                const priorityType = await this.manager.createQueryBuilder(PriorityTypes, "priorityType")
                    .select(["priorityType.id", "priorityType.name"])
                    .where(`(LOWER(priorityType.name) = :name)`, {
                        name: `${updatePriorityTypes.name.toLowerCase()}`
                    })
                    .andWhere(`(priorityType.isDeleted = false)`)
                    .andWhere(`(priorityType.id != :id)`, { id })
                    .getOne();
                if (priorityType) {
                    throw new ConflictException("ERR_PRIORITY_EXIST&&&name");
                }

                priorityTypesExist.name = updatePriorityTypes.name;
                priorityTypesExist.colorCode = updatePriorityTypes.colorCode;
            }

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
                PriorityTypes,
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
