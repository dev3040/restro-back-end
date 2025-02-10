import { DataSource, Repository } from 'typeorm';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { OutletMenu } from 'src/shared/entity/outlet-menu.entity';
import { AddCarrierTypeDto, UpdateCarrierTypeDto } from './dto/add-carrier-type.dto';
import { User } from 'src/shared/entity/user.entity';
import { IsActive } from 'src/shared/enums/is-active.enum';
import { commonDeleteHandler } from 'src/shared/utility/common-function.methods';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';

@Injectable()
export class CarrierTypesRepository extends Repository<OutletMenu> {
    constructor(readonly dataSource: DataSource) {
        super(OutletMenu, dataSource.createEntityManager());
    }

    async addCarrierType(addCarrierType: AddCarrierTypeDto, user: User): Promise<OutletMenu> {
        try {
            const carrierType = await this.manager.createQueryBuilder(OutletMenu, "carrierType")
                .select(["carrierType.id", "carrierType.name"])
                .where(`(LOWER(carrierType.name) = :name)`, {
                    name: `${addCarrierType.name.toLowerCase()}`
                })
                .andWhere(`(carrierType.isDeleted = false)`)
                .getOne();
            if (carrierType) {
                throw new ConflictException("ERR_CARRIER_EXIST&&&name");
            }
            const outletMenu = new OutletMenu();
            outletMenu.name = addCarrierType.name;
            outletMenu.printer = addCarrierType.printer;
            outletMenu.branchId = addCarrierType.branchId;
            outletMenu.isActive = addCarrierType.isActive;
            outletMenu.createdBy = user.id;
            await outletMenu.save();
            return outletMenu;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllCarrierTypes(filterDto?: any): Promise<{ outletMenu: OutletMenu[], page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(OutletMenu, "outletMenu")
                .leftJoinAndSelect("outletMenu.branch", "branch")
                .select(["outletMenu.id", "outletMenu.printer", "outletMenu.name", "branch", "outletMenu.isActive", "outletMenu.createdAt"])
                .where("(outletMenu.isDeleted = false)")

            if (filterDto) {
                if (filterDto.offset && filterDto.limit) {
                    listQuery.skip(filterDto.offset * filterDto.limit);
                    listQuery.take(filterDto.limit)
                }
                listQuery.orderBy(`outletMenu.${filterDto.orderBy}`, filterDto.orderDir);

                if (filterDto.search) {
                    listQuery.andWhere("(outletMenu.name ilike :search)", { search: `%${filterDto.search}%` });
                }

                if (filterDto?.activeStatus == IsActive.ACTIVE) {
                    listQuery.andWhere("(outletMenu.isActive = true)")
                }
                if (filterDto?.activeStatus == IsActive.INACTIVE) {
                    listQuery.andWhere("(outletMenu.isActive = false)")
                }
            }

            const carrierTypesWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = carrierTypesWithCount[1];
            }

            return { outletMenu: carrierTypesWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async editCarrierType(updateCarrierType: UpdateCarrierTypeDto, id: number): Promise<OutletMenu> {
        try {
            // Check user exists with given ID
            const carrierTypesExist = await this.findOne({
                where: { id: id, isDeleted: false }
            });
            if (!carrierTypesExist) throw new NotFoundException(`ERR_CARRIER_NOT_FOUND`);

            if (updateCarrierType?.name) {
                const carrierType = await this.manager.createQueryBuilder(OutletMenu, "outletMenu")
                    .select(["outletMenu.id", "outletMenu.name"])
                    .where(`(LOWER(outletMenu.name) = :name)`, {
                        name: `${updateCarrierType.name.toLowerCase()}`
                    })
                    .andWhere(`(outletMenu.isDeleted = false)`)
                    .andWhere(`(outletMenu.id != :id)`, { id })
                    .getOne();

                if (carrierType) {
                    throw new ConflictException("ERR_CARRIER_EXIST&&&name");
                }

                carrierTypesExist.name = updateCarrierType.name;
                carrierTypesExist.printer = updateCarrierType.printer;
                carrierTypesExist.branchId = updateCarrierType.branchId;
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
                OutletMenu,
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
