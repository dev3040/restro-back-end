import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { CustomerLinks } from './customer-links.entity';
import { CustomerTransactionTypes } from './customer-transaction-types.entity';
import { CustomerContacts } from './customer-contacts.entity';

@Index("customers_name", ["name"], {})

@Entity({ name: 'customers', schema: 'customer' })
export class Customers extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'name', length: 150, nullable: false })
    name: string;

    @Column('varchar', { name: 'short_name', length: 50, nullable: true })
    shortName: string | null;

    @Column('varchar', { name: 'email', length: 100, nullable: true })
    email: string | null;

    @Column('varchar', { name: 'phone', length: 30, nullable: true })
    phone: string | null;

    @Column('text', { name: 'primary_location', nullable: true })
    primaryLocation: string | null;

    @Column('varchar', { name: 'fax', length: 30, nullable: true })
    fax: string | null;

    @Column('text', { name: 'customer_note', nullable: true })
    customerNote: string | null;

    @Column('text', { name: 'billing_note', nullable: true })
    billingNote: string | null;

    @Column('text', { name: 'payment_terms', nullable: true })
    paymentTerms: string | null;

    @Column('text', { name: 'vendor_number', nullable: true })
    vendorNumber: string | null;

    @Column("boolean", { name: "is_active", nullable: false, comment: "true=active, false=deactive" })
    isActive: boolean;

    @Column("boolean", { name: "is_deleted", default: false })
    isDeleted: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: false })
    createdBy: number;

    @UpdateDateColumn({
        type: "timestamp with time zone",
        name: "updated_at"
    })
    updatedAt: Date;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;

    @ManyToOne(() => User, (user) => user.departmentCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User


    @ManyToOne(() => User, (user) => user.departmentCreatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @OneToMany(() => CustomerLinks, (d) => d.customer)
    customerLinks: CustomerLinks[];

    @OneToMany(() => CustomerTransactionTypes, (d) => d.customer)
    transactionTypes: CustomerTransactionTypes[];

    @OneToMany(() => CustomerContacts, (d) => d.customer)
    contact: CustomerContacts[];

}
