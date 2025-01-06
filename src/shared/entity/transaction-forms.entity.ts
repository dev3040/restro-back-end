import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { FormsPdf } from './forms-pdf.entity';
import { TransactionTypes } from './transaction-types.entity';
import { BaseModifiableEntity } from '../base-entities/base-modifiable-entity';

@Entity({ name: 'transaction_forms', schema: 'master' })
@Unique(['transactionCode', 'formShortCode', "isDeleted"])
export class TransactionForms extends BaseModifiableEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'transaction_code', length: 50, nullable: true })
    transactionCode: string | null;

    @Column('varchar', { name: 'form_short_code', length: 50, nullable: true })
    formShortCode: string | null;

    @Column("boolean", { name: "is_deleted", default: false })
    isDeleted: boolean;

    @ManyToOne(() => FormsPdf)
    @JoinColumn({ name: "form_short_code", referencedColumnName: "code" })
    formsPdf: FormsPdf;

    @ManyToOne(() => TransactionTypes)
    @JoinColumn({ name: "transaction_code", referencedColumnName: "transactionCode" })
    transactionType: TransactionTypes;
}
