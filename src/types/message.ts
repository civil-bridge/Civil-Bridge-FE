import type { MessageType } from './common';

export interface MessageResponse {
    messages: MessageItem[];
    nextCursor: number | null;
    hasNext: boolean;
}

export interface MessageItem {
    id: number;
    content: string;
    userName: string;
    createdAt: string;
}

export interface ChatMessagePayload {
    type: MessageType | string;
    content: string;
    roomId: number;
    userId: number;
}
