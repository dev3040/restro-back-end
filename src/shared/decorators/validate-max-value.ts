import {
  isNumber,
  max,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';
import { Translation } from 'src/i18n/translation.utility';
import { IDynamicValidationOptions } from '../interfaces/dynamic-validation-option';


@ValidatorConstraint({ async: false })
export class ValidateMaxValueConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const maxNumber = args.constraints[1] as number;
    if (isNumber(value)) {
      return max(value, maxNumber);
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const { message, constraints } = args.constraints[0] as IDynamicValidationOptions;
    constraints.max = args.constraints[1];
    return Translation.Translator("en", "error", message || 'ERR_MAX_VALUE', constraints);
  }
}

export function ValidateMaxValue(
  length: number,
  validationOptions: IDynamicValidationOptions,
  options?: ValidationOptions,
) {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: options,
      constraints: [validationOptions, length],
      validator: ValidateMaxValueConstraint,
    });
  };
}
