export interface AppResponse<ResClass = object | object[]> {
    message: string;
    data?: ResClass;
}
