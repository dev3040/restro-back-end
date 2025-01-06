import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "src/shared/utility/throw-exception";
import { VinProfileRepository } from "./vin-profile.repository";
import { SetVinProfileDto } from "./dto/set-vin-profile.dto";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { TicketDocuments } from 'src/shared/entity/ticket-documents.entity';
import { documentPath } from 'src/config/common.config';


@Injectable()
export class VinProfileService {
    constructor(@InjectRepository(VinProfileRepository)
    private readonly vinProfileRepository: VinProfileRepository) { }

    async fetchVinProfileDetails(ticketId) {
        try {
            const data = await this.vinProfileRepository.getVinProfile(ticketId);
            return {
                message: "SUC_VIN_PROFILE_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async setVinProfile(payload: SetVinProfileDto, userId: number): Promise<AppResponse> {
        try {
            //    await findTicket(payload.ticketId);
            const data = await this.vinProfileRepository.setVinProfile(payload, userId)

            return {
                message: "SUC_VIN_PROFILE_SAVED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async downloadDocument(docs, res) {
        try {
            const filesToDownload = (
                await Promise.all(
                    docs.docIds.map(async (id) => {
                        try {
                            const document = await TicketDocuments.findOne({ where: { id } });
                            if (!document) {
                                return null;
                            }

                            const fullPath = path.join(process.cwd(), `${documentPath}/${document.ticketId}`, document.fileName);
                            if (!fs.existsSync(fullPath)) {
                                return null;
                            }

                            return fullPath;
                        } catch (err) {
                            return null;
                        }
                    })
                )
            ).filter(Boolean);

            if (filesToDownload.length === 0) {
                throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND');
            }

            //Zip file for documents
            const zipFileName = `vin_profile_docs_${Date.now()}.zip`;
            const zipFilePath = path.join(process.cwd(), zipFileName);
            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                res.download(zipFilePath, zipFileName, (err) => {
                    if (!err) {
                        fs.unlinkSync(zipFilePath); // Clean zip after download
                    }
                });
            });

            archive.on('error', (err) => {
                throw err;
            });

            archive.pipe(output);

            //files to zip
            for (const filePath of filesToDownload) {
                archive.file(filePath, { name: path.basename(filePath) });
            }

            await archive.finalize();
        } catch (error) {
            throwException(error);
        }
    }
    async previewDocuments(docs) {
        console.log('docs: ', docs);
        try {
            // const data = await this.vinProfileRepository.VinProfileDocsPreview(docs)

            return {
                message: "SUC_VIN_PROFILE_DOCS_PREVIEW",
                // data
            };

        } catch (error) {
            throwException(error);
        }
    }

}