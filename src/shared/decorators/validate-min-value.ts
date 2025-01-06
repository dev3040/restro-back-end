import {
  isNumber,
  min,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';
import { Translation } from 'src/i18n/translation.utility';
import { IDynamicValidationOptions } from '../interfaces/dynamic-validation-option';



@ValidatorConstraint({ async: false })
export class ValidateMinValueConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const minNumber = args.constraints[1] as number;
    if (isNumber(value)) {
      return min(value, minNumber);
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const { message, constraints } = args.constraints[0] as IDynamicValidationOptions;
    constraints.min = args.constraints[1];
    return Translation.Translator("en", "error", message || 'ERR_MIN_VALUE', constraints);
  }
}

export function ValidateMinValue(
  limit: number,
  validationOptions: IDynamicValidationOptions,
  options?: ValidationOptions,
) {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: options,
      constraints: [validationOptions, limit],
      validator: ValidateMinValueConstraint,
    });
  };
}
