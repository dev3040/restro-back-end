import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TitleCounties } from './title-counties.entity';
import { FedExPickupFrequency } from '../enums/county-location.enum';


@Entity({ name: 'county_cheat_sheet', schema: 'county' })
export class CountyCheatSheet extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('int', { name: 'county_id', nullable: false })
    countyId: number;

    @Column('text', { name: 'note', nullable: true })
    note: string;

    @Column("boolean", { name: "emission", default: false })
    emission: boolean;

    @Column("boolean", { name: "t19cPoa", default: false })
    t19cPoa: boolean;

    @Column("boolean", { name: "commercial_plate_form_required", default: false })
    commercialPlateFormRequired: boolean;

    @Column("int", { name: "ga_dealer_work_after", nullable: true, width: 4 })
    gaDealerWorkAfter: number;

    @Column("varchar", { name: "refund_policy", length: 50, nullable: true })
    refundPolicy: string;

    @Column("varchar", { name: "trailers_t22b", length: 50, nullable: true })
    trailersT22B: string;

    @Column("boolean", { name: "poa_t19c", default: false })
    poaT19C: boolean;

    @Column("int", { name: "registration_renewal_period", nullable: true, width: 4 })
    registrationRenewalPeriod: number;

    @Column("varchar", { name: "replacement_plate", length: 50, nullable: true })
    replacementPlate: string;

    @Column("varchar", { name: "replacement_sticker_decal", length: 50, nullable: true })
    replacementStickerDecal: string;

    @Column("varchar", { name: "plate_exchange", length: 50, nullable: true })
    plateExchange: string;

    @Column("boolean", { name: "business_license", default: false })
    businessLicense: boolean;

    @Column("boolean", { name: "proof_of_residency", default: false })
    proofOfResidency: boolean;

    @Column("boolean", { name: "driver_license", default: false })
    driverLicense: boolean;

    @Column("boolean", { name: "letter_of_authorization", default: false })
    letterOfAuthorization: boolean;

    @Column("boolean", { name: "leased_to_biz_and_reg_add_com_biz_lic", default: false })
    leasedToBizAndRegAddComBizLic: boolean;

    @Column("boolean", { name: "biz_and_reg_add_com_biz_lic", default: false })
    bizAndRegAddComBizLic: boolean;

    @Column("boolean", { name: "biz_and_reg_add_res_biz_lic", default: false })
    bizAndRegAddResBizLic: boolean;

    @Column("int", { name: "business_state_change", width: 4, nullable: true })
    businessStateChange: number;

    @Column("int", { name: "mailing_fees", width: 4, nullable: true })
    mailingFees: number;

    @Column("boolean", { name: "mailing_fees_required", default: false })
    mailingFeesRequired: boolean;

    @Column("boolean", { name: "no_blank_checks", default: false })
    noBlankChecks: boolean;

    @Column("boolean", { name: "send_blank_check_only", default: false })
    sendBlankCheckOnly: boolean;

    @Column({
        type: "enum",
        enum: FedExPickupFrequency,
        default: FedExPickupFrequency.DAILY,
        nullable: true,
    })
    fedExPickup: FedExPickupFrequency;

    @Column("boolean", { name: "plates_only_to_reg_address", default: false })
    platesOnlyToRegAddress: boolean;

    @Column("int", { name: "residency_individual_period", width: 4, nullable: true })
    resIndPeriod: number;

    @Column("int", { name: "residency_business_period", width: 4, nullable: true })
    resBizAndComPeriod: number;

    @Column("boolean", { name: "leased_reg_add_type_biz_and_res_add_res_biz_lic", default: false })
    leasedRegAddTypeBizAndResAddResBizLic: boolean;

    @Column("boolean", { name: "leased_reg_add_type_biz_and_res_add_res_proof_res", default: false })
    leasedRegAddTypeBizAndResAddResProofRes: boolean;

    @Column("boolean", { name: "leased_reg_add_type_biz_and_res_add_res_driver_license", default: false })
    leasedRegAddTypeBizAndResAddResDriverLicense: boolean;

    @Column("boolean", { name: "leased_reg_add_type_biz_and_res_add_res_letter_of_auth", default: false })
    leasedRegAddTypeBizAndResAddResLetterOfAuth: boolean;

    @Column("boolean", { name: "leased_reg_add_type_biz_and_res_add_com_biz_lic", default: false })
    leasedRegAddTypeBizAndResAddComBizLic: boolean;

    @Column("boolean", { name: "leased_reg_add_type_biz_and_res_add_com_proof_res", default: false })
    leasedRegAddTypeBizAndResAddComProofRes: boolean;

    @Column("boolean", { name: "biz_and_reg_add_com_business_license", default: false })
    bizAndRegAddComBusinessLicense: boolean;

    @Column("boolean", { name: "biz_and_reg_add_com_proof_of_residency", default: false })
    bizAndRegAddComProofOfResidency: boolean;

    @Column("boolean", { name: "biz_and_reg_add_res_business_license", default: false })
    bizAndRegAddResBusinessLicense: boolean;

    @Column("boolean", { name: "is_deleted", default: false, comment: "true=deleted, true=not deleted" })
    isDeleted: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number;

    @ManyToOne(() => User)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @OneToOne(() => TitleCounties)
    @JoinColumn({ name: "county_id", referencedColumnName: "id" })
    county: TitleCounties;

    @UpdateDateColumn({
        type: "timestamp with time zone",
        name: "updated_at"
    })
    updatedAt: Date;
}


