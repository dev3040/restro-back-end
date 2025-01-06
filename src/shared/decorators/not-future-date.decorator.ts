import { ValidatorConstraint, ValidatorConstraintInterface, registerDecorator, ValidationOptions } from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
   validate(date: any): boolean {
      const inputDate = new Date(date);
      if (isNaN(inputDate.getTime())) {
         return false; // Invalid date
      }
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Normalize the current date to midnight
      inputDate.setHours(0, 0, 0, 0);   // Normalize the input date to midnight

      return inputDate >= currentDate;  // Correct comparison
   }

   defaultMessage(): string {
      return 'Date cannot be a future date.';
   }
}

export function IsNotFutureDate(validationOptions?: ValidationOptions) {
   return function (object: Object, propertyName: string) {
      registerDecorator({
         target: object.constructor,
         propertyName: propertyName,
         options: validationOptions,
         constraints: [],
         validator: IsNotFutureDateConstraint,
      });
   };
}
