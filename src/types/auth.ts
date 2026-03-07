export interface LoginResponse {
    userId: number;
    nickname: string;
    email: string;
    role: string;
    grantType: string;
    accessToken: string;
    refreshToken: string;
}

export interface RefreshResponse {
    grantType: string;
    accessToken: string;
    refreshToken: string;
}
