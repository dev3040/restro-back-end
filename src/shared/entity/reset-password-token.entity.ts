import {
    BaseEntity,
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { User } from "./user.entity";

@Entity({ name: "reset_password_token", schema: "authentication" })
export class ResetPasswordToken extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("int", { name: "user_id" })
    userId: number;

    @Column("text", { name: "token" })
    token: string;

    @Column("boolean", { name: "is_active", default: false })
    isActive: boolean;

    @Column("bigint", { name: "expire_time" })
    expireTime: number;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
    user: User;

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
    setUserId() {
        if (this.user) {
            this.userId = this.user.id;
        }
    }
}
