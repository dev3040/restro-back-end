import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CashierForm } from '../../shared/entity/cashier-form.entity';
import { CreateCashierFormDto } from './dto/create-cashier-form.dto';
import { UpdateCashierFormDto } from './dto/update-cashier-form.dto';
import { FindByDateDto } from './dto/find-by-date.dto';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { Branches } from '../../shared/entity/branches.entity';
import { Repository as TypeOrmRepository } from 'typeorm';
import * as ejs from 'ejs';

@Injectable()
export class CashierFormService {
  constructor(
    @InjectRepository(CashierForm)
    private cashierFormRepository: Repository<CashierForm>,
    @InjectRepository(Branches)
    private branchesRepository: TypeOrmRepository<Branches>,
  ) { }

  async create(createCashierFormDto: CreateCashierFormDto): Promise<CashierForm> {
    const cashierForm = this.cashierFormRepository.create(createCashierFormDto);

    // If generated_date is provided, convert string to Date
    if (createCashierFormDto.generated_date) {
      cashierForm.generated_date = new Date(createCashierFormDto.generated_date);
    }

    return await this.cashierFormRepository.save(cashierForm);
  }

  async findAll(): Promise<CashierForm[]> {
    return await this.cashierFormRepository.find({
      order: { generated_date: 'DESC' }
    });
  }

  async findOne(id: number): Promise<CashierForm> {
    const cashierForm = await this.cashierFormRepository.findOne({ where: { id } });
    if (!cashierForm) {
      throw new NotFoundException(`Cashier form with ID ${id} not found`);
    }
    return cashierForm;
  }

  async update(id: number, updateCashierFormDto: UpdateCashierFormDto): Promise<CashierForm> {
    const cashierForm = await this.findOne(id);

    // Create a new object to avoid type issues
    const updateData: any = { ...updateCashierFormDto };

    // If generated_date is provided, convert string to Date
    if (updateCashierFormDto.generated_date) {
      updateData.generated_date = new Date(updateCashierFormDto.generated_date);
    }

    Object.assign(cashierForm, updateData);
    return await this.cashierFormRepository.save(cashierForm);
  }

  async remove(id: number): Promise<void> {
    const cashierForm = await this.findOne(id);
    await this.cashierFormRepository.remove(cashierForm);
  }

  async findByDate(findByDateDto: FindByDateDto): Promise<CashierForm[]> {
    const { startDate, endDate, date } = findByDateDto;

    if (date) {
      // Find forms for a specific date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return await this.cashierFormRepository.find({
        where: {
          generated_date: Between(startOfDay, endOfDay)
        },
        order: { generated_date: 'DESC' }
      });
    }

    if (startDate && endDate) {
      // Find forms within a date range
      return await this.cashierFormRepository.find({
        where: {
          generated_date: Between(new Date(startDate), new Date(endDate))
        },
        order: { generated_date: 'DESC' }
      });
    }

    if (startDate) {
      // Find forms from start date onwards
      return await this.cashierFormRepository.find({
        where: {
          generated_date: Between(new Date(startDate), new Date())
        },
        order: { generated_date: 'DESC' }
      });
    }

    if (endDate) {
      // Find forms up to end date
      return await this.cashierFormRepository.find({
        where: {
          generated_date: Between(new Date(0), new Date(endDate))
        },
        order: { generated_date: 'DESC' }
      });
    }

    // If no date filters provided, return all forms
    return await this.findAll();
  }

  async generatePdf(data: any): Promise<Buffer> {
    // Fetch branch name dynamically
    let branchName = '';
    if (data.branchId) {
      const branch = await this.branchesRepository.findOne({ where: { id: data.branchId } });
      branchName = branch ? branch.name : '';
    }
    data.branchName = branchName;

    // Render EJS template
    const templatePath = path.join(__dirname, '../../shared/templates/cashier-form-report.ejs');
    let html = await ejs.renderFile(templatePath, data) as string;
    if (typeof html !== 'string') html = '';

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    let pdfBuffer: any = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    // Ensure Buffer type
    if (!(pdfBuffer instanceof Buffer)) {
      if (ArrayBuffer.isView(pdfBuffer)) {
        pdfBuffer = Buffer.from(pdfBuffer.buffer);
      } else if (pdfBuffer instanceof ArrayBuffer) {
        pdfBuffer = Buffer.from(new Uint8Array(pdfBuffer));
      }
    }
    return pdfBuffer;
  }
} 