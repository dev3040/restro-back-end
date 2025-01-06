import { ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from "class-validator";

@ValidatorConstraint({ async: false })
export class ValidNumberValidator implements ValidatorConstraintInterface {
   validate(value: any): boolean {
      return typeof value === 'number' && !isNaN(value);
   }
   defaultMessage(): string {
      return 'Please enter a valid number value.';
   }
}

export function IsValidNumber(validationOptions?: ValidationOptions) {
   return function (object: Object, propertyName: string) {
      registerDecorator({
         target: object.constructor,
         propertyName: propertyName,
         options: validationOptions,
         constraints: [],
         validator: ValidNumberValidator,
      });
   };
}
