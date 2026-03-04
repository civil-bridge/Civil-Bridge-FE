export interface SignupResponse {
    userId: number;
    nickname: string;
    email: string;
    role: string;
}

export interface SignupRequest {
    loginId: string;
    password: string;
    name: string;
    nickname: string;
    email: string;
    phoneNumber: string;
}
