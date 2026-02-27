import type { AccessLevel } from './common';

export interface RoomListResponse {
    rooms: RoomSummary[];
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface RoomSummary {
    roomId: number;
    title: string;
    city: string;
    district: string;
    accessLevel: AccessLevel | string;
    currentUsers: number;
    createdAt: string;
}

export interface RoomMember {
    userId: number;
    nickname: string;
    role: string;
    profileImageUrl?: string | null;
}

export interface JoinRoomRes {
    roomId: number;
    title: string;
    description?: string;
    city: string;
    district: string;
    accessLevel: AccessLevel | string;
    currentUsers: number;
    members: RoomMember[];
    joinedAt: string;
}

export interface CreateRoomReq {
    title: string;
    description?: string;
    city: string;
    district: string;
    accessLevel: AccessLevel | string;
}
