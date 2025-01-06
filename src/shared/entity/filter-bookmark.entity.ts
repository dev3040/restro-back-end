import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { BaseModifiableEntity } from '../base-entities/base-modifiable-entity';
import { FilterBookmarkConst } from '../constants/common.constant';
import { FilterBookmarkTeams } from './filter-bookmark-teams.entity';
import { BookmarkFilterData } from '../../modules/filter-bookmark/interface/filter-data.interface';


@Entity({ name: 'filter_bookmarks', schema: 'ticket' })
export class FilterBookmarks extends BaseModifiableEntity {

   @PrimaryGeneratedColumn()
   id: number;

   @Column('varchar', { name: 'name', length: FilterBookmarkConst.nameLength, nullable: false })
   name: string;

   @Column({ name: "filter_data", type: 'jsonb', nullable: false })
   filterData: BookmarkFilterData;

   @ManyToOne(() => User, (user) => user.filterBookmarkCreatedBy)
   @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
   createdByUser: User

   @ManyToOne(() => User, (user) => user.filterBookmarkUpdatedBy)
   @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
   updatedByUser: User;

   @OneToMany(() => FilterBookmarkTeams, (t) => t.bookmark)
   bookmarkTeam: FilterBookmarkTeams[];

}
