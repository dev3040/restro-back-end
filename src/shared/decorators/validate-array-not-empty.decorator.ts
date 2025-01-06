import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Translation } from 'src/i18n/translation.utility';
import { IDynamicValidationOptions } from '../interfaces/dynamic-validation-option';

// Custom constraint for ArrayNotEmpty validation
@ValidatorConstraint({ async: false })
export class ValidateArrayNotEmptyConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!Array.isArray(value) || value.length === 0) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const { message, constraints } = args.constraints[0] as IDynamicValidationOptions;
    return Translation.Translator("en", "error", message || `ERR_ARRAY_NOT_EMPTY`, constraints);
  }
}

export function ValidateArrayNotEmpty(

  validationOptions: IDynamicValidationOptions,
  options?: ValidationOptions,
) {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: options,
      constraints: [validationOptions],
      validator: ValidateArrayNotEmptyConstraint,
    });
  };
}
