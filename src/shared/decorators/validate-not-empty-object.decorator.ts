import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from 'class-validator';
import { Translation } from 'src/i18n/translation.utility';
import { IDynamicValidationOptions } from '../interfaces/dynamic-validation-option';
import { ValidationOptions } from 'joi';


//check if the object is not empty
@ValidatorConstraint({ name: 'IsNotEmptyObject', async: false })
export class IsNotEmptyObjectConstraint implements ValidatorConstraintInterface {
   validate(value: any, args: any) {
      if (!value || typeof value !== 'object') {
         return false;
      }
      const { constraints } = args.constraints[0];
      const requiredFields = constraints.requiredFields || [];

      if (requiredFields.length) {
         // Check if any fields other than requiredFields are present
         const extraFields = Object.keys(value).filter(field => !requiredFields.includes(field));
         if (extraFields.length) {
            return false;
         }
      }
      // Check if at least one of the required fields is present and valid
      return value && typeof value === 'object' && Object.keys(value).length > 0;
   }

   defaultMessage(args: ValidationArguments) {
      const { message, constraints } = args?.constraints[0];
      if (!args?.value || typeof args?.value !== 'object') {
         return Translation.Translator("en", "error", message || `ERR_REQUIRED`, constraints);
      }
      const requiredFields = constraints.requiredFields || [];
      const extraFields = Object.keys(args.object[args.property]).filter(field => !requiredFields.includes(field));

      // If there are extra fields, return an error message indicating the issue
      if (extraFields.length) {
         return `The ${args.property} contains invalid fields: ${extraFields.join(', ')}. Only the following keys are allowed: ${requiredFields.join(', ')}.`;
      }

      // Default message for when required fields are missing
      return Translation.Translator("en", "error", message || 'ERR_EMPTY_OBJ_NOT_ALLOWED', constraints);
   }
}

export function ValidateObjectNotEmpty(
   validationOptions: IDynamicValidationOptions,
   options?: ValidationOptions,
) {
   return (object: Object, propertyName: string) => {
      registerDecorator({
         target: object.constructor,
         propertyName: propertyName,
         options: options,
         constraints: [validationOptions],
         validator: IsNotEmptyObjectConstraint,
      });
   };
}

