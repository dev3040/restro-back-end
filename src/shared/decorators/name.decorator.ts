
import { ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from "class-validator";

@ValidatorConstraint({ async: false })
export class IsValidNameConstraint implements ValidatorConstraintInterface {
    validate(value: any): boolean {
        const regex = /^[\S]+(\s[\S]+)*$/;
        return typeof value === 'string' && regex.test(value);
    }

    defaultMessage(): string {
        return 'Please enter a valid name.&&&name';
    }
}

export function IsValidName(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidNameConstraint,
        });
    };
}