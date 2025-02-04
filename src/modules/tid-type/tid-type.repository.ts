import { DataSource, Repository } from 'typeorm';
import { ConflictException, Injectable } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { AddTidTypeDto, UpdateTidTypeDto } from './dto/add-tid-type.dto';
import { User } from 'src/shared/entity/user.entity';
import { PaymentMethods } from 'src/shared/entity/tid-types.entity';
import { checkTidTypeExists, commonDeleteHandler } from 'src/shared/utility/common-function.methods';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';


@Injectable()
export class TidTypeRepository extends Repository<PaymentMethods> {
    constructor(readonly dataSource: DataSource) {
        super(PaymentMethods, dataSource.createEntityManager());
    }

    async addTidType(addTidType: AddTidTypeDto, user: User): Promise<PaymentMethods> {
        try {
            const { name } = addTidType;

            const tidTypeNameExists = await this.manager.createQueryBuilder(PaymentMethods, "tidType")
                .select(["tidType.id", "tidType.name"])
                .where(`(LOWER(tidType.name) = :name)`, { name: `${name.toLowerCase()}` })
                .andWhere(`(tidType.isDeleted = false)`)
                .getOne();
            if (tidTypeNameExists) {
                throw new ConflictException("ERR_TID_TYPE_EXIST&&&name");
            }

            const tidType = new PaymentMethods();
            tidType.name = name;
            tidType.createdBy = user.id
            await tidType.save();

            return tidType;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllTidTypes(filterDto?: any): Promise<{ tidTypes: PaymentMethods[]; page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(PaymentMethods, "tidType")
                .where("(tidType.isDeleted = false)")
                .select(["tidType.id", "tidType.name", "tidType.slug"])

            if (filterDto) {
                if (filterDto.offset && filterDto.limit) {
                    listQuery.skip(filterDto.offset * filterDto.limit);
                    listQuery.take(filterDto.limit);
                }
                listQuery.orderBy(`tidType.${filterDto.orderBy}`, filterDto.orderDir);

                if (filterDto.search) {
                    listQuery.andWhere("(tidType.name ilike :search)", { search: `%${filterDto.search}%` });
                }
            }

            const tidTypeWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = tidTypeWithCount[1];
            }

            return { tidTypes: tidTypeWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async editTidType(updateTidType: UpdateTidTypeDto, id, user: User): Promise<PaymentMethods> {
        try {
            const { name } = updateTidType;

            const tidTypeExist = await checkTidTypeExists(id);

            const tidTypeNameExists = await this.manager.createQueryBuilder(PaymentMethods, "tidType")
                .select(["tidType.id", "tidType.name"])
                .where(`(LOWER(tidType.name) = :name)`, { name: `${name.toLowerCase()}` })
                .andWhere(`(tidType.isDeleted = false)`)
                .andWhere(`(tidType.id != :id)`, { id })
                .getOne();
            if (tidTypeNameExists) {
                throw new ConflictException("ERR_TID_TYPE_EXIST&&&name");
            }


            tidTypeExist.name = name;
            tidTypeExist.updatedBy = user.id;
            await tidTypeExist.save();

            return tidTypeExist;
        } catch (error) {
            throwException(error);
        }
    }
    async deleteTidTypes(tidTypes, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                PaymentMethods,
                tidTypes,
                userId,
                success.SUC_TID_TYPE_DELETED,
                error.ERR_TID_TYPE_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}
