import {
    BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn
} from "typeorm";
import { User } from "./user.entity";
import { ActivityLogs } from "./activity-logs.entity";

@Index("comment_mentions_mention_user_id", ["mentionUserId"], {})
@Index("comment_mentions_comment_id", ["commentId"], {})

@Entity({ name: "comment_mentions", schema: "public" })
export class CommentMentions extends BaseEntity {

    @PrimaryGeneratedColumn({ type: "integer", name: "id" })
    id: number;

    @Column({ type: "integer", name: "comment_id" })
    commentId: number;

    @Column({ type: "integer", name: "mention_user_id" })
    mentionUserId: number;

    @ManyToOne(type => User)
    @JoinColumn([{ name: "mention_user_id", referencedColumnName: "id" }])
    mentionedUser: User;

    @ManyToOne(type => ActivityLogs)
    @JoinColumn([{ name: "comment_id", referencedColumnName: "id" }])
    comment: ActivityLogs;


}