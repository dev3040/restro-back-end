import {
    BaseEntity,
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import { User } from "./user.entity";

@Entity({ name: "token", schema: "authentication" })
export class Token extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("int", { name: "user_id" })
    userId: number;

    @Column("text", { name: "access_token", unique: true })
    accessToken: string;

    @Column("text", { name: "refresh_token", unique: true })
    refreshToken: string;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
    user: User;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @BeforeInsert()
    setUserId() {
        if (this.user) {
            this.userId = this.user.id;
        }
    }
}
