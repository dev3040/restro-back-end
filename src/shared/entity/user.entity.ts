import {
    BaseEntity, BeforeInsert, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import * as bcrypt from "bcrypt";
import { Exclude } from "class-transformer";
import { AvatarColors } from "./avatar-colors.entity";
import { Branches } from "./branches.entity";
import { Designation } from "./designation.entity";

@Index("user_first_name", ["firstName"], {})
@Index("user_last_name", ["lastName"], {})

@Entity({ name: "user", schema: "authentication" })
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { name: "first_name", length: 100 })
    firstName: string;

    @Column("varchar", { name: "last_name", length: 100 })
    lastName: string;

    @Column("int", { name: "branch_id", nullable: true })
    branchId: number | null;

    @Column("int", { name: "designation_id", nullable: true })
    designationId: number | null;

    @Column("varchar", { name: "username", length: 150 })
    username: string;
    
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

    @ManyToOne(() => Branches)
    @JoinColumn({ name: "branch_id", referencedColumnName: "id" })
    branch: Branches;

    @ManyToOne(() => Designation)
    @JoinColumn({ name: "designation_id", referencedColumnName: "id" })
    designation: Designation;
}
