import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
import { User } from './user.entity';
import { TicketStatuses } from './ticket-statuses.entity';
import { Departments } from './departments.entity';
import { Customers } from './customers.entity';
import { PriorityTypes } from './priority-types.entity';
import { CarrierTypes } from './carrier-types.entity';
import { TicketAssignedUsers } from './ticket-assigned-users.entity';
import { TicketTags } from './ticket-tags.entity';
import { TicketDocuments } from './ticket-documents.entity';
import { VinInfo } from './vin-info.entity';
import { TidTypes } from './tid-types.entity';
import { BasicInfo } from './basic-info.entity';
import { ActivityLogs } from './activity-logs.entity';
import { TradeInInfo } from './trade-in-info.entity';
import { TitleInfo } from './title-info.entity';
import { BuyerInfo } from './buyer-info.entity';
import { LienInfo } from './lien-info.entity';
import { InsuranceInfo } from './insurance-info.entity';
import { SellerInfo } from './seller-info.entity';
import { RegistrationInfo } from './registration-info.entity';
import { TavtForm } from './tavt-form.entity';
import { FMVValucationMaster } from './fmv-valucation-master.entity';
import { BillingInfo } from './billing-info.entity';
import { BillingInfoDeposits } from './billing-info-deposits.entity';
import { SelectedFormsMapping } from './selected-forms-mapping.entity';
import { SelectedStampMapping } from './selected-stamp-mapping.entity';
import { SelectedDocsMapping } from './selected-docs-mapping.entity';
import { BatchPrepMapping } from './batch-prep-mapping.entity';
import { InvoiceChecks } from './invoice-checks.entity';
import { CountyProcessingTypes } from '../enums/county-location.enum';
import { FedExDocuments } from './fedex-labels.entity';

@Index("tickets_ticket_status_id", ["ticketStatusId"], {})
@Index("tickets_assigned_to_dept_id", ["assignedToDeptId"], {})
@Index("tickets_priority_id", ["priorityId"], {})
@Index("tickets_vin_id", ["vinId"], {})
@Index("tickets_carrier_types_id", ["carrierTypesId"], {})
@Index("tickets_tracking_id", ["trackingId"], {})
@Index("tickets_customer_id", ["customerId"], {})
@Index("tickets_start_date", ["startDate"], {})
@Index("tickets_doc_received_date", ["docReceivedDate"], {})
@Index("tickets_purchase_date", ["purchaseDate"], {})
@Index("tickets_id", ["id"], {})
@Index("tickets_invoice_id", ["invoiceId"], {})

@Entity({ name: 'tickets', schema: 'ticket' })
export class Tickets extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'invoice_id', length: 30, nullable: false })
    invoiceId: string;

    @Column('int', { name: 'vin_id' })
    vinId: number;

    @Column('int', { name: 'ticket_status_id', nullable: false })
    ticketStatusId: number | null;

    @Column('int', { name: 'assigned_to_dept_id', nullable: true })
    assignedToDeptId: number;

    @Column('int', { name: 'customer_id', nullable: true })
    customerId: number;

    @Column('int', { name: 'priority_id', nullable: true })
    priorityId: number | null;

    @Column('int', { name: 'carrier_types_id', nullable: true })
    carrierTypesId: number;

    @Column('int', { name: 'tid_types_id', nullable: true })
    tidTypeId: number | null;

    @Column('varchar', { name: 'tracking_id', nullable: true })
    trackingId: string;

    @Column("timestamp", { name: "date_received", nullable: true })
    dateReceived: Date;

    @Column("date", { name: "doc_received_date", nullable: true })
    docReceivedDate: Date;

    @Column('date', { name: 'purchase_date', nullable: true })
    purchaseDate: Date;

    @Column('date', { name: 'start_date', nullable: true })
    startDate: Date;

    @Column('date', { name: 'end_date', nullable: true })
    endDate: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'estimation_fees', nullable: true })
    estimationFees: number;

    @Column('boolean', { name: 'is_active', default: true, comment: "true=> active,  false=> deactive" })
    isActive: boolean;

    @Column("boolean", { name: "is_deleted", default: false })
    isDeleted: boolean;

    @Column('boolean', { name: 'is_state_transfer', default: null, nullable: true, comment: "true=state-transfer, false=not-state-transfer" })
    isStateTransfer: boolean;

    @Column("timestamp", { name: "sent_to_dmv_at", nullable: true })
    sentToDmvAt: Date;

    @Column("int", { name: "sent_to_dmv_by", nullable: true })
    sentToDmvBy: number | null;

    @Column("timestamp", { name: "sent_to_batch_prep", nullable: true })
    sentToBatchPrep: Date;

    @Column("int", { name: "sent_to_batch_prep_by", nullable: true })
    sentToBatchPrepBy: number | null;

    @Column({ name: 'processingType', type: 'enum', enum: CountyProcessingTypes, nullable: true, comment: "WALK:1,DROP:2,MAIL:3" })
    processingType: CountyProcessingTypes | null;

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

    @ManyToOne(() => TicketStatuses)
    @JoinColumn({ name: "ticket_status_id", referencedColumnName: "id" })
    ticketStatus: TicketStatuses;

    @ManyToOne(() => CarrierTypes)
    @JoinColumn({ name: "carrier_types_id", referencedColumnName: "id" })
    carrierType: CarrierTypes;

    @ManyToOne(() => Customers)
    @JoinColumn({ name: "customer_id", referencedColumnName: "id" })
    customer: Customers;

    @ManyToOne(() => PriorityTypes)
    @JoinColumn({ name: "priority_id", referencedColumnName: "id" })
    priority: PriorityTypes;

    @ManyToOne(() => Departments)
    @JoinColumn({ name: "assigned_to_dept_id", referencedColumnName: "id" })
    department: Departments;

    @OneToMany(() => TicketAssignedUsers, (d) => d.ticket)
    ticketAssignedUser: TicketAssignedUsers[];

    @OneToOne(() => BasicInfo, (d) => d.ticket)
    basicInfo: BasicInfo;

    @OneToOne(() => TitleInfo, (d) => d.ticket)
    titleInfo: TitleInfo;

    @OneToOne(() => InsuranceInfo, (d) => d.ticket)
    insuranceInfo: InsuranceInfo;

    @OneToMany(() => LienInfo, (d) => d.ticket)
    lienInfo: LienInfo[];

    @OneToMany(() => TicketTags, (d) => d.ticket)
    ticketTag: TicketTags[];

    @OneToMany(() => TicketDocuments, (d) => d.ticket)
    ticketDocument: TicketDocuments[];

    @OneToMany(() => FedExDocuments, (d) => d.ticket)
    fedExDocuments: FedExDocuments[];

    @ManyToOne(() => VinInfo)
    @JoinColumn({ name: "vin_id", referencedColumnName: "id" })
    vinInfo: VinInfo;

    @ManyToOne(() => TidTypes)
    @JoinColumn({ name: "tid_types_id", referencedColumnName: "id" })
    tidTypeData: TidTypes;

    @OneToMany(() => ActivityLogs, (a) => a.ticket)
    activityLogTicket: ActivityLogs[];

    @OneToMany(() => TradeInInfo, (trade) => trade.ticket)
    tradeInInfo: TradeInInfo[];

    @OneToMany(() => BuyerInfo, (buyer) => buyer.ticket)
    buyerInfo: BuyerInfo[];

    @OneToMany(() => SellerInfo, (seller) => seller.ticket)
    sellerInfo: SellerInfo[];

    @OneToOne(() => RegistrationInfo, (regInfo) => regInfo.ticket)
    registrationInfo: RegistrationInfo;

    @OneToOne(() => TavtForm, (d) => d.ticket)
    tavtForm: TavtForm;

    @OneToMany(() => FMVValucationMaster, (fmv) => fmv.ticket)
    fmvMasters: FMVValucationMaster[];

    @OneToOne(() => BillingInfo, (b) => b.ticket)
    billingInfo: BillingInfo;

    @OneToMany(() => BillingInfoDeposits, (b) => b.ticket)
    billingInfoDeposits: BillingInfoDeposits[];

    @OneToMany(() => SelectedFormsMapping, (pdf) => pdf.ticket)
    selectedForms: SelectedFormsMapping[];

    @OneToMany(() => SelectedStampMapping, (stamp) => stamp.ticket)
    selectedStamp: SelectedStampMapping[];

    @OneToMany(() => SelectedDocsMapping, (doc) => doc.ticket)
    selectedDoc: SelectedDocsMapping[];

    @OneToOne(() => BatchPrepMapping, (d) => d.ticket)
    batchPrepMapping: BatchPrepMapping;

    @ManyToOne(() => User)
    @JoinColumn({ name: "sent_to_dmv_by", referencedColumnName: "id" })
    sentToDmvByUser: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: "sent_to_batch_prep_by", referencedColumnName: "id" })
    sentToBatchPrepByUser: User;

    @OneToMany(() => InvoiceChecks, (check) => check.ticket)
    invoiceChecks: InvoiceChecks[];

}