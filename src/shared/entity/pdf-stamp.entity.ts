import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { SelectedStampMapping } from './selected-stamp-mapping.entity';

@Entity({ name: 'pdf_stamp', schema: 'master' })
export class PdfStamp extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'stamp', length: 100, nullable: false })
    stamp: string;

    @Column("boolean", { name: "is_active", default: true, comment: "true=active, false=inactive" })
    isActive: boolean;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
    isDeleted: boolean;

    @Column("boolean", { name: "is_add_on", default: false, comment: "true=addOn stamp, false=not addOn stamp" })
    isAddOn: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;

    @ManyToOne(() => User, (user) => user.departmentCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @OneToMany(() => SelectedStampMapping, (stamp) => stamp.stamp)
    selectedStamp: SelectedStampMapping[];

}
