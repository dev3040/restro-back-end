import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TitleStates } from './title-states.entity';
import { TaxExemptionTypeEnum } from '../enums/tax-exemption.enum';

@Entity({ name: 'tavt_tax_exemption_master', schema: 'master' })
export class TavtTaxExemptionMaster extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'state_id', type: 'int', nullable: false })
    stateId: number | null;

    @Column("enum", { name: "exemption_type", enum: TaxExemptionTypeEnum, nullable: false, comment: "TAVT = 1,TAVT_SALES_TAX = 2,SALES_TAX = 2" })
    exemptionType: TaxExemptionTypeEnum;

    @Column('varchar', { name: 'exemption', length: 100, nullable: false })
    exemption: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'rate', nullable: true })
    rate: string;

    @Column('varchar', { name: 'required_forms', length: 50, nullable: false })
    requiredForms: string;

    @Column("text", { nullable: true })
    description: string;

    @Column("boolean", { name: "is_active", default: true, comment: "true=active, false=inactive" })
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

    @ManyToOne(() => User, (user) => user.exemptionCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "updated_by", referencedColumnName: "id" })
    updatedByUser: User;

    @ManyToOne(() => TitleStates)
    @JoinColumn({ name: "state_id", referencedColumnName: "id" })
    titleState: TitleStates;


}
