import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BaseModifiableEntity } from '../base-entities/base-modifiable-entity';
import { BatchGroups } from "./batch-group.entity";
import { BatchHistoryPdfStatus } from "../enums/batch-history.enum";
import { pdfHistoryStatusEnumValues } from "../utility/enum-helper-functions";

@Entity({ name: 'batch_history', schema: 'batch_prep' })
export class BatchHistory extends BaseModifiableEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('date', { name: 'generated_date', nullable: true })
    generatedDate: Date;

    @Column('timestamp', { name: 'downloaded_date', nullable: true })
    downloadedDate: Date;

    @Column('enum', { name: "status", enum: BatchHistoryPdfStatus, comment: `(${pdfHistoryStatusEnumValues()})`, nullable: false })
    status: BatchHistoryPdfStatus;

    @Column('varchar', { name: 'file_name', length: 255, nullable: true })
    fileName: string;

    @Column('jsonb', { name: 'batch_ids', nullable: true })
    batchIds: number[]; 

    @ManyToOne(() => BatchGroups)
    @JoinColumn([{ name: "group_id", referencedColumnName: "id" }])
    group: BatchGroups;
}


