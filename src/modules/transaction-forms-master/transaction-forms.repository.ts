import { TransactionForms } from 'src/shared/entity/transaction-forms.entity';
import { DataSource, In, Repository } from 'typeorm';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { AddTransactionFormDto, UpdateTransactionFormDto } from './dto/add-transaction-forms.dto';

@Injectable()
export class TransactionFormsRepository extends Repository<TransactionForms> {
    constructor(readonly dataSource: DataSource) {
        super(TransactionForms, dataSource.createEntityManager());
    }

    async addTransactionForm(addTransactionForm: AddTransactionFormDto, user): Promise<any> {
        try {
            if (addTransactionForm.transactionCode) {
                const insertPayload = addTransactionForm.transactionCode.map(code => ({
                    transactionCode: code,
                    formShortCode: addTransactionForm.formShortCode,
                    createdBy: user.id
                }));
                return this.save(insertPayload);
            } else {
                const checkEntry = await this.findOne({ where: { formShortCode: addTransactionForm.formShortCode, transactionCode: null, isDeleted: false } })
                if (checkEntry) {
                    throw new BadRequestException('DUPLICATE_ENTRY_TRANSACTION_FORM');
                }
                return this.save({ formShortCode: addTransactionForm.formShortCode, createdBy: user.id });
            }
        } catch (error: any) {
            throwException(error);
        }
    }

    async fetchAllTransactionForms(filterDto, code?: string): Promise<{ transactionForms: any[]; page: object }> {
        try {
            const { offset, limit, search, orderBy, orderDir } = filterDto;

            const listQuery = this.manager
                .createQueryBuilder(TransactionForms, "transactionForms")
                .leftJoinAndSelect("transactionForms.formsPdf", "formsPdf")
                .leftJoinAndSelect("transactionForms.transactionType", "transactionType")
                .select([
                    "transactionForms.id",
                    "transactionForms.transactionCode",
                    "transactionForms.formShortCode",
                    "formsPdf.formsName",
                    "formsPdf.description",
                    "transactionType.name",
                    "transactionType.transactionCode"
                ])
                .where("transactionForms.isDeleted=false");

            // Apply pagination
            if (limit) {
                listQuery.take(limit).skip((offset || 0) * limit);
            }

            // Apply search filter
            if (search) {
                listQuery.andWhere(
                    `(transactionForms.transactionCode ilike :search OR 
                      transactionForms.formShortCode ilike :search OR
                      formsPdf.formsName ilike :search OR
                      transactionType.name ilike :search)`,
                    { search: `%${search}%` }
                );
            }

            if (code) {
                listQuery.andWhere(
                    'transactionForms.formShortCode = :code', { code }
                );
            }

            // Apply sorting
            if (orderBy && orderDir) {
                listQuery.orderBy(orderBy, orderDir, 'NULLS LAST');
            }

            // Fetch the data and count
            const [formsData, totalCount] = await listQuery.getManyAndCount();

            // Group and format the data by formShortCode
            const groupedForms = formsData.reduce((acc, form) => {
                const existingForm = acc.find((f) => f.formShortCode === form.formShortCode);

                if (existingForm) {
                    // Append transaction type to the existing form
                    existingForm.transactionType.push({
                        name: form?.transactionType?.name,
                        transactionCode: form?.transactionType?.transactionCode
                    });
                } else {
                    // Create a new form entry
                    acc.push({
                        formShortCode: form.formShortCode,
                        formsPdf: { formsName: form.formsPdf?.formsName, description: form.formsPdf?.description },
                        transactionType: form.transactionType ? [{
                            name: form?.transactionType?.name,
                            transactionCode: form?.transactionType?.transactionCode
                        }] : []
                    });
                }

                return acc;
            }, []);

            // Update count in filterDto if it exists
            if (filterDto) {
                filterDto.count = totalCount;
            }

            return { transactionForms: groupedForms, page: filterDto };
        } catch (error) {
            // Handle error (rethrow with custom handler)
            throwException(error);
        }
    }



    async editTransactionForm(updateTransactionForm: UpdateTransactionFormDto, code, user): Promise<any> {
        try {
            // Fetch the existing record by code
            const existingForm = await this.find({ where: { formShortCode: code, isDeleted: false } });
            if (!existingForm) {
                throw new NotFoundException("ERR_TRANSACTION_FORM_NOT_FOUND")
            }
            if (!updateTransactionForm.transactionCode) {
                await this.update(
                    { formShortCode: code },
                    { isDeleted: true, updatedBy: user.id }  // Soft delete by setting isDeleted to true
                );
                return this.save({ formShortCode: code, createdBy: user.id });
            }
            // Get the current transaction codes for the form
            const currentTransactionCodes = existingForm.map(tc => tc.transactionCode);

            if (!currentTransactionCodes[0]) {
                await this.update(
                    { formShortCode: code },
                    { isDeleted: true, updatedBy: user.id }
                );
            }

            // Case 1: Filter out the transaction codes that already exist in the current form
            const newTransactionCodes = updateTransactionForm.transactionCode.filter(tc => !currentTransactionCodes.includes(tc));
            // Insert the new transaction codes if any
            if (newTransactionCodes.length > 0) {
                const insertPayload = newTransactionCodes.map(tCode => ({
                    transactionCode: tCode,
                    formShortCode: code,
                    createdBy: user.id,
                }));

                await this.save(insertPayload);
            }

            // Case 2: Soft delete transaction codes that are not in the updated payload
            const codesToDelete = currentTransactionCodes.filter(tc => !updateTransactionForm.transactionCode.includes(tc));
            if (codesToDelete.length > 0) {
                await this.update(
                    { transactionCode: In(codesToDelete), formShortCode: code },
                    { isDeleted: true, updatedBy: user.id }  // Soft delete by setting isDeleted to true
                );
            }
            return existingForm;
        } catch (error) {
            throwException(error);
        }
    }

    async deleteTransactionForms(deleteTransactionForms, userId) {
        try {
            const existingRecords = await this.find({
                where: { formShortCode: In(deleteTransactionForms.formCodes), isDeleted: false },
            });
            const existingFormCodes = existingRecords.map(record => record.formShortCode);
            const missingFormCodes = deleteTransactionForms.formCodes.filter(code => !existingFormCodes.includes(code));

            if (missingFormCodes.length > 0) {
                throw new NotFoundException('ERR_TRANSACTION_FORM_NOT_FOUND&&&formCodes');
            }
            return this.update(
                { formShortCode: In(deleteTransactionForms.formCodes) },
                { isDeleted: true, updatedBy: userId }
            );
        } catch (error) {
            throwException(error);
        }
    }
}
