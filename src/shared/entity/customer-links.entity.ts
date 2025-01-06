import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Customers } from './customers.entity';

@Index("customer_links_customer_id", ["customerId"], {})

@Entity({ name: 'customer_links', schema: 'customer' })
export class CustomerLinks extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('int', { name: 'customer_id', nullable: false })
    customerId: number;

    @Column('varchar', { name: 'link_url', length: 200, nullable: false })
    linkUrl: string;

    @Column('text', { name: 'description', nullable: true })
    description: string;

    @Column("boolean", { name: "is_active", default: true, nullable: false, comment: "true=active, false=deactive" })
    isActive: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: false })
    createdBy: number;

    @ManyToOne(() => User, (user) => user.departmentCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => Customers, (customer) => customer.customerLinks)
    @JoinColumn({ name: "customer_id", referencedColumnName: "id" })
    customer: Customers;
}
