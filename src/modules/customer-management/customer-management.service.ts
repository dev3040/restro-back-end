import {
    BadRequestException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { AddCustomerDto, UpdateCustomerDto } from "./dto/add-customer.dto";
import { CustomerManagementRepository } from "./customer-management.repository";
import { AddContactDto } from "./dto/add-contact.dto";
import { checkContactExists } from "src/shared/utility/common-function.methods";
import { CustomerContacts } from "src/shared/entity/customer-contacts.entity";
import { In } from "typeorm";
import { ListCustomersDto } from "src/shared/dtos/list-data.dto";

@Injectable()
export class CustomerManagementService {
    constructor(
        @InjectRepository(CustomerManagementRepository)
        private readonly customerManagementRepository: CustomerManagementRepository
    ) { }

    async addCustomer(addCustomer: AddCustomerDto, user): Promise<AppResponse> {
        try {
            const data = await this.customerManagementRepository.addCustomer(
                addCustomer, user);

            return {
                message: "SUC_CUSTOMER_CREATED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getCustomerList(query: ListCustomersDto): Promise<AppResponse> {
        try {
            const data = await this.customerManagementRepository.fetchAllCustomers(query);
            return {
                message: "SUC_CUSTOMER_LIST_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }


    async customerAnalytics(): Promise<AppResponse> {
        try {
            const data = await this.customerManagementRepository.customerAnalytics();
            return {
                message: "SUC_CUSTOMER_ANALYTICS_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Fetch customerManagement details from ID
     * @author Ishita
     * @param id  => Customer id
     */
    async getCustomer(id): Promise<AppResponse> {
        try {
            // Check customerManagement exists with given ID
            const data = await this.customerManagementRepository.getCustomer(id);

            return {
                message: "SUC_CUSTOMER_DETAILS_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    /* Fetch all active customers for Ticket */
    async fetchCustomerData(): Promise<AppResponse> {
        try {
            const data = await this.customerManagementRepository.fetchCustomerData();

            return {
                message: "SUC_CUSTOMER_LIST_FETCHED",
                data: data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editCustomer(updateCustomer: UpdateCustomerDto, id, user): Promise<AppResponse> {
        try {
            const data = await this.customerManagementRepository.editCustomer(updateCustomer, id, user);
            return {
                message: "SUC_CUSTOMER_UPDATED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }


    async activeInactiveCustomer(id, user): Promise<AppResponse> {
        try {
            // Check customer exists with given ID
            const getCustomer = await this.customerManagementRepository.findOne({
                select: ['id', 'isActive'],
                where: {
                    id: id,
                    isDeleted: false
                }
            });
            if (!getCustomer) {
                throw new NotFoundException(`ERR_CUSTOMER_NOT_FOUND`);
            }

            getCustomer.isActive = !getCustomer.isActive;
            getCustomer.updatedBy = user.id;
            await getCustomer.save();

            return {
                message: getCustomer.isActive
                    ? "SUC_CUSTOMER_ACTIVATED_UPDATED"
                    : "SUC_CUSTOMER_DEACTIVATED_UPDATED",
                data: getCustomer
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteCustomers(customers, userId): Promise<AppResponse> {
        try {
            return await this.customerManagementRepository.deleteCustomers(customers, userId);
        } catch (error) {
            throwException(error);
        }
    }


    /* ************************ COntact Info APIs *************************** */

    async addContact(addContact: AddContactDto, user): Promise<AppResponse> {
        try {
            const data = await this.customerManagementRepository.addContact(addContact, user);

            return {
                message: "SUC_CONTACT_CREATED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getContactList(query): Promise<AppResponse> {
        try {
            const data = await this.customerManagementRepository.fetchAllContacts(query);
            return {
                message: "SUC_CONTACT_LIST_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Fetch contact details from ID
     * @author Ishita
     * @param id  => contact id
     */
    async getContact(id): Promise<AppResponse> {
        try {
            const data = await this.customerManagementRepository.getContact(id);

            return {
                message: "SUC_CONTACT_DETAILS_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editContact(updateCustomer: UpdateCustomerDto, id, user): Promise<AppResponse> {
        try {
            await this.customerManagementRepository.editContact(updateCustomer, id, user);
            return {
                message: "SUC_CONTACT_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }


    async activeInactiveContact(id, user): Promise<AppResponse> {
        try {
            const getContact = await checkContactExists(id);
            if (getContact.isPrimary && getContact.isActive) {
                throw new BadRequestException("ERR_PRIMARY_CONTACT_INACTIVE");
            }
            getContact.isActive = !getContact.isActive;
            getContact.updatedBy = user.id;
            await getContact.save();

            return {
                message: getContact.isActive
                    ? "SUC_CONTACT_ACTIVATED_UPDATED"
                    : "SUC_CONTACT_DEACTIVATED_UPDATED",
                data: getContact
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteContact(deleteContact, userId: number): Promise<any> {
        try {
            const getContact = await CustomerContacts.find({
                where: {
                    id: In(deleteContact.ids),
                    isDeleted: false
                },
                select: ["id", "isPrimary"]
            })

            if (getContact.find(i => i.isPrimary)) {
                throw new BadRequestException("ERR_PRIMARY_CONTACT_DELETE");
            }
            const response = await this.customerManagementRepository.deleteCountyContact(deleteContact, userId);
            return response;
        } catch (error) {
            throwException(error);
        }
    }

    async getLatestTransaction(id): Promise<AppResponse> {
        try {
            const data = await this.customerManagementRepository.getLatestTransaction(id);

            return {
                message: "SUC_CUSTOMER_DETAILS_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }
}
