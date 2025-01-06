export interface OtpLeftTime {
    email: string;
    otpType: string;
}

export interface ResetPassword {
    userId: number;
    plateform: string;
}

export interface ResetToken {
    resetToken: string;
    userId: number;
}

export interface StoreLoginToken {
    accessToken: string;
    userId: number;
}


