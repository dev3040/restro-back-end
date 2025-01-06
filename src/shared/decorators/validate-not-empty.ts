import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  isNotEmpty,
} from 'class-validator';
import { Translation } from 'src/i18n/translation.utility';
import { IDynamicValidationOptions } from '../interfaces/dynamic-validation-option';


@ValidatorConstraint({ async: false })
export class ValidateNotEmptyConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    return isNotEmpty(value);
  }

  defaultMessage(args: ValidationArguments) {
    const { message, constraints } = args.constraints[0] as IDynamicValidationOptions;
    return Translation.Translator("en", "error", message || 'ERR_REQUIRED', constraints);
  }
}

export function ValidateNotEmpty(
  validationOptions: IDynamicValidationOptions,
  options?: ValidationOptions,
) {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: options,
      constraints: [validationOptions],
      validator: ValidateNotEmptyConstraint,
    });
  };
}
