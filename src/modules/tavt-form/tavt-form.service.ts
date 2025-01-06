import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TavtRepository } from "./tavt-form.repository";
import { TavtFormDto } from "./dto/save-tavt-form.dto";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { throwException } from "src/shared/utility/throw-exception";
import { User } from "src/shared/entity/user.entity";
import { TavtOtherFees } from "src/shared/entity/tavt-other-fees.entity";
import { ActivityLogPayload } from "../activity-logs/activity-log.interface";
import { ActivityLogActionType } from "src/shared/enums/activity-action-type.enum";
import { SocketEventEnum } from "src/shared/enums/socket-event.enum";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { DataEntryFormType } from "src/shared/enums/form-type.enum";
import { SocketGateway } from "../socket/socket.gateway";
import { SalesTaxMaster } from "src/shared/entity/sales-tax-master.entity";
import { SalesTaxMasterDto } from "./dto/update-sales-tax.dto";


@Injectable()
export class TavtFormService {
    constructor(
        @InjectRepository(TavtRepository)
        private readonly tavtRepository: TavtRepository,
        private socketGateway: SocketGateway,
        private activityLogService: ActivityLogsService
    ) { }

    async saveTavtForm(tavtForm: TavtFormDto, userId: number, isSummary: boolean): Promise<AppResponse> {
        try {
            const data = await this.tavtRepository.saveTavtForm(tavtForm, userId, isSummary);

            return {
                message: "SUC_TAVT_FORM_SAVED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getTavtForm(ticketId): Promise<AppResponse> {
        try {
            const regInfo = await this.tavtRepository.getTavtForm(ticketId)
            return {
                message: "SUC_TAVT_FORM_FETCHED",
                data: regInfo
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getCalcInfo(ticketId): Promise<AppResponse> {
        try {
            const tavt = await this.tavtRepository.getCalcInfo(ticketId)
            return {
                message: "SUC_TAVT_FORM_FETCHED",
                data: tavt
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteOtherFees(id, user: User) {
        const otherFees = await this.tavtRepository.getOtherField(id);
        if (!otherFees) {
            throw new NotFoundException(`ERR_OTHER_FEES_NOT_FOUND&&&id`)
        }
        await TavtOtherFees.delete({ id })

        const data: ActivityLogPayload = {
            userId: user.id,
            actionType: ActivityLogActionType.OTHER_FEES_REMOVE,
            ticketId: otherFees.tavtForm.ticketId,
            fieldName: otherFees.taxableMaster.name,
            newData: null,
            oldData: `${otherFees.price}`,
            formType: DataEntryFormType.TAVT_FORM_ACTIVITY
        }
        this.activityLogService.addActivityLog(data, [], SocketEventEnum.TICKET_DATA_REMOVE);

        const latestTavtForm: any = await this.tavtRepository.getTavtForm(otherFees.tavtForm.ticketId);
        /* Emit data ===>>> [Tavt] */
        this.socketGateway.formDataUpdatedEvent(otherFees.tavtForm.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestTavtForm, DataEntryFormType.TAVT_FORM);

        return {
            message: "SUC_OTHER_FEE_DELETED",
            data: {}
        };
    }

    async getSalesTaxList(query): Promise<AppResponse> {
        try {
            const salesTaxList = await this.tavtRepository.getSalesTaxList(query);
            return {
                message: "SUC_SALES_TAX_LIST_FETCHED",
                data: salesTaxList
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getSalesTaxById(countyId, query): Promise<AppResponse> {
        try {
            const { cityId } = query;
            const salesTaxData = await this.tavtRepository.getSalesTaxById(countyId, cityId);
            return {
                message: "SUC_SALES_TAX_DETAILS_FETCHED",
                data: salesTaxData
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editSalesTax(salesTaxPayload: SalesTaxMasterDto, id, user) {
        try {
            const taxData = await SalesTaxMaster.findOne({
                where: {
                    id: id
                }
            })
            if (!taxData) {
                throw new NotFoundException(`ERR_SALES_TAX_FOUND`);
            }
            taxData.cityId = salesTaxPayload.cityId;
            taxData.countyId = salesTaxPayload.countyId;
            taxData.rate = salesTaxPayload.rate;
            taxData.isActive = salesTaxPayload.isActive;
            taxData.updatedBy = user.id
            await taxData.save();
            return {
                message: "SUC_SALES_TAX_UPDATE",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }
}
