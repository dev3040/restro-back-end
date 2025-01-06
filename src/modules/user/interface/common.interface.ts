export interface AddUser {
    userId: number;
    roles: Array<number>;
}

export interface EditUser {
    userId: number;
    loginUserId: number;
}

export interface OtpData {
    userId: number;
    otp: string;
    otpType: number;
}

export interface UserStatusChange {
    userId?: number;
    status: boolean;
    loginUserId: number;
}
