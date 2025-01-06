import { NotFoundException } from "@nestjs/common";
import validate = require("uuid-validate");

export class UuidValidation {
    static validate(id) {
        if (!validate(id)) {
            throw new NotFoundException(`Please enter valid id`);
        }
    }
}
