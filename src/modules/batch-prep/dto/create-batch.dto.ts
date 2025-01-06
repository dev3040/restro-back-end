import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, ValidationOptions, registerDecorator, ValidationArguments, IsOptional, ValidateIf, ValidatorConstraint, ValidatorConstraintInterface, ValidateNested } from "class-validator";
import moment from "moment";

export function IsValidProcessingDate(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: "IsValidProcessingDate",
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const date = moment(value, "YYYY-MM-DD", true);

                    if (!date.isValid()) { //valid date
                        return false;
                    }
                    if (date.isBefore(moment(), "day")) { //date is past
                        return false;
                    }

                    const dayOfWeek = date.day(); //if date Saturday/Sunday
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                        return false;
                    }
                    return true;
                },
                defaultMessage(args: ValidationArguments) {
                    const date = moment(args.value, "YYYY-MM-DD", true);
                    if (!date.isValid()) {
                        return "ERR_PROCESSING_DATE_FORMAT";
                    } else if (date.isBefore(moment(), "day")) {
                        return "ERR_PROCESSING_PAST_DATE";
                    } else if (date.day() === 0 || date.day() === 6) {
                        return "ERR_PROCESSING_DATE";
                    }
                    return "ERR_PROCESSING_DATE_INVALID";
                }
            }
        });
    };
}


// Validator Constraint for Class-Level Validation
@ValidatorConstraint({ name: 'AtLeastOneDate', async: false })
export class AtLeastOneDateConstraint implements ValidatorConstraintInterface {
    validate(_: any, args: ValidationArguments) {
        const obj = args.object as any;
        return !!(obj.dropDateProcessing || obj.walkDateProcessing || obj.mailDateProcessing);
    }

    defaultMessage(args: ValidationArguments) {
        return "ERR_ADD_PROCESSING_DATE";
    }
}

export function AtLeastOneDate(validationOptions?: ValidationOptions) {
    return function (constructor: Function) {
        registerDecorator({
            name: 'AtLeastOneDate',
            target: constructor,
            options: validationOptions,
            validator: AtLeastOneDateConstraint,
            propertyName: ""
        });
    };
}

// @AtLeastOneDate({ message: "ERR_ADD_PROCESSING_DATE" })
export class BatchDto {

    @IsInt()
    @IsOptional()
    @ValidateIf((c) => c.countyId)
    countyId: number;

    @IsInt()
    @IsOptional()
    @ValidateIf((t) => t.ticketId)
    ticketId: number;

    @IsInt()
    @IsOptional()
    @ValidateIf((p) => p.processingType)
    processingType: number;

    @IsInt()
    @IsOptional()
    @ValidateIf((p) => p.processingType)
    cityId: number;

    @IsOptional()
    @ValidateIf((w) => w.walkDateProcessing)
    @IsValidProcessingDate()
    walkDateProcessing: Date;

    @IsOptional()
    @ValidateIf((d) => d.dropDateProcessing)
    @IsValidProcessingDate()
    dropDateProcessing: Date;

    @IsOptional()
    @ValidateIf((m) => m.mailDateProcessing)
    @IsValidProcessingDate()
    mailDateProcessing: Date;
}

export class CreateBatchDto {
    @ApiPropertyOptional({
        description: "Enter Comment for batch",
        example: [{
            countyId: 2,
            cityId: 1,
            processingType: 1,
            ticketId: 2,
            walkDateProcessing: '2024-12-28',
            dropDateProcessing: '2024-12-28',
            mailDateProcessing: '2024-12-28',

        }],
    })
    @ValidateNested()
    @Type(() => BatchDto)
    batches: BatchDto[];
}