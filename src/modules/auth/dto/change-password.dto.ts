import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Matches, MaxLength, MinLength, ValidationOptions, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from "class-validator";


@ValidatorConstraint({ async: false })
class IsDifferentConstraint implements ValidatorConstraintInterface {
    validate(newPassword: any, args: ValidationArguments) {
        const object = args.object as any;
        return object.oldPassword !== newPassword;
    }

    defaultMessage(args: ValidationArguments) {
        return 'ERR_RESET_OLD_PASSWORD.&&&newPassword';
    }
}

export function IsDifferent(property: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [property],
            validator: IsDifferentConstraint,
        });
    };
}

export class ChangePasswordDto {
    @IsNotEmpty({
        message: `Please enter your password.&&&oldPassword`
    })
    @ApiProperty({
        description: "Password",
        example: "Test123@"
    })
    oldPassword: string;

    @IsNotEmpty({
        message: `Please enter your new password.&&&password`
    })
    @ApiProperty({
        description: `Enter new password`,
        example: `Test1234@`
    })

    @MaxLength(20)
    @MinLength(8, { message: `New password is too short. It should be minimum 8 characters.&&&newPassword` })
    @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/, {
        message: `Your new password must be 8 characters long, should contain at least 1 uppercase, 1 lowercase, 1 numeric or special character.&&&password`
    })
    @IsDifferent('oldPassword', {
        message: 'New password should not be the same as the old password.&&&newPassword'
    })
    newPassword: string
}
