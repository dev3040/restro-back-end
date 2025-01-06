import { DataSource, ILike, In, IsNull, Repository } from 'typeorm';
import {
    BadRequestException,
    ConflictException,
    Injectable, NotFoundException,
} from '@nestjs/common';
import { AddCountyDto, UpdateCountyDto } from './dto/add-county.dto';
import { throwException } from "../../shared/utility/throw-exception";
import { IsActive } from 'src/shared/enums/is-active.enum';
import { User } from 'src/shared/entity/user.entity';
import { TitleCounties } from 'src/shared/entity/title-counties.entity';
import { CountyProfile } from 'src/shared/entity/county-profile.entity';
import { CountyContacts } from 'src/shared/entity/county-contacts.entity';
import { AddContactDto, UpdateContactDto } from './dto/add-contact.dto';
import { checkCountyContactExists, checkCountyContactForPrimary, filterYearlyGraph, checkCheatSheetExists, commonDeleteHandler } from 'src/shared/utility/common-function.methods';
import { CountyLinks } from 'src/shared/entity/county-links.entity';
import { SaveCountyLinksDto } from './dto/save-county-links.dto';
import { Tickets } from 'src/shared/entity/tickets.entity';
import { AddCountyCheatSheetDto, UpdateCheatSheetDto } from './dto/add-county-cheat-sheet.dto';
import { CountyCheatSheet } from 'src/shared/entity/county-cheetsheet.entity';
import { CountyFedexAddress } from 'src/shared/entity/county-fedex-address.entity';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import moment from 'moment';
import { SaveCountyRatesDto } from './dto/save-county-milage-rates.dto';
import { CountyMilage } from 'src/shared/entity/county-milage.entity';
import { YearlyRates } from 'src/shared/entity/county-yearly-rate.entity';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';
import { CountyProcessing } from 'src/shared/entity/county-processing.entity';
import { TransactionTypes } from 'src/shared/entity/transaction-types.entity';
import { CountyTransactionWorks } from 'src/shared/entity/county-transaction-works.entity';


@Injectable()
export class CountyMasterRepository extends Repository<TitleCounties> {
    constructor(readonly dataSource: DataSource) {
        super(TitleCounties, dataSource.createEntityManager());
    }

    async addCounty(addCounty: AddCountyDto, user: User): Promise<TitleCounties> {
        try {
            const counties = await this.manager.createQueryBuilder(TitleCounties, "counties")
                .select(["counties.id", "counties.name", "counties.code"])
                .where(`(LOWER(counties.code) = :code)`, {
                    code: `${addCounty.code.toLowerCase()}`
                })
                .andWhere(`(counties.isDeleted = false)`)
                .getOne();
            if (counties) {
                throw new ConflictException("ERR_COUNTY_EXIST&&&name");
            }
            const county = this.create({ ...addCounty, createdBy: user.id });
            await this.save(county);
            return county;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllCounty(filterDto?: any): Promise<{ counties: TitleCounties[]; page: object }> {
        try {
            const listQuery = this.manager
                .createQueryBuilder(TitleCounties, "counties")
                .leftJoinAndSelect("counties.state", "state")
                .leftJoinAndSelect("counties.countyCheatSheet", "countyCheatSheet")
                .select([
                    "counties.id", "counties.name", "counties.code", "counties.isActive",
                    "state.id", "state.name", "state.code",
                    "countyCheatSheet.businessStateChange"
                ])
                .where("(counties.is_deleted = false)");

            if (filterDto) {
                listQuery.offset(filterDto.offset * filterDto.limit);
                listQuery.limit(filterDto.limit);
                listQuery.orderBy(`counties.${filterDto.orderBy}`, filterDto.orderDir, 'NULLS LAST');
            }

            if (filterDto?.search) {
                listQuery.andWhere("(counties.code ILIKE :search OR counties.name ILIKE :search OR state.name ILIKE :search OR state.code ILIKE :search OR (CAST(countyCheatSheet.businessStateChange AS TEXT) ilike :search))", { search: `%${filterDto.search}%` });
            }

            if (filterDto?.activeStatus == IsActive.ACTIVE) {
                listQuery.andWhere("(counties.isActive = true)");
            }
            if (filterDto?.activeStatus == IsActive.INACTIVE) {
                listQuery.andWhere("(counties.isActive = false)");
            }

            const countyWithCount = await listQuery.getManyAndCount();
            const counties = countyWithCount[0];
            const countyIds = counties.map(county => county.id);


            if (countyIds.length > 0) {
                let ticketQuery = this.manager.createQueryBuilder(Tickets, "ticket")
                    .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
                    .leftJoinAndSelect("basicInfo.transactionType", "transactionType")
                    .leftJoin("ticket.buyerInfo", "buyerInfo")
                    .select([
                        "buyerInfo.countyId",
                        "ticket.id",
                        `("ticket"."end_date" - DATE("ticket"."sent_to_dmv_at")) as "periodOfProcess"`
                    ])
                    .where("(ticket.isDeleted = false) and (buyerInfo.countyId IN (:...countyIds))", { countyIds })
                    .groupBy("ticket.id, buyerInfo.countyId");

                const result = await ticketQuery.getRawMany();

                // Calculate average period of process for each county
                const countyProcessTimes = result.reduce((acc, row) => {
                    const countyId = row.buyerInfo_county_id;
                    if (!acc[countyId]) {
                        acc[countyId] = [];
                    }
                    if (row.periodOfProcess) {
                        acc[countyId].push(row.periodOfProcess);
                    }
                    return acc;
                }, {});

                const avgPeriodOfProcess: any = {};
                for (const countyId in countyProcessTimes) {
                    const periods = countyProcessTimes[countyId];
                    const avg = periods.reduce((sum, period) => sum + period, 0) / periods.length;
                    avgPeriodOfProcess[countyId] = Math.round(avg);
                }

                // Assign average period of process to counties
                counties.forEach((county: any) => {
                    county.avgPeriodOfProcess = avgPeriodOfProcess[county.id] || null;
                });
            }

            if (filterDto) {
                filterDto.count = countyWithCount[1];
            }

            return { counties, page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async getCountyDetails(id: number): Promise<TitleCounties> {
        try {
            const county = this.manager
                .createQueryBuilder(TitleCounties, "counties")
                .leftJoinAndSelect("counties.state", "state")
                .leftJoinAndSelect("counties.countyProfile", "countyProfile")
                .leftJoinAndSelect("counties.countyProcessing", "countyProcessing")
                .leftJoinAndSelect("countyProfile.fedExData", "fedExData", "fedExData.isDeleted = false")
                .leftJoinAndSelect("fedExData.fedexServiceMaster", "fedexServiceMaster")
                .select(["counties.id", "counties.name", "counties.code", "counties.isActive", "state.id", "state.name", "state.code", "counties.createdAt",
                    "countyProfile.id", "countyProfile.name", "countyProfile.phone", "countyProfile.email", "countyProfile.address", "countyProfile.notes",
                    "countyProfile.physicalAddress", "countyProfile.mailingAddress", "countyProfile.shippingAddress",
                    "countyProfile.mainLocation", "countyProfile.role",
                    "countyProcessing.isTransactionPerWork",
                    "fedExData.id", "fedExData.profileId", "fedExData.contactName", "fedExData.companyName", "fedExData.phone", "fedExData.location", "fedExData.serviceTypeId",
                    "fedexServiceMaster"
                ])
                .where("counties.is_deleted = false AND counties.id = :id", { id })
                .getOne();

            return county;
        } catch (error) {
            throwException(error);
        }
    }

    async editCounty(updateCounty: UpdateCountyDto, id, user): Promise<TitleCounties> {
        try {
            const county = await this.findOne({ where: { id: id, isDeleted: false } });
            if (!county) throw new NotFoundException(`ERR_COUNTY_NOT_FOUND&&&id`);

            if (updateCounty?.name) {
                const county = await this.manager.createQueryBuilder(TitleCounties, "county")
                    .select(["county.id", "county.name", "county.code"])
                    .where(`(LOWER(county.code) = :code)`, {
                        code: `${updateCounty.code.toLowerCase()}`
                    })
                    .andWhere(`(county.isDeleted = false)`)
                    .andWhere(`(county.id != :id)`, { id })
                    .getOne();

                if (county) {
                    throw new ConflictException("ERR_COUNTY_EXIST&&&name");
                }

            }
            county.name = updateCounty?.name;
            county.code = updateCounty.code
            county.updatedBy = user.id;
            county.stateId = updateCounty.stateId;
            county.isActive = updateCounty.isActive;

            await county.save();
            return county;
        } catch (error) {
            throwException(error);
        }
    }

    async saveCountyProfile(saveProfileDto, countyId, user) {
        try {
            const existingCountyProfile = await CountyProfile.findOne({ where: { countyId } });
            let countyData, fedExData;
            const { mailingAddress, shippingAddress, physicalAddress, fedExAddress, ...rest } = saveProfileDto;
            const payload = {
                mailingAddress: JSON.stringify(mailingAddress),
                shippingAddress: JSON.stringify(shippingAddress),
                physicalAddress: JSON.stringify(physicalAddress),
                countyId,
                ...rest
            }
            if (existingCountyProfile) {
                await CountyProfile.update(existingCountyProfile.id, { ...payload, updatedBy: user.id });
            } else {
                countyData = await CountyProfile.create({ ...payload, createdBy: user.id });
                await countyData.save();
            }
            countyData = await CountyProfile.findOne({ where: { countyId } });
            fedExData = await CountyFedexAddress.findOne({ where: { profileId: countyData.id, isDeleted: false } })
            if (fedExAddress) {
                const { isDeleted, ...payload } = fedExAddress;
                if (isDeleted) {
                    fedExData.isDeleted = true;
                    await fedExData.save();
                } else {
                    if (fedExData) {
                        await CountyFedexAddress.update(fedExData.id, { ...payload, updatedBy: user.id });
                        fedExData = await CountyFedexAddress.findOne({ where: { profileId: countyData.id, isDeleted: false } });
                    } else {
                        fedExData = await CountyFedexAddress.create({ profileId: countyData.id, createdBy: user.id, ...payload });
                        await fedExData.save();
                    }
                }

            }
            return { countyData, fedExData };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteCounties(deleteCounties, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                TitleCounties,
                deleteCounties,
                userId,
                success.SUC_COUNTY_DELETED,
                error.ERR_COUNTY_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }

    /* ================== links apis ================= */

    async getLink(id) {
        try {
            const link = await this.manager.createQueryBuilder(CountyLinks, "cc")
                .leftJoinAndSelect("cc.county", "county")
                .select(["cc", "county.id", "county.name"])
                .where("cc.id =:id", { id: id })
                .andWhere("cc.isDeleted = false")
                .getOne();
            if (!link) {
                throw new NotFoundException(`ERR_LINK_NOT_FOUND`);
            }
            return link;

        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllLinks(filterDto): Promise<{ links: CountyLinks[]; page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(CountyLinks, "countyLink")
                .leftJoinAndSelect("countyLink.county", "county")
                .select(["countyLink.id", "countyLink.linkUrl", "countyLink.description",
                    "county.id", "county.name"])
                .where("(countyLink.isDeleted = false)");

            if (filterDto) {
                if (filterDto.limit && filterDto.offset) {
                    listQuery.offset(filterDto.offset * filterDto.limit);
                    listQuery.limit(filterDto.limit);
                    listQuery.orderBy(`countyLink.${filterDto.orderBy}`, filterDto.orderDir);
                }

                if (filterDto?.countyId) {
                    listQuery.andWhere("(countyLink.countyId = :countyId)", { countyId: filterDto?.countyId })
                }
            }

            const data = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = data[1];
            }

            return { links: data[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async saveLinks(saveLinks: SaveCountyLinksDto, id, user) {
        try {
            if (parseInt(id)) {
                const countyLink = await CountyLinks.findOne({ where: { id } })
                if (!countyLink) throw new NotFoundException(`ERR_LINK_NOT_FOUND&&&id`);
                countyLink.linkUrl = saveLinks.linkUrl;
                countyLink.description = saveLinks.description;
                countyLink.updatedBy = user.id;
                return countyLink.save();
            } else {
                const countyLink = await CountyLinks.create({ ...saveLinks, createdBy: user.id });
                return countyLink.save();
            }

        } catch (error) {
            throwException(error);
        }
    }

    /* ================== contact apis ================= */

    async getContact(id) {
        try {
            const contact = await this.manager.createQueryBuilder(CountyContacts, "cc")
                .leftJoinAndSelect("cc.county", "county")
                .select(["cc", "county.id", "county.name"])
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

    async addContact(addContact: AddContactDto, user): Promise<CountyContacts> {
        try {
            const { countyId, isActive, isPrimary } = addContact;

            const primaryContact = await checkCountyContactForPrimary(countyId)
            if (isPrimary && !isActive) {
                throw new BadRequestException("ERR_PRIMARY_CONTACT_INACTIVE");
            }

            const newContact = new CountyContacts();
            newContact.name = addContact.name;
            newContact.countyId = countyId;
            newContact.title = addContact.title;
            newContact.email = addContact.email;
            newContact.phone = addContact.phone;
            newContact.address = addContact.address;
            newContact.notes = addContact.notes;
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

    async fetchAllContact(filterDto): Promise<{ contacts: CountyContacts[]; page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(CountyContacts, "countyContact")
                .leftJoinAndSelect("countyContact.county", "county")
                .select(["countyContact.id", "countyContact.name", "countyContact.isActive",
                    "countyContact.email", "countyContact.countyId", "countyContact.phone",
                    "countyContact.createdAt", "countyContact.isPrimary",
                    "countyContact.notes", "countyContact.address", "countyContact.title",
                    "county.id", "county.name"])
                .where("(countyContact.isDeleted = false)");

            if (filterDto) {
                if (filterDto.limit && filterDto.offset) {
                    listQuery.offset(filterDto.offset * filterDto.limit);
                    listQuery.limit(filterDto.limit);
                    listQuery.orderBy(`countyContact.${filterDto.orderBy}`, filterDto.orderDir);
                }

                if (filterDto?.countyId) {
                    listQuery.andWhere("(countyContact.countyId = :countyId)", { countyId: filterDto?.countyId })
                }

                if (filterDto?.search) {
                    listQuery.andWhere("((countyContact.email ilike :search) OR (countyContact.title ilike :search) OR (countyContact.name ilike :search) OR (countyContact.phone ilike :search))", { search: `%${filterDto.search}%`, keyword: filterDto.search });
                }

                if (filterDto?.activeStatus == IsActive.ACTIVE) {
                    listQuery.andWhere("(countyContact.isActive = true)")
                }
                if (filterDto?.activeStatus == IsActive.INACTIVE) {
                    listQuery.andWhere("(countyContact.isActive = false)")
                }

                listQuery.orderBy(`countyContact.isPrimary`, `DESC`)
                    .addOrderBy(`countyContact.${filterDto.orderBy}`, filterDto.orderDir);
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

    async editContact(updateContact: UpdateContactDto, id, user): Promise<CountyContacts> {
        try {
            const { isActive, isPrimary } = updateContact;

            const contact = await checkCountyContactExists(id);
            const primaryContact = await checkCountyContactForPrimary(contact.countyId);
            if (isPrimary && !isActive) {
                throw new BadRequestException("ERR_PRIMARY_CONTACT_INACTIVE");
            }
            contact.phone = updateContact.phone;
            contact.name = updateContact.name;
            contact.email = updateContact.email;
            contact.title = updateContact.title;
            contact.address = updateContact.address;
            contact.notes = updateContact.notes;
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

    async getAnalytics(countyId, query: AnalyticsQueryDto): Promise<{ totalTickets, completedTickets, inProgressTickets, graphData }> {
        try {
            let { year } = query;
            if (!year) {
                year = moment().year();
            }

            const countyConditions = "buyerInfo.countyId = :countyId";
            const activeConditions = "ticket.isDeleted = false and ticket.isActive = true and buyerInfo.isDeleted = false and buyerInfo.isActive = true";

            const ticketCounts = await this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoin("ticket.buyerInfo", "buyerInfo")
                .select("COUNT(ticket.id)", "totalTickets")
                .addSelect("COUNT(CASE WHEN ticket.endDate IS NOT NULL THEN 1 END)", "completedTickets")
                .addSelect("COUNT(CASE WHEN ticket.endDate IS NULL THEN 1 END)", "inProgressTickets")
                .where(countyConditions, { countyId })
                .andWhere(activeConditions)
                .getRawOne();

            const { totalTickets, completedTickets, inProgressTickets } = ticketCounts;

            let graphData;
            if (!!query.isWeekly) {
                const weekStart = moment().startOf('week').toDate();
                const weekEnd = moment().endOf('week').toDate();
                const weeklyData = await this.manager.createQueryBuilder(Tickets, "ticket")
                    .leftJoin("ticket.buyerInfo", "buyerInfo")
                    .select("EXTRACT(DOW FROM ticket.createdAt)", "day")
                    .addSelect("COUNT(ticket.id)", "count")
                    .where(countyConditions, { countyId })
                    .andWhere(activeConditions)
                    .andWhere("ticket.createdAt BETWEEN :weekStart AND :weekEnd", { weekStart, weekEnd })
                    .groupBy("EXTRACT(DOW FROM ticket.createdAt)")
                    .getRawMany();

                const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                graphData = daysOfWeek.map((day, index) => {
                    const dayData = weeklyData.find(d => d.day == index);
                    return { name: day, count: dayData ? parseInt(dayData.count) : 0 };
                });
            } else {
                const monthlyData = await this.manager.createQueryBuilder(Tickets, "ticket")
                    .leftJoin("ticket.buyerInfo", "buyerInfo")
                    .select("EXTRACT(MONTH FROM ticket.createdAt)", "month")
                    .addSelect("COUNT(ticket.id)", "count")
                    .where(countyConditions, { countyId })
                    .andWhere(activeConditions)
                    .andWhere("EXTRACT(YEAR FROM ticket.createdAt) = :year", { year })
                    .groupBy("EXTRACT(MONTH FROM ticket.createdAt)")
                    .getRawMany();

                graphData = filterYearlyGraph(monthlyData);
            }

            return { totalTickets, completedTickets, inProgressTickets, graphData };
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllTickets(filterDto, countyId): Promise<{ tickets: any; page: object, avgPeriodOfProcess }> {
        try {
            let { offset, limit, orderDir, orderBy, search } = filterDto;

            let listQuery = this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoinAndSelect("ticket.customer", "customer")
                .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
                .leftJoinAndSelect("basicInfo.transactionType", "transactionType")
                .leftJoin("ticket.buyerInfo", "buyerInfo")
                .select([
                    "ticket.id", "ticket.customerId",
                    "ticket.docReceivedDate", "ticket.startDate", "ticket.createdAt",
                    "ticket.endDate", "ticket.sentToDmvAt", "ticket.endDate", "ticket.sentToDmvBy", "ticket.isActive", "ticket.purchaseDate",
                    "customer.id", "customer.name", "customer.email",
                    "basicInfo.id", "basicInfo.transactionTypeId",
                    "transactionType.id", "transactionType.name",
                    `("ticket"."end_date" - DATE("ticket"."sent_to_dmv_at")) as "periodOfProcess"`
                ])
                .where(`(ticket.isDeleted = false) and (buyerInfo.countyId = :countyId) and (ticket.isActive = true)`, { countyId });

            if (filterDto) {
                if (search) {
                    listQuery.andWhere("((customer.name ilike :search) OR (customer.email ilike :search))", { search: `%${search}%` });
                }

                // Pagination
                if (offset && limit) {
                    listQuery = listQuery.take(limit)
                        .skip(offset * limit);
                }

                // Sorting
                listQuery.orderBy(`ticket.${orderBy}`, orderDir);
            }

            const result = await listQuery.getRawAndEntities();
            const { raw, entities } = result;

            // Map the custom periodOfProcess to each ticket entity
            const tickets = entities.map((entity, index) => {
                return {
                    ...entity,
                    periodOfProcess: raw[index].periodOfProcess
                };
            });

            // Filter out invalid periodOfProcess values
            const validPeriods = raw
                .map(item => parseFloat(item.periodOfProcess))
                .filter(period => !isNaN(period));

            // Calculate the average periodOfProcess and round it to the nearest integer
            const totalPeriodOfProcess = validPeriods.reduce((acc, curr) => acc + curr, 0);
            const avgPeriodOfProcess = validPeriods.length > 0 ? Math.round(totalPeriodOfProcess / validPeriods.length) : 0;

            if (filterDto) {
                filterDto.count = raw.length;
            }

            return { tickets, page: filterDto, avgPeriodOfProcess };

        } catch (error) {
            throwException(error);
        }
    }

    async deleteCountyContact(deleteContact, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                CountyContacts,
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

    /** --------------- county cheat sheet apis  ----------------------------------  */

    async addCheatSheet(addCheatSheet: AddCountyCheatSheetDto, user: User) {
        try {

            const cheatSheet = new CountyCheatSheet();
            const cheatSheetExist = await checkCheatSheetExists(addCheatSheet.countyId);
            if (cheatSheetExist.exists) {
                throw new Error(`ERROR_MESSAGE`);
            }
            cheatSheet.countyId = addCheatSheet.countyId;
            cheatSheet.bizAndRegAddComBizLic = addCheatSheet.bizAndRegAddComBizLic;
            cheatSheet.bizAndRegAddComBusinessLicense = addCheatSheet.bizAndRegAddComBusinessLicense;
            cheatSheet.bizAndRegAddComProofOfResidency = addCheatSheet.bizAndRegAddComProofOfResidency;
            cheatSheet.bizAndRegAddResBizLic = addCheatSheet.bizAndRegAddResBizLic;
            cheatSheet.bizAndRegAddResBusinessLicense = addCheatSheet.bizAndRegAddResBusinessLicense;
            cheatSheet.note = addCheatSheet.note;
            cheatSheet.businessLicense = addCheatSheet.businessLicense;
            cheatSheet.businessStateChange = addCheatSheet.businessStateChange;
            cheatSheet.commercialPlateFormRequired = addCheatSheet.commercialPlateFormRequired;
            cheatSheet.resBizAndComPeriod = addCheatSheet.resBizAndComPeriod;
            cheatSheet.mailingFees = addCheatSheet.mailingFees;
            cheatSheet.resIndPeriod = addCheatSheet.resIndPeriod;
            cheatSheet.leasedRegAddTypeBizAndResAddComBizLic = addCheatSheet.leasedRegAddTypeBizAndResAddComBizLic;
            cheatSheet.bizAndRegAddComBusinessLicense = addCheatSheet.bizAndRegAddComBusinessLicense;
            cheatSheet.bizAndRegAddComProofOfResidency = addCheatSheet.bizAndRegAddComProofOfResidency;
            cheatSheet.leasedRegAddTypeBizAndResAddComProofRes = addCheatSheet.leasedRegAddTypeBizAndResAddComProofRes;
            cheatSheet.leasedRegAddTypeBizAndResAddResBizLic = addCheatSheet.leasedRegAddTypeBizAndResAddResBizLic;
            cheatSheet.leasedRegAddTypeBizAndResAddResDriverLicense = addCheatSheet.leasedRegAddTypeBizAndResAddResDriverLicense;
            cheatSheet.leasedRegAddTypeBizAndResAddResLetterOfAuth = addCheatSheet.leasedRegAddTypeBizAndResAddResLetterOfAuth;
            cheatSheet.leasedRegAddTypeBizAndResAddResProofRes = addCheatSheet.leasedRegAddTypeBizAndResAddResProofRes;
            cheatSheet.leasedToBizAndRegAddComBizLic = addCheatSheet.leasedToBizAndRegAddComBizLic;
            cheatSheet.mailingFeesRequired = addCheatSheet.mailingFeesRequired;
            cheatSheet.noBlankChecks = addCheatSheet.noBlankChecks;
            cheatSheet.businessLicense = addCheatSheet.businessLicense;
            cheatSheet.plateExchange = addCheatSheet.plateExchange;
            cheatSheet.platesOnlyToRegAddress = addCheatSheet.platesOnlyToRegAddress;
            cheatSheet.poaT19C = addCheatSheet.poaT19C;
            cheatSheet.proofOfResidency = addCheatSheet.proofOfResidency;
            cheatSheet.registrationRenewalPeriod = addCheatSheet.registrationRenewalPeriod;
            cheatSheet.emission = addCheatSheet.emission;
            cheatSheet.fedExPickup = addCheatSheet.fedExPickup;
            cheatSheet.gaDealerWorkAfter = addCheatSheet.gaDealerWorkAfter;
            cheatSheet.refundPolicy = addCheatSheet.refundPolicy;
            cheatSheet.replacementPlate = addCheatSheet.replacementPlate;
            cheatSheet.replacementStickerDecal = addCheatSheet.replacementStickerDecal;
            cheatSheet.trailersT22B = addCheatSheet.trailersT22B;
            cheatSheet.t19cPoa = addCheatSheet.t19cPoa;
            cheatSheet.poaT19C = addCheatSheet.poaT19C;
            cheatSheet.createdBy = user.id;

            await cheatSheet.save();
            return await this.getCheatSheet(cheatSheet.countyId);
        } catch (error) {
            throwException(error);
        }
    }

    async getCheatSheet(countyId: number) {
        try {
            const cheatSheet = await this.manager.createQueryBuilder(CountyCheatSheet, "ccs")
                .leftJoinAndSelect("ccs.county", "county")
                .select([
                    "ccs.countyId", "ccs.note", "ccs.emission", "ccs.t19cPoa",
                    "ccs.commercialPlateFormRequired", "ccs.gaDealerWorkAfter", "ccs.refundPolicy", "ccs.trailersT22B",
                    "ccs.poaT19C", "ccs.registrationRenewalPeriod", "ccs.replacementPlate", "ccs.replacementStickerDecal",
                    "ccs.plateExchange", "ccs.businessLicense", "ccs.proofOfResidency", "ccs.driverLicense",
                    "ccs.letterOfAuthorization", "ccs.leasedToBizAndRegAddComBizLic", "ccs.bizAndRegAddComBizLic",
                    "ccs.bizAndRegAddResBizLic", "ccs.businessStateChange", "ccs.mailingFees", "ccs.mailingFeesRequired",
                    "ccs.noBlankChecks", "ccs.sendBlankCheckOnly", "ccs.fedExPickup", "ccs.platesOnlyToRegAddress",
                    "ccs.resIndPeriod", "ccs.resBizAndComPeriod", "ccs.leasedRegAddTypeBizAndResAddResBizLic",
                    "ccs.leasedRegAddTypeBizAndResAddResProofRes", "ccs.leasedRegAddTypeBizAndResAddResDriverLicense",
                    "ccs.leasedRegAddTypeBizAndResAddResLetterOfAuth", "ccs.leasedRegAddTypeBizAndResAddComBizLic",
                    "ccs.leasedRegAddTypeBizAndResAddComProofRes", "ccs.bizAndRegAddComBusinessLicense",
                    "ccs.bizAndRegAddComProofOfResidency", "ccs.bizAndRegAddResBusinessLicense"
                ])
                .where("ccs.countyId = :countyId", { countyId })
                .andWhere("ccs.isDeleted = false")
                .getOne();

            return cheatSheet;
        } catch (error) {
            throwException(error);
        }
    }

    async editCheatSheet(updateSheet: UpdateCheatSheetDto, countyId, user): Promise<CountyCheatSheet> {
        try {
            const cheatSheet = await checkCheatSheetExists(countyId);

            if (!cheatSheet.data) {
                throw new NotFoundException("ERR_COUNTY_CHEET_SHEET_FOUND");
            }

            Object.assign(cheatSheet.data, {
                ...updateSheet,
                updatedBy: user.id
            });

            await cheatSheet.data.save();
            return this.getCheatSheet(cheatSheet.data.countyId);
        } catch (error) {
            throwException(error);
        }
    }

    // County Milage Rates APIs

    async saveRates(ratesDto: SaveCountyRatesDto, countyId, user) {
        try {
            const { id, millRates, ...payload } = ratesDto;
            let countyMilage = null;
            if (id) {
                countyMilage = await CountyMilage.findOne({ where: { id } })
                if (!countyMilage) throw new NotFoundException(`ERR_COUNTY_MILAGE_NOT_FOUND&&&id`);
                countyMilage.districtName = ratesDto.districtName;
                countyMilage.taxDistrict = ratesDto.taxDistrict;
                countyMilage.updatedBy = user.id;
                await countyMilage.save();
            } else {
                countyMilage = await CountyMilage.create({ ...payload, countyId, createdBy: user.id }).save();
            }

            if (millRates?.length) {
                //existing rates
                const existingData = millRates.filter(v => v.id != null).map(v => ({
                    ...v, id: v.id, updatedBy: user.id, milageId: countyMilage.id
                }));
                //new rates
                const newData = millRates.filter(v => v.id == null).map(v => ({
                    ...v, createdBy: user.id, milageId: countyMilage.id
                }));
                if (existingData.length > 0) {
                    const ids = existingData.map(update => update.id);

                    const entitiesToUpdate = await YearlyRates.find({
                        select: ["id"],
                        where: { id: In(ids) }
                    });
                    if (entitiesToUpdate.length !== ids.length) {
                        throw new NotFoundException('ERR_COUNTY_MILAGE_NOT_FOUND&&&fmvMaster');
                    }

                    await Promise.all(existingData.map(async rate => {
                        const foundEntity = entitiesToUpdate.find(entity => entity.id == rate.id);
                        if (foundEntity) {
                            Object.assign(foundEntity, rate);
                            await foundEntity.save();
                        }
                    }));
                }
                if (newData.length > 0) {
                    await this.manager.createQueryBuilder()
                        .insert()
                        .into(YearlyRates)
                        .values(newData)
                        .execute();
                }
            }
            return countyMilage;

        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllRates(countyId, filterDto) {
        try {
            const currentYear = new Date().getFullYear();
            const yearsToInclude = [currentYear - 2, currentYear - 1];
            const listQuery = this.manager
                .createQueryBuilder(CountyMilage, "countyMilage")
                .leftJoinAndSelect("countyMilage.county", "county")
                .leftJoinAndSelect("countyMilage.yearlyRates", "yearlyRates", "yearlyRates.year IN (:...years)", { years: yearsToInclude })
                .select(["countyMilage.id", "countyMilage.countyId", "countyMilage.districtName", "countyMilage.taxDistrict", "countyMilage.isActive",
                    "county.id", "county.name", "county.code",
                    "yearlyRates.id", "yearlyRates.year", "yearlyRates.millRate"])
                .where("(countyMilage.isActive = true AND countyMilage.countyId = :countyId)", { countyId })

            if (filterDto) {
                listQuery.offset(filterDto.offset * filterDto.limit);
                listQuery.limit(filterDto.limit);
                listQuery.orderBy(`countyMilage.${filterDto.orderBy}`, filterDto.orderDir);
            }

            if (filterDto?.search) {
                listQuery.andWhere("(countyMilage.name ILIKE :search OR state.name ILIKE :search OR state.code ILIKE :search)", { search: `%${filterDto.search}%` });
            }

            if (filterDto?.activeStatus == IsActive.ACTIVE) {
                listQuery.andWhere("(countyMilage.isActive = true)")
            }
            if (filterDto?.activeStatus == IsActive.INACTIVE) {
                listQuery.andWhere("(countyMilage.isActive = false)")
            }

            const countyWithCount = await listQuery.getManyAndCount();

            const transformedCountyMilage = countyWithCount[0].map(county => {
                const transformedYearlyRates = county.yearlyRates.reduce((acc, rate) => {
                    acc[rate.year] = rate;
                    return acc;
                }, {});

                return {
                    ...county,
                    ...transformedYearlyRates,
                    yearlyRates: undefined
                };
            });

            if (filterDto) {
                filterDto.count = countyWithCount[1];
            }

            return { countyMilage: transformedCountyMilage, page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async getCountyByCode(code: string) {
        return TitleCounties.findOne({ where: { code, isDeleted: false } });
    }

    async insertData(countyMilages, yearlyRates) {
        const countyMilageMap = new Map();

        await this.manager.transaction(async transactionalEntityManager => {
            // Fetch all existing countyMilages to minimize database lookups
            const existingMilages = await transactionalEntityManager.find(CountyMilage, {
                where: countyMilages.map(milage => ({
                    countyId: milage.countyId,
                    taxDistrict: milage.taxDistrict,
                    districtName: milage.districtName
                }))
            });

            // Cache existing countyMilages
            existingMilages.forEach(milage => {
                countyMilageMap.set(`${milage.countyId}-${milage.taxDistrict}-${milage.districtName}`, milage);
            });

            // Prepare new countyMilages to insert
            const newCountyMilages = countyMilages.filter(milage => {
                const key = `${milage.countyId}-${milage.taxDistrict}-${milage.districtName}`;
                if (!countyMilageMap.has(key)) {
                    countyMilageMap.set(key, milage);
                    return true;
                }
                return false;
            });

            // Insert new countyMilages in batch
            if (newCountyMilages.length > 0) {
                const insertedCountyMilages = await transactionalEntityManager.save(CountyMilage, newCountyMilages);
                insertedCountyMilages.forEach(milage => {
                    const key = `${milage.countyId}-${milage.taxDistrict}-${milage.districtName}`;
                    countyMilageMap.set(key, milage);
                });
            }

            // Prepare yearlyRates to insert
            const yearlyRatesToInsert = yearlyRates.map(rate => ({
                milageId: countyMilageMap.get(`${rate.countyMilage.countyId}-${rate.countyMilage.taxDistrict}-${rate.countyMilage.districtName}`).id,
                millRate: rate.millRate,
                year: rate.year,
                createdBy: rate.createdBy
            }));

            // Insert yearlyRates in batch
            await transactionalEntityManager.save(YearlyRates, yearlyRatesToInsert);
        });
    }

    async deleteMilageRate(deleteMilage, userId) {
        try {
            const { ids } = deleteMilage;
            const existingRecordsCount = await CountyMilage.count({
                where: { id: In(ids), isActive: true },
            });
            if (existingRecordsCount !== ids.length) {
                return {
                    message: error.ERR_COUNTY_MILAGE_NOT_FOUND,
                    data: {},
                };
            }
            // Proceed with deletion if all IDs are found
            await this.dataSource.transaction(async transactionalEntityManager => {
                await transactionalEntityManager
                    .createQueryBuilder()
                    .update(CountyMilage)
                    .set({ isActive: false, updatedBy: userId })
                    .whereInIds(ids)
                    .execute();
            });

            return {
                message: success.SUC_COUNTY_MILAGE_DEACTIVATED,
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async saveProcessingDetails(payload, countyId: number, user: any) {
        const countyExists = await this.count({ where: { id: countyId, isDeleted: false } });
        if (!countyExists) throw new NotFoundException(`ERR_COUNTY_NOT_FOUND&&&id`);
        let cityExist

        if (payload.city) {
            cityExist = await CountyMilage.findOne({ where: { districtName: ILike(`%${payload.city}%`) }, select: ["id", "districtName"] })
            payload.cityId = cityExist && cityExist.id;
            delete payload.city
        }

        const whereCondition = payload.id
            ? { id: payload.id }
            : { countyId, cityId: cityExist?.id || IsNull() };

        let countyProcessing = await CountyProcessing.findOne({ where: whereCondition });


        if (countyProcessing) {
            Object.assign(countyProcessing, payload);
            countyProcessing.updatedBy = user.id;
            countyProcessing.updatedAt = new Date();
        } else {
            countyProcessing = CountyProcessing.create({
                ...payload,
                countyId,
                createdBy: user.id,
                createdAt: new Date(),
            });
        }

        return await CountyProcessing.save(countyProcessing);
    }

    async fetchTransactionWorks({ countyId, filterDto, transactionCode }: any): Promise<{ transactionTypes; page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(TransactionTypes, "transactionTypes")
                .select([
                    "transactionTypes.id", "transactionTypes.name",
                    "transactionTypes.state", "transactionTypes.isActive",
                    "transactionTypes.transactionCode"
                ])
                .where("(transactionTypes.isDeleted = false)");

            if (filterDto) {
                listQuery.offset(filterDto.offset * filterDto.limit);
                listQuery.limit(filterDto.limit);
                listQuery.orderBy(`transactionTypes.${filterDto.orderBy}`, filterDto.orderDir);
            }

            if (filterDto?.search) {
                listQuery.andWhere(
                    "(transactionTypes.name ilike :search or transactionTypes.state ilike :search or transactionTypes.transactionCode ilike :search)",
                    { search: `%${filterDto.search}%` }
                );
            }

            if (filterDto?.activeStatus == IsActive.ACTIVE) {
                listQuery.andWhere("transactionTypes.isActive = true");
            }

            if (filterDto?.activeStatus == IsActive.INACTIVE) {
                listQuery.andWhere("transactionTypes.isActive = false");
            }

            if (transactionCode) {
                listQuery.andWhere("transactionTypes.transactionCode = :transactionCode", { transactionCode });
            }

            const transactionTypesWithCount = await listQuery.getManyAndCount();

            const transactionWorkList = await CountyTransactionWorks.find({ where: { countyId } });

            const transactionTypes = transactionTypesWithCount[0].map((transactionType: any) => {
                const matchingTransactionWork = transactionWorkList.find(work => work.transactionTypeId === transactionType.id);
                if (matchingTransactionWork) {
                    transactionType.checkCount = matchingTransactionWork.checkCount;
                } else {
                    transactionType.checkCount = 1;
                }
                return transactionType;
            });

            if (filterDto) {
                filterDto.count = transactionTypesWithCount[1];
            }

            return { transactionTypes, page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async saveTransactionWorks(transactionCode, countyId, payload, user) {
        const countyExists = await this.count({ where: { id: countyId, isDeleted: false } });
        if (!countyExists) throw new NotFoundException(`ERR_COUNTY_NOT_FOUND&&&id`);

        const transactionType = await TransactionTypes.findOne({ where: { transactionCode, isDeleted: false } });
        if (!transactionType) throw new NotFoundException(`ERR_TRANSACTION_TYPE_NOT_FOUND&&&transactionCode`);

        let countyTransactionWorks = await CountyTransactionWorks.findOne({ where: { transactionTypeId: transactionType.id } });

        if (countyTransactionWorks) {
            Object.assign(countyTransactionWorks, payload);
            countyTransactionWorks.updatedBy = user.id;
            countyTransactionWorks.updatedAt = new Date();
        } else {
            countyTransactionWorks = CountyTransactionWorks.create({
                ...payload,
                transactionTypeId: transactionType.id,
                countyId,
                createdBy: user.id
            });
        }
        return await CountyTransactionWorks.save(countyTransactionWorks);
    }

    countyProcessing(countyId) {
        return CountyProcessing.createQueryBuilder("countyProcessing")
            .leftJoinAndSelect("countyProcessing.city", "city")
            .select([
                "countyProcessing.id",
                "countyProcessing.type",
                "countyProcessing.worksType",
                "countyProcessing.countyId",
                "countyProcessing.renewalWorks",
                "countyProcessing.isDuplicateRound",
                "countyProcessing.isDropDuplicateRound",
                "countyProcessing.isMin",
                "countyProcessing.titleWorks",
                "countyProcessing.workRounds",
                "countyProcessing.titleOrRenewalTotal",
                "countyProcessing.dropTitleOrRenewalTotal",
                "countyProcessing.notes",
                "countyProcessing.isTransactionPerWork",
                "countyProcessing.checkCount",
                "countyProcessing.dropRenewalWorks",
                "countyProcessing.dropTitleWorks",
                "countyProcessing.dropWorkRounds",
                "countyProcessing.dropWorksType",
                "countyProcessing.dropNotes",
                "city.id",
                "city.districtName",
            ])
            .where("countyProcessing.countyId = :countyId", { countyId })
            .addOrderBy("countyProcessing.id", "ASC")
            .getMany();
    }

}