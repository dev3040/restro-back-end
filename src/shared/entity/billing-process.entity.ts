import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Tickets } from './tickets.entity';

@Entity({ name: 'billing_process', schema: 'data_entry' })
export class BillingProcess extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'ticket_id', type: 'int', nullable: false })
    ticketId: number;

    @Column({
        type: "jsonb",
        name: "vin_module",
        nullable: false,
        default: () => "'{}'",
    })
    vinModule: Record<string, any>;

    @Column({
        type: "jsonb",
        name: "buyer_module",
        nullable: false,
        default: () => "'{}'",
    })
    buyerModule: Record<string, any>;

    @Column({
        type: "jsonb",
        name: "lien_module",
        nullable: false,
        default: () => "'{}'",
    })
    lienModule: Record<string, any>;

    @Column({
        type: "jsonb",
        name: "fees_module",
        nullable: false,
        default: () => "'{}'",
    })
    feesModule: Record<string, any>;

    @Column({
        type: "jsonb",
        name: "billing_module",
        nullable: false,
        default: () => "'{}'",
    })
    billingModule: Record<string, any>;

    @Column({
        type: "jsonb",
        name: "service_fees_module",
        nullable: false,
        default: () => "'{}'",
    })
    serviceFeesModule: Record<string, any>;

    @Column({
        type: "jsonb",
        name: "transaction_return_module",
        nullable: false,
        default: () => "'{}'",
    })
    transactionReturnModule: Record<string, any>;

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
