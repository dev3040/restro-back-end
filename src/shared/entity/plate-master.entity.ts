import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, UpdateDateColumn, CreateDateColumn, OneToMany, AfterLoad } from 'typeorm';
import { CountySpecialForms } from './county-special-forms.entity';

@Entity({ name: 'plate_master', schema: 'master' })
export class PlateMaster extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'plate_details', type: 'varchar', length: 150 })
    plateDetails: string;

    @Column({ name: 'category_code', type: 'varchar', length: 5 })
    categoryCode: string;

    @Column("int", { name: "plate_type_id", nullable: true })
    plateTypeId: number;

    @Column({ name: 'annual_special_fee', type: 'decimal', precision: 10, scale: 2, nullable: true })
    annualSpecialFee: string;

    @Column({ name: 'manufacturing_fee', type: 'decimal', precision: 10, scale: 2, nullable: true })
    manufacturingFee: string;

    @Column({ name: 'standard_fee', type: 'decimal', precision: 10, scale: 2, nullable: true })
    standardFee: string;

    @Column({ name: 'required_forms', type: 'varchar', length: 70, nullable: true })
    requiredForms: string;

    @Column({ name: 'special_qualifications', type: 'varchar', length: 500, nullable: true })
    specialQualifications: string;

    @Column({ name: 'state', type: 'int', nullable: true })
    stateId: number;

    @Column({ name: 'document', type: 'text', nullable: true })
    document: string;

    @Column({ name: 'site_link', type: 'text', nullable: true })
    siteLink: string;

    @Column({ name: 'weight_range_start', type: 'int', nullable: true })
    weightRangeStart: number;

    @Column({ name: 'weight_range_end', type: 'int', nullable: true })
    weightRangeEnd: number;

    @Column({ name: 'is_transferable', type: 'boolean' })
    isTransferable: boolean;

    @Column({ name: 'is_feb_expiration', type: 'boolean' })
    isFebExpiration: boolean;

    @Column({ name: 'is_reg_quarter', type: 'boolean', default: false })
    isRegQuarter: boolean;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'is_deleted', type: 'boolean', default: false })
    isDeleted: boolean;

    @Column({ name: 'quarter_calc', type: 'text', nullable: true })
    quarterCalc: string | null;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: "timestamp with time zone",
        name: "updated_at"
    })
    updatedAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;

    @OneToMany(() => CountySpecialForms, (d) => d.countyForms)
    countyForms: CountySpecialForms[];

    @AfterLoad()
    parseBrands() {
        if (this.quarterCalc) {
            this.quarterCalc = JSON.parse(this.quarterCalc);
        }
    }
}
