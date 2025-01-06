import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Departments } from './departments.entity';
import { TransactionTypes } from './transaction-types.entity';


@Index("transaction_types_teams_team_id", ["teamId"], {})
@Index("transaction_types_teams_transaction_type_id", ["transactionTypeId"], {})

@Unique(['transactionTypeId', 'teamId'])

@Entity({ name: 'transaction_types_teams' })
export class TransactionTypesTeams extends BaseEntity {

   @PrimaryGeneratedColumn()
   id: number;

   @Column('int', { name: 'transaction_type_id' })
   transactionTypeId: number;

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

   @ManyToOne(() => TransactionTypes)
   @JoinColumn({ name: "transaction_type_id", referencedColumnName: "id" })
   transactionType: TransactionTypes;
}