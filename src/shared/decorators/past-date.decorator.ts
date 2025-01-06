import { ValidatorConstraint, ValidatorConstraintInterface, registerDecorator, ValidationOptions } from 'class-validator';


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
      return 'Date must be a past date.';
   }
}

export function IsPastDateValidator(validationOptions?: ValidationOptions) {
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