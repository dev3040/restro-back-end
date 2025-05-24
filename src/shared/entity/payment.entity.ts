import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Branches } from './branches.entity';


@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date', name: 'payment_date' })
    paymentDate: string;

    @Column({ type: 'varchar', length: 255, name: 'payment_to' })
    paymentTo: string;

    @Column({ type: 'varchar', length: 50, default: 'cash', name: 'payment_mode' })
    paymentMode: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'text', nullable: true })
    remarks: string;

    @Column({ name: 'branch_id' })
    branchId: number;

    @ManyToOne(() => Branches)
    @JoinColumn({ name: 'branch_id' })
    branch: Branches;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
} 