import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength, IsEnum, ValidationArguments, ValidationOptions, registerDecorator, IsNumber, IsOptional, ValidateIf } from "class-validator";
import { IsValidName } from "src/shared/decorators/name.decorator";
import { SellerTypeEnum } from "src/shared/enums/seller-info.enum";

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

export function IsDealerIdValid(property: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isDealerIdValid',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [property],
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];

                    if (relatedValue === true) {
                        return typeof value === 'number' && Number.isInteger(value) && value > 0;
                    }
                    return true; // If isDealer is false
                },
                defaultMessage(args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    return `${args.property} must be a positive integer when ${relatedPropertyName} is true.`;
                },
            },
        });
    };
}

export class AddSellerInfoDto {

    @IsNumber()
    @IsNotEmpty({ message: 'Please enter Ticket id.' })
    @ApiProperty({
        description: 'Enter ticket id.',
        example: 2,
    })
    ticketId: number;

    @ApiProperty({ description: 'Indicates whether the entity represents a dealer.', example: true })
    isDealer: boolean;

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


    @MaxLength(20, { message: "Sales tax ID must not exceed 20 characters." })
    @IsOptional()
    @ApiProperty({ description: 'sales tax ID', required: false, example: '114ABCCD' })
    salesTaxId?: string;


    @IsDealerIdValid('isDealer', { message: 'Dealer ID must be a positive integer.' })
    @ApiProperty({ description: 'Dealer id', required: false, example: 2 })
    dealerId?: number;

    @MaxLength(50)
    @IsNotEmpty({ message: 'Name is required.&&&name' })
    @ApiProperty({ description: 'name', example: 'ABC Motors' })
    name: string;

    @IsOptional()
    @MaxLength(300)
    @ApiProperty({ description: 'address', required: true, example: '123 Main St' })
    address?: string;

    @MaxLength(25)
    @IsValidName({ message: 'Please enter a valid seller ID.&&&sellerId' })
    @IsOptional()
    @ApiProperty({ description: 'seller id', example: 'ABC12132' })
    sellerId: string;

}

export class AddSellerDto {

    @ValidateIf(o => !o.ticketId)
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter id.',
        example: 35,
    })
    id: number;

    @ValidateIf(o => !o.id)
    @IsNumber()
    @IsNotEmpty({ message: 'Enter Ticket id.' })
    @ApiPropertyOptional({
        description: 'Enter ticket id.',
        example: 2,
    })
    ticketId: number;

    @ApiProperty({ description: 'Indicates whether the entity represents a dealer.', example: true })
    isDealership: boolean;

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

    @MaxLength(20, { message: "Sales tax ID must not exceed 20 characters." })
    @IsOptional()
    @ApiProperty({ description: 'sales tax ID', required: false, example: '114ABCCD' })
    salesTaxId?: string;

    @IsDealerIdValid('isDealer', { message: 'Dealer ID must be a positive integer.' })
    @ApiProperty({ description: 'Dealer ID', required: false, example: 2 })
    dealerId?: number;

    @MaxLength(50)
    @IsNotEmpty({ message: 'Name is required.&&&name' })
    @ApiProperty({ description: 'name', example: 'ABC Motors' })
    name: string;

    @IsOptional()
    @MaxLength(300)
    @ApiProperty({ description: 'address', required: true, example: '123 Main St' })
    address?: string;

    @MaxLength(25)
    @IsValidName({ message: 'Please enter a valid seller id.&&&sellerId' })
    @IsOptional()
    @ApiProperty({ description: 'seller id', example: 'ABC12132' })
    sellerId: string;
}


export class UpdateSellerInfoDto extends PartialType(AddSellerInfoDto) { }