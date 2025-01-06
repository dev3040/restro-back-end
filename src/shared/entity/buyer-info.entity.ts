import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ActiveDutyMilEnum, BusinessTypeEnum, IDOptionEnum } from "../enums/buyer-info.enum";
import { Tickets } from "./tickets.entity";
import { TitleCounties } from "./title-counties.entity";


@Index("buyer_ticket_id", ["ticketId"], {})
@Entity({ name: 'buyer_info', schema: "data_entry" })
export class BuyerInfo extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("enum", { name: "type", enum: BusinessTypeEnum, nullable: true, comment: "1 = business, 2 = individual" })
    type: BusinessTypeEnum;

    @Column("varchar", { name: "name", length: 100, nullable: true })
    name: string;

    @Column("enum", { name: "secondary_type", enum: BusinessTypeEnum, default: BusinessTypeEnum.BUSINESS, nullable: true, comment: "1 = business, 2 = individual" })
    secondaryType: BusinessTypeEnum;

    @Column("varchar", { name: "secondary_name", length: 100, nullable: true })
    secondaryName: string;

    @Column("text", { nullable: true })
    address: string;

    @Column("text", { name: "mailing_address", nullable: true })
    mailingAddress: string;

    @Column("text", { name: "secondary_address", nullable: true })
    secAddress: string;

    @Column("text", { name: "secondary_mailing_address", nullable: true })
    secMailingAddress: string;

    @Column('varchar', { name: 'email', length: 100, nullable: true })
    email: string;

    @Column('varchar', { name: 'phone', length: 30, nullable: true })
    phone: string;

    @Column('varchar', { name: 'secondary_email', length: 100, nullable: true })
    secondaryEmail: string;

    @Column('varchar', { name: 'secondary_phone', length: 30, nullable: true })
    secondaryPhone: string;

    @Column("varchar", { name: "first_name", length: 100, nullable: true })
    firstName: string;

    @Column("varchar", { name: "secondary_last_name", length: 100, nullable: true })
    secLastName: string;

    @Column("varchar", { name: "middle_name", length: 100, nullable: true })
    middleName: string;

    @Column("varchar", { name: "secondary_middle_name", length: 100, nullable: true })
    secMiddleName: string;

    @Column("varchar", { name: "secondary_first_name", length: 100, nullable: true })
    secFirstName: string;

    @Column("varchar", { name: "last_name", length: 100, nullable: true })
    lastName: string;

    @Column("varchar", { name: "suffix", length: 100, nullable: true })
    suffix: string;

    @Column("varchar", { name: "secondary_suffix", length: 100, nullable: true })
    secSuffix: string;

    @Column("date", { name: 'dob', nullable: true })
    dob: Date;

    @Column("date", { name: 'secondary_dob', nullable: true })
    secDob: Date;

    @Column("int", { name: 'ticket_id', nullable: false })
    ticketId: number;

    @Column("enum", { name: "id_option", enum: IDOptionEnum, comment: "ga_driver_license/id, ,list_other_states_id, other_id", nullable: true })
    idOption: IDOptionEnum;

    @Column("enum", { name: "secondary_id_option", enum: IDOptionEnum, comment: "ga_driver_license/id, ,list_other_states_id, other_id", nullable: true })
    secIdOption: IDOptionEnum;

    @Column("varchar", { name: "license", length: 20, nullable: true })
    license: string;

    @Column("varchar", { name: "secondary_license", length: 20, nullable: true })
    secLicense: string;

    @Column("varchar", { name: "district", length: 100, nullable: true })
    district: string;

    @Column("varchar", { name: "secondary_district", length: 100, nullable: true })
    secDistrict: string;

    @Column("date", { name: 'expire_date', nullable: true })
    expireDate: Date;

    @Column("date", { name: 'secondary_expire_date', nullable: true })
    secExpireDate: Date;

    @Column('boolean', { name: 'is_active', default: true, comment: "true=active, false=inactive" })
    isActive: boolean;

    @Column('boolean', { name: 'is_lessee', nullable: true, default: true, comment: "true=Lessee, false=not Lessee" })
    isLessee: boolean;

    @Column('boolean', { name: 'is_lessor', nullable: true, comment: "true=lessor, false=not lessor" })
    isLessor: boolean;

    @Column('boolean', { name: 'is_military', nullable: true, comment: "true=military, false=notMilitary" })
    isMilitary: boolean;

    @Column('boolean', { name: 'secondary_is_military', nullable: true, comment: "true=military, false=notMilitary" })
    secIsMilitary: boolean;

    @Column('boolean', { name: 'tax_exempt', nullable: true, comment: "true=taxExempted, false=noTaxExempt" })
    taxExempt: boolean;

    @Column('boolean', { name: 'secondary_tax_exempt', nullable: true, comment: "true=taxExempted, false=noTaxExempt" })
    secondaryTaxExempt: boolean;

    @Column('boolean', { name: 'is_primary', nullable: true, comment: "true=primary, false=notPrimary" })
    isPrimary: boolean;

    @Column('boolean', { name: 'is_secondary', nullable: true, comment: "true=secondary, false=notSecondary" })
    isSecondary: boolean;

    @Column('boolean', { name: 'is_primary_address_clone', nullable: true, comment: "true=clone, false=notClone" })
    isPrimeAddClone: boolean;

    @Column('boolean', { name: 'is_owner', nullable: true, comment: "true=owner, false=notOwner" })
    isOwner: boolean;

    @Column('boolean', { name: 'purchase_type', default: false, nullable: true })
    purchaseType: boolean;

    @Column('boolean', { name: 'secondary_purchase_type', default: false, nullable: true })
    secPurchaseType: boolean;

    @Column('boolean', { name: 'is_secondary_address_clone', nullable: true, comment: "true=secondaryClone, false=notSecondaryClone" })
    isSecAddClone: boolean;

    @Column("enum", { name: "active_duty_mil_stat_in_ga", enum: ActiveDutyMilEnum, nullable: true, comment: "TAVT = 1,  SALES_TAX = 2" })
    activeDutyMilitaryStationedInGa: ActiveDutyMilEnum;

    @Column("enum", { name: "secondary_active_duty_mil_stat_in_ga", enum: ActiveDutyMilEnum, nullable: true, comment: "TAVT = 1,  SALES_TAX = 2" })
    secActiveDutyMilitaryStationedInGa: ActiveDutyMilEnum;

    @Column("boolean", { name: "is_deleted", default: false })
    isDeleted: boolean;

    @Column('int', { name: 'county_id', nullable: true })
    countyId: number;

    @Column('int', { name: 'secondary_county_id', nullable: true })
    secCountyId: number;

    @Column('boolean', { name: 'is_residential', nullable: true, default: false, comment: "true=Residential, false=Business" })
    isResidential: boolean;

    @Column('boolean', { name: 'secondary_is_residential', nullable: true, default: false, comment: "true=Residential, false=Business" })
    secIsResidential: boolean;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number;

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

    @ManyToOne(() => Tickets, (ticket) => ticket.buyerInfo)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;

    @ManyToOne(() => TitleCounties)
    @JoinColumn({ name: "county_id", referencedColumnName: "id" })
    county: TitleCounties;

    @ManyToOne(() => TitleCounties)
    @JoinColumn({ name: 'secondary_county_id' })
    secCounty: TitleCounties;

}

