import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { SelectedFormsMapping } from "./selected-forms-mapping.entity";


@Entity({ name: "forms_pdf", schema: "data_entry" })
@Unique(['code'])
export class FormsPdf extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'forms_name', length: 100, nullable: false })
    formsName: string;

    @Column('boolean', { name: 'is_required', default: false, comment: "false=not-required, true=required" })
    isRequired: boolean;

    @Column('text', { name: 'description', nullable: true })
    description: string;

    @Column('varchar', { name: 'code', length: 10, nullable: false })
    code: string;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
    isDeleted: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @OneToMany(() => SelectedFormsMapping, (pdf) => pdf.formsPdf)
    selectedFormsPdf: SelectedFormsMapping[];

}
