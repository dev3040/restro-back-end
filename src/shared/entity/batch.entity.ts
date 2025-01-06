import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { TitleCounties } from "./title-counties.entity";
import { BatchGroups } from "./batch-group.entity";
import { BatchPrepMapping } from "./batch-prep-mapping.entity";
import { FedExDocuments } from "./fedex-labels.entity";
import { CountyMilage } from "./county-milage.entity";
import { CountyProcessingTypes } from "../enums/county-location.enum";
import { User } from "./user.entity";

@Index("batches_group_id", ["groupId"], {})
@Index("batches_county_id", ["countyId"], {})

@Entity({ name: 'batches', schema: 'batch_prep' })
export class Batches extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('bigint', { name: 'county_id', nullable: false })
    countyId: number;

    @Column('bigint', { name: 'group_id', nullable: false })
    groupId: number;

    @Column('bigint', { name: 'city_id', nullable: true })
    cityId: number;

    @Column('enum', { name: "processing_types", enum: CountyProcessingTypes, comment: "WALK:1,DROP:2,MAIL:3", nullable: false })
    processingType: CountyProcessingTypes;

    @Column('text', { name: 'comment', nullable: true })
    comment: string;

    @Column("timestamp", { name: "walk_date_processing", nullable: true })
    walkDateProcessing: Date;

    @Column("timestamp", { name: "drop_date_processing", nullable: true })
    dropDateProcessing: Date;

    @Column("timestamp", { name: "mail_date_processing", nullable: true })
    mailDateProcessing: Date;

    @Column("timestamp", { name: "date_processing", nullable: true })
    dateProcessing: Date;

    @Column('date', { name: 'completed_at', nullable: true })
    completedAt: Date;

    @Column("int", { name: "completed_by", nullable: true })
    completedBy: number;

    @ManyToOne(() => User, (user) => user.batchGroupCompletedBy)
    @JoinColumn([{ name: "completed_by", referencedColumnName: "id" }])
    completedByUser: User;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @ManyToOne(() => TitleCounties)
    @JoinColumn([{ name: "county_id", referencedColumnName: "id" }])
    county: TitleCounties;

    @ManyToOne(() => BatchGroups)
    @JoinColumn([{ name: "group_id", referencedColumnName: "id" }])
    group: BatchGroups;

    @OneToMany(() => BatchPrepMapping, (a) => a.batch)
    batchPrepMapping: BatchPrepMapping[];

    @OneToOne(() => FedExDocuments, (d) => d.batch)
    fedExDocuments: FedExDocuments;

    @ManyToOne(() => User)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User;

    @ManyToOne(() => CountyMilage)
    @JoinColumn([{ name: "city_id", referencedColumnName: "id" }])
    countyMilage: CountyMilage;

}
