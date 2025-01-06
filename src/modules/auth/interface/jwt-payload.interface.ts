export interface JwtPayload {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    date: string;
    email: string;
    isActive?: boolean;
    exp?: number;
}

export interface RefreshTokenPayload {
    id: number;
    email: string;
    username: string;
    date: string;
}
