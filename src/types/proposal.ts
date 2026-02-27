import type { SubmitStatus } from './common';

export interface ProposalContents {
    paragraph?: string;
    image?: string;
    solution?: string;
    expectedEffect?: string;
}

export interface Consenter {
    id: number;
    nickname: string;
}

export interface ProposalResponse {
    id: number;
    roomId: number;
    authorId: number;
    title?: string;
    contents: ProposalContents;
    status: SubmitStatus | string;
    consents: Consenter[];
    deadline: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProposalCreateReq {
    title?: string;
    paragraph?: string;
    image?: string;
    solution?: string;
    expectedEffect?: string;
    roomId?: number;
}

export interface ProposalUpdateReq {
    title?: string;
    paragraph?: string;
    image?: string;
    solution?: string;
    expectedEffect?: string;
}

export interface LockStatusResponse {
    isLocked: boolean;
    lockOwnerId?: number;
    lockOwnerNickname?: string;
}

export interface ConsentersResponse {
    totalConsents: number;
    consenters: Consenter[];
}
