export interface ApiResponse<T = any> {
    code: string;
    message: string;
    data: T;
}

export interface PageResponse<T> {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    items: T[]; // 실제 데이터 배열, API Response에 따라 유동적으로 사용
}

export type AccessLevel = 'PUBLIC' | 'OFFICIALS_ONLY' | 'USER_ONLY';

export type SubmitStatus = 'COMPLETED' | 'UNSUBMITTABLE' | 'VOTING';

export type MessageType = 'CHAT' | 'JOIN' | 'LEAVE';

export type Role = 'USER' | 'OFFICIAL' | 'ADMIN';
