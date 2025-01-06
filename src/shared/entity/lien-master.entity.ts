import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'lien_master', schema: 'master' })
export class LienMaster extends BaseEntity {

    @PrimaryGeneratedColumn({ type: 'int' })
    id: number;

    @Column({ name: 'holder_name', type: 'varchar', nullable: false, length: 200 })
    holderName: string;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ name: 'is_active', type: 'boolean', default: true, comment: "true=active, false=not-inactive" })
    isActive: boolean;

    @Column({ name: 'is_elt', type: 'boolean', default: false, comment: "true=elt, false=not-elt" })
    isElt: boolean;

    @Column({ name: 'is_deleted', type: 'boolean', default: false, comment: "true=deleted, false=not-deleted" })
    isDeleted: boolean;

    @Column({ type: "varchar", name: "lien_holder_id", nullable: true, length: 50 })
    lienHolderId: string;

    @Column({ type: 'text', name: "mailing_address", nullable: true })
    mailingAddress: string;

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

}
