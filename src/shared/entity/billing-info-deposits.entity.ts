import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Tickets } from './tickets.entity';
import { BillingDepositTypesEnum } from '../enums/billing-deposit-type.enum';

@Index("billing_info_deposits_ticket_id", ["ticketId"], {})

@Entity({ name: 'billing_info_deposits', schema: 'data_entry' })
export class BillingInfoDeposits extends BaseEntity {

   @PrimaryGeneratedColumn()
   id: number;

   @Column({ name: 'ticket_id', type: 'int', nullable: false })
   ticketId: number;

   @Column('enum', { name: "type", enum: BillingDepositTypesEnum, comment: "1=Deposit to Us, 2=Deposit to County", nullable: false })
   type: BillingDepositTypesEnum;

   @Column('varchar', { name: 'cheque_number', length: 25, nullable: true })
   chequeNumber: string | null;

   @Column('date', { name: 'received_date', nullable: true })
   receivedDate: Date | null;

   @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
   amount: string | null;

   @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
   createdAt: Date;

   @Column("int", { name: "created_by", nullable: false })
   createdBy: number;

   @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
   updatedAt: Date;

   @Column("int", { name: "updated_by", nullable: true })
   updatedBy: number | null;

   @ManyToOne(() => User, (user) => user.billingInfoDepositCreatedBy)
   @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
   createdByUser: User;

   @ManyToOne(() => User, (user) => user.billingInfoDepositUpdatedBy)
   @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
   updatedByUser: User

   @ManyToOne(() => Tickets, (t) => t.billingInfoDeposits)
   @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
   ticket: Tickets;
}
