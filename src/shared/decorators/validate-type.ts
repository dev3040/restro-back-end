import {
  isBoolean,
  isNumber,
  isString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';
import { Translation } from 'src/i18n/translation.utility';
import { TypeEnum } from '../enums/field-type.enum';
import { IDynamicValidationOptions } from '../interfaces/dynamic-validation-option';

@ValidatorConstraint({ async: false })
export class ValidateTypeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const { type } = args.constraints[0].constraints;

    if (value) {
      switch (type) {

        case TypeEnum.String:
          return isString(value)

        case TypeEnum.Number:
          return isNumber(value)

        case TypeEnum.Boolean:
          return isBoolean(value)

        default:
          return true;
      }
    } else {
      return true;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const { message, constraints } = args.constraints[0] as IDynamicValidationOptions;
    return Translation.Translator("en", "error", message || 'ERR_TYPE', constraints);
  }
}

export function ValidateType(
  validationOptions: IDynamicValidationOptions,
  options?: ValidationOptions,
) {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: options,
      constraints: [validationOptions],
      validator: ValidateTypeConstraint,
    });
  };
}
