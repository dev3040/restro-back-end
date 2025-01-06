import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsPhoneNumber(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isPhoneNumber',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
                    if (typeof value !== 'string') {
                        return false;
                    }
                    return phoneRegex.test(value) && value.length === 14;
                },
                defaultMessage(args: ValidationArguments) {
                    const value = args.value;
                    if (typeof value === 'string' && value.length !== 14) {
                        return 'Phone number must be exactly 14 characters long.';
                    }
                    return 'Phone number must be in the format (XXX) XXX-XXXX.';
                },
            },
        });
    };
}
