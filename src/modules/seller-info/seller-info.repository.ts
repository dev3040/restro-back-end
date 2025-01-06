import { DataSource, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { User } from 'src/shared/entity/user.entity';
import { AddSellerInfoDto, UpdateSellerInfoDto } from './dto/add-seller-info.dto';
import { SellerInfo } from 'src/shared/entity/seller-info.entity';
import { checkSellerInfoExists, checkTicketExists, checkValidSeller, getSellerType } from 'src/shared/utility/common-function.methods';
import { TicketsRepository } from '../ticket-management/ticket-management.repository';
import { ActivityLogPayload } from '../activity-logs/activity-log.interface';
import { ActivityLogActionType } from 'src/shared/enums/activity-action-type.enum';
import { DataEntryFormType } from 'src/shared/enums/form-type.enum';
import { SocketEventEnum } from 'src/shared/enums/socket-event.enum';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class SellerInfoRepository extends Repository<SellerInfo> {
    constructor(
        readonly dataSource: DataSource,
        private ticketsRepository: TicketsRepository,
        private socketGateway: SocketGateway,
        private activityLogService: ActivityLogsService
    ) {
        super(SellerInfo, dataSource.createEntityManager());
    }

    async addSellerInfo(addSellerInfo: AddSellerInfoDto, user: User) {
        try {
            const ticket = await checkTicketExists(addSellerInfo.ticketId);
            const sellerInfo = new SellerInfo();
            sellerInfo.isDealership = addSellerInfo.isDealer;
            sellerInfo.name = addSellerInfo.name;
            sellerInfo.address = addSellerInfo.address;
            sellerInfo.dealerId = addSellerInfo.dealerId;
            sellerInfo.salesTaxId = addSellerInfo.salesTaxId;
            sellerInfo.sellerType = addSellerInfo.sellerType;
            sellerInfo.ticketId = ticket.id;
            sellerInfo.sellerId = addSellerInfo.sellerId;
            sellerInfo.createdBy = user.id;
            const data = await sellerInfo.save();
            const sellerData = {
                id: data.id,
                isDealership: data.isDealership,
                name: data.name,
                address: data.address,
                salesTaxId: data.salesTaxId,
                sellerType: data.sellerType,
                sellerId: data.sellerId,
                ticketId: data.ticketId,
                ...(data.isDealership && { dealerId: data.dealerId })
            }

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(addSellerInfo.ticketId, user.id);

            return sellerData;
        } catch (error) {
            throwException(error);
        }
    }
    async editSellerInfo(updateSellerInfo: UpdateSellerInfoDto, id, user: User) {
        try {
            const sellerInfo = await checkSellerInfoExists(id);
            sellerInfo.isDealership = updateSellerInfo.isDealer;
            sellerInfo.name = updateSellerInfo.name;
            sellerInfo.address = updateSellerInfo.address;
            sellerInfo.dealerId = updateSellerInfo.dealerId;
            sellerInfo.salesTaxId = updateSellerInfo.salesTaxId;
            sellerInfo.sellerType = updateSellerInfo.sellerType;
            sellerInfo.sellerId = updateSellerInfo.sellerId;
            sellerInfo.updatedBy = user.id;
            const data = await sellerInfo.save();
            const sellerData = {
                id: data.id,
                isDealership: data.isDealership,
                name: data.name,
                address: data.address,
                salesTaxId: data.salesTaxId,
                sellerType: data.sellerType,
                sellerId: data.sellerId,
                ticketId: data.ticketId,
                ...(data.isDealership && { dealerId: data.dealerId })
            }

            this.socketGateway.formDataUpdatedEvent(sellerData.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, { sellerInfo: [sellerData] }, DataEntryFormType.SELLER_INFO);
            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(updateSellerInfo.ticketId, user.id);
            return sellerData;
        } catch (error) {
            throwException(error);
        }
    }
    async fetchSellerInfo(id) {
        try {
            const listQuery = this.manager.createQueryBuilder(SellerInfo, "sellerInfo")
                .where("sellerInfo.ticketId = :ticketId", { ticketId: id })
                .andWhere("sellerInfo.isDeleted = false")
                .select(["sellerInfo.id", "sellerInfo.isDealership", "sellerInfo.name",
                    "sellerInfo.address", "sellerInfo.sellerId",
                    "sellerInfo.dealerId", "sellerInfo.sellerType", "sellerInfo.salesTaxId", "sellerInfo.ticketId"]);

            const sellerInfo = await listQuery.getMany();
            return { sellerInfo };
        } catch (error) {
            throwException(error);
        }
    }
    async saveSellerInfo(sellerInfo, userId, isSummary: boolean): Promise<any> {
        try {
            let isUpdate: boolean;
            let seller: any;
            let isNewSeller: boolean;
            const ticketId = sellerInfo.ticketId;

            if (sellerInfo?.id) {
                await checkSellerInfoExists(sellerInfo?.id)
                seller = await this.fetchSellerById(sellerInfo.id);
                await checkValidSeller(SellerInfo, this.dataSource, sellerInfo?.name, sellerInfo?.address, null, ticketId);
                const criteria = { id: sellerInfo.id };
                // Update record 
                await this.update(criteria, { ...sellerInfo, ticketId: ticketId, updatedBy: userId });
                isUpdate = true;

            } else if (sellerInfo?.ticketId) {
                await checkTicketExists(sellerInfo.ticketId); //new entry
                const sellerData = await SellerInfo.findOne({
                    select: ["id", "ticketId"],
                    where: {
                        ticketId: sellerInfo.ticketId,
                        isDeleted: false
                    }
                })
                // Create a new record
                await checkValidSeller(SellerInfo, this.dataSource, sellerInfo?.name, sellerInfo?.address, null, ticketId);
                seller = this.create({ ...sellerInfo, createdBy: userId });
                await this.save(seller);

                isNewSeller = true;
                isUpdate = !!sellerData;
            }

            let latestSellerInfo: any = await this.fetchSellerInfo(ticketId);
            // Emit data : seller data
            this.socketGateway.formDataUpdatedEvent(ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestSellerInfo, DataEntryFormType.SELLER_INFO);

            // ACTIVITY LOG 
            if (isUpdate) {
                if (isNewSeller) {
                    const data: ActivityLogPayload = {
                        userId,
                        actionType: ActivityLogActionType.FORM_NEW_RECORD,
                        ticketId,
                        fieldName: null,
                        newData: null,
                        oldData: null,
                        formType: !isSummary ? DataEntryFormType.SELLER_INFO_ACTIVITY : DataEntryFormType.SUMMARY_SELLER_INFO_ACTIVITY
                    }

                    this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_DATA_UPDATE);
                } else {
                    let changes: any[] = [];
                    const unwantedKeys = ['createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'id', 'isActive', 'isDeleted'];
                    unwantedKeys.forEach(property => { delete latestSellerInfo[property] });

                    const keyMappings = {
                        name: "Name",
                        sellerId: "Seller ID",
                        isDealership: "Is dealer",
                        sellerType: "Seller type",
                        dealerId: "Dealer ID",
                        salesTaxId: "Sales tax ID",
                        address: "Address"
                    };

                    for (let key in latestSellerInfo.sellerInfo[0]) {
                        if (seller[key] !== latestSellerInfo.sellerInfo[0][key]) {
                            const fieldName = keyMappings[key];

                            if (fieldName) {
                                let oldValue = seller[key];
                                let newValue = latestSellerInfo.sellerInfo[0][key];

                                if (key === "sellerType") {
                                    oldValue = getSellerType(oldValue);
                                    newValue = getSellerType(newValue);
                                }
                                changes.push({
                                    fieldName: fieldName,
                                    oldValue: oldValue,
                                    newValue: newValue
                                });
                            }
                        }
                    }
                    if (changes.length > 0) {
                        const data: ActivityLogPayload[] = changes.map(change => ({
                            userId: userId,
                            actionType: ActivityLogActionType.FORM_DATA_UPDATE,
                            ticketId: sellerInfo.ticketId,
                            fieldName: change.fieldName,
                            newData: change.newValue,
                            oldData: change.oldValue,
                            formType: !isSummary ? DataEntryFormType.SELLER_INFO_ACTIVITY : DataEntryFormType.SUMMARY_SELLER_INFO_ACTIVITY
                        }));

                        this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_DATA_UPDATE);
                    }
                }
            } else {
                const data: ActivityLogPayload = {
                    userId: userId,
                    actionType: ActivityLogActionType.FORM_START,
                    ticketId: ticketId,
                    fieldName: null,
                    newData: null,
                    oldData: null,
                    formType: !isSummary ? DataEntryFormType.SELLER_INFO_ACTIVITY : DataEntryFormType.SUMMARY_SELLER_INFO_ACTIVITY
                }
                this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_START);
            }

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(ticketId, userId);
        } catch (error) {
            throwException(error);
        }
    }

    async fetchSellerById(id) {
        try {
            const listQuery = await this.manager.createQueryBuilder(SellerInfo, "sellerInfo")
                .where("sellerInfo.id = :id", { id: id })
                .andWhere("sellerInfo.isDeleted = false")
                .select(["sellerInfo.id", "sellerInfo.isDealership", "sellerInfo.name",
                    "sellerInfo.address", "sellerInfo.sellerId", "sellerInfo.ticketId",
                    "sellerInfo.dealerId", "sellerInfo.sellerType", "sellerInfo.salesTaxId"])
                .getMany();
            if (!listQuery && listQuery.length === 0) {
                throw new NotFoundException(`ERR_SELLER_INFO_NOT_FOUND&&&id`);
            }
            return listQuery[0];
        } catch (error) {
            throwException(error);
        }
    }

}
