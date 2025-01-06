import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Tickets } from './tickets.entity';
import { TransactionReturnTypeEnum } from '../enums/transaction-return-type.enum';

@Index("billing_info_ticket_id", ["ticketId"], {})

@Entity({ name: 'billing_info', schema: 'data_entry' })
export class BillingInfo extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'ticket_id', type: 'int', nullable: false })
    ticketId: number;

    @Column('enum', { name: "transaction_return_type", enum: TransactionReturnTypeEnum, nullable: true, comment: "1-Customer provided label back to them, 2-Customer provided label to their Client, 3-Customer will pickup, 4-Ship back to Customer + Charge Fee, 5-Ship back to Customer - Request Label, 6-Ship to Client/Enter address information + Charge Fee, 7-County mailed Reg/Plate to Driver, 8-Driver picked up Reg/Plate at County - No fee" })
    transactionReturnType: TransactionReturnTypeEnum;

    @Column({ name: 'express_mail_fees', type: 'decimal', precision: 10, scale: 2, nullable: true })
    expressMailFees: string | null;

    @Column('text', { name: 'address', nullable: true })
    address: string | null;

    @Column("boolean", { name: "is_different_address", default: false, comment: "true=different, false=same" })
    isDifferentAddress: boolean;

    @Column('varchar', { name: 'tracking_label', length: 20, nullable: true })
    trackingLabel: string | null;

    @Column('text', { name: 'billing_note', nullable: true })
    billingNote: string | null;

    @Column('text', { name: 'runner_note', nullable: true })
    runnerNote: string | null;

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

    @ManyToOne(() => User, (user) => user.billingInfoCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User;

    @ManyToOne(() => Tickets, (ticket) => ticket.billingInfo)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;

    @ManyToOne(() => User, (user) => user.billingInfoUpdatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User


}
