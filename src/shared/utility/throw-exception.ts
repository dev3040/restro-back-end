import {
    BadRequestException,
    ConflictException,
    HttpStatus,
    InternalServerErrorException,
    NotAcceptableException,
    NotFoundException,
    UnauthorizedException
} from "@nestjs/common";

/* 
Use cases to call this function:- 
1) throwException(error)
2) throwException(
    error,
    {
        [HttpStatus.CONFLICT]:'Custom message for Conflict exception!',
        [HttpStatus.BAD_REQUEST]:'Custom message for Bad Request exception!',
        403:'Custom message for Conflict exception!'
    }
    )
*/
export const throwException = (error, errorMsgObj = {}) => {
    if (error && error.response) {
        if (error.response.statusCode == HttpStatus.CONFLICT) {
            throw new ConflictException(
                getErrorMessageByCode(HttpStatus.CONFLICT, errorMsgObj) ?? error.response.message
            );
        } else if (error.response.statusCode == HttpStatus.BAD_REQUEST) {
            throw new BadRequestException(
                getErrorMessageByCode(HttpStatus.BAD_REQUEST, errorMsgObj) ?? error.response.message
            );
        } else if (error.response.statusCode == HttpStatus.NOT_FOUND) {
            throw new NotFoundException(
                getErrorMessageByCode(HttpStatus.NOT_FOUND, errorMsgObj) ?? error.response.message
            );
        } else if (error.response.statusCode == HttpStatus.UNAUTHORIZED) {
            throw new UnauthorizedException(
                getErrorMessageByCode(HttpStatus.UNAUTHORIZED, errorMsgObj) ?? error.response.message
            );
        } else if (error.response.statusCode == HttpStatus.NOT_ACCEPTABLE) {
            throw new NotAcceptableException(
                getErrorMessageByCode(HttpStatus.NOT_ACCEPTABLE, errorMsgObj) ?? error.response.message
            );
        }
    }
    throw new InternalServerErrorException(error);
};

function getErrorMessageByCode(status: number, errorMsgObj) {
    return Object.keys(errorMsgObj).find((prop) => Number(prop) == status) ? errorMsgObj[status] : null;
}
