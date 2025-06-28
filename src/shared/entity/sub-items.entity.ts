import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { CommonConst } from '../constants/common.constant';
import { OutletMenu } from './outlet-menu.entity';
import { SubItemBranchMapping } from './sub-item-branch-mapping.entity';

@Entity({ name: 'sub_items', schema: 'master' })
export class SubItems extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'name', length: 100, nullable: true })
    name: string;

    @Column({ type: 'jsonb', name: 'price', nullable: true })
    price: string;

    @Column("int", { name: "category_id", nullable: true })
    categoryId: number | null;

    @Column('varchar', { name: 'slug', length: CommonConst.slugLength, nullable: true })
    slug: string;

    @Column("decimal", { name: "offer", precision: 10, scale: 2, nullable: true })
    offer: string | null;

    @Column('smallint', { name: 'order', nullable: true })
    order: number;

    @Column('varchar', { name: 'printer', length: 100, nullable: true, default: "K1" })
    printer: string;

    @Column('boolean', { name: 'is_active', default: true })
    isActive: boolean;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
    isDeleted: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "updated_by", referencedColumnName: "id" })
    updatedByUser: User;

    @ManyToOne(() => OutletMenu)
    @JoinColumn({ name: "category_id", referencedColumnName: "id" })
    outletMenu: OutletMenu;

    @OneToOne(() => SubItemBranchMapping, (subItemBranchMapping) => subItemBranchMapping.subItem)
    subItemBranchMapping: SubItemBranchMapping;
}
