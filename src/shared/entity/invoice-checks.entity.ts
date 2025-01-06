import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { BatchGroups } from './batch-group.entity';
import { Tickets } from './tickets.entity';
import { Batches } from './batch.entity';

@Entity({ name: 'invoice_checks', schema: 'batch_prep' })
export class InvoiceChecks extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('bigint', { name: 'batch_id', nullable: true })
    batchId: number;

    @Column('bigint', { name: 'ticket_id', nullable: true })
    ticketId: number;

    @Column('varchar', { name: 'check_num', length: 100, nullable: true })
    checkNum: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'amount', nullable: true })
    amount: number;

    @Column('int', { name: 'order', nullable: false })
    order: number;

    @ManyToOne(() => BatchGroups)
    @JoinColumn([{ name: "group_id", referencedColumnName: "id" }])
    group: BatchGroups;

    @ManyToOne(() => Batches)
    @JoinColumn([{ name: "batch_id", referencedColumnName: "id" }])
    batch: Batches;

    @ManyToOne(() => Tickets)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;
}