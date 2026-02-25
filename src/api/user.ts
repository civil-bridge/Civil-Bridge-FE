import api from './axios';
import type { ApiResponse } from '../types/common';
import type { SignupResponse } from '../types/user';

export const signup = async (data: any): Promise<ApiResponse<SignupResponse>> => {
    return api.post('/api/users/signup', data);
};

export const sendEmailVerification = async (email: string): Promise<ApiResponse<null>> => {
    return api.post('/api/users/email/send', { email });
};

export const verifyEmail = async (email: string, code: string): Promise<ApiResponse<null>> => {
    return api.post('/api/users/email/verify', { email, code });
};
