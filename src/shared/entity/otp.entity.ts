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

@Entity({ name: "otp", schema: "authentication" })
export class Otp extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("int", { name: "user_id" })
    userId: number;

    @Column("varchar", { name: "otp", length: 6 })
    otp: string;

    @Column("smallint", { name: "type", nullable: true, comment: "Register = 1, Login = 2,Forgot password = 3" })
    type: number;

    @Column("bigint", { name: "expire_time" })
    expireTime: number;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: "user_id", referencedColumnName: "id" })
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
