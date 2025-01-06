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

@Index("add_on_prices_name", ["name"], {})

@Entity({ name: 'add_on_prices', schema: 'master' })
export class AddOnPrices extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'name', length: 150, })
    name: string;

    @Column('decimal', { name: 'price' })
    price: string;

    @Column('varchar', { name: 'code', length: 10, nullable: true })
    code: string | null;

    @Column('boolean', { name: 'is_active', default: true, comment: "true=active, false=inactive" })
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


}
