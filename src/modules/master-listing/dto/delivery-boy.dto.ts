import { ApiProperty } from "@nestjs/swagger";

export class DeliveryBoyDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    empId: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
} 