import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { TransactionTypes } from './transaction-types.entity';
import { Customers } from './customers.entity';

@Index("customer_transaction_types_customer_id", ["customerId"], {})

@Entity({ name: 'customer_transaction_types', schema: 'customer' })
export class CustomerTransactionTypes extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: false, name: 'customer_id' })
    customerId: number;

    @Column({ type: 'int', nullable: false, name: 'transaction_types_id' })
    transactionTypesId: number;

    @Column({ type: 'varchar', length: 100, nullable: true, name: 'customer_transaction_type' })
    customerTransactionType: string;

    @Column({ type: 'decimal', nullable: false, name: 'price' })
    price: string;

    @Column({ type: 'text', nullable: true, name: 'description' })
    description: string | null;

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

    @ManyToOne(() => TransactionTypes)
    @JoinColumn({ name: "transaction_types_id", referencedColumnName: "id" })
    transactionType: TransactionTypes;

    @ManyToOne(() => Customers, (customer) => customer.transactionTypes)
    @JoinColumn({ name: "customer_id", referencedColumnName: "id" })
    customer: Customers;
}
