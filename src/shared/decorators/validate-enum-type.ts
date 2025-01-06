import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { Translation } from "src/i18n/translation.utility";
import { IDynamicValidationOptions } from "../interfaces/dynamic-validation-option";

@ValidatorConstraint({ async: true })
export class ValidateEnumTypeConstraint<T> implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const [types, targetProperty] = args.constraints;
        const obj = args.object;
        if (!obj[targetProperty]) return true;
        if (Object.values(types).includes(obj[targetProperty])) return true;
        return false;
    }

    defaultMessage(args: ValidationArguments) {
        const { message, constraints } = args.constraints[2] as IDynamicValidationOptions;
        return Translation.Translator("en", "error", message || 'ERR_IS_ENUM', constraints);
      }
}

export function ValidateEnumType<T>(types: Object, targetProperty: string, validationOptions: IDynamicValidationOptions, options?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: options,
            constraints: [types, targetProperty, validationOptions],
            validator: ValidateEnumTypeConstraint,
        });
    };
}