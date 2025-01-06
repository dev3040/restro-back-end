import { LienMaster } from 'src/shared/entity/lien-master.entity';
import { DataSource, Not, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { AddLienMasterDto, UpdateLienMasterDto } from './dto/add-lien-master.dto';
import { throwException } from "../../shared/utility/throw-exception";
import { IsActive } from 'src/shared/enums/is-active.enum';
import { User } from 'src/shared/entity/user.entity';
import { commonDeleteHandler } from 'src/shared/utility/common-function.methods';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';

@Injectable()
export class LienMasterRepository extends Repository<LienMaster> {
    constructor(readonly dataSource: DataSource) {
        super(LienMaster, dataSource.createEntityManager());
    }

    async addLienMaster(addLienMaster: AddLienMasterDto, user: User): Promise<LienMaster> {
        try {
            // Check if the combination of holder name, address, state, city, and zip code already exists
            const existingLienMaster = await LienMaster.findOne({
                where: {
                    holderName: addLienMaster.holderName,
                    address: addLienMaster.address
                }
            });

            if (existingLienMaster) {
                throw new Error('ERR_LIEN_MASTER_ALREADY_EXIST');
            }

            const lienMaster = new LienMaster();
            lienMaster.holderName = addLienMaster.holderName;
            lienMaster.address = addLienMaster.address;
            lienMaster.isActive = addLienMaster.isActive;
            lienMaster.createdBy = user.id;
            lienMaster.isElt = addLienMaster.isElt;
            lienMaster.lienHolderId = addLienMaster.lienHolderId;

            const res = await lienMaster.save();
            return res;
        } catch (error) {
            throwException(error);
        }
    }
    async fetchAllLienMaster(filterDto): Promise<{ lienMasters: LienMaster[]; page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(LienMaster, "lienMaster")
                .select(["lienMaster.lienHolderId", "lienMaster.id", "lienMaster.isElt", "lienMaster.holderName", "lienMaster.address", "lienMaster.isActive", "lienMaster.createdAt"])
                .where("(lienMaster.is_deleted = false)")

            if (filterDto) {
                if (filterDto.offset && filterDto.limit) {
                    listQuery.skip(filterDto.offset * filterDto.limit);
                    listQuery.take(filterDto.limit);
                }

                if (filterDto.search) {
                    listQuery.andWhere("(lienMaster.address ilike :search OR lienMaster.holderName ilike :search OR CAST(lienMaster.id AS TEXT) ILIKE :search OR CAST(lienMaster.lienHolderId AS TEXT) ILIKE :search)", { search: `%${filterDto.search}%` });
                }

                if (filterDto.holderName) {
                    listQuery.andWhere("(lienMaster.holderName = :search)", { search: `${filterDto.holderName}` });
                }

                if (filterDto?.activeStatus == IsActive.ACTIVE) {
                    listQuery.andWhere("lienMaster.isActive = true")
                }
                if (filterDto?.activeStatus == IsActive.INACTIVE) {
                    listQuery.andWhere("lienMaster.isActive = false")
                }
                if (filterDto.isElt) {
                    listQuery.andWhere("lienMaster.isElt = :isElt", { isElt: filterDto.isElt });
                }

                /* listQuery.orderBy(`CASE 
                    WHEN '${filterDto.orderBy}' = 'lienHolderId' THEN 'lienMaster.lienHolderId'
                    ELSE lienMaster.${filterDto.orderBy}
                    END`,
                    filterDto.orderDir,
                    'NULLS LAST'
                ); */

                listQuery.orderBy(`lienMaster.${filterDto.orderBy}`, filterDto.orderDir, 'NULLS LAST')
                /* if (filterDto.orderBy !== 'holderName') {
                    listQuery.addOrderBy('lienMaster.holderName', filterDto.orderDir, 'NULLS LAST')
                } */
            }

            const lienMastersWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = lienMastersWithCount[1];
            }

            return { lienMasters: lienMastersWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }
    async editLienMaster(updateLienMaster: UpdateLienMasterDto, id, user: User): Promise<LienMaster> {
        try {
            const lienMaster = await this.findOne({ select: ["holderName", "id", "address", "isActive", "createdBy", "isElt", "lienHolderId"], where: { id: id } });
            // Check if the combination of holder name, address, state, city, and zip code already exists
            const existingLienMaster = await LienMaster.findOne({
                where: {
                    holderName: updateLienMaster.holderName,
                    address: updateLienMaster.address,
                    id: Not(id)
                }
            });

            if (existingLienMaster) {
                throw new Error('ERR_LIEN_MASTER_ALREADY_EXIST');
            }

            lienMaster.holderName = updateLienMaster.holderName;
            lienMaster.address = updateLienMaster.address;
            lienMaster.isActive = updateLienMaster.isActive;
            lienMaster.updatedBy = user.id;
            lienMaster.isElt = updateLienMaster.isElt;
            lienMaster.lienHolderId = updateLienMaster.lienHolderId;

            return await lienMaster.save();
        } catch (error) {
            throwException(error);
        }
    }
    async deleteLienMaster(deleteLienMaster, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                LienMaster,
                deleteLienMaster,
                userId,
                success.SUC_LIEN_MASTER_DELETED,
                error.ERR_LIEN_MASTER_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}
