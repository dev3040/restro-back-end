import {
    BaseEntity, BeforeInsert, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import * as bcrypt from "bcrypt";
import { Exclude } from "class-transformer";
import { Departments } from "./departments.entity";
import { CarrierTypes } from "./carrier-types.entity";
import { Customers } from "./customers.entity";
import { TicketStatuses } from "./ticket-statuses.entity";
import { PriorityTypes } from "./priority-types.entity";
import { TransactionTypes } from "./transaction-types.entity";
import { Modules } from "./modules.entity";
import { TicketAssignedUsers } from "./ticket-assigned-users.entity";
import { TicketTags } from "./ticket-tags.entity";
import { TidTypes } from "./tid-types.entity";
import { CustomerContacts } from "./customer-contacts.entity";
import { UserDepartments } from "./user-departments.entity";
import { TradeInInfo } from "./trade-in-info.entity";
import { ActivityLogs } from "./activity-logs.entity";
import { CommentMentions } from "./comment-mention.entity";
import { TavtTaxExemptionMaster } from "./tavt-exemption-master.entity";
import { BillingInfo } from "./billing-info.entity";
import { BillingInfoDeposits } from "./billing-info-deposits.entity";
import { FilterBookmarkTeams } from "./filter-bookmark-teams.entity";
import { FilterBookmarks } from "./filter-bookmark.entity";
import { AvatarColors } from "./avatar-colors.entity";
import { TransactionTypesTeams } from "./transaction-types-teams.entity";
import { BatchPrepMapping } from "./batch-prep-mapping.entity";
import { BatchGroups } from "./batch-group.entity";
import { Batches } from "./batch.entity";


@Index("user_first_name", ["firstName"], {})
@Index("user_last_name", ["lastName"], {})
@Index("user_email", ["email"], {})

@Entity({ name: "user", schema: "authentication" })
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { name: "first_name", length: 100 })
    firstName: string;

    @Column("varchar", { name: "last_name", length: 100 })
    lastName: string;

    @Column("varchar", { name: "email", length: 150 })
    email: string;

    @Column("boolean", { name: "is_active", default: true, comment: "True = Active, False = Inactive" })
    isActive: boolean;

    @Column("varchar", { name: "password", length: 255 })
    @Exclude()
    password: string;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;

    @Column("varchar", { name: "salt", length: 50 })
    salt: string;

    @Column("int", { name: "color_id", nullable: true })
    colorId: number | null;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
    isDeleted: boolean;

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

    @OneToMany(() => Departments, (d) => d.createdBy)
    departmentCreatedBy: Departments[];

    @OneToMany(() => Departments, (d) => d.updatedBy)
    departmentupdatedBy: Departments[];

    @OneToMany(() => CarrierTypes, (ct) => ct.createdBy)
    carrierCreatedBy: CarrierTypes[];

    @OneToMany(() => Customers, (d) => d.createdBy)
    customerCreatedBy: Customers[];

    @OneToMany(() => Customers, (d) => d.updatedBy)
    customerupdatedBy: Customers[];

    @OneToMany(() => TicketStatuses, (d) => d.createdBy)
    ticketStatusCreatedBy: TicketStatuses[];

    @OneToMany(() => TicketStatuses, (d) => d.updatedBy)
    ticketStatusUpdatedBy: TicketStatuses[];

    @OneToMany(() => PriorityTypes, (ct) => ct.createdBy)
    priorityCreatedBy: PriorityTypes[];

    @OneToMany(() => TransactionTypes, (d) => d.createdBy)
    transactionTypeCreatedBy: TransactionTypes[];

    @OneToMany(() => BatchPrepMapping, (b) => b.createdBy)
    batchPrepCreatedBy: BatchPrepMapping[];

    @OneToMany(() => TransactionTypes, (d) => d.updatedBy)
    transactionTypeUpdatedBy: TransactionTypes[];

    @OneToMany(() => Modules, (d) => d.createdBy)
    modulesCreatedBy: Modules[];

    @OneToMany(() => Modules, (d) => d.updatedBy)
    modulesUpdatedBy: Modules[];

    @OneToMany(() => TicketAssignedUsers, (d) => d.createdByUser)
    ticketAssignedUserCreatedBy: TicketAssignedUsers[];

    @OneToMany(() => TicketAssignedUsers, (d) => d.updatedByUser)
    ticketAssignedUserUpdatedBy: TicketAssignedUsers[];

    @OneToMany(() => TicketAssignedUsers, (d) => d.assignedUser)
    ticketAssignedUser: TicketAssignedUsers[];

    @OneToMany(() => TicketTags, (d) => d.createdByUser)
    ticketTagCreatedBy: TicketTags[];

    @OneToMany(() => TidTypes, (d) => d.createdByUser)
    tidTypeCreatedBy: TidTypes[];

    @OneToMany(() => TidTypes, (t) => t.updatedByUser)
    tidTypeUpdatedBy: TidTypes[];

    @OneToMany(() => CustomerContacts, (d) => d.createdBy)
    customerContactCreatedBy: CustomerContacts[];

    @OneToMany(() => CustomerContacts, (d) => d.updatedBy)
    customerContactupdatedBy: CustomerContacts[];

    @OneToMany(() => UserDepartments, (d) => d.user)
    departmentUser: UserDepartments[];

    @OneToMany(() => UserDepartments, (ct) => ct.createdByUser)
    departmentUserCreatedBy: UserDepartments[];

    @OneToMany(() => User, (user) => user.userCreatedBy)
    createdByUser: User[];

    @OneToMany(() => User, (user) => user.userUpdatedBy)
    updatedByUser: User[];

    @ManyToOne(() => User, (user) => user.createdByUser)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    userCreatedBy: User

    @ManyToOne(() => User, (d) => d.updatedByUser)
    @JoinColumn({ name: "updated_by", referencedColumnName: "id" })
    userUpdatedBy: User;

    @OneToMany(() => TradeInInfo, (trade) => trade.createdByUser)
    tradeInInfoCreatedBy: TradeInInfo[];

    @OneToMany(() => TradeInInfo, (trade) => trade.updatedByUser)
    tradeInInfoUpdatedBy: TradeInInfo[];


    // @ManyToOne(() => ActivityLogs, (a) => a.createdByUser)
    // @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
    @OneToMany(() => ActivityLogs, (a) => a.createdByUser)
    activityLogCreateBy: ActivityLogs

    @OneToMany(() => CommentMentions, (a) => a.mentionedUser)
    commentMention: CommentMentions[];

    @OneToMany(() => TavtTaxExemptionMaster, (d) => d.createdBy)
    exemptionCreatedBy: TavtTaxExemptionMaster[];
    @OneToMany(() => BillingInfo, (a) => a.createdByUser)
    billingInfoCreatedBy: BillingInfo[];

    @OneToMany(() => BillingInfo, (a) => a.updatedByUser)
    billingInfoUpdatedBy: BillingInfo[];

    @OneToMany(() => BillingInfoDeposits, (a) => a.createdByUser)
    billingInfoDepositCreatedBy: BillingInfoDeposits[];

    @OneToMany(() => BillingInfoDeposits, (a) => a.updatedByUser)
    billingInfoDepositUpdatedBy: BillingInfoDeposits[];

    @OneToMany(() => FilterBookmarks, (a) => a.createdByUser)
    filterBookmarkCreatedBy: FilterBookmarks[];

    @OneToMany(() => FilterBookmarks, (a) => a.updatedByUser)
    filterBookmarkUpdatedBy: FilterBookmarks[];

    @OneToMany(() => FilterBookmarkTeams, (a) => a.createdByUser)
    filterBookmarkTeamsCreatedBy: FilterBookmarkTeams[];

    @OneToMany(() => FilterBookmarkTeams, (a) => a.updatedByUser)
    filterBookmarkTeamsUpdatedBy: FilterBookmarkTeams[];

    @ManyToOne(() => AvatarColors)
    @JoinColumn({ name: "color_id", referencedColumnName: "id" })
    avatarColor: AvatarColors;

    @OneToMany(() => TransactionTypesTeams, (a) => a.createdByUser)
    transactionTypesTeamsCreatedBy: TransactionTypesTeams[];

    @OneToMany(() => TransactionTypesTeams, (a) => a.updatedByUser)
    transactionTypesTeamsUpdatedBy: TransactionTypesTeams[];

    @OneToMany(() => BatchGroups, (a) => a.createdByUser)
    batchGroupCreatedBy: BatchGroups[];

    @OneToMany(() => BatchGroups, (a) => a.updatedByUser)
    batchGroupUpdatedBy: BatchGroups[];

    @OneToMany(() => Batches, (a) => a.completedByUser)
    batchGroupCompletedBy: Batches[];

    @OneToMany(() => Batches, (a) => a.createdByUser)
    batchCreatedBy: Batches[];

    @BeforeInsert()
    async hashPassword() {
        if (this.password) {
            this.password = await bcrypt.hash(this.password, this.salt);
        }

        if (!this.colorId) {
            // Assign color ID in sequence
            const maxColorId = await User
                .createQueryBuilder("user")
                .select("MAX(user.colorId)", "max")
                .getRawOne();

            const maxAvailableColorId = await AvatarColors
                .createQueryBuilder("avatarColors")
                .select("MAX(avatarColors.id)", "max")
                .getRawOne();

            let nextColorId = maxColorId.max ? maxColorId.max + 1 : 1;

            if (nextColorId > maxAvailableColorId.max) {
                nextColorId = 1;
            }

            this.colorId = nextColorId;
        }
    }

    async validatePassword(password: string): Promise<boolean> {
        const hash = await bcrypt.hash(password, this.salt);
        return hash === this.password;
    }
}
