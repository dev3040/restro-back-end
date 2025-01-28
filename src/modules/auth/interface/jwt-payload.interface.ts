export interface JwtPayload {
    id: number;
    userFullName: string;
    firstName: string;
    lastName: string;
    date: string;
    username: string;
    isActive?: boolean;
    exp?: number;
}

export interface RefreshTokenPayload {
    id: number;
    username: string;
    userFullName: string;
    date: string;
}
