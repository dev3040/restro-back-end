import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, ValidationArguments, MaxLength, MinLength, registerDecorator, ValidationOptions, IsEnum, IsArray, ArrayNotEmpty, ArrayMinSize, IsInt } from 'class-validator';
import { IsValidName } from 'src/shared/decorators/name.decorator';
import { SellerTypeEnum } from 'src/shared/enums/seller-info.enum';

export class AddDealerMasterDto {
    @MaxLength(50)
    @MinLength(2)
    @IsValidName({ message: 'Please enter a valid name.&&&name' })
    @IsNotEmpty()
    @ApiProperty({ description: 'name', example: 'ABC Motors' })
    name: string;

    @MaxLength(200)
    @IsValidName({ message: 'Please enter a valid seller id.&&&sellerId' })
    @IsOptional()
    @ApiProperty({ description: 'seller id', example: 'ABC12132' })
    sellerId: string;

    @IsOptional()
    @ApiProperty({ description: 'address', required: false, example: '123 Main St' })
    address?: string;

    @MinLength(2)
    @MaxLength(25)
    @IsOptional()
    @ApiProperty({ description: 'sales tax ID', required: false, example: '1234567890' })
    salesTaxId?: string;

    @ApiProperty({ description: 'Indicates whether the entity represents a dealer.', example: true })
    isDealer: boolean;

    @ApiProperty({ description: 'Indicates whether the entity is active.', example: true })
    isActive: boolean;

    @ApiProperty({ description: 'Indicates whether the entity is deleted.', example: false })
    isDeleted: boolean;

    @IsNotEmpty({ message: 'Select seller type.' })
    @IsSellerTypeValid('isDealer')
    @IsEnum(SellerTypeEnum, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
                return `Select seller type.(ga_dealer, out_of_state_dealer,out_of_state_transfer,business_individual_non_dealer).&&&sellerType&&&ERROR_MESSAGE`;
            } else {
                return `Select valid seller type(individual_non_dealer,government).&&&sellerType&&&ERROR_MESSAGE`;
            }
        }
    })
    @ApiPropertyOptional({
        description: `sellerType (ga_dealer, out_of_state_dealer, out_of_state_transfer).`,
        example: "ga_dealer",
    })
    sellerType: SellerTypeEnum;
}

export function IsSellerTypeValid(property: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isSellerTypeValid',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [property],
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const isDealer = (args.object as any)[relatedPropertyName];

                    if (isDealer) {
                        //  isDealer is true
                        const validDealerValues = [
                            SellerTypeEnum.GADEALER,
                            SellerTypeEnum.OUT_OF_STATE_DEALER,
                            SellerTypeEnum.OUT_OF_STATE_TRANSFER,
                            SellerTypeEnum.BIZ_IND_NON_DEL
                        ];
                        return validDealerValues.includes(value);
                    } else {
                        // isDealer is false
                        const validNonDealerValues = [
                            SellerTypeEnum.BIZ_NON_DEALER,
                            SellerTypeEnum.IND_NON_DEALER,
                            SellerTypeEnum.GOV
                        ];
                        return validNonDealerValues.includes(value);
                    }
                },
                defaultMessage(args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const isDealer = (args.object as any)[relatedPropertyName];

                    if (isDealer) {
                        return `Select valid seller type (ga_dealer, out_of_state_dealer, out_of_state_transfer, business_individual_non_dealer).`;
                    } else {
                        return `Select valid seller type (business_non_dealer, individual_non_dealer, government).`;
                    }
                },
            },
        });
    };
}


export class UpdateDealerMasterDto extends PartialType(AddDealerMasterDto) { }

export class DeleteDealerMastersDto {
    @ApiProperty({
        type: [Number],
        description: 'Array of dealer master IDs to be deleted',
        example: [1, 2, 3],
    })
    @IsArray()
    @ArrayNotEmpty({ message: 'The list of IDs should not be empty' })
    @ArrayMinSize(1, { message: 'The list must contain at least one ID' })
    @IsInt({ each: true, message: 'Each ID must be an integer' })
    ids: number[];
}
