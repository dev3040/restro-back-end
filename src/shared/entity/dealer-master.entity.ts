import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn, CreateDateColumn, BaseEntity, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { SellerInfo } from './seller-info.entity';
import { SellerTypeEnum } from '../enums/seller-info.enum';

@Entity({ schema: 'master', name: 'dealer_master' })
export class DealerMaster extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { length: 150, nullable: false })
    name: string;

    @Column("varchar", { name: "seller_id", length: 200, nullable: true })
    sellerId: string;

    @Column("text", { nullable: true })
    address: string | null;

    @Column("varchar", { name: 'sales_tax_id', length: 25, nullable: true })
    salesTaxId: string | null;

    @Column("boolean", { name: 'is_dealer', default: false })
    isDealer: boolean;

    @Column("enum", { name: "seller_type", enum: SellerTypeEnum, comment: "ga_dealer, out_of_state_dealer,out_of_state_transfer", nullable: true })
    sellerType: SellerTypeEnum;

    @Column("boolean", { name: 'is_active', default: false })
    isActive: boolean;

    @Column("boolean", { name: 'is_deleted', default: false })
    isDeleted: boolean;

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

    @ManyToOne(() => User, (user) => user.departmentCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User


    @ManyToOne(() => User, (user) => user.departmentCreatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @OneToMany(() => SellerInfo, (seller) => seller.dealer)
    dealerId: SellerInfo[];
}
