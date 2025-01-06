import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { TitleStates } from './title-states.entity';
import { User } from './user.entity';
import { CountyProfile } from './county-profile.entity';
import { CountyCheatSheet } from './county-cheetsheet.entity';
import { SalesTaxMaster } from './sales-tax-master.entity';
import { CountyProcessing } from './county-processing.entity';
import { Batches } from './batch.entity';

@Entity({ name: 'title_counties', schema: 'master' })
export class TitleCounties extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'state_id', type: 'int' })
    stateId: number;

    @Column({ name: 'name', type: 'varchar', length: 100 })
    name: string;

    @Column({ name: 'code', type: 'varchar', length: 15, nullable: true })
    code: string;

    @Column({ name: 'county_code', type: 'varchar', length: 15, nullable: true })
    countyCode: string;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
    isDeleted: boolean;

    @Column('boolean', { name: 'is_active', default: true })
    isActive: boolean;

    @ManyToOne(() => TitleStates)
    @JoinColumn({ name: "state_id", referencedColumnName: "id" })
    state: TitleStates;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt: Date | null;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;

    @ManyToOne(() => User)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @OneToOne(() => CountyProfile, (countyProfile) => countyProfile.county)
    countyProfile: CountyProfile;

    @OneToOne(() => CountyCheatSheet, countyCheatSheet => countyCheatSheet.county)
    countyCheatSheet: CountyCheatSheet;

    @OneToOne(() => CountyProcessing, countyProcessing => countyProcessing.county)
    countyProcessing: CountyProcessing;

    @OneToOne(() => SalesTaxMaster, salesTaxMaster => salesTaxMaster.county)
    salesTax: SalesTaxMaster;

    @OneToOne(() => Batches, b => b.county)
    countyBatch: Batches;
}
