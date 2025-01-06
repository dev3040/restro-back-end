import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength, ValidateIf, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from "class-validator";
import { ValidationOptions } from "joi";
import { IsValidName } from "src/shared/decorators/name.decorator";
import { ActiveDutyMilEnum, BusinessTypeEnum, IDOptionEnum } from "src/shared/enums/buyer-info.enum";
import { IsPhoneNumber } from "src/shared/decorators/phone.decorator";

@ValidatorConstraint({ async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
    validate(date: any): boolean {
        const inputDate = new Date(date);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);
        // Allow today and future dates
        return inputDate.getTime() >= currentDate.getTime();
    }

    defaultMessage(): string {
        return "ERR_EXPIRE_DATE";
    }
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsFutureDateConstraint,
        });
    };
}

@ValidatorConstraint({ async: false })
export class IsPastDateConstraint implements ValidatorConstraintInterface {
    validate(date: any): boolean {
        const inputDate = new Date(date);
        if (isNaN(inputDate.getTime())) {
            return false;
        }
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);
        return inputDate < currentDate;
    }

    defaultMessage(): string {
        return 'Date of Birth must be a past date.';
    }
}

export function IsPastDate(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsPastDateConstraint,
        });
    };
}

export class AddBuyerInfoDto {

    @ValidateIf(o => !o.ticketId)
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter id.',
        example: 35,
    })
    id: number;

    @ValidateIf(o => !o.id)
    @IsNumber()
    @IsNotEmpty({ message: 'Enter Ticket id.' })
    @ApiProperty({
        description: 'Enter ticket id.',
        example: 2,
    })
    ticketId: number;

    @IsOptional()
    @IsEnum(BusinessTypeEnum, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
                return `Select type.(1 = business, 2 = individual).&&&type&&&ERROR_MESSAGE`;
            } else {
                return `Select valid type(1 = business, 2 = individual).&&&type&&&ERROR_MESSAGE`;
            }
        }
    })
    @ApiPropertyOptional({
        description: `type (business, individual).`,
        example: "1",
    })
    type: BusinessTypeEnum;


    @IsOptional()
    @IsEnum(BusinessTypeEnum, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined" || args.value == "" || args.value == null) {
                return `Select type.(1 = business, 2 = individual).&&&secondaryType&&&ERROR_MESSAGE`;
            } else {
                return `Select valid type(1 = business, 2 = individual).&&&secondaryType&&&ERROR_MESSAGE`;
            }
        }
    })
    @ApiPropertyOptional({
        description: `Select secondary type (business, individual).`,
        example: "1",
    })
    secondaryType: BusinessTypeEnum;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Please enter name.',
        example: 'FedEx',
    })
    @MaxLength(50, { message: "Name must not exceed 50 characters." })
    @MinLength(2, { message: "Name must be at least 2 characters long." })
    @IsValidName({ message: 'Please enter a valid name.&&&name' })
    name: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Please enter secondary name.',
        example: 'FedEx',
    })
    @MaxLength(50, { message: "Secondary name must not exceed 50 characters." })
    @MinLength(2, { message: "Secondary name must be at least 2 characters long." })
    @IsValidName({ message: 'Please enter a valid secondary name.&&&secondaryName' })
    secondaryName: string;

    @IsEmail(
        {},
        {
            message: (args: ValidationArguments) => {
                if (typeof args.value == "undefined" || args.value == "") {
                    return `Please enter your email.&&&email`;
                } else {
                    return `Please enter a valid email.&&&email`;
                }
            }
        }
    )
    @MaxLength(50, { message: "Email must not exceed 50 characters." })
    @IsOptional()
    @ApiPropertyOptional({
        description: "Enter email.",
        example: "jon.doe@gmail.com"
    })
    email: string;


    @IsEmail(
        {},
        {
            message: (args: ValidationArguments) => {
                if (typeof args.value == "undefined" || args.value == "") {
                    return `Please enter your email.&&&secondaryEmail`;
                } else {
                    return `Please enter a valid email.&&&secondaryEmail`;
                }
            }
        }
    )
    @IsOptional()
    @MaxLength(50, { message: "Secondary email must not exceed 50 characters." })
    @ApiPropertyOptional({
        description: "Enter secondary email.",
        example: "jon.doe@gmail.com"
    })
    secondaryEmail: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter  phone.',
        example: '(123) 456-7890',
    })
    @IsPhoneNumber()
    phone: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter secondary phone.',
        example: '(123) 456-7890',
    })
    @IsPhoneNumber({ message: 'Invalid secondary phone number format or length.' })
    secondaryPhone: string;

    @IsOptional()
    @ApiProperty({ description: 'address', required: false, example: '123 Main St' })
    address?: string;

    @IsOptional()
    @MaxLength(300, { message: "Mailing address must not exceed 300 characters." })
    @ApiPropertyOptional({ description: 'Enter mailing address', required: false, example: '123 Street Florida' })
    mailingAddress?: string;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Enter secondary address', required: false, example: '123 Main St' })
    secAddress?: string;

    @IsOptional()
    @MaxLength(300, { message: "Secondary mailing address must not exceed 300 characters." })
    @ApiProperty({ description: 'Enter secondary mailing address', required: false, example: '123 Street Florida' })
    secMailingAddress?: string;

    @IsOptional()
    @IsEnum(IDOptionEnum, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined") {
                return `Select type.(ga_driver_license/id ,other_id,list_other_states_id).&&&idOption&&&ERROR_MESSAGE`;
            } else {
                return `Select valid type(ga_driver_license/id ,other_id,list_other_states_id).&&&idOption&&&ERROR_MESSAGE`;
            }
        }
    })
    @ApiPropertyOptional({
        description: `Select idOption (ga_driver_license/id ,other_id,list_other_states_id).`,
        example: "list_other_states_id",
    })
    idOption: IDOptionEnum;

    @IsOptional()
    @IsEnum(IDOptionEnum, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined") {
                return `Select type.(ga_driver_license/id,other_id,list_other_states_id).&&&secIdOption&&&ERROR_MESSAGE`;
            } else {
                return `Select valid type(ga_driver_license/id ,other_id,list_other_states_id).&&&secIdOption&&&ERROR_MESSAGE`;
            }
        }
    })
    @ApiProperty({
        description: `Select secondary idOption (ga_driver_license/id ,other_id,list_other_states_id).`,
        example: "list_other_states_id",
    })
    secIdOption: IDOptionEnum;

    @IsOptional()
    @ApiProperty({
        description: `Enter first name.`,
        example: `Jon`
    })
    @MaxLength(20, { message: "First name must not exceed 20 characters." })
    @MinLength(2, { message: "First name must be at least 2 characters long." })
    @IsValidName({ message: 'Please enter a valid first name.&&&firstName' })
    firstName: string;

    @IsOptional()
    @ApiProperty({
        description: `Enter secondary first name.`,
        example: `Jon`
    })
    @MaxLength(20, { message: "Secondary first name must not exceed 20 characters." })
    @MinLength(2, { message: "Secondary first name must be at least 2 characters long." })
    @IsValidName({ message: 'Please enter a valid secondary first name.&&&secFirstName' })
    secFirstName: string;

    @IsOptional()
    @ApiProperty({
        description: `Enter middle name.`,
        example: "Martin"
    })
    @MaxLength(20, { message: "Middle name must not exceed 20 characters." })
    @IsValidName({ message: 'Please enter a valid middle name.&&&middleName' })
    middleName: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter secondary middle name.`,
        example: "Martin"
    })
    @MaxLength(20, { message: "Secondary middle name must not exceed 20 characters." })
    @IsValidName({ message: 'Please enter a valid secondary middle name.&&&secMiddleName' })
    secMiddleName: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter last name.`,
        example: `Doe`
    })
    @MaxLength(20, { message: "Last name must not exceed 20 characters." })
    @MinLength(2, { message: "Last name must be at least 2 characters long." })
    @IsValidName({ message: 'Please enter a valid last name.&&&lastName' })
    lastName: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter secondary last name.`,
        example: `Doe`
    })
    @MaxLength(20, { message: "Secondary last name must not exceed 20 characters." })
    @MinLength(2, { message: "Secondary last name must be at least 2 characters long." })
    @IsValidName({ message: 'Please enter a valid secondary last name.&&&secLastName' })
    secLastName: string;

    @IsOptional()
    @MaxLength(10, { message: "License must be at most 10 characters long." })
    @ApiPropertyOptional({
        description: "Enter license",
        example: "1234567894"
    })
    license: string;

    @IsOptional()
    @MaxLength(10, { message: "Secondary license must be at most 10 characters long." })
    @ApiPropertyOptional({
        description: "Enter secondary license",
        example: "1234567894"
    })
    secLicense: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter suffix.`,
        example: `jn`
    })
    @MaxLength(20)
    @MinLength(2)
    suffix: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter secondary suffix.`,
        example: `jn`
    })
    @MaxLength(20)
    @MinLength(2)
    secSuffix: string;

    @IsOptional()
    @IsEnum(ActiveDutyMilEnum, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined") {
                return `Select type.(1 = TAVT, 2 =  sales tax).&&&activeDutyMilitaryStationedInGa&&&ERROR_MESSAGE`;
            } else {
                return `Select valid type(1 = TAVT, 2 =  sales tax).&&&activeDutyMilitaryStationedInGa&&&ERROR_MESSAGE`;
            }
        }
    })
    @ApiPropertyOptional({
        description: `type (1 = TAVT, 2 =  sales tax).`,
        example: "1",
    })
    activeDutyMilitaryStationedInGa: ActiveDutyMilEnum;

    @IsOptional()
    @IsEnum(ActiveDutyMilEnum, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined") {
                return `Select secondary type.(1 = TAVT, 2 =  sales tax).&&&secActiveDutyMilitaryStationedInGa&&&ERROR_MESSAGE`;
            } else {
                return `Select valid secondary type(1 = TAVT, 2 =  sales tax).&&&secActiveDutyMilitaryStationedInGa&&&ERROR_MESSAGE`;
            }
        }
    })
    @ApiPropertyOptional({
        description: `Select type (1 = TAVT, 2 =  sales tax).`,
        example: "1",
    })
    secActiveDutyMilitaryStationedInGa: ActiveDutyMilEnum;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter military value.`,
        example: true
    })
    isMilitary: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter address type.`,
        example: true
    })
    isResidential: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter secondary address type.`,
        example: true
    })
    secIsResidential: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter Owner.`,
        example: true
    })
    isOwner: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter purchase type.`,
        example: false
    })
    purchaseType: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter secondary purchase type.`,
        example: false
    })
    secPurchaseType: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter primary address clone value.`,
        example: true
    })
    isPrimeAddClone: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter secondary address clone value.`,
        example: true
    })
    isSecAddClone: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter primary value.`,
        example: true
    })
    isPrimary: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter secondary military value.`,
        example: true
    })
    secIsMilitary: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter lessee value.`,
        example: true
    })
    isLessee: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter lessor value.`,
        example: true
    })
    isLessor: boolean;

    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({
        description: `Enter tax exempt.`,
        example: true
    })
    taxExempt: boolean;

    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({
        description: `Enter secondary tax exempt.`,
        example: true
    })
    secondaryTaxExempt: boolean;


    @ValidateIf(o => o.dob)
    @IsDateString()
    @IsPastDate()
    @ApiPropertyOptional({
        description: 'Enter dob.',
        example: '2024-04-25',
    })
    dob: Date;

    @ValidateIf(o => o.secDob)
    @IsDateString()
    @IsPastDate()
    @ApiPropertyOptional({
        description: 'Enter secondary dob.',
        example: '2024-04-25',
    })
    secDob: Date;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter secondary form.`,
        example: null
    })
    isSecondary: boolean;

    @ValidateIf(o => o.expireDate)
    @IsDateString()
    @IsFutureDate()
    @ApiPropertyOptional({
        description: 'Enter expire date.',
        example: '2024-08-25',
    })
    expireDate: Date;

    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter county.',
        example: 2,
    })
    countyId: number;

    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Enter secondary county.',
        example: 2,
    })
    secCountyId: number;

    @ValidateIf(o => o.secExpireDate)
    @IsDateString()
    @IsFutureDate()
    @ApiPropertyOptional({
        description: 'Enter secondary expire date',
        example: '2024-08-25',
    })
    secExpireDate: Date;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter district.`,
        example: `Delaware`
    })
    @MaxLength(100)
    @MinLength(2)
    @IsValidName({ message: 'Enter a valid district.&&&district' })
    district: string;


    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter secondary district.`,
        example: `Delaware`
    })
    @MaxLength(100)
    @MinLength(2)
    @IsValidName({ message: 'Please enter a valid secondary district.&&&district' })
    secDistrict: string;


}

export class DeleteBuyerInfo {

    @IsNotEmpty({ message: "Buyer ID cannot be null" })
    @ApiProperty({
        description: 'Enter ID.',
        example: 35,
    })
    id: number;

    @IsNotEmpty({ message: "Individual cannot be null" })
    @ApiProperty({
        description: `Enter individual.`,
        example: true
    })
    isIndividual: boolean;

    @IsNotEmpty({ message: "Form type cannot be null." })
    @ApiProperty({
        description: `Enter form type.`,
        example: true
    })
    isPrimary: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter primary value.`,
        example: false
    })
    primary: boolean;

    @IsOptional()
    @ApiPropertyOptional({
        description: `Enter secondary value.`,
        example: false
    })
    secondary: boolean;

}

export class UpdateBuyerInfoDto extends PartialType(AddBuyerInfoDto) { }
