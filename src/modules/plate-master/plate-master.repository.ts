import { DataSource, In, Not, Repository } from 'typeorm';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { User } from 'src/shared/entity/user.entity';
import { PlateMaster } from 'src/shared/entity/plate-master.entity';
import { CountySpecialForms } from 'src/shared/entity/county-special-forms.entity';
import { formatPrice } from 'src/shared/utility/common-function.methods';
import { IsActive } from 'src/shared/enums/is-active.enum';
import { editFileName, pathExistence } from 'src/shared/helper/file-validators';
import { plateDocumentPath } from 'src/config/common.config';
import * as path from 'path';
import * as fs from 'fs';


@Injectable()
export class PlateMasterRepository extends Repository<PlateMaster> {
    constructor(readonly dataSource: DataSource) {
        super(PlateMaster, dataSource.createEntityManager());
    }

    async addPlateMaster(addPlateMaster, user: User) {
        try {
            const existingPlate = await this.findOne({
                where: {
                    plateDetails: addPlateMaster.plateDetails,
                    categoryCode: addPlateMaster.categoryCode
                }
            });
            if (existingPlate) {
                throw new Error('ERR_PLATE_MASTER_ALREADY_EXIST');
            }
            const plateMaster = new PlateMaster();
            plateMaster.plateDetails = addPlateMaster.plateDetails;
            plateMaster.categoryCode = addPlateMaster.categoryCode;
            plateMaster.plateTypeId = addPlateMaster.plateTypeId;
            plateMaster.annualSpecialFee = formatPrice(addPlateMaster.annualSpecialFee);
            plateMaster.manufacturingFee = formatPrice(addPlateMaster.manufacturingFee);
            plateMaster.standardFee = formatPrice(addPlateMaster.standardFee);
            plateMaster.requiredForms = addPlateMaster.requiredForms;
            plateMaster.specialQualifications = addPlateMaster.specialQualifications;
            plateMaster.stateId = addPlateMaster.stateId;
            plateMaster.siteLink = addPlateMaster.siteLink;
            plateMaster.weightRangeStart = addPlateMaster.weightRangeStart;
            plateMaster.weightRangeEnd = addPlateMaster.weightRangeEnd;
            plateMaster.isTransferable = addPlateMaster.isTransferable;
            plateMaster.isFebExpiration = addPlateMaster.isFebExpiration;
            plateMaster.isRegQuarter = addPlateMaster.isRegQuarter;
            plateMaster.isActive = addPlateMaster.isActive;
            plateMaster.createdBy = user.id;
            plateMaster.quarterCalc = addPlateMaster.quarterCalc;
            const res = await plateMaster.save();
            if (addPlateMaster?.countySpecialForm?.length) {
                await this.saveCountyForms(addPlateMaster, res, user)
            }
            return res;
        } catch (error) {
            throwException(error);
        }
    }

    async editPlateMaster(id, updatePlateMaster, user: User) {
        try {
            const plateMaster = await this.findOne({ where: { id } })
            if (!plateMaster) {
                throw new Error('ERR_PLATE_MASTER_NOT_FOUND');
            }
            const existingPlate = await this.findOne({
                where: {
                    plateDetails: updatePlateMaster.plateDetails,
                    categoryCode: updatePlateMaster.categoryCode,
                    id: Not(id)
                }
            });
            if (existingPlate) {
                throw new Error('ERR_PLATE_MASTER_ALREADY_EXIST');
            }
            plateMaster.plateDetails = updatePlateMaster.plateDetails;
            plateMaster.categoryCode = updatePlateMaster.categoryCode;
            plateMaster.plateTypeId = updatePlateMaster.plateTypeId;
            plateMaster.annualSpecialFee = formatPrice(updatePlateMaster.annualSpecialFee);
            plateMaster.manufacturingFee = formatPrice(updatePlateMaster.manufacturingFee);
            plateMaster.standardFee = formatPrice(updatePlateMaster.standardFee);
            plateMaster.requiredForms = updatePlateMaster.requiredForms;
            plateMaster.specialQualifications = updatePlateMaster.specialQualifications;
            plateMaster.stateId = updatePlateMaster.stateId;
            plateMaster.siteLink = updatePlateMaster.siteLink;
            plateMaster.weightRangeStart = updatePlateMaster.weightRangeStart;
            plateMaster.weightRangeEnd = updatePlateMaster.weightRangeEnd;
            plateMaster.isTransferable = updatePlateMaster.isTransferable;
            plateMaster.isFebExpiration = updatePlateMaster.isFebExpiration;
            plateMaster.isRegQuarter = updatePlateMaster.isRegQuarter;
            plateMaster.isActive = updatePlateMaster.isActive;
            plateMaster.createdBy = user.id;
            plateMaster.quarterCalc = updatePlateMaster.quarterCalc;
            const res = await plateMaster.save();
            if (updatePlateMaster?.countySpecialForm?.length) {
                await this.saveCountyForms(updatePlateMaster, plateMaster, user)
            }
            return res;
        } catch (error) {
            throwException(error);
        }
    }

    async saveCountyForms(payload, plateMaster, user) {
        this.validatePayload(payload.countySpecialForm)
        const allRecordsToInsert = [];

        for (const form of payload.countySpecialForm) {
            const countyIds = form.countyIds;
            const formName = form.formName;

            // Fetch all existing records for the countyIds and formName in a single query
            const existingRecords = await CountySpecialForms.find({
                where: {
                    plateId: plateMaster.id,
                    formName,
                    isDeleted: false,
                },
            });
            const existingCountyIds = new Set(existingRecords.map(record => record.countyId));
            if (countyIds) {
                const countyIdsInPayload = new Set(countyIds.map(Number));
                const recordsToSoftDelete = existingRecords.filter(
                    record => !countyIdsInPayload.has(record.countyId)
                ).map(v => v.id);
                if (recordsToSoftDelete.length > 0) {
                    await CountySpecialForms.update({ id: In(recordsToSoftDelete) }, { isDeleted: true })
                }
                const recordsToInsert = countyIds
                    .filter(id => !existingCountyIds.has(Number(id))) // Exclude existing countyIds
                    .map(id => {
                        return CountySpecialForms.create({
                            countyId: Number(id),
                            formName,
                            plateId: plateMaster.id,
                            createdBy: user.id
                        });
                    });

                // Add the filtered records to the final batch
                allRecordsToInsert.push(...recordsToInsert);
            } else {
                const deleteIds = existingRecords.map(i => i.id)
                await CountySpecialForms.update({ id: In(deleteIds) }, { isDeleted: true })
            }

        }

        if (allRecordsToInsert.length > 0) {
            await CountySpecialForms.save(allRecordsToInsert);
        }
    }

    validatePayload(payload: any[]) {
        const formNameMap = new Map<string, Set<string>>();

        for (const item of payload) {
            const formName = item.formName;
            const countyIds = item.countyIds;

            if (!formNameMap.has(formName)) {
                formNameMap.set(formName, new Set(countyIds));
            } else {
                const existingCountyIds = formNameMap.get(formName);

                for (const countyId of countyIds) {
                    if (existingCountyIds.has(countyId)) {
                        throw new BadRequestException('DUPLICATE_ENTRY_COUNTY_FORM&&&countySpecialForm');
                    }
                }
            }
        }
    }

    async fetchAllPlates(filterDto?: any): Promise<{ plates: PlateMaster[]; page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(PlateMaster, "plateMaster")
                .leftJoinAndSelect("plateMaster.plateTypes", "plateTypes")
                .select(['plateMaster.id', 'plateMaster.plateDetails', 'plateMaster.categoryCode',
                    'plateMaster.plateTypeId', 'plateMaster.standardFee',
                    'plateMaster.weightRangeStart',
                    'plateMaster.weightRangeEnd', 'plateMaster.isTransferable',
                    'plateMaster.isActive', 'plateTypes', "plateMaster.createdAt"])
                .where(`(plateMaster.isDeleted = false)`)

            if (filterDto && filterDto.search) {
                listQuery.andWhere("((plateMaster.categoryCode ilike :search) OR (plateMaster.plateDetails ilike :search) OR (CAST(plateMaster.weightRangeStart AS TEXT) ilike :search) OR (CAST(plateMaster.weightRangeEnd AS TEXT) ilike :search))", { search: `%${filterDto.search}%` });
            }

            if (filterDto?.activeStatus == IsActive.ACTIVE) {
                listQuery.andWhere("(plateMaster.isActive = true)")
            }
            if (filterDto?.activeStatus == IsActive.INACTIVE) {
                listQuery.andWhere("(plateMaster.isActive = false)")
            }

            if (filterDto) {
                listQuery.skip(filterDto.offset * filterDto.limit);
                listQuery.take(filterDto.limit);
                listQuery.orderBy(filterDto.orderBy, filterDto.orderDir, 'NULLS LAST');
            }
            const platesWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = platesWithCount[1];
            }

            return { plates: platesWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }


    async getPlateDetails(id): Promise<any> {
        try {
            const plate = await this.manager.createQueryBuilder(PlateMaster, "plateMaster")
                .leftJoinAndSelect("plateMaster.plateTypes", "plateTypes")
                .leftJoinAndSelect("plateMaster.countyForms", "countyForms", "countyForms.isDeleted = false")
                .leftJoinAndSelect("countyForms.county", "county")
                .select(['plateMaster.id', 'plateMaster.plateDetails', 'plateMaster.categoryCode',
                    'plateMaster.plateTypeId', 'plateMaster.standardFee',
                    'plateMaster.weightRangeStart',
                    'plateMaster.isRegQuarter',
                    'plateMaster.quarterCalc',
                    'plateMaster.requiredForms', 'plateMaster.specialQualifications', 'plateMaster.stateId', 'plateMaster.document',
                    'plateMaster.siteLink', 'plateMaster.annualSpecialFee', 'plateMaster.manufacturingFee',
                    'plateMaster.weightRangeEnd', 'plateMaster.isTransferable',
                    'plateMaster.isActive', 'plateTypes', "plateMaster.createdAt", "countyForms.id", "countyForms.plateId", "countyForms.formName", "countyForms.countyId",
                    'county', 'plateMaster.isFebExpiration'])
                .where(`(plateMaster.id = :id AND plateMaster.isDeleted = false)`, { id })
                .getOne();

            if (!plate) {
                throw new NotFoundException(`ERR_PLATE_MASTER_NOT_FOUND&&&id`);
            }

            // Group countyForms by formName and restructure
            const groupedCountyForms = plate.countyForms.reduce((acc, countyForm) => {
                const { formName, county } = countyForm;

                if (!acc[formName]) {
                    acc[formName] = {
                        plateId: countyForm.plateId,
                        formName,
                        county: []
                    };
                }

                acc[formName].county.push(county);
                return acc;
            }, {});

            // Convert the object back to an array
            const countyForms = Object.values(groupedCountyForms);

            // Modify plate data to include the grouped countyForms
            return {
                ...plate,
                countyForms
            };

        } catch (error) {
            throwException(error);
        }
    }

    async uploadDocs(plate: PlateMaster, file, user: User) {
        try {
            const fileName = editFileName(file);
            const folderPath = `${plateDocumentPath}/${plate.id}`;
            const filePath = path.join(process.cwd(), folderPath, fileName);
            await pathExistence(filePath);
            fs.writeFileSync(filePath, file.buffer);
            plate.document = fileName;
            plate.updatedBy = user.id;
            return plate.save();
        } catch (error) {
            throwException(error);
        }

    }
}
