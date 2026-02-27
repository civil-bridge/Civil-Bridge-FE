import api from './axios';
import type { ApiResponse } from '../types/common';
import type { RoomListResponse, CreateRoomReq, JoinRoomRes } from '../types/room';

export const createRoom = async (data: CreateRoomReq): Promise<ApiResponse<JoinRoomRes>> => {
    return api.post('/api/discussion-rooms/create', data);
};

export const getTotalRooms = async (page = 1, size = 15): Promise<ApiResponse<RoomListResponse>> => {
    return api.get('/api/discussion-rooms/retrieveTotal', { params: { page, size } });
};

export const getMyJoinedRooms = async (page = 1, size = 15): Promise<ApiResponse<RoomListResponse>> => {
    return api.get('/api/discussion-rooms/retrieveMyJoined', { params: { page, size } });
};

export const joinRoom = async (roomId: number): Promise<ApiResponse<JoinRoomRes>> => {
    return api.post(`/api/discussion-rooms/${roomId}/join`);
};

export const getRoom = async (roomId: number): Promise<ApiResponse<JoinRoomRes>> => {
    // Note: Assuming there's a GET endpoint or we fallback to catching 409 and returning response
    return api.get(`/api/discussion-rooms/${roomId}`);
};

export const leaveRoom = async (roomId: number): Promise<ApiResponse<null>> => {
    return api.delete(`/api/discussion-rooms/${roomId}/leave`);
};

export const deleteRoom = async (roomId: number): Promise<ApiResponse<null>> => {
    return api.delete(`/api/discussion-rooms/${roomId}`);
};
