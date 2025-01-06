import { DataSource, Repository } from 'typeorm';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { CarrierTypes } from 'src/shared/entity/carrier-types.entity';
import { AddCarrierTypeDto, UpdateCarrierTypeDto } from './dto/add-carrier-type.dto';
import { User } from 'src/shared/entity/user.entity';
import { IsActive } from 'src/shared/enums/is-active.enum';
import { commonDeleteHandler } from 'src/shared/utility/common-function.methods';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';

@Injectable()
export class CarrierTypesRepository extends Repository<CarrierTypes> {
    constructor(readonly dataSource: DataSource) {
        super(CarrierTypes, dataSource.createEntityManager());
    }

    async addCarrierType(addCarrierType: AddCarrierTypeDto, user: User): Promise<CarrierTypes> {
        try {
            const carrierType = await this.manager.createQueryBuilder(CarrierTypes, "carrierType")
                .select(["carrierType.id", "carrierType.name"])
                .where(`(LOWER(carrierType.name) = :name)`, {
                    name: `${addCarrierType.name.toLowerCase()}`
                })
                .andWhere(`(carrierType.isDeleted = false)`)
                .getOne();
            if (carrierType) {
                throw new ConflictException("ERR_CARRIER_EXIST&&&name");
            }
            const carrierTypes = new CarrierTypes();
            carrierTypes.name = addCarrierType.name;
            carrierTypes.isActive = addCarrierType.isActive;
            carrierTypes.createdBy = user.id;
            await carrierTypes.save();
            return carrierTypes;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllCarrierTypes(filterDto?: any): Promise<{ carrierTypes: CarrierTypes[], page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(CarrierTypes, "carrierTypes")
                .select(["carrierTypes.id", "carrierTypes.name", "carrierTypes.isActive", "carrierTypes.createdAt"])
                .where("(carrierTypes.isDeleted = false)")

            if (filterDto) {
                if (filterDto.offset && filterDto.limit) {
                    listQuery.skip(filterDto.offset * filterDto.limit);
                    listQuery.take(filterDto.limit)
                }
                listQuery.orderBy(`carrierTypes.${filterDto.orderBy}`, filterDto.orderDir);

                if (filterDto.search) {
                    listQuery.andWhere("(carrierTypes.name ilike :search)", { search: `%${filterDto.search}%` });
                }

                if (filterDto?.activeStatus == IsActive.ACTIVE) {
                    listQuery.andWhere("(carrierTypes.isActive = true)")
                }
                if (filterDto?.activeStatus == IsActive.INACTIVE) {
                    listQuery.andWhere("(carrierTypes.isActive = false)")
                }
            }

            const carrierTypesWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = carrierTypesWithCount[1];
            }

            return { carrierTypes: carrierTypesWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async editCarrierType(updateCarrierType: UpdateCarrierTypeDto, id: number): Promise<CarrierTypes> {
        try {
            // Check user exists with given ID
            const carrierTypesExist = await this.findOne({
                where: { id: id, isDeleted: false }
            });
            if (!carrierTypesExist) throw new NotFoundException(`ERR_CARRIER_NOT_FOUND`);

            if (updateCarrierType?.name) {
                const carrierType = await this.manager.createQueryBuilder(CarrierTypes, "carrierTypes")
                    .select(["carrierTypes.id", "carrierTypes.name"])
                    .where(`(LOWER(carrierTypes.name) = :name)`, {
                        name: `${updateCarrierType.name.toLowerCase()}`
                    })
                    .andWhere(`(carrierTypes.isDeleted = false)`)
                    .andWhere(`(carrierTypes.id != :id)`, { id })
                    .getOne();

                if (carrierType) {
                    throw new ConflictException("ERR_CARRIER_EXIST&&&name");
                }

                carrierTypesExist.name = updateCarrierType.name;
            }
            carrierTypesExist.isActive = updateCarrierType.isActive;
            await carrierTypesExist.save();

            return carrierTypesExist;
        } catch (error) {
            throwException(error);
        }
    }
    async deleteCarrierTypes(deleteCarrierTypes, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                CarrierTypes,
                deleteCarrierTypes,
                userId,
                success.SUC_CARRIER_DELETED,
                error.ERR_CARRIER_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}
