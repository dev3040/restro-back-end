import { BadRequestException, Injectable, PipeTransform, UnsupportedMediaTypeException } from "@nestjs/common";

@Injectable()
export class FileTypeValidationPipe implements PipeTransform {
    transform(files: Express.Multer.File | Express.Multer.File[]): Express.Multer.File | Express.Multer.File[] {
        if (files === undefined || files === null) {
            throw new BadRequestException("Validation failed (file expected)");
        }
        if (Array.isArray(files) && files.length === 0) {
            throw new BadRequestException("Validation failed (files expected)");
        }
        // Add your custom file validation hear.
        if (Array.isArray(files)) {
            files.forEach((file) => {
                if (file.mimetype !== "text/csv") {
                    throw new UnsupportedMediaTypeException("File is not valid use csv only!");
                }
            });
        } else {
            if (files[0].mimetype !== "text/csv") {
                throw new UnsupportedMediaTypeException("File is not valid use csv only!");
            }
        }
        return files;
    }
}
