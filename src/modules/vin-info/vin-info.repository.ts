import * as path from 'path';
import * as fs from 'fs';
import { DataSource, In, Repository } from 'typeorm';
import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { User } from 'src/shared/entity/user.entity';
import { VinInfo } from 'src/shared/entity/vin-info.entity';
import { FMVValucationMaster } from 'src/shared/entity/fmv-valucation-master.entity';
import { editFileName, pathExistence } from 'src/shared/helper/file-validators';
import { FmvMasterDocuments } from 'src/shared/entity/fmv-master-documents.entity';
import { checkColorExists, checkFmvMasterExists, commonDeleteHandler, formatPrice } from 'src/shared/utility/common-function.methods';
import { fmvDocumentPath } from 'src/config/common.config';
import { FmvPdfData } from 'src/shared/entity/fmv-pdf-data.entity';
import { ActivityLogPayload } from '../activity-logs/activity-log.interface';
import { ActivityLogActionType } from 'src/shared/enums/activity-action-type.enum';
import { DataEntryFormType } from 'src/shared/enums/form-type.enum';
import { SocketEventEnum } from 'src/shared/enums/socket-event.enum';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { SocketGateway } from '../socket/socket.gateway';
import { RegistrationInfoRepository } from '../registration-info/registration-info.repository';
import { VinMaster } from 'src/shared/entity/vin-master.entity';
import { TicketsRepository } from '../ticket-management/ticket-management.repository';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';

@Injectable()
export class VinInfoRepository extends Repository<VinInfo> {
    constructor(
        readonly dataSource: DataSource,
        private activityLogService: ActivityLogsService,
        private ticketsRepository: TicketsRepository,
        private socketGateway: SocketGateway,
        @Inject(forwardRef(() => RegistrationInfoRepository))
        private registrationInfoRepository: RegistrationInfoRepository,
    ) {
        super(VinInfo, dataSource.createEntityManager());
    }

    async editVinInfo(updateVinInfo, id: number, user: User): Promise<any> {
        try {
            const vinInfo: any = await VinInfo.findOne({ where: { id, isActive: true } })
            if (!vinInfo) {
                throw new NotFoundException("ERR_VIN_INFO_NOT_FOUND&&&id")
            }

            vinInfo.year = updateVinInfo.year;
            vinInfo.model = updateVinInfo.model;
            vinInfo.productClass = updateVinInfo.productClass;
            vinInfo.bodyStyle = updateVinInfo.bodyStyle;
            vinInfo.gvwr = updateVinInfo.gvwr;
            vinInfo.gvw = updateVinInfo.gvw;
            vinInfo.make = updateVinInfo.make;
            vinInfo.primaryColorId = updateVinInfo.primaryColorId;
            vinInfo.secondaryColorId = updateVinInfo.secondaryColorId;
            vinInfo.cylinders = updateVinInfo.cylinders;
            vinInfo.primaryFuelType = updateVinInfo.primaryFuelType;
            vinInfo.secondaryFuelType = updateVinInfo.secondaryFuelType;
            vinInfo.engineType = updateVinInfo.engineType;
            vinInfo.noOfDoors = updateVinInfo.noOfDoors;
            vinInfo.shippingWeight = updateVinInfo.shippingWeight;
            vinInfo.vehicleUse = updateVinInfo.vehicleUse;
            vinInfo.shippingInfo = updateVinInfo.shippingInfo;
            vinInfo.emissions = updateVinInfo.emissions;
            vinInfo.type = updateVinInfo.type;
            vinInfo.updatedBy = user.id;
            await vinInfo.save();

            if (updateVinInfo.fmvMasters?.length) {
                const { fmvMasters } = updateVinInfo;
                const fmvMasterUpdated: any = fmvMasters.map(item => {
                    const updatedItem = { ...item, vinId: vinInfo.id, price: formatPrice(item.price) };
                    for (const key in updatedItem) {
                        if (updatedItem[key] === '') {
                            updatedItem[key] = null;
                        }
                    }
                    return updatedItem;
                });
                const existingFmvs = fmvMasterUpdated.filter(v => v.id != null).map(v => ({ ...v, id: parseInt(v.id), updatedBy: user.id }));
                const newFmvs = fmvMasterUpdated.filter(v => v.id == null).map(v => ({ ...v, createdBy: user.id, ticketId: updateVinInfo.ticketId }));
                if (existingFmvs.length > 0) {
                    const ids = existingFmvs.map(update => update.id);
                    const entitiesToUpdate = await FMVValucationMaster.find({ where: { id: In(ids) } });
                    if (entitiesToUpdate.length !== ids.length) {
                        throw new NotFoundException('ERR_FMV_MATER_NOT_FOUND&&&fmvMaster');
                    }
                    await Promise.all(existingFmvs.map(async (fmv) => {
                        const foundEntity = entitiesToUpdate.find(entity => entity.id == fmv.id);
                        if (foundEntity) {
                            Object.assign(foundEntity, fmv);
                            await foundEntity.save();
                        }
                    }));
                }
                if (newFmvs.length > 0) {
                    await this.manager.createQueryBuilder()
                        .insert()
                        .into(FMVValucationMaster)
                        .values(newFmvs)
                        .execute();
                    vinInfo.newFmvs = newFmvs;
                }

            }
            return this.getVinData(id, updateVinInfo.ticketId);
        } catch (error) {
            throwException(error);
        }
    }

    async setVinInfo(updateVinInfo, vinId: number, userId: number, isSummary: boolean): Promise<VinInfo> {
        try {
            const { newFmvs, gaFmvValucationYear, fmvMasters, ticketId, vehicleNewUsed, ...dto } = updateVinInfo;

            let getVinInfo: any = await this.getVinData(vinId, ticketId);

            // Perform all validations and fetch necessary data
            const validationPromises = [
                updateVinInfo?.primaryColorId && checkColorExists(updateVinInfo.primaryColorId, true),
                updateVinInfo?.secondaryColorId && checkColorExists(updateVinInfo.secondaryColorId, false),
            ];
            await Promise.all(validationPromises);

            // Update the existing record 
            await this.update(vinId, { ...dto, updatedBy: userId });

            await VinMaster.update({ vinNumber: getVinInfo.vinNumber }, { ...dto, updatedBy: userId })

            if (getVinInfo?.fmvMasters?.length) {
                //fmv master
                const fmvMasters = getVinInfo.fmvMasters.map(item => ({
                    ...item, vinId: getVinInfo.id, price: formatPrice(item.price)
                }));
                //existing fmv
                const existingFmvs = fmvMasters.filter(v => v.id != null).map(v => ({
                    ...v, id: parseInt(v.id), updatedBy: userId
                }));
                //new fmv
                const newFmvs = fmvMasters.filter(v => v.id == null).map(v => ({
                    ...v, createdBy: userId
                }));
                if (existingFmvs.length > 0) {
                    const ids = existingFmvs.map(update => update.id);

                    const entitiesToUpdate = await FMVValucationMaster.find({
                        select: ["id"],
                        where: { id: In(ids) }
                    });
                    if (entitiesToUpdate.length !== ids.length) {
                        throw new NotFoundException('ERR_FMV_MATER_NOT_FOUND&&&fmvMaster');
                    }

                    await Promise.all(existingFmvs.map(async fmv => {
                        const foundEntity = entitiesToUpdate.find(entity => entity.id == fmv.id);
                        if (foundEntity) {
                            Object.assign(foundEntity, fmv);
                            delete foundEntity.document
                            await foundEntity.save();
                        }
                    }));
                }
                if (newFmvs.length > 0) {
                    await this.manager.createQueryBuilder()
                        .insert()
                        .into(FMVValucationMaster)
                        .values(newFmvs)
                        .execute();

                    getVinInfo.newFmvs = newFmvs;
                    await getVinInfo.save();
                }
            }
            const latestVinInfo = await this.getVinData(vinId, ticketId);

            // Emit data ======>>>> vehicle info 
            this.socketGateway.formDataUpdatedEvent(ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestVinInfo, DataEntryFormType.VEHICLE_INFO);

            // Emit data if VIN updated ===>>> Vin info 
            if (getVinInfo?.gvw !== latestVinInfo?.gvw) {
                const getRegFormInfo = await this.registrationInfoRepository.getRegInfo(ticketId);
                if (getRegFormInfo) {
                    this.socketGateway.formDataUpdatedEvent(ticketId, SocketEventEnum.FORM_DETAILS_UPDATE,
                        getRegFormInfo, DataEntryFormType.REGISTRATION_INFO);
                }
            }

            //  ACTIVITY LOG 
            const changes: any[] = [];
            let newVinData: any = { ...latestVinInfo };
            const pColor = newVinData.primaryColor;
            const sColor = newVinData.secondaryColor;
            const unwantedKeys = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'ticketId', "vinNumber", "isActive", "isDeleted", "primaryColor", "secondaryColor", "fmvMasters", "vinMaster"];

            unwantedKeys.forEach(key => delete newVinData[key]);

            for (let key in newVinData) {
                if (getVinInfo[key] !== newVinData[key]) {
                    let change = {
                        fieldName: key,
                        oldValue: getVinInfo[key],
                        newValue: newVinData[key]
                    };
                    switch (key) {
                        case "productClass":
                            change.fieldName = "product class";
                            break;
                        case "primaryColorId":
                            change.fieldName = "primary color";
                            change.oldValue = getVinInfo?.primaryColorId ? `${getVinInfo.primaryColor?.colorCode} - ${getVinInfo.primaryColor?.colorName}` : null;
                            change.newValue = newVinData?.primaryColorId ? `${pColor?.colorCode} - ${pColor?.colorName}` : null;
                            break;
                        case "secondaryColorId":
                            change.fieldName = "secondary color";
                            change.oldValue = getVinInfo?.secondaryColorId ? `${getVinInfo?.secondaryColor?.colorCode} - ${getVinInfo?.secondaryColor?.colorName}` : null;
                            change.newValue = newVinData?.secondaryColorId ? `${sColor?.colorCode} - ${sColor?.colorName}` : null;
                            break;
                        case "primaryFuelType":
                            change.fieldName = "primary fuel type";
                            break;
                        case "secondaryFuelType":
                            change.fieldName = "secondary fuel type";
                            break;
                        case "noOfDoors":
                            change.fieldName = "no of doors";
                            break;
                        case "shippingWeight":
                            change.fieldName = "shipping weight";
                            break;
                        case "vehicleUse":
                            change.fieldName = "vehicle use";
                            break;
                        case "shippingInfo":
                            change.fieldName = "shipping info";
                            break;
                        default:
                            break;
                    }
                    changes.push(change);
                }
            }
            if (changes.length > 0) {
                let data: ActivityLogPayload[] = changes.map(change => ({
                    userId: userId,
                    actionType: ActivityLogActionType.FORM_DATA_UPDATE,
                    ticketId: ticketId,
                    fieldName: change.fieldName,
                    newData: change.newValue,
                    oldData: change.oldValue,
                    formType: !isSummary ? DataEntryFormType.VEHICLE_INFO_ACTIVITY : DataEntryFormType.SUMMARY_VEHICLE_INFO_ACTIVITY
                }));
                this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_DATA_UPDATE);
            }

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(ticketId, userId);

            return latestVinInfo;
        } catch (error) {
            throwException(error);
        }
    }

    async getVinData(vinId, ticketId: number): Promise<VinInfo> {
        try {
            const vinInfoExist = await this.manager.createQueryBuilder(VinInfo, "vinInfo")
                .leftJoinAndSelect("vinInfo.primaryColor", "primaryColor")
                .leftJoinAndSelect("vinInfo.secondaryColor", "secondaryColor")
                .leftJoinAndSelect("vinInfo.vinMaster", "vinMaster")
                .leftJoinAndSelect(
                    "vinInfo.fmvMasters",
                    "fmvMasters",
                    "fmvMasters.ticketId = :ticketId AND fmvMasters.year = vinInfo.year AND fmvMasters.isDeleted=false",
                    { ticketId }
                )
                .leftJoinAndSelect("fmvMasters.document", "document", "document.isDeleted = false")
                .select([
                    "vinInfo.id", "vinInfo.vinNumber", "vinInfo.model", "vinInfo.productClass",
                    "vinInfo.bodyStyle", "vinInfo.gvwr", "vinInfo.gvw", "vinInfo.primaryColorId",
                    "vinInfo.secondaryColorId", "vinInfo.cylinders", "vinInfo.primaryFuelType",
                    "vinInfo.secondaryFuelType", "vinInfo.engineType", "vinInfo.make", "vinInfo.noOfDoors",
                    "vinInfo.vehicleUse", "vinInfo.shippingInfo", "vinInfo.type", "vinInfo.year", "vinInfo.emissions",
                    "vinInfo.shippingWeight", "vinInfo.hideDefaultError",
                    "primaryColor", "secondaryColor",
                    "fmvMasters.id", "fmvMasters.vinId", "fmvMasters.vinFirstHalf", "fmvMasters.year",
                    "fmvMasters.isMaster",
                    "fmvMasters.price", "fmvMasters.valueType", "fmvMasters.source", "fmvMasters.dateEntered", "fmvMasters.series", "fmvMasters.effectiveYear",
                    "document.id", "document.fmvId", "document.ticketId", "document.fileName", "document.filePath",
                    "vinMaster.error"
                ])
                .where("vinInfo.id = :vinId", { vinId })
                .addOrderBy("fmvMasters.isMaster", "DESC")
                .addOrderBy("fmvMasters.id", "ASC")
                .getOne();

            if (!vinInfoExist) {
                throw new NotFoundException(`ERR_VIN_INFO_NOT_FOUND`);
            }
            return vinInfoExist;
        } catch (err) {
            throwException(err);
        }
    }

    async uploadFmvDocumentsBulk(files, user: User, vinId, ticketId) {
        try {
            const uploadedFiles = [];
            for (const file of files) {
                const fileName = editFileName(file);
                const folderPath = `${fmvDocumentPath}/${file.fmvId}`;
                const filePath = path.join(process.cwd(), folderPath, fileName);

                await pathExistence(filePath);
                fs.writeFileSync(filePath, file.buffer);

                uploadedFiles.push({
                    fmvId: file.fmvId,
                    fileName: fileName,
                    filePath: filePath,
                    createdBy: user.id
                });
            }

            try {
                await this.manager.createQueryBuilder()
                    .insert()
                    .into(FmvMasterDocuments)
                    .values(uploadedFiles)
                    .execute();
            } catch (error) {
                throw new BadRequestException(`${error}attachment&&&ERROR_MESSAGE`)
            }

            /* Emit data ======>>>> vehicle info */
            const latestVinInfo = await this.getVinData(vinId, ticketId);
            if (latestVinInfo) {
                this.socketGateway.formDataUpdatedEvent(null, SocketEventEnum.FORM_DETAILS_UPDATE, latestVinInfo, DataEntryFormType.VEHICLE_INFO);
            }
        } catch (error) {
            throwException(error);
        }
    }

    async uploadDocuments(fmvMaster: FMVValucationMaster, files, user: User) {
        try {
            const uploadedFile = await FmvMasterDocuments.findOne({ where: { fmvId: fmvMaster.id, isDeleted: false } });
            if (uploadedFile) {
                uploadedFile.isDeleted = true;
                uploadedFile.updatedBy = user.id;
                await uploadedFile.save();
            }
            const uploadedFiles = [];
            // const activityLogs = [];
            for (const file of files) {
                const fileName = editFileName(file);
                const folderPath = `${fmvDocumentPath}/${fmvMaster.id}`;
                const filePath = path.join(process.cwd(), folderPath, fileName);

                await pathExistence(filePath);
                fs.writeFileSync(filePath, file.buffer);

                uploadedFiles.push({
                    fmvId: fmvMaster.id,
                    fileName: fileName,
                    filePath: filePath,
                    createdBy: user.id
                });
            }
            try {
                await this.manager.createQueryBuilder()
                    .insert()
                    .into(FmvMasterDocuments)
                    .values(uploadedFiles)
                    .execute();
            } catch (error) {
                throw new BadRequestException(`${error}&&&attachment&&&ERROR_MESSAGE`)
            }

            const latestVinInfo = await this.getVinData(fmvMaster.vinId, fmvMaster.ticketId);

            // Emit data ======>>>> vehicle info 
            this.socketGateway.formDataUpdatedEvent(fmvMaster.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestVinInfo, DataEntryFormType.VEHICLE_INFO);

            /* ACTIVITY LOGS */
            // for (let element of uploadedFiles) {
            //     let data: ActivityLogPayload = {
            //         userId: user.id,
            //         actionType: ActivityLogActionType.FORM_DATA_UPDATE,
            //         ticketId: null,
            //         fieldName: "FMV document",
            //         newData: element?.fileName,
            //         oldData: null,
            //         formType: DataEntryFormType.VEHICLE_INFO
            //     }
            //     activityLogs.push(data);
            // }
            // if (activityLogs.length) {
            //     this.activityLogService.addActivityLog(activityLogs, [], SocketEventEnum.FORM_DATA_UPDATE);
            // }
        } catch (error) {
            throwException(error);
        }
    }

    async fetchFmvPdfData(query): Promise<{ fmvPdfData: FmvPdfData[], page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(FmvPdfData, "fmvPdf")
                .andWhere("fmvPdf.isDeleted = false")
                .select(["fmvPdf.id", "fmvPdf.vin", "fmvPdf.series", "fmvPdf.year", "fmvPdf.price", "fmvPdf.effectiveYear", "fmvPdf.updatedBy"]);

            if (query.search) {
                listQuery.andWhere("(fmvPdf.vin ILIKE :search OR CAST(fmvPdf.price AS TEXT) ILIKE :search OR CAST(fmvPdf.year AS TEXT) ILIKE :search OR CAST(fmvPdf.series AS TEXT) ILIKE :search )", { search: `%${query.search}%` });
            }

            if (query.year && query.vin) {
                listQuery.andWhere("(CAST(fmvPdf.year AS TEXT) = :year AND fmvPdf.vin ILIKE :vin )", { year: `${query.year}`, vin: `${query.vin}` });
            }

            if (query) {
                listQuery.offset(query.offset * query.limit)
                    .limit(query.limit)
                    .orderBy(`fmvPdf.${query.orderBy}`, query.orderDir, 'NULLS LAST')
                if (query.orderBy !== 'vin') {
                    listQuery.addOrderBy(`fmvPdf.vin`, query.orderDir, 'NULLS LAST')
                }
            }

            const fmvDataWithCount = await listQuery.getManyAndCount();
            if (query) {
                query.count = fmvDataWithCount[1];
            }
            return { fmvPdfData: fmvDataWithCount[0], page: query };
        } catch (error) {
            throwException(error);
        }
    }

    async editFmv(updateFmvData, id, user) {
        try {
            let fmvData;
            let oldData;
            let isUpdate: boolean;
            if (parseInt(id)) {
                fmvData = await checkFmvMasterExists(id);
                oldData = { ...fmvData }
                fmvData.price = updateFmvData.price;
                fmvData.year = updateFmvData.year;
                fmvData.valueType = updateFmvData.valueType
                fmvData.series = updateFmvData.series
                fmvData.dateEntered = updateFmvData.dateEntered
                fmvData.source = updateFmvData.source
                fmvData.effectiveYear = updateFmvData.effectiveYear;
                fmvData.isMaster = updateFmvData.isMaster;
                fmvData.updatedBy = user.id;
                await fmvData.save();
                isUpdate = true;
            } else {
                fmvData = await FMVValucationMaster.create({ ...updateFmvData, createdBy: user.id }).save();
                isUpdate = false;
            }

            const latestVinInfo = await this.getVinData(updateFmvData.vinId, fmvData.ticketId || updateFmvData.ticketId);

            // Emit data ======>>>> vehicle info 
            this.socketGateway.formDataUpdatedEvent(fmvData.ticketId || updateFmvData.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestVinInfo, DataEntryFormType.VEHICLE_INFO);
            const latestFmvData = await checkFmvMasterExists(parseInt(id) || fmvData.id);

            const changes: any[] = [];
            let data;
            if (isUpdate) {
                const fieldMappings = {
                    price: "fair market value",
                    valueType: "value type",
                    source: "source",
                    series: "series",
                    dateEntered: "date entered",
                    year: "model year",
                    effectiveYear: "effective year"
                };
                for (let key in latestFmvData) {
                    if (oldData[key] != latestFmvData[key] && fieldMappings[key]) {
                        const fieldName = fieldMappings[key] || key;
                        let oldValue = oldData[key];
                        let newValue = latestFmvData[key];
                        changes.push({ fieldName, oldValue, newValue });
                    }
                }
                if (changes.length > 0) {
                    data = changes.map(change => ({
                        userId: user.id,
                        actionType: ActivityLogActionType.FORM_DATA_UPDATE,
                        ticketId: latestFmvData.ticketId,
                        fieldName: change.fieldName,
                        newData: change.newValue,
                        oldData: change.oldValue,
                        formType: DataEntryFormType.VEHICLE_INFO_ACTIVITY
                    }));
                }
            } else if (!isUpdate) {
                data = {
                    userId: user.id,
                    actionType: ActivityLogActionType.FORM_NEW_RECORD,
                    ticketId: updateFmvData.ticketId,
                    fieldName: null,
                    newData: null,
                    oldData: null,
                    formType: DataEntryFormType.VEHICLE_INFO_ACTIVITY
                }
            }

            if (data !== undefined) {
                this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_DATA_UPDATE);
            }
        } catch (error) {
            throwException(error);
        }
    }

    async fetchVinHistory(vinNum, query): Promise<{ vinInfo: VinInfo[], page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(VinInfo, "vinInfo")
                .leftJoinAndSelect("vinInfo.vinTickets", "vinTickets")
                .leftJoinAndSelect("vinTickets.ticketStatus", "ticketStatus")
                .leftJoinAndSelect("vinTickets.basicInfo", "basicInfo")
                .leftJoinAndSelect("basicInfo.transactionType", "transactionType")
                .leftJoinAndSelect("basicInfo.customer", "customer")
                .select([
                    "vinInfo.vinNumber", "vinTickets.id", "vinTickets.invoiceId",
                    "basicInfo.transactionTypeId", "basicInfo.customerId",
                    "transactionType.name", "ticketStatus.internalStatusName",
                    "customer.name"
                ])
                .where("vinInfo.vinNumber = :vinNum and vinTickets.id IS NOT NULL and vinTickets.isDeleted=false", { vinNum })
                .andWhere(query.ticketId ? "vinTickets.id != :ticketId" : "1=1", { ticketId: query.ticketId })
                .addOrderBy("vinTickets.id", "DESC");

            if (query) {
                listQuery.offset(query.offset * query.limit);
                listQuery.limit(query.limit);
            }

            const dataWithCount = await listQuery.getManyAndCount();
            if (query) {
                query.count = dataWithCount[1];
            }
            return { vinInfo: dataWithCount[0], page: query };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteFMVs(deleteFMV, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                FMVValucationMaster,
                deleteFMV,
                userId,
                success.SUC_FMV_DELETED,
                error.ERR_FMV_MATER_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }


}
