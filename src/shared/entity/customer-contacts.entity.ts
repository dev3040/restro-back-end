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
import { Customers } from './customers.entity';

@Index("customer_contacts_name", ["name"], {})
@Index("customer_contacts_customer_id", ["customerId"], {})

@Entity({ name: 'customer_contacts', schema: 'customer' })
export class CustomerContacts extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('int', { name: 'customer_id' })
    customerId: number;

    @Column('varchar', { name: 'role', length: 100, nullable: false })
    role: string;

    @Column('varchar', { name: 'name', length: 150, nullable: false })
    name: string;

    @Column('varchar', { name: 'email', length: 100, nullable: true })
    email: string | null;

    @Column('varchar', { name: 'phone', length: 30, nullable: true })
    phone: string | null;

    @Column('text', { name: 'billing_notes', nullable: true })
    billingNotes: string;

    @Column('text', { name: 'general_notes', nullable: true })
    generalNotes: string;

    @Column("boolean", { name: "is_primary", default: false, comment: "true=primary, false=not primary" })
    isPrimary: boolean;

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

    @ManyToOne(() => Customers, (c) => c.contact)
    @JoinColumn([{ name: "customer_id", referencedColumnName: "id" }])
    customer: Customers



}
