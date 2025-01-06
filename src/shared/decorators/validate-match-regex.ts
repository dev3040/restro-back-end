import {
  matches,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';
import { Translation } from 'src/i18n/translation.utility';
import { IDynamicValidationOptions } from '../interfaces/dynamic-validation-option';

@ValidatorConstraint({ async: false })
export class ValidateMatchRegexConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const pattern = args.constraints[1] as RegExp;
    if(value.length === 0){
      return true;
    }
    return matches(value, pattern);
  }

  defaultMessage(args: ValidationArguments) {
    const { message, constraints } = args.constraints[0] as IDynamicValidationOptions;
    return Translation.Translator("en", "error", message || 'ERR_INVALID_REGEX', constraints);
  }
}

export function ValidateMatchRegex(  
  pattern: RegExp,
  validationOptions: IDynamicValidationOptions,
  options?: ValidationOptions,
) {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: options,
      constraints: [validationOptions, pattern],
      validator: ValidateMatchRegexConstraint,
    });
  };
}
