import api from './axios';
import type { ApiResponse } from '../types/common';
import type { MessageResponse } from '../types/message';

export const getMessagesByRoom = async (roomId: number, cursor?: number, size = 30): Promise<ApiResponse<MessageResponse>> => {
    const params: any = { size };
    if (cursor !== undefined) {
        params.cursor = cursor;
    }
    return api.get(`/api/messages/rooms/${roomId}`, { params });
};
