import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from 'typeorm';


@Index("vin_number", ["vin"], {})

@Entity({ name: 'fmv_pdf_data', schema: 'master' })
export class FmvPdfData extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'vin_number', length: 50, nullable: true })
    vin: string;

    @Column('int', { name: 'year', nullable: true })
    year: number;

    @Column('text', { name: 'series', nullable: true })
    series: string;

    @Column('numeric', { name: 'price', nullable: true, precision: 15, scale: 2 })
    price: string;

    @Column('int', { name: 'effective_year', nullable: true })
    effectiveYear: number;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
    isDeleted: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "updated_at"
    })
    updatedAt: Date;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;

}
