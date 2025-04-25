import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Branches } from './branches.entity';
import { PaymentMethods } from './payment-methods.entity';

@Entity({ name: 'billing', schema: 'public' })
export class Billing extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('int', { name: 'billing_id' })
    billingId: number;

    @Column('json', { name: 'billing_calc', nullable: true })
    billingCalc: Record<string, any> | null;

    @Column('boolean', { name: 'is_take_away', nullable: true })
    isTakeAway: boolean | null;

    @Column('boolean', { name: 'is_home_delivery', nullable: true })
    isHomeDelivery: boolean | null;

    @Column('decimal', { name: 'sub_total', precision: 10, scale: 2, nullable: true })
    subTotal: number | null;

    @Column('decimal', { name: 'discount', precision: 10, scale: 2, nullable: true })
    discount: number | null;

    @Column('int', { name: 'delivery_boy_id', nullable: true })
    deliveryBoyId: number | null;

    @ManyToOne(() => Branches)
    @JoinColumn({ name: 'branch_id', referencedColumnName: 'id' })
    branch: Branches;

    @Column('int', { name: 'payment_method_id', nullable: true })
    paymentMethodId: number | null;

    @ManyToOne(() => PaymentMethods)
    @JoinColumn({ name: 'payment_method_id', referencedColumnName: 'id' })
    paymentMethod: PaymentMethods;

    @Column('varchar', { name: 'table_no', nullable: true })
    tableNo: string | null;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: "timestamp with time zone",
        name: "updated_at"
    })
    updatedAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number;
}