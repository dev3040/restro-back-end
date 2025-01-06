import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

// to validate two properties are equal or not => generally used in DTOs
export function IsEqualTo(property: string, validationOptions?: ValidationOptions) {
    return (object: any, propertyName: string) => {
        registerDecorator({
            name: "isEqualTo",
            target: object.constructor,
            propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];
                    return value === relatedValue;
                },

                defaultMessage() {
                    return `ERR_NEW_AND_CONFIRM_PASSWORD_MISMATCHED`;
                }
            }
        });
    };
}
