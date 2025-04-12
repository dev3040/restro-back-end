import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { CustomerLinks } from './customer-links.entity';
import { CustomerTransactionTypes } from './customer-transaction-types.entity';
import { CustomerContacts } from './customer-contacts.entity';

@Index("customers_name", ["name"], {})
@Entity({ name: 'customers', schema: 'customer' })
export class Customers extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'name', length: 150, nullable: true })
    name: string;

    @Column('varchar', { name: 'unique_id', length: 150, nullable: true })
    uniqueId: string;

    @Column('varchar', { name: 'email', length: 100, nullable: true })
    email: string | null;

    @Column('varchar', { name: 'phone', length: 100, nullable: true })
    phone: string | null;

    @Column('text', { name: 'address', nullable: true })
    address: string | null;

    @Column('text', { name: 'state', nullable: true })
    state: string | null;

    @Column('text', { name: 'street', nullable: true })
    street: string | null;

    @Column({
        type: "date",
        name: "birth_date",
        nullable: true
    })
    birthDate: Date;

    @Column({
        type: "date",
        name: "anniversary_date",
        nullable: true
    })
    anniversaryDate: Date;

    @Column("boolean", { name: "is_active", nullable: false, comment: "true=active, false=deactive", default: true })
    isActive: boolean;

    @Column("boolean", { name: "is_deleted", default: false })
    isDeleted: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number;

    @UpdateDateColumn({
        type: "timestamp with time zone",
        name: "updated_at"
    })
    updatedAt: Date;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;

    @OneToMany(() => CustomerLinks, (d) => d.customer)
    customerLinks: CustomerLinks[];

    @OneToMany(() => CustomerTransactionTypes, (d) => d.customer)
    transactionTypes: CustomerTransactionTypes[];

    @OneToMany(() => CustomerContacts, (d) => d.customer)
    contact: CustomerContacts[];

}
