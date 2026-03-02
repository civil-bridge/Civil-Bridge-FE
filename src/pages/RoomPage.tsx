import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useChat } from '../hooks/useChat';
import { getMessagesByRoom } from '../api/message';
import { joinRoom, getRoom, leaveRoom, deleteRoom } from '../api/room';
import { getProposalsByRoom, createProposal, updateProposal, startEditing, finishEditing, getLockStatus } from '../api/proposal';
import { isAxiosError } from 'axios';
import type { ProposalResponse, LockStatusResponse } from '../types/proposal';
import {
    ReadOnlyNoticeModal,
    PermissionDeniedModal,
    LeaveRoomModal,
    DeleteRoomModal,
    SubmitProposalModal,
    KickParticipantModal
} from '../components/room/RoomModals';

const RoomPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();

    // UI States
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProposalOpen, setIsProposalOpen] = useState(false);
    const [isShowAllMembers, setIsShowAllMembers] = useState(false);

    // Modal States
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [kickTarget, setKickTarget] = useState<string>('');

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, name: string } | null>(null);

    // Proposal States
    const [proposals, setProposals] = useState<ProposalResponse[]>([]);
    const [locks, setLocks] = useState<Record<number, LockStatusResponse>>({});

    // Editor States
    const [proposalId, setProposalId] = useState<number | null>(null);
    const [proposalTitle, setProposalTitle] = useState('');
    const [proposalParagraph, setProposalParagraph] = useState('');
    const [proposalSolution, setProposalSolution] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isCreatingProposal, setIsCreatingProposal] = useState(false);

    const { user } = useAuthStore();
    const numericRoomId = parseInt(roomId || '0', 10);

    const { data: roomData, isLoading: isRoomLoading, error: roomError } = useQuery({
        queryKey: ['room', numericRoomId],
        queryFn: async () => {
            try {
                return await joinRoom(numericRoomId);
            } catch (error) {
                if (isAxiosError(error) && error.response?.status === 409) {
                    // Already joined, fetch room info directly
                    return await getRoom(numericRoomId);
                }
                throw error;
            }
        },
        retry: 0,
    });

    const roomInfo = roomData?.data;

    const fetchProposalsAndLocks = async () => {
        if (!numericRoomId) return;
        try {
            const res = await getProposalsByRoom(numericRoomId);
            const data = res.data || [];
            setProposals(data);

            // Fetch locks
            const lockPromises = data.map(p => getLockStatus(p.id).catch(() => null));
            const lockResults = await Promise.all(lockPromises);

            const newLocks: Record<number, LockStatusResponse> = {};
            data.forEach((p, index) => {
                const lockRes = lockResults[index];
                if (lockRes && lockRes.data) {
                    newLocks[p.id] = lockRes.data;
                }
            });
            setLocks(newLocks);
        } catch (err) {
            console.error('Failed to fetch proposals:', err);
        }
    };

    useEffect(() => {
        if (isMenuOpen) {
            fetchProposalsAndLocks();
        }
    }, [isMenuOpen, numericRoomId]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (proposalId && isProposalOpen) {
                finishEditing(proposalId).catch(console.error);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (proposalId && isProposalOpen) {
                finishEditing(proposalId).catch(console.error);
            }
        };
    }, [proposalId, isProposalOpen]);

    const handleCloseProposalPanel = async () => {
        setIsProposalOpen(false);
        if (proposalId) {
            try {
                // 패널을 닫을 때 자동으로 임시저장 (제목이 있는 경우만)
                if (proposalTitle?.trim()) {
                    await updateProposal(proposalId, {
                        title: proposalTitle,
                        paragraph: proposalParagraph,
                        solution: proposalSolution
                    }).catch(console.error);
                }
                await finishEditing(proposalId);
            } catch (err) {
                console.error("Failed to release lock:", err);
            }
        }
    };

    const handleTempSave = async () => {
        setIsSaving(true);
        try {
            if (proposalId) {
                // Update (Already holds the lock from opening it)
                try {
                    await updateProposal(proposalId, {
                        title: proposalTitle,
                        paragraph: proposalParagraph,
                        solution: proposalSolution
                    });
                    // 백엔드가 락을 풀릴 경우를 대비해 (백엔드 수정 전까지의 호환성 유지)
                    await startEditing(proposalId).catch(() => { });
                    alert('임시저장되었습니다.');
                } catch (error: any) {
                    if (isAxiosError(error) && error.response?.status === 403) {
                        // 락 재획득 시도 (로직 안정화용 백업)
                        console.log('Lock lost. Re-acquiring lock and retrying save...');
                        await startEditing(proposalId);
                        await updateProposal(proposalId, {
                            title: proposalTitle,
                            paragraph: proposalParagraph,
                            solution: proposalSolution
                        });
                        await startEditing(proposalId).catch(() => { });
                        alert('임시저장되었습니다.');
                    } else {
                        throw error;
                    }
                }
            } else {
                alert('잘못된 접근입니다. 제안서를 먼저 생성해주세요.');
            }
        } catch (error) {
            console.error('Failed to temp save proposal:', error);
            alert('임시저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsSaving(false);
        }
    };

    const { messages: liveMessages, isConnected, sendMessage } = useChat({
        roomId: numericRoomId,
        userId: user?.userId || 0
    });

    const { data: historyData } = useQuery({
        queryKey: ['messages', numericRoomId],
        queryFn: () => getMessagesByRoom(numericRoomId, undefined, 50),
    });

    const historyMessages = historyData?.data?.messages || [];
    // API returns latest first, so reverse it for display
    const reversedHistory = [...historyMessages].reverse();
    const allMessages = [...reversedHistory, ...liveMessages];

    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allMessages]);

    const handleConfirmAction = () => {
        console.log(`Action confirmed for ${activeModal}`);
        setActiveModal(null);
    };

    const handleLeaveRoomConfirm = async () => {
        try {
            await leaveRoom(numericRoomId);
            alert('방에서 나갔습니다.');
            navigate('/');
        } catch (error) {
            console.error('Failed to leave room:', error);
            alert('방 나가기에 실패했습니다.');
        } finally {
            setActiveModal(null);
        }
    };

    const handleDeleteRoomConfirm = async () => {
        try {
            await deleteRoom(numericRoomId);
            alert('방이 삭제되었습니다.');
            navigate('/');
        } catch (error) {
            console.error('Failed to delete room:', error);
            alert('방 삭제에 실패했습니다.');
        } finally {
            setActiveModal(null);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, name: string) => {
        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            name
        });
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    // Profile Icon Style Mapping
    const getProfileStyles = (role: string) => {
        switch (role) {
            case 'leader': return "bg-[#F5D0FE] text-[#A21CAF]";
            case 'official': return "bg-[#DBEAFE] text-[#2563EB]";
            default: return "bg-[#F5F5F4] text-[#57534E]";
        }
    };

    if (isRoomLoading) {
        return <div className="flex bg-white items-center justify-center h-screen">로딩 중...</div>;
    }

    if (roomError || !roomInfo) {
        return (
            <div className="flex flex-col bg-white items-center justify-center h-screen">
                <p className="text-xl mb-4">방 정보를 불러올 수 없거나 존재하지 않는 방입니다.</p>
                <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary-500 text-white rounded-xl">홈으로 가기</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* 1. Header */}
            <header className="h-16 border-b border-neutral-200 flex items-center px-4 bg-white shrink-0 relative z-10">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>

                <div className="ml-2 flex items-center gap-2 overflow-hidden">
                    <h1 className="text-lg font-bold truncate">{roomInfo.title}</h1>
                    <span className="text-neutral-300">·</span>
                    <span className="text-neutral-500 shrink-0">{roomInfo.city} {roomInfo.district}</span>
                    <span className="text-neutral-300">·</span>
                    <span className="text-neutral-500 shrink-0">{roomInfo.currentUsers}명 참여중</span>
                </div>

                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="ml-auto p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* 3. Chat Area */}
                <main className={`flex flex-col transition-all duration-300 ease-in-out ${isProposalOpen ? 'w-[65%]' : 'w-full'} bg-[#FAFAFA]`}>
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {allMessages.map((msg: any, index: number) => {
                            // 백엔드 명세상 과거 메시지(API)에는 userId가 없고 userName만 있음 (STOMP에는 userId 있음)
                            const isMe =
                                (msg.userId && msg.userId === user?.userId) ||
                                (!msg.userId && msg.userName?.trim() === user?.nickname?.trim());
                            const role = msg.role || 'user'; // Assuming role is provided, else fallback to user
                            const isNotice = msg.type === 'JOIN' || msg.type === 'LEAVE';

                            if (isNotice) {
                                return (
                                    <div key={msg.id || index} className="flex justify-center my-4">
                                        <span className="bg-neutral-200 text-neutral-600 text-xs px-3 py-1 rounded-full">
                                            {msg.content}
                                        </span>
                                    </div>
                                );
                            }

                            return (
                                <div key={msg.id || index} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!isMe && (
                                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-sm ${getProfileStyles(role)}`}>
                                            {msg.userName?.[0] || 'U'}
                                        </div>
                                    )}
                                    <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-neutral-800 text-sm">{msg.userName}</span>
                                        </div>
                                        <div className={`p-4 rounded-[16px] shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${isMe
                                            ? 'bg-[#F5D0FE] text-[#1C1917] rounded-tr-none'
                                            : 'bg-white border border-[#E7E5E4] text-neutral-700 rounded-tl-none'
                                            }`}>
                                            {msg.content}
                                        </div>
                                        <div className="mt-1 text-xs text-neutral-400">
                                            {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 bg-white border-t border-neutral-100 relative z-10">
                        <div className="flex gap-2 items-end max-w-[800px] mx-auto w-full">
                            <textarea
                                rows={1}
                                className="flex-1 bg-neutral-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none min-h-[44px] max-h-32"
                                placeholder={isConnected ? "메시지를 입력하세요 (Shift + Enter: 줄바꿈)" : "채팅 서버에 연결 중..."}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                disabled={!isConnected}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (chatInput.trim()) {
                                            sendMessage(chatInput);
                                            setChatInput('');
                                        }
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    if (chatInput.trim()) {
                                        sendMessage(chatInput);
                                        setChatInput('');
                                    }
                                }}
                                disabled={!isConnected || !chatInput.trim()}
                                className="bg-primary-500 text-white w-11 h-11 rounded-xl flex items-center justify-center shrink-0 hover:bg-primary-600 transition-colors shadow-sm shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </main>

                {/* 4. Proposal Panel (Edit View Only) */}
                <aside
                    className={`fixed top-16 right-0 bottom-0 z-20 w-[40%] bg-white border-l border-neutral-200 transform transition-transform duration-300 ease-in-out shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.1)] ${isProposalOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="flex flex-col h-full relative">
                        <div className="h-14 border-b border-neutral-100 flex items-center justify-between px-6 shrink-0 bg-white">
                            <div className="flex items-center gap-3">
                                <h2 className="font-bold text-neutral-800">
                                    {proposalId ? '제안서 수정' : '새 제안서 작성'}
                                </h2>
                            </div>
                            <button
                                onClick={handleCloseProposalPanel}
                                className="p-2 -mr-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-tight">제안 제목</label>
                                <input
                                    type="text"
                                    className="w-full border-b border-neutral-200 py-2 text-lg font-semibold focus:outline-none focus:border-primary-500 transition-colors"
                                    placeholder="제목을 입력하세요"
                                    value={proposalTitle}
                                    onChange={(e) => setProposalTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-tight">현재 문제</label>
                                <textarea
                                    className="w-full bg-neutral-50 rounded-xl p-4 text-sm min-h-[120px] border border-transparent focus:bg-white focus:border-neutral-200 focus:outline-none transition-all"
                                    placeholder="현재 발생하고 있는 문제를 상세히 적어주세요."
                                    value={proposalParagraph}
                                    onChange={(e) => setProposalParagraph(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-tight">제안 솔루션</label>
                                <textarea
                                    className="w-full bg-neutral-50 rounded-xl p-4 text-sm min-h-[120px] border border-transparent focus:bg-white focus:border-neutral-200 focus:outline-none transition-all"
                                    placeholder="해결을 위한 구체적인 솔루션을 제안해주세요."
                                    value={proposalSolution}
                                    onChange={(e) => setProposalSolution(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-tight">첨부파일</label>
                                <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:bg-neutral-50 hover:border-neutral-300 transition-all cursor-pointer">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    <span className="text-sm text-neutral-500">파일을 클릭하거나 드래그하여 업로드</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-neutral-100 flex gap-3 shrink-0 bg-white">
                            <button
                                onClick={handleTempSave}
                                disabled={isSaving}
                                className="flex-1 py-3 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? '저장 중...' : '임시저장'}
                            </button>
                            <button
                                onClick={() => setActiveModal('submitProposal')}
                                className="flex-1 py-3 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors shadow-md shadow-primary-100"
                            >
                                최종 제출
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {/* 2. Slide Menu Drawer */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-black bg-opacity-40 transition-opacity"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl flex flex-col">
                        <div className="h-16 border-b border-neutral-100 flex items-center justify-between px-6">
                            <span className="font-bold text-neutral-800">메뉴</span>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 -mr-2 text-neutral-400 hover:text-neutral-600"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">참여자 목록 ({roomInfo.currentUsers}명)</h3>
                                <div className="space-y-4">
                                    {(isShowAllMembers ? roomInfo.members : roomInfo.members?.slice(0, 10))?.map(member => {
                                        return (
                                            <div
                                                key={member.userId}
                                                className="flex items-center gap-3 p-1 rounded-lg hover:bg-neutral-50 transition-colors cursor-context-menu"
                                                onContextMenu={(e) => member.userId !== user?.userId && handleContextMenu(e, member.nickname)}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getProfileStyles(member.role)}`}>
                                                    {member.role === 'LEADER' ? '방' : '참'}
                                                </div>
                                                <span className="text-sm font-medium text-neutral-700">{member.nickname}</span>
                                                {member.role === 'LEADER' && <span className="text-[10px] text-primary-500 font-bold ml-auto border border-primary-100 px-1 rounded">방장</span>}
                                            </div>
                                        );
                                    })}
                                    {roomInfo.members && roomInfo.members.length > 10 && (
                                        <button
                                            onClick={() => setIsShowAllMembers(!isShowAllMembers)}
                                            className="w-full text-center text-xs text-neutral-400 hover:text-neutral-600 py-2"
                                        >
                                            {isShowAllMembers ? '접기' : `참여자 전체보기 (${roomInfo.members.length - 10}명 더보기)`}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 border-t border-neutral-100">
                                <div className="p-4">
                                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">제안서 목록</h3>

                                    <button
                                        onClick={async () => {
                                            if (isCreatingProposal) return;
                                            setIsCreatingProposal(true);
                                            try {
                                                if (proposalId && isProposalOpen) {
                                                    try {
                                                        if (proposalTitle?.trim()) {
                                                            await updateProposal(proposalId, {
                                                                title: proposalTitle,
                                                                paragraph: proposalParagraph,
                                                                solution: proposalSolution
                                                            }).catch(console.error);
                                                        }
                                                        await finishEditing(proposalId);
                                                    } catch (err) { console.error(err); }
                                                }

                                                // 대안 A: 명시적 생성 (즉각 서버 통신)
                                                const res = await createProposal({
                                                    roomId: numericRoomId,
                                                    title: '새 제안서',
                                                    paragraph: '',
                                                    solution: ''
                                                });

                                                const newId = res.data.id;
                                                // 백엔드가 생성 시 락을 자동 부여하도록 수정되기 전까지 임시로 startEditing 호출
                                                await startEditing(newId).catch(console.error);

                                                setProposalId(newId);
                                                setProposalTitle('새 제안서');
                                                setProposalParagraph('');
                                                setProposalSolution('');

                                                // 상태 갱신 (새 제안서가 목록에 바로 보이도록)
                                                await fetchProposalsAndLocks();

                                                setIsProposalOpen(true);
                                                setIsMenuOpen(false);
                                            } catch (error) {
                                                console.error('Failed to create new proposal:', error);
                                                alert('제안서 생성에 실패했습니다.');
                                            } finally {
                                                setIsCreatingProposal(false);
                                            }
                                        }}
                                        disabled={isCreatingProposal}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-4 rounded-xl border border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors disabled:opacity-50"
                                    >
                                        {isCreatingProposal ? (
                                            <span className="text-sm font-bold">생성 중...</span>
                                        ) : (
                                            <>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M5 12h14" /><path d="M12 5v14" />
                                                </svg>
                                                <span className="text-sm font-bold">새 제안서 생성</span>
                                            </>
                                        )}
                                    </button>

                                    <div className="space-y-3">
                                        {proposals.map(p => {
                                            const lock = locks[p.id];
                                            const isLocked = lock?.isLocked;
                                            const amIOwner = isLocked && lock.lockOwnerId === user?.userId;

                                            return (
                                                <div
                                                    key={p.id}
                                                    className={`border border-neutral-200 rounded-xl p-3 hover:border-neutral-300 transition-colors cursor-pointer ${isLocked && !amIOwner ? 'opacity-70 bg-neutral-50' : 'bg-white'}`}
                                                    onClick={async () => {
                                                        if (isLocked && !amIOwner) {
                                                            alert(`${lock.lockOwnerNickname}님이 작업 중입니다.`);
                                                            return;
                                                        }

                                                        if (proposalId && proposalId !== p.id && isProposalOpen) {
                                                            try {
                                                                if (proposalTitle?.trim()) {
                                                                    await updateProposal(proposalId, {
                                                                        title: proposalTitle,
                                                                        paragraph: proposalParagraph,
                                                                        solution: proposalSolution
                                                                    }).catch(console.error);
                                                                }
                                                                await finishEditing(proposalId);
                                                            } catch (err) { console.error(err); }
                                                        }

                                                        try {
                                                            await startEditing(p.id);
                                                        } catch (err) {
                                                            alert('해당 제안서 편집을 시작할 수 없습니다. (다른 사용자가 작업 중일 수 있습니다.)');
                                                            return;
                                                        }

                                                        setProposalId(p.id);
                                                        setProposalTitle(p.title || '');
                                                        setProposalParagraph(p.contents?.paragraph || '');
                                                        setProposalSolution(p.contents?.solution || '');
                                                        setIsProposalOpen(true);
                                                        setIsMenuOpen(false);
                                                    }}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <h4 className="font-bold text-sm text-neutral-800 truncate">{p.title || '제목 없음'}</h4>
                                                        <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                                                            <span className={`px-1.5 py-0.5 rounded-full border ${p.status === 'SUBMITTABLE' ? 'border-primary-200 text-primary-600 bg-primary-50' : 'border-neutral-200 text-neutral-500 bg-neutral-50'}`}>
                                                                {p.status === 'SUBMITTABLE' ? '작성중' : p.status}
                                                            </span>
                                                            {isLocked && (
                                                                <span className={`font-bold ${amIOwner ? 'text-primary-600' : 'text-orange-600'}`}>
                                                                    {amIOwner ? '(내가 작업중)' : `(${lock.lockOwnerNickname} 작업중)`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {proposals.length === 0 && (
                                            <div className="text-center py-6 text-xs text-neutral-400">
                                                생성된 제안서가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto border-t border-neutral-100 p-2">
                                <button
                                    onClick={() => setActiveModal('leaveRoom')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-700"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 17l5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    </svg>
                                    <span className="text-sm font-medium">방 나가기</span>
                                </button>

                                <button
                                    onClick={() => setActiveModal('deleteRoom')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-50 transition-colors text-error mt-1"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                    <span className="text-sm font-medium">방 삭제</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Modals */}
            <ReadOnlyNoticeModal
                isOpen={activeModal === 'readOnly'}
                onClose={() => setActiveModal(null)}
                onConfirm={handleConfirmAction}
            />
            <PermissionDeniedModal
                isOpen={activeModal === 'permissionDenied'}
                onClose={() => setActiveModal(null)}
            />
            <LeaveRoomModal
                isOpen={activeModal === 'leaveRoom'}
                onClose={() => setActiveModal(null)}
                onConfirm={handleLeaveRoomConfirm}
            />
            <DeleteRoomModal
                isOpen={activeModal === 'deleteRoom'}
                onClose={() => setActiveModal(null)}
                onConfirm={handleDeleteRoomConfirm}
            />
            <SubmitProposalModal
                isOpen={activeModal === 'submitProposal'}
                onClose={() => setActiveModal(null)}
                onConfirm={handleConfirmAction}
            />
            <KickParticipantModal
                isOpen={activeModal === 'kickParticipant'}
                name={kickTarget}
                onClose={() => setActiveModal(null)}
                onConfirm={handleConfirmAction}
            />

            {/* Context Menu */}
            {contextMenu && (
                <>
                    <div
                        className="fixed inset-0 z-[60]"
                        onClick={closeContextMenu}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            closeContextMenu();
                        }}
                    />
                    <div
                        className="fixed z-[70] bg-white border border-neutral-200 rounded-xl shadow-xl py-1 min-w-[120px]"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button
                            className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error/5 transition-colors flex items-center gap-2"
                            onClick={() => {
                                setKickTarget(contextMenu.name);
                                setActiveModal('kickParticipant');
                                closeContextMenu();
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" />
                            </svg>
                            강퇴하기
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default RoomPage;
