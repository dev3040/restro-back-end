import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { BaseModifiableEntity } from '../base-entities/base-modifiable-entity';
import { TransactionTypesTeams } from './transaction-types-teams.entity';
import { CommonConst, TransactionTypeConst } from '../constants/common.constant';

@Index("transaction_types_name", ["name"], {})
@Entity({ name: 'transaction_types', schema: 'master' })
@Unique(['transactionCode'])
export class TransactionTypes extends BaseModifiableEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'name', length: TransactionTypeConst.nameLength, nullable: true })
    name: string;

    @Column('varchar', { name: 'slug', length: CommonConst.slugLength, nullable: true })
    slug: string;

    @Column('varchar', { name: 'transaction_code', length: TransactionTypeConst.codeLength, nullable: true })
    transactionCode: string | null;

    @Column('decimal', { name: 'price', precision: 10, scale: 2 })
    price: string;

    @Column('varchar', { name: 'state', length: TransactionTypeConst.stateLength })
    state: string | null;

    @Column('boolean', { name: 'is_active', default: true, comment: "true=active, false=not-inactive" })
    isActive: boolean;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
    isDeleted: boolean;

    @ManyToOne(() => User, (user) => user.transactionTypeCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User, (user) => user.transactionTypeUpdatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @OneToMany(() => TransactionTypesTeams, (ct) => ct.transactionType)
    teamTransactionType: TransactionTypesTeams[];

}
