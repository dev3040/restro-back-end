import { DataSource, Repository } from 'typeorm';
import moment from 'moment';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { Customers } from 'src/shared/entity/customers.entity';
import { AddCustomerDto, UpdateCustomerDto } from './dto/add-customer.dto';
import { IsActive } from 'src/shared/enums/is-active.enum';
import { CustomerLinks } from 'src/shared/entity/customer-links.entity';
import { AddCustomerTransactionTypeDto, UpdateCustomerTransactionTypeDto } from './dto/add-customer-transaction-type.dto';
import { checkContactExists, checkCusContactForPrimary, checkCustomerExists, checkCustomerTransactionTypesCount, checkTransactionTypesCount, commonDeleteHandler, formatPrice } from 'src/shared/utility/common-function.methods';
import { CustomerTransactionTypes } from 'src/shared/entity/customer-transaction-types.entity';
import { CustomerContacts } from 'src/shared/entity/customer-contacts.entity';
import { AddContactDto, UpdateContactDto } from './dto/add-contact.dto';
import { TransactionTypes } from 'src/shared/entity/transaction-types.entity';
import { Tickets } from 'src/shared/entity/tickets.entity';
import { TicketStatuses } from 'src/shared/entity/ticket-statuses.entity';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';

@Injectable()
export class CustomerManagementRepository extends Repository<Customers> {
    constructor(readonly dataSource: DataSource) {
        super(Customers, dataSource.createEntityManager());
    }

    async getCustomer(id) {
        try {
            const getCustomer = await this.manager.createQueryBuilder(Customers, "customer")
                .leftJoinAndSelect("customer.customerLinks", "customerLinks")
                .leftJoinAndSelect("customer.transactionTypes", "transactionTypes")
                .leftJoinAndSelect("transactionTypes.transactionType", "transactionType")
                .leftJoinAndSelect("customer.contact", "contact", "contact.isPrimary = true AND contact.isDeleted = false")
                .select(["customer.id", "customer.name", "customer.shortName", "customer.email", "customer.phone", "customer.primaryLocation",
                    "customer.fax", "customer.customerNote", "customer.paymentTerms", "customer.billingNote",
                    "customer.vendorNumber", "customer.isActive", "customer.createdAt", "customer.updatedAt", "transactionTypes.id", "transactionTypes.customerTransactionType",
                    "transactionTypes.price", "transactionTypes.description", "transactionTypes.transactionTypesId", "customerLinks.id",
                    "customerLinks.linkUrl", "customerLinks.description", "transactionType.name", "transactionType.transactionCode", "contact.id", "contact.name"])
                .where("customer.id = :id", { id: id })
                .getOne();
            if (!getCustomer) {
                throw new NotFoundException(`ERR_CUSTOMER_NOT_FOUND`);
            }
            return getCustomer;

        } catch (error) {
            throwException(error);
        }
    }

    async fetchCustomerData() {
        try {
            const [customers, count] = await this.manager.createQueryBuilder(Customers, "customer")
                .select(["customer.id", "customer.name"])
                .where("customer.isDeleted = false AND customer.isActive = true")
                .getManyAndCount();

            return { customers, count };
        } catch (error) {
            throwException(error);
        }
    }

    async addCustomer(addCustomer: AddCustomerDto, user): Promise<Customers> {
        try {
            const { name, email, phone, fax, primaryLocation, isActive, billingNote, customerNote, shortName, helpFulLinks, transactionTypes, vendorNumber, paymentTerms } = addCustomer;

            const customer = new Customers();
            customer.name = name;
            customer.shortName = shortName || null;
            customer.email = email || null;
            customer.phone = phone || null;
            customer.fax = fax || null;
            customer.billingNote = billingNote || null;
            customer.customerNote = customerNote || null;
            customer.primaryLocation = primaryLocation || null;
            customer.vendorNumber = vendorNumber || null;
            customer.paymentTerms = paymentTerms || null;
            customer.isActive = isActive;
            customer.createdBy = user.id;
            await customer.save();

            if (helpFulLinks?.length) {
                const helpFulLinksBulk = helpFulLinks.map((e) => ({
                    customerId: customer.id,
                    linkUrl: e.linkUrl,
                    description: e.description,
                    createdBy: user.id,

                }));
                try {
                    await this.manager.createQueryBuilder()
                        .insert()
                        .into(CustomerLinks)
                        .values(helpFulLinksBulk)
                        .execute();
                } catch (err) {
                    throw new BadRequestException(`${err}&&&helpFulLinks&&&ERROR_MESSAGE`)
                }
            }

            if (transactionTypes?.length) {
                await this.addCustomerTransactionType(transactionTypes, customer.id, user, true);
            } else {
                await this.addCustomerTransactionType(transactionTypes, customer.id, user, false);
            }
            return await this.getCustomer(customer.id);

        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllCustomers(filterDto): Promise<{ customerManagements: Customers[]; page: object }> {
        try {
            const listQuery = this.manager
                .createQueryBuilder(Customers, "customer")
                .select(["customer.id", "customer.name", "customer.shortName", "customer.email", "customer.phone", "customer.isActive", "customer.createdAt"])
                .where("(customer.isDeleted = false)");

            if (filterDto) {
                if (filterDto.limit && filterDto.offset) {
                    listQuery.offset(filterDto.offset * filterDto.limit);
                    listQuery.limit(filterDto.limit);
                    listQuery.orderBy(`customer.${filterDto.orderBy}`, filterDto.orderDir);
                }
                if (filterDto.search) {
                    listQuery.andWhere("(customer.name ilike :search)", { search: `%${filterDto.search}%` });
                }

                if (filterDto?.activeStatus == IsActive.ACTIVE) {
                    listQuery.andWhere("(customer.isActive = true)")
                }
                if (filterDto?.activeStatus == IsActive.INACTIVE) {
                    listQuery.andWhere("(customer.isActive = false)")
                }

                listQuery.orderBy(`customer.${filterDto.orderBy}`, filterDto.orderDir);
            }

            const customerManagementsWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = customerManagementsWithCount[1];
            }

            return { customerManagements: customerManagementsWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async customerAnalytics(): Promise<{ totalCustomers: number, activeCustomers: number, newCustomersInMonth: number, customerTicketData: { customerName: string, ticketCount: number }[], customerEstimationFees: any }> {
        try {
            let customerTicketData = [];
            const startOfMonth = moment().startOf('month').format('YYYY-MM-DD'); //start date of the month
            const endOfMonth = moment().endOf('month').format('YYYY-MM-DD'); //end date of the month

            //total customers
            const totalCustomers = await this.manager.createQueryBuilder(Customers, "customer")
                .where("customer.isDeleted = false")
                .getCount();

            //active customers
            const activeCustomers = await this.manager.createQueryBuilder(Customers, "customer")
                .where("customer.isDeleted = false")
                .andWhere("customer.isActive = true")
                .getCount();

            //new customers in current month
            const newCustomersInMonth = await this.manager.createQueryBuilder(Customers, "customer")
                .where("customer.isDeleted = false")
                .andWhere(`((("created_at") BETWEEN '${startOfMonth}' AND '${endOfMonth}') OR (DATE("created_at") = '${startOfMonth}') OR (DATE("customer"."created_at") = '${endOfMonth}'))`)
                .getCount();

            //find 'completed' slug from Ticket status
            const getCompletedStatus = await TicketStatuses.findOne({
                select: ["id", "slug"],
                where: { slug: "completed" }
            })

            //get open ticket count of customer
            let query = this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoinAndSelect("ticket.customer", "customer")
                .select('customer.name', 'customer')
                .addSelect('COUNT(ticket.id)', 'ticketCount')
                .where(`ticket.isDeleted = false`)

            if (getCompletedStatus) {
                query.andWhere(`ticket.ticketStatusId != :ticketStatus`, { ticketStatus: getCompletedStatus?.id })
            }
            const ticketCounts = await query
                .groupBy('ticket.customerId, customer.name')
                .orderBy('"ticketCount"', 'DESC')
                .limit(5)   //top 5 
                .getRawMany();

            customerTicketData = ticketCounts.map(element => {
                return {
                    customerName: element?.customer,
                    ticketCount: parseInt(element.ticketCount),
                };
            });

            let estimationQuery = this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoinAndSelect("ticket.customer", "customer")
                .select('customer.name', 'customer')
                .addSelect('SUM(COALESCE(ticket.estimationFees, 0))', 'totalEstimationFees')
                .where(`ticket.isDeleted = false AND customer.isDeleted = false`);

            const estimationFeesTotal = await estimationQuery
                .groupBy('ticket.customerId, customer.name')
                .orderBy('"totalEstimationFees"', 'DESC')
                .limit(5)
                .getRawMany();
                
            const customerEstimationFees = estimationFeesTotal.map(element => {
                return {
                    customerName: element?.customer,
                    totalEstimationFees: parseFloat(element.totalEstimationFees),
                };
            });

            return {
                totalCustomers, activeCustomers, newCustomersInMonth, customerTicketData, customerEstimationFees
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editCustomer(updateCustomer: UpdateCustomerDto, id, user): Promise<Customers> {
        try {
            const { name, email, phone, fax, primaryLocation, isActive, billingNote, customerNote, shortName, helpFulLinks, transactionTypes, vendorNumber, paymentTerms } = updateCustomer;

            const customer = await checkCustomerExists(id)

            customer.name = name;
            customer.shortName = shortName;
            customer.email = email;
            customer.phone = phone;
            customer.fax = fax;
            customer.billingNote = billingNote;
            customer.customerNote = customerNote;
            customer.primaryLocation = primaryLocation;
            customer.vendorNumber = vendorNumber;
            customer.paymentTerms = paymentTerms;
            customer.isActive = isActive;
            customer.updatedBy = user.id;
            await customer.save();

            await CustomerLinks.delete({ customerId: customer.id });

            if (helpFulLinks?.length) {
                const helpFulLinksBulk = helpFulLinks.map(link => ({
                    customerId: customer.id,
                    linkUrl: link.linkUrl,
                    description: link.description,
                    createdBy: user.id
                }));
                try {
                    await this.manager.createQueryBuilder()
                        .insert()
                        .into(CustomerLinks)
                        .values(helpFulLinksBulk)
                        .execute();
                } catch (err) {
                    throw new BadRequestException(`${err}&&&helpFulLinks&&&ERROR_MESSAGE`)
                }
            }

            if (transactionTypes?.length) {
                await this.editCustomerTransactionType(transactionTypes, user, id);
            }

            return this.getCustomer(id);
        } catch (error) {
            throwException(error);
        }
    }

    async addCustomerTransactionType(addCustomerTransactionType: AddCustomerTransactionTypeDto[], customerId, user, checkData: boolean) {
        try {
            let transactionTypeBulk = [];

            if (checkData) {
                //given transaction types
                const transactionTypeIds = addCustomerTransactionType.map(v => v.transactionTypesId);

                //all transaction types
                const transactionTypeExist = await checkTransactionTypesCount(transactionTypeIds);
                if (transactionTypeExist !== transactionTypeIds.length) {
                    throw new NotFoundException(`ERR_TRANSACTION_TYPE_NOT_FOUND&&&transactionTypes`)
                }

                transactionTypeBulk = addCustomerTransactionType.map(e => ({
                    customerId,
                    description: e.description,
                    transactionTypesId: e.transactionTypesId,
                    customerTransactionType: e.customerTransactionType,
                    price: formatPrice(e.price),
                    createdBy: user.id
                }));

            } else {
                /* automatic mapping */
                const transactionTypesData = await TransactionTypes.find({
                    where: { isDeleted: false }
                })
                if (transactionTypesData.length) {
                    transactionTypeBulk = transactionTypesData.map(e => ({
                        customerId,
                        transactionTypesId: e.id,
                        price: e.price,
                        createdBy: user.id
                    }));
                }
            }

            if (transactionTypeBulk.length) {
                try {
                    await this.manager.createQueryBuilder()
                        .insert()
                        .into(CustomerTransactionTypes)
                        .values(transactionTypeBulk)
                        .execute();
                } catch (err) {
                    throw new BadRequestException(`${err}&&&&&&transactionTypes&&&ERROR_MESSAGE`)
                }
            }
        } catch (error) {
            throwException(error);
        }
    }

    async editCustomerTransactionType(updateCustomerTransactionType: UpdateCustomerTransactionTypeDto[], user, customerId) {
        try {
            //given customer transaction types
            const customerTransactionTypeIds = updateCustomerTransactionType.map(v => v.customerTransactionTypeId);

            //all customer transaction types
            const custTransactionExist = await checkCustomerTransactionTypesCount(customerTransactionTypeIds, customerId);

            if (custTransactionExist === 0) {
                throw new NotFoundException(`ERR_CUS_TRANSACTION_TYPE_NOT_FOUND&&&transactionTypes`);
            }

            try {
                if (updateCustomerTransactionType?.length) {

                    const promises = updateCustomerTransactionType.map(async payload => {
                        let { customerTransactionTypeId, price, customerTransactionType, description } = payload;
                        price = formatPrice(price)
                        await this.createQueryBuilder()
                            .update(CustomerTransactionTypes)
                            .set({
                                price,
                                description,
                                customerTransactionType,
                                updatedBy: user.id
                            })
                            .where("id = :id", { id: customerTransactionTypeId })
                            .andWhere("customer_id = :customerId", { customerId: customerId })
                            .execute();
                    });

                    await Promise.all(promises);
                }
            } catch (err) {
                throw new BadRequestException(`Error processing transactions: ${err}`);
            }
        } catch (error) {
            throwException(error);
        }
    }
    async deleteCustomers(customers, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                Customers,
                customers,
                userId,
                success.SUC_CUSTOMER_DELETED,
                error.ERR_CUSTOMER_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }


    /* ================== contact apis ================= */

    async getContact(id) {
        try {
            const contact = await this.manager.createQueryBuilder(CustomerContacts, "cc")
                .leftJoinAndSelect("cc.customer", "customer")
                .select(["cc", "customer.id", "customer.name"])
                .where("cc.id =:id", { id: id })
                .andWhere("cc.isDeleted = false")
                .getOne();
            if (!contact) {
                throw new NotFoundException(`ERR_CONTACT_NOT_FOUND`);
            }
            return contact;

        } catch (error) {
            throwException(error);
        }
    }

    async addContact(addContact: AddContactDto, user): Promise<CustomerContacts> {
        try {
            const { customerId, role, isActive, name, generalNotes, billingNotes, email, phone, isPrimary } = addContact;

            await checkCustomerExists(customerId);
            const primaryContact = await checkCusContactForPrimary(customerId)
            if (isPrimary && !isActive) {
                throw new BadRequestException("ERR_PRIMARY_CONTACT_INACTIVE");
            }

            const newContact = new CustomerContacts();
            newContact.name = name;
            newContact.customerId = customerId;
            newContact.role = role;
            newContact.email = email;
            newContact.phone = phone;
            newContact.generalNotes = generalNotes;
            newContact.billingNotes = billingNotes;
            newContact.isActive = isActive;
            newContact.isPrimary = isPrimary;
            newContact.createdBy = user.id;
            await newContact.save();

            if (isPrimary && primaryContact) {
                primaryContact.isPrimary = false;
                primaryContact.updatedBy = user.id;
                await primaryContact.save();
            }
            return newContact;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllContacts(filterDto): Promise<{ contacts: CustomerContacts[]; page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(CustomerContacts, "customerContact")
                .leftJoinAndSelect("customerContact.customer", "customer")
                .select(["customerContact.id", "customerContact.name", "customerContact.isActive",
                    "customerContact.email", "customerContact.customerId", "customerContact.phone", "customerContact.createdAt", "customerContact.isPrimary", "customerContact.role", "customerContact.billingNotes",
                    "customerContact.generalNotes", "customer.id", "customer.name"])
                .where("(customerContact.isDeleted = false)");

            if (filterDto) {
                if (filterDto.limit && filterDto.offset) {
                    listQuery.offset(filterDto.offset * filterDto.limit);
                    listQuery.limit(filterDto.limit);
                    listQuery.orderBy(`customerContact.${filterDto.orderBy}`, filterDto.orderDir);
                }

                if (filterDto?.customerId) {
                    listQuery.andWhere("(customerContact.customerId = :customerId)", { customerId: filterDto?.customerId })
                }

                if (filterDto?.search) {
                    listQuery.andWhere("((customerContact.email ilike :search) OR (customerContact.role ilike :search) OR (customerContact.name ilike :search) OR (customerContact.phone ilike :search))", { search: `%${filterDto.search}%`, keyword: filterDto.search });
                }

                if (filterDto?.activeStatus == IsActive.ACTIVE) {
                    listQuery.andWhere("(customerContact.isActive = true)")
                }
                if (filterDto?.activeStatus == IsActive.INACTIVE) {
                    listQuery.andWhere("(customerContact.isActive = false)")
                }

                listQuery.orderBy(`customerContact.isPrimary`, `DESC`)
                    .addOrderBy(`customerContact.id`, filterDto.orderDir);
            }

            const data = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = data[1];
            }

            return { contacts: data[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async editContact(updateContact: UpdateContactDto, id, user): Promise<CustomerContacts> {
        try {
            const { customerId, role, phone, isActive, generalNotes, billingNotes, isPrimary, email } = updateContact;

            const contact = await checkContactExists(id);

            await checkCustomerExists(customerId);

            const primaryContact = await checkCusContactForPrimary(contact.customerId);
            if (isPrimary && !isActive) {
                throw new BadRequestException("ERR_PRIMARY_CONTACT_INACTIVE");
            }
            contact.phone = phone;
            contact.email = email;
            contact.role = role;
            contact.generalNotes = generalNotes;
            contact.billingNotes = billingNotes;
            contact.isActive = isActive;
            contact.isPrimary = isPrimary;
            contact.updatedBy = user.id;
            await contact.save();

            if (primaryContact && primaryContact?.id !== +id && isPrimary) {
                primaryContact.isPrimary = false;
                primaryContact.updatedBy = user.id;
                await primaryContact.save();
            }

            return contact;
        } catch (error) {
            throwException(error);
        }
    }

    async getLatestTransaction(id) {
        try {
            const tickets = await this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoinAndSelect("ticket.ticketStatus", "ticketStatus")
                .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
                .leftJoinAndSelect("basicInfo.transactionType", "transactionType")
                .where('ticket.customerId = :id and ticket.isDeleted=false', { id })
                .orderBy('ticket.createdAt', 'DESC')
                .select(["ticket.id", "ticket.createdAt",
                    "ticket.endDate", "ticketStatus.id", "ticketStatus.internalStatusName",
                    "transactionType.id", "transactionType.name", "basicInfo.transactionTypeId"])
                .limit(20)
                .getMany();
            return tickets;

        } catch (error) {
            throwException(error);
        }
    }

    async deleteCountyContact(deleteContact, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                CustomerContacts,
                deleteContact,
                userId,
                success.SUC_CONTACT_DELETED,
                error.ERR_CONTACT_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}
