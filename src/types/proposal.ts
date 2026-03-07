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
    minAgreements?: number;
    deadline: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProposalCreateReq {
    roomId: number;
}

export interface ProposalUpdateReq {
    title?: string;
    paragraph?: string;
    image?: string;
    solution?: string;
    expectedEffect?: string;
}

export interface SubmitProposalReq {
    title: string;
    paragraph: string;
    image?: string;
    solution?: string;
    expectedEffect?: string;
    minAgreements: number;
    deadline: string;
}

export interface LockStatusResponse {
    locked: boolean;
    lockOwnerId?: number;
    lockOwnerNickname?: string;
}

export interface ConsentersResponse {
    totalConsents: number;
    consenters: Consenter[];
}

export interface ConsentResponse {
    totalConsents: number;
}
