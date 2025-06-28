import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { SubItems } from './sub-items.entity';
import { Branches } from './branches.entity';

@Entity({ name: 'sub_item_branch_mapping', schema: 'master' })
export class SubItemBranchMapping extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("int", { name: "sub_item_id", nullable: false })
    subItemId: number;

    @Column("int", { name: "branch_id", nullable: true })
    branchId: number;

    @Column({ type: 'jsonb', name: 'branch_price', nullable: true, comment: "Branch-specific price override" })
    branchPrice: string;

    @Column("decimal", { name: "branch_offer", precision: 10, scale: 2, nullable: true, comment: "Branch-specific offer/discount" })
    branchOffer: string | null;

    @ManyToOne(() => SubItems)
    @JoinColumn({ name: "sub_item_id", referencedColumnName: "id" })
    subItem: SubItems;

    @ManyToOne(() => Branches)
    @JoinColumn({ name: "branch_id", referencedColumnName: "id" })
    branch: Branches;
} 