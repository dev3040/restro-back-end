import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    OneToMany,
    AfterLoad,
} from 'typeorm';
import { User } from './user.entity';
import { Tickets } from './tickets.entity';
import { TavtOtherFees } from './tavt-other-fees.entity';
import { TavtTaxExemptionMaster } from './tavt-exemption-master.entity';

@Entity({ name: "tavt_form", schema: "data_entry" })
export class TavtForm extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('int', { name: 'ticket_id' })
    ticketId: number;

    @Column('int', { name: 'check_count', default: 1 })
    checkCount: number;

    @Column({ type: 'boolean', name: 'is_sales', default: false })
    isSales: boolean;

    @Column({ type: 'date', name: 'arrival_date', nullable: true })
    arrivalDate: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'sales_price', nullable: true })
    salesPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'rebates', nullable: true })
    rebates: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount', nullable: true })
    discount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'accessories', nullable: true })
    accessories: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'administration_fees', nullable: true })
    administrationFees: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'dealer_handling', nullable: true })
    dealerHandling: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'delivery_fees', nullable: true })
    deliveryFees: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'documentation_fees', nullable: true })
    documentationFees: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'shipping_handling_fees', nullable: true })
    shippingHandlingFees: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'taxable_value', nullable: true })
    taxableValue: number;

    @Column('int', { name: 'tax_exemption_id', nullable: true })
    taxExemptionId: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'tavt_value', nullable: true })
    tavtValue: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'tavt_percentage', nullable: true })
    tavtPercentage: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'tavt_dealer_penalty', nullable: true })
    tavtDealerPenalty: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'tavt_dealer_penalty_percentage', nullable: true })
    tavtDealerPenaltyPercentage: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'title_fees', nullable: true })
    titleFees: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'title_late_penalty', nullable: true })
    titleLatePenalty: number;

    @Column({ name: 'cost_calc', type: 'text', nullable: true })
    costCalc: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'sales_tax_percentage', nullable: true })
    salesTaxPercentage: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'sales_tax_value', nullable: true })
    salesTaxValue: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'valorem_value', nullable: true })
    valoremValue: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'valorem_penalty_percentage', nullable: true })
    valoremPenaltyPercentage: number;

    @Column({ type: 'text', name: 'valorem_calc', nullable: true })
    valoremCalc: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'valorem_penalty', nullable: true })
    valoremPenalty: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'agreed_upon_value', nullable: true })
    agreedUponValue: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'amortized', nullable: true })
    amortized: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'depreciation', nullable: true })
    depreciation: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'down_payment', nullable: true })
    downPayment: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'our_fees', nullable: true })
    ourFees: number;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @UpdateDateColumn({
        type: "timestamp with time zone",
        name: "updated_at"
    })
    updatedAt: Date;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;

    @ManyToOne(() => User)
    @JoinColumn({ name: "created_by", referencedColumnName: "id" })
    createdByUser: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: "updated_by", referencedColumnName: "id" })
    updatedByUser: User;

    @ManyToOne(() => Tickets)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;

    @ManyToOne(() => TavtTaxExemptionMaster)
    @JoinColumn({ name: "tax_exemption_id", referencedColumnName: "id" })
    tavtTaxExemptionMaster: TavtTaxExemptionMaster;

    @OneToMany(() => TavtOtherFees, (d) => d.tavtForm)
    otherFees: TavtOtherFees[];

    @AfterLoad()
    parseCostCalc() {
        if (this.costCalc) {
            this.costCalc = JSON.parse(this.costCalc);
        }
    }

    @AfterLoad()
    parseValorem() {
        if (this.valoremCalc) {
            this.valoremCalc = JSON.parse(this.valoremCalc);
        }
    }
}
