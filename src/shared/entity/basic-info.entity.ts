import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BaseEntity, Index } from 'typeorm';
import { User } from './user.entity';
import { TransactionTypes } from './transaction-types.entity';
import { Customers } from './customers.entity';
import { CustomerContacts } from './customer-contacts.entity';
import { Tickets } from './tickets.entity';

@Index("basic_info_ticket_id", ["ticketId"], {})

@Entity({ name: 'basic_info', schema: 'data_entry' })
export class BasicInfo extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'client', type: 'varchar', length: 100, nullable: true })
    client: string;

    @Column({ name: 'unit', type: 'varchar', length: 100, nullable: true })
    unit: string;

    @Column({ name: 'transaction_type_id', type: 'int', nullable: true })
    transactionTypeId: number | null;

    @Column({ name: 'ticket_id', type: 'int', nullable: false })
    ticketId: number;

    @Column({ name: 'customer_contact_info_id', type: 'int', nullable: true })
    customerContactInfoId: number | null;

    @Column({ name: 'customer_id', type: 'int', nullable: true })
    customerId: number;

    @Column({ name: 'customer_transaction_type', type: 'varchar', length: 100, nullable: true })
    customerTransactionType: string | null;

    @Column({ name: 'is_title', type: 'boolean', default: false })
    isTitle: boolean;

    @Column({ name: 'is_registration', type: 'boolean', default: false })
    isRegistration: boolean;

    @Column({ name: 'is_irp', type: 'boolean', default: false })
    isIrp: boolean;

    @Column({ name: 'is_conditional_title', type: 'boolean', default: false })
    isConditionalTitle: boolean;

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

    @ManyToOne(() => TransactionTypes)
    @JoinColumn({ name: "transaction_type_id", referencedColumnName: "id" })
    transactionType: TransactionTypes;

    @ManyToOne(() => Customers)
    @JoinColumn({ name: "customer_id", referencedColumnName: "id" })
    customer: Customers;

    @ManyToOne(() => CustomerContacts)
    @JoinColumn({ name: "customer_contact_info_id", referencedColumnName: "id" })
    customerContacts: CustomerContacts;

    @ManyToOne(() => Tickets)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;
}
