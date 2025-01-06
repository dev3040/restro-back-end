import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from './user.entity';
import { Batches } from "./batch.entity";
import { BaseModifiableEntity } from '../base-entities/base-modifiable-entity';
import { BatchDocuments } from "./batch-documents.entity";
import { BatchHistory } from "./batch-history.entity";

@Entity({ name: 'batch_groups', schema: 'batch_prep' })
export class BatchGroups extends BaseModifiableEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @Column('date', { name: 'completed_at', nullable: true })
    completedAt: Date;

    @Column("int", { name: "completed_by", nullable: true })
    completedBy: number;

    @ManyToOne(() => User, (user) => user.batchGroupCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User, (user) => user.filterBookmarkUpdatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User;

    @OneToMany(() => Batches, (a) => a.group)
    groupBatch: Batches[];

    @OneToMany(() => BatchDocuments, (d) => d.batchGroups)
    documents: BatchDocuments[];

    @OneToMany(() => BatchHistory, (b) => b.group)
    batchHistory: BatchHistory[];

}


