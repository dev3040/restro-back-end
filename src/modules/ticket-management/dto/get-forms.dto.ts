import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, ValidationArguments } from 'class-validator';
import { FormType } from 'src/shared/enums/form-type.enum';


export class GetFormsDto {
    @IsNotEmpty({ message: "Ticket ID is required." })
    @ApiProperty({
        description: "Enter ticket ID",
        example: 1
    })
    ticketId: number;

    @IsNotEmpty({ message: "Type is required." })
    @IsEnum(FormType, {
        message: (args: ValidationArguments) => {
            if (typeof args.value == "undefined") {
                return `Select form type. Valid options: ${Object.values(FormType).join(', ')}.&&&type&&&ERROR_MESSAGE`;
            } else {
                return `Select valid form type. Valid options: ${Object.values(FormType).join(', ')}.&&&type&&&ERROR_MESSAGE`;
            }
        }
    })
    @ApiProperty({
        description: 'Select form type',
        example: FormType.BASIC_INFO_FORM,
        enum: FormType,
    })
    type: FormType;
}
