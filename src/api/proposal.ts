import api from './axios';
import type { ApiResponse } from '../types/common';
import type {
    ProposalResponse,
    ProposalCreateReq,
    ProposalUpdateReq,
    LockStatusResponse,
    ConsentersResponse
} from '../types/proposal';

export const createProposal = async (data: ProposalCreateReq): Promise<ApiResponse<ProposalResponse>> => {
    return api.post('/api/proposals', data);
};

export const getProposal = async (proposalId: number): Promise<ApiResponse<ProposalResponse>> => {
    return api.get(`/api/proposals/${proposalId}`);
};

export const getProposalsByRoom = async (roomId: number): Promise<ApiResponse<ProposalResponse[]>> => {
    return api.get(`/api/proposals/rooms/${roomId}`);
};

export const updateProposal = async (proposalId: number, data: ProposalUpdateReq): Promise<ApiResponse<ProposalResponse>> => {
    return api.put(`/api/proposals/${proposalId}`, data);
};

export const getLockStatus = async (proposalId: number): Promise<ApiResponse<LockStatusResponse>> => {
    return api.get(`/api/proposals/${proposalId}/lock-status`);
};

export const startEditing = async (proposalId: number): Promise<ApiResponse<null>> => {
    return api.post(`/api/proposals/${proposalId}/start-editing`);
};

export const finishEditing = async (proposalId: number): Promise<ApiResponse<null>> => {
    return api.post(`/api/proposals/${proposalId}/finish-editing`);
};

export const startVoting = async (proposalId: number): Promise<ApiResponse<ProposalResponse>> => {
    return api.post(`/api/proposals/${proposalId}/start-voting`);
};

export const endVoting = async (proposalId: number): Promise<ApiResponse<ProposalResponse>> => {
    return api.post(`/api/proposals/${proposalId}/end-voting`);
};

export const consentProposal = async (proposalId: number): Promise<ApiResponse<null>> => {
    return api.post(`/api/proposals/${proposalId}/consents`);
};

export const getConsenters = async (proposalId: number): Promise<ApiResponse<ConsentersResponse>> => {
    return api.get(`/api/proposals/${proposalId}/consenters`);
};
