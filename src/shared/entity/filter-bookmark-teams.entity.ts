import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Departments } from './departments.entity';
import { FilterBookmarks } from './filter-bookmark.entity';

@Index("filter_bookmark_teams_team_id", ["teamId"], {})
@Index("filter_bookmark_teams_bookmark_id", ["bookmarkId"], {})

@Unique(['bookmarkId', 'teamId'])

@Entity({ name: 'filter_bookmark_teams', schema: 'ticket' })
export class FilterBookmarkTeams extends BaseEntity {

   @PrimaryGeneratedColumn()
   id: number;

   @Column('int', { name: 'bookmark_id' })
   bookmarkId: number;

   @Column("int", { name: "team_id", nullable: false })
   teamId: string;

   @ManyToOne(() => User)
   @JoinColumn({ name: "created_by", referencedColumnName: "id" })
   createdByUser: User;

   @ManyToOne(() => User)
   @JoinColumn({ name: "updated_by", referencedColumnName: "id" })
   updatedByUser: User;

   @ManyToOne(() => Departments)
   @JoinColumn({ name: "team_id", referencedColumnName: "id" })
   team: Departments;

   @ManyToOne(() => FilterBookmarks)
   @JoinColumn({ name: "bookmark_id", referencedColumnName: "id" })
   bookmark: FilterBookmarks;
}