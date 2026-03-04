import api from './axios';
import type { ApiResponse } from '../types/common';
import type { SignupRequest, SignupResponse, SendEmailRequest, VerifyEmailRequest } from '../types/user';

export const signup = async (data: SignupRequest): Promise<ApiResponse<SignupResponse>> => {
    return api.post('/api/users/signup', data);
};

export const sendEmailVerification = async (data: SendEmailRequest): Promise<ApiResponse<null>> => {
    return api.post('/api/users/email/send', data);
};

export const verifyEmail = async (data: VerifyEmailRequest): Promise<ApiResponse<null>> => {
    return api.post('/api/users/email/verify', data);
};
