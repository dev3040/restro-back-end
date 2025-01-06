import {
    BadRequestException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CountyMasterRepository } from "./county-master.repository";
import { UpdateCountyDto, AddCountyDto } from "./dto/add-county.dto";
import { PageQueryDto } from "src/shared/dtos/list-query.dto";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { User } from "src/shared/entity/user.entity";
import { RedisCacheService } from "examples/redis-cache/redis-cache.service";
import { RedisKey } from "src/shared/enums/cache-key.enum";
import { SaveCountyProfileDto } from "./dto/save-county-profile.dto";
import { AddContactDto, UpdateContactDto } from "./dto/add-contact.dto";
import { checkCountyContactExists } from "src/shared/utility/common-function.methods";
import { CountyLinks } from "src/shared/entity/county-links.entity";
import { SaveCountyLinksDto } from "./dto/save-county-links.dto";
import { AddCountyCheatSheetDto, UpdateCheatSheetDto } from "./dto/add-county-cheat-sheet.dto";
import { SaveCountyRatesDto } from "./dto/save-county-milage-rates.dto";
import csvParser from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';
import { In } from "typeorm";
import { CountyContacts } from "src/shared/entity/county-contacts.entity";
import { CountyProcessingDto } from "./dto/county-processing.dto";
import { ListCountiesDto } from "src/shared/dtos/list-data.dto";

@Injectable()
export class CountyMasterService {
    constructor(
        @InjectRepository(CountyMasterRepository)
        private readonly countyMasterRepository: CountyMasterRepository,
        private readonly cacheService: RedisCacheService
    ) { }

    async addCounties(createCounty: AddCountyDto, user: User): Promise<AppResponse> {
        try {
            const cratedCounty = await this.countyMasterRepository.addCounty(createCounty, user);
            const data = await this.countyMasterRepository.fetchAllCounty();
            await this.cacheService.deleteCache(RedisKey.COUNTY_MASTER);
            await this.cacheService.addCache({ key: RedisKey.COUNTY_MASTER, value: data });
            return {
                message: "SUC_COUNTY_CREATED",
                data: cratedCounty
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getCountyList(query: ListCountiesDto): Promise<AppResponse> {
        try {
            const data = await this.countyMasterRepository.fetchAllCounty(query);

            await this.cacheService.addCache({ key: RedisKey.COUNTY_MASTER, value: data.counties });
            return {
                message: "SUC_COUNTIES_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getCountyDetails(id): Promise<AppResponse> {
        try {
            const county = await this.countyMasterRepository.getCountyDetails(id);
            if (!county) {
                throw new NotFoundException(`ERR_COUNTY_NOT_FOUND&&&id`);
            }
            return {
                message: "SUC_COUNTIES_FETCHED",
                data: county
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editCounty(updateDto: UpdateCountyDto, id, user): Promise<AppResponse> {
        try {
            const updatedCounty = await this.countyMasterRepository.editCounty(updateDto, id, user);
            const data = await this.countyMasterRepository.fetchAllCounty();
            await this.cacheService.deleteCache(RedisKey.COUNTY_MASTER);
            await this.cacheService.addCache({ key: RedisKey.COUNTY_MASTER, value: data });
            return {
                message: "SUC_COUNTY_UPDATED",
                data: updatedCounty
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editCountyProfile(saveProfileDto: SaveCountyProfileDto, countyId, user): Promise<AppResponse> {
        try {
            const countyProfile = await this.countyMasterRepository.saveCountyProfile(saveProfileDto, countyId, user);
            return {
                message: "SUC_COUNTY_UPDATED",
                data: countyProfile
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteCounty(id): Promise<AppResponse> {
        try {
            const county = await this.countyMasterRepository.findOne({
                where: { id: id }
            });
            if (!county) {
                throw new NotFoundException(`ERR_COUNTY_NOT_FOUND&&&id`);
            }

            county.isDeleted = true;
            await county.save();
            await this.cacheService.deleteCache(RedisKey.COUNTY_MASTER);

            return {
                message: "SUC_COUNTY_DELETED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteCounties(deleteCounties, userId): Promise<AppResponse> {
        try {
            const response = await this.countyMasterRepository.deleteCounties(deleteCounties, userId);
            return response;
        } catch (error) {
            throwException(error);
        }
    }


    async activeInactiveCounty(id, user): Promise<AppResponse> {
        try {
            const county = await this.countyMasterRepository.findOne({
                select: ['id', 'isActive'],
                where: {
                    id: id,
                    isDeleted: false
                }
            });
            if (!county) {
                throw new NotFoundException(`ERR_COUNTY_NOT_FOUND&&&id`);
            }

            county.isActive = !county.isActive;
            county.updatedBy = user.id;
            await county.save();

            return {
                message: county.isActive
                    ? "SUC_COUNTY_ACTIVATED_UPDATED"
                    : "SUC_COUNTY_DEACTIVATED_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    /* ************************ Contact Info APIs *************************** */

    async addContact(addContact: AddContactDto, user): Promise<AppResponse> {
        try {
            const newContact = await this.countyMasterRepository.addContact(addContact, user);

            return {
                message: "SUC_CONTACT_CREATED",
                data: newContact
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getContactList(query: PageQueryDto): Promise<AppResponse> {
        try {
            const { contacts, page } = await this.countyMasterRepository.fetchAllContact(query);
            return {
                message: "SUC_CONTACT_LIST_FETCHED",
                data: { contacts, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getContact(id): Promise<AppResponse> {
        try {
            const getCounty = await this.countyMasterRepository.getContact(id);

            return {
                message: "SUC_CONTACT_DETAILS_FETCHED",
                data: getCounty
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editContact(updateContact: UpdateContactDto, id, user): Promise<AppResponse> {
        try {
            await this.countyMasterRepository.editContact(updateContact, id, user);
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
            const getContact = await checkCountyContactExists(id);
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
            const getContact = await CountyContacts.find({
                where: {
                    id: In(deleteContact.ids),
                    isDeleted: false
                },
                select: ["id", "isPrimary"]
            })

            if (getContact.find(i => i.isPrimary)) {
                throw new BadRequestException("ERR_PRIMARY_CONTACT_DELETE");
            }
            const response = await this.countyMasterRepository.deleteCountyContact(deleteContact, userId);
            return response;
        } catch (error) {
            throwException(error);
        }
    }
    /* ************************ Contact Link APIs *************************** */

    async getLinkList(query: PageQueryDto): Promise<AppResponse> {
        try {
            const { links, page } = await this.countyMasterRepository.fetchAllLinks(query);
            return {
                message: "SUC_LINK_LIST_FETCHED",
                data: { links, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getLink(id): Promise<AppResponse> {
        try {
            const getCounty = await this.countyMasterRepository.getLink(id);

            return {
                message: "SUC_LINK_DETAILS_FETCHED",
                data: getCounty
            };
        } catch (error) {
            throwException(error);
        }
    }

    async saveLinks(saveLinks: SaveCountyLinksDto, id, user): Promise<AppResponse> {
        try {
            const countyLink = await this.countyMasterRepository.saveLinks(saveLinks, id, user);
            return {
                message: "SUC_LINK_SAVED",
                data: countyLink
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteLink(id, user): Promise<AppResponse> {
        try {
            const getLink = await CountyLinks.findOne({ where: { id } });
            if (!getLink) {
                throw new NotFoundException("ERR_LINK_NOT_FOUND&&&id");
            }

            getLink.isDeleted = true;
            getLink.updatedBy = user.id;
            await getLink.save();

            return {
                message: "SUC_CONTACT_DELETED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getAnalytics(countyId, query): Promise<AppResponse> {
        try {
            const analytics = await this.countyMasterRepository.getAnalytics(countyId, query);
            return {
                message: "SUC_COUNTY_ANALYTICS_FETCHED",
                data: analytics
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getTicketList(query: PageQueryDto, countyId): Promise<AppResponse> {
        try {
            const { tickets, page, avgPeriodOfProcess } = await this.countyMasterRepository.fetchAllTickets(query, countyId);
            return {
                message: "SUC_TICKET_LIST_FETCHED",
                data: { tickets, page, avgPeriodOfProcess }
            };
        } catch (error) {
            throwException(error);
        }
    }

    // county cheat sheet apis

    async addCheatSheet(addCheatSheet: AddCountyCheatSheetDto, user: User): Promise<AppResponse> {
        try {
            const cheatSheet = await this.countyMasterRepository.addCheatSheet(addCheatSheet, user);

            return {
                message: "SUC_COUNTY_CHEAT_SHEET_CREATED",
                data: cheatSheet
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getCheatSheet(id): Promise<AppResponse> {
        try {
            const getCheatSheet = await this.countyMasterRepository.getCheatSheet(id);

            return {
                message: "SUC_COUNTY_CHEAT_SHEET_FETCHED",
                data: getCheatSheet
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editCheatSheet(updateSheet: UpdateCheatSheetDto, countyId, user): Promise<AppResponse> {
        try {
            const data = await this.countyMasterRepository.editCheatSheet(updateSheet, countyId, user);
            return {
                message: "SUC_COUNTY_CHEAT_SHEET_UPDATED",
                data: data
            };
        } catch (error) {
            throwException(error);
        }
    }

    // County milage rate apis

    async saveRates(ratesDto: SaveCountyRatesDto, countyId, user): Promise<AppResponse> {
        try {
            const rates = await this.countyMasterRepository.saveRates(ratesDto, countyId, user);
            return {
                message: "SUC_COUNTY_RATES_SAVED",
                data: rates
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getRates(countyId, query: PageQueryDto,): Promise<AppResponse> {
        try {
            const { countyMilage, page } = await this.countyMasterRepository.fetchAllRates(countyId, query);
            return {
                message: "SUC_COUNTY_MILAGE_RATES_LIST_FETCHED",
                data: { countyMilage, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    async saveBulkRates(file, user, upload) {
        if (!file?.buffer) {
            throw new BadRequestException('ERR_COUNTY_FILE_UPLOAD&&&attachment');
        }

        // Check if the file is a CSV
        if (file.mimetype !== 'text/csv') {
            throw new BadRequestException('ERR_FILE_CSV_UPLOAD&&&attachment');
        }

        const customDir = path.join(__dirname, 'assets/upload');
        if (!fs.existsSync(customDir)) {
            fs.mkdirSync(customDir, { recursive: true });
        }

        const customFilePath = path.join(customDir, file.originalname);

        try {
            // Write the buffer to the file in the custom directory
            fs.writeFileSync(customFilePath, file.buffer);

            // Create a read stream and pipe it to csv-parser
            const stream = fs.createReadStream(customFilePath).pipe(csvParser());
            const countiesCache = {};
            const countyMilages = [];
            const yearlyRates = [];
            for await (const row of stream) {
                const countyNumber = row['County Number'];
                const taxDistrict = row['Tax District'];
                const taxDistrictName = row['Tax District Name'];
                const millRate = row['Mill Rate'];
                let county = countiesCache[countyNumber];
                if (!county) {
                    county = await this.countyMasterRepository.getCountyByCode(countyNumber);
                    countiesCache[countyNumber] = county;
                }

                if (county) {
                    const countyMilage = {
                        countyId: county.id,
                        taxDistrict: parseInt(taxDistrict),
                        districtName: taxDistrictName,
                        createdBy: user.id
                    };
                    countyMilages.push(countyMilage);

                    yearlyRates.push({
                        countyMilage,
                        millRate,
                        year: upload.year,
                        createdBy: user.id
                    });
                }

            }
            await this.countyMasterRepository.insertData(countyMilages, yearlyRates)
            return {
                message: "SUC_COUNTY_RATES_SAVED",
            };
        } catch (error) {
            throw new BadRequestException('ERR_FILE_CSV_PROCESS');
        } finally {
            fs.unlinkSync(customFilePath);
        }
    }

    async activeInactiveCountyMilageRate(deleteMilage, userId: number): Promise<AppResponse> {
        try {
            const response = await this.countyMasterRepository.deleteMilageRate(deleteMilage, userId);
            return response;
        } catch (error) {
            throwException(error);
        }
    }

    /* ************************ Processing APIs *************************** */
    async saveProcessingDetails(payload: CountyProcessingDto, countyId, user): Promise<AppResponse> {
        try {
            const data = await this.countyMasterRepository.saveProcessingDetails(payload, countyId, user);
            return {
                message: "SUC_COUNTY_PROCESSING_SAVED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getDetails(countyId): Promise<AppResponse> {
        try {
            const countyExists = await this.countyMasterRepository.count({ where: { id: countyId } });
            if (!countyExists) throw new NotFoundException(`ERR_COUNTY_NOT_FOUND&&&id`);

            const data = await this.countyMasterRepository.countyProcessing(countyId);
            return {
                message: "SUC_COUNTY_PROCESSING_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getTransactionWorks(countyId, query: PageQueryDto): Promise<AppResponse> {
        try {
            const countyExists = await this.countyMasterRepository.count({ where: { id: countyId } });
            if (!countyExists) throw new NotFoundException(`ERR_COUNTY_NOT_FOUND&&&id`);

            const data = await this.countyMasterRepository.fetchTransactionWorks({ countyId, filterDto: query });
            return {
                message: "SUC_TRANSACTION_TYPE_LIST_FETCHED",
                data: data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async saveTransactionWorks(transactionCode, countyId, payload, user): Promise<AppResponse> {
        try {
            const data = await this.countyMasterRepository.saveTransactionWorks(transactionCode, countyId, payload, user);
            return {
                message: "SUC_TRANSACTION_WORK_UPDATED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }
}
