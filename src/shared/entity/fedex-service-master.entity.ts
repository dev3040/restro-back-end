import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity({ name: 'fedex_service_master', schema: 'master' })
export class FedexServiceMaster extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, name: 'service_code' })
    serviceCode: string;

    @Column({ length: 100, name: 'service_name' })
    serviceName: string;
}