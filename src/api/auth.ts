import api from './axios';
import type { ApiResponse } from '../types/common';
import type { LoginResponse, RefreshResponse } from '../types/auth';

export const login = async (data: any): Promise<ApiResponse<LoginResponse>> => {
    return api.post('/api/auth/login', data);
};

export const logout = async (): Promise<ApiResponse<null>> => {
    return api.post('/api/auth/logout');
};

export const refresh = async (token: string): Promise<ApiResponse<RefreshResponse>> => {
    return api.post('/api/auth/refresh', { refreshToken: token });
};
