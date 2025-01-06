import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { SelectedDocsMapping } from './selected-docs-mapping.entity';
import { BatchGroups } from './batch-group.entity';

@Index("batch_documents_group_id", ["groupId"], {})
@Entity({ name: 'batch_documents', schema: 'batch_prep' })
export class BatchDocuments extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('int', { name: 'group_id' })
    groupId: number;

    @Column('varchar', { name: 'file_name', length: 255 })
    fileName: string;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true:deleted, false:not deleted" })
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

    @ManyToOne(() => User, (user) => user.ticketStatusUpdatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @ManyToOne(() => BatchGroups)
    @JoinColumn({ name: "group_id", referencedColumnName: "id" })
    batchGroups: BatchGroups;

    @ManyToOne(() => User)
    @JoinColumn({ name: "created_by", referencedColumnName: "id" })
    createdByUser: User;

    @OneToOne(() => SelectedDocsMapping, selectedDocsMapping => selectedDocsMapping.document)
    selectedDocMapping: SelectedDocsMapping;
}