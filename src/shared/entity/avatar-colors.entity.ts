import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity({ schema: 'master', name: 'avatar_colors' })
export class AvatarColors extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { name: 'name', length: 150, nullable: false })
    name: string;
}
