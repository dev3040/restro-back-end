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
import { SellerTypeEnum } from '../enums/seller-info.enum';
import { Tickets } from './tickets.entity';
import { DealerMaster } from './dealer-master.entity';


@Index("seller_id", ["id"], {})
@Index("seller_ticket_id", ["ticketId"], {})

@Entity({ name: 'seller_info', schema: "data_entry" })
export class SellerInfo extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'name', length: 150, nullable: false })
    name: string;

    @Column("varchar", { name: "seller_id", length: 25, nullable: true })
    sellerId: string;

    @Column("boolean", { name: "is_dealership", default: true, comment: "true=dealership, false=non-dealership" })
    isDealership: boolean;

    @Column("enum", { name: "seller_type", enum: SellerTypeEnum, comment: "ga_dealer, out_of_state_dealer,out_of_state_transfer" })
    sellerType: SellerTypeEnum;

    @Column('int', { name: 'dealer_id', nullable: true })
    dealerId: number;

    @Column("int", { name: "ticket_id", nullable: true })
    ticketId: number;

    @Column('varchar', { name: 'sales_tax_id', length: 20, nullable: true })
    salesTaxId: string;

    @Column("text", { nullable: true })
    address: string;

    @Column("boolean", { name: "is_active", default: true, comment: "true=active, false=inactive" })
    isActive: boolean;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
    isDeleted: boolean;

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
    createdBy: number;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number;


    @ManyToOne(() => Tickets, (ticket) => ticket.sellerInfo)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;

    @ManyToOne(() => DealerMaster, (dealer) => dealer.dealerId)
    @JoinColumn({ name: "dealer_id", referencedColumnName: "id" })
    dealer: DealerMaster;
}
