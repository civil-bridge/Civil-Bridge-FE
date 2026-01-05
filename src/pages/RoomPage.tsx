import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

    // Modal States
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [kickTarget, setKickTarget] = useState<string>('');

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, name: string } | null>(null);

    // Dummy Data for Room
    const roomInfo = {
        title: "부천역 소음문제 해결",
        location: "부천시",
        participantCount: 12
    };

    // Dummy Messages
    const dummyMessages = [
        { id: 1, sender: "김시민", role: "leader", content: "안녕하세요! 부천역 소음 문제에 대해 구체적인 해결 방안을 토의해보고자 합니다. 제안서 초안을 확인해주세요.", time: "오후 2:00", isMe: false },
        { id: 2, sender: "이철수", role: "user", content: "특히 밤늦은 시간에 들리는 환기구 소음이 너무 큽니다.", time: "오후 2:05", isMe: false },
        { id: 3, sender: "부천시 민원팀", role: "official", content: "해당 구역의 소음 데시벨 측정을 요청해둔 상태입니다. 조만간 결과가 나올 예정입니다.", time: "오후 2:10", isMe: false },
        { id: 4, sender: "나 (사용자)", role: "user", content: "전문적인 측정이 이루어진다니 다행이네요. 결과가 나오면 공유 부탁드립니다.", time: "오후 2:15", isMe: true },
        { id: 5, sender: "박영희", role: "user", content: "방음벽 설치도 고려해볼 수 있을까요? 부천역 근처 연립주택들이 특히 피해가 심합니다.", time: "오후 2:18", isMe: false },
        { id: 6, sender: "김시민", role: "leader", content: "방음벽은 예산 문제도 있고 도시 미관상 제약이 있을 수 있어서 신중하게 접근해야 할 것 같아요.", time: "오후 2:20", isMe: false },
        { id: 7, sender: "나 (사용자)", role: "user", content: "제안서에 방음벽 외에도 저소음 포장이나 환기구 위치 변경 등의 대안도 담아보았습니다.", time: "오후 2:22", isMe: true },
        { id: 8, sender: "이철수", role: "user", content: "환기구 위치 변경이 가장 현실적일 것 같습니다. 주거 지역과 멀어지는 방향으로요.", time: "오후 2:25", isMe: false },
    ];

    const handleConfirmAction = () => {
        console.log(`Action confirmed for ${activeModal}`);
        setActiveModal(null);
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
                    <span className="text-neutral-500 shrink-0">{roomInfo.location}</span>
                    <span className="text-neutral-300">·</span>
                    <span className="text-neutral-500 shrink-0">{roomInfo.participantCount}명 참여중</span>
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
                        {dummyMessages.map((msg) => (
                            <div key={msg.id} className={`flex items-start gap-3 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {!msg.isMe && (
                                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-sm ${getProfileStyles(msg.role)}`}>
                                        {msg.sender[0]}
                                    </div>
                                )}
                                <div className={`max-w-[70%] flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-neutral-800 text-sm">{msg.sender}</span>
                                        {msg.role === 'leader' && <span className="bg-[#F5D0FE] text-[#A21CAF] text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">방장</span>}
                                        {msg.role === 'official' && <span className="bg-neutral-800 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">OFFICIAL</span>}
                                    </div>
                                    <div className={`p-4 rounded-[16px] shadow-sm text-sm leading-relaxed ${msg.isMe
                                        ? 'bg-[#F5D0FE] text-[#1C1917] rounded-tr-none'
                                        : 'bg-white border border-[#E7E5E4] text-neutral-700 rounded-tl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                    <div className="mt-1 text-xs text-neutral-400">{msg.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 bg-white border-t border-neutral-100 relative z-10">
                        <div className="flex gap-2 items-end max-w-[800px] mx-auto w-full">
                            <textarea
                                rows={1}
                                className="flex-1 bg-neutral-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none min-h-[44px] max-h-32"
                                placeholder="메시지를 입력하세요 (Shift + Enter: 줄바꿈)"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        // Send logic here
                                    }
                                }}
                            />
                            <button className="bg-primary-500 text-white w-11 h-11 rounded-xl flex items-center justify-center shrink-0 hover:bg-primary-600 transition-colors shadow-sm shadow-primary-200">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </main>

                {/* 4. Proposal Panel */}
                <aside
                    className={`fixed top-16 right-0 bottom-0 z-20 w-[35%] bg-white border-l border-neutral-200 transform transition-transform duration-300 ease-in-out shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.1)] ${isProposalOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="flex flex-col h-full">
                        <div className="h-14 border-b border-neutral-100 flex items-center justify-between px-6 shrink-0">
                            <h2 className="font-bold text-neutral-800">제안서</h2>
                            <button
                                onClick={() => setIsProposalOpen(false)}
                                className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400"
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
                                    defaultValue={roomInfo.title}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-tight">현재 문제</label>
                                <textarea
                                    className="w-full bg-neutral-50 rounded-xl p-4 text-sm min-h-[120px] border border-transparent focus:bg-white focus:border-neutral-200 focus:outline-none transition-all"
                                    placeholder="현재 발생하고 있는 문제를 상세히 적어주세요."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-tight">제안 솔루션</label>
                                <textarea
                                    className="w-full bg-neutral-50 rounded-xl p-4 text-sm min-h-[120px] border border-transparent focus:bg-white focus:border-neutral-200 focus:outline-none transition-all"
                                    placeholder="해결을 위한 구체적인 솔루션을 제안해주세요."
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
                        <div className="p-6 border-t border-neutral-100 flex gap-3">
                            <button className="flex-1 py-3 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors">
                                임시저장
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
                                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">참여자 목록 (12명)</h3>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map(i => {
                                        const name = `참여자 ${i}`;
                                        return (
                                            <div
                                                key={i}
                                                className="flex items-center gap-3 p-1 rounded-lg hover:bg-neutral-50 transition-colors cursor-context-menu"
                                                onContextMenu={(e) => i !== 1 && handleContextMenu(e, name)}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-400">
                                                    {i === 1 ? '방' : '참'}
                                                </div>
                                                <span className="text-sm font-medium text-neutral-700">{name}</span>
                                                {i === 1 && <span className="text-[10px] text-primary-500 font-bold ml-auto border border-primary-100 px-1 rounded">방장</span>}
                                            </div>
                                        );
                                    })}
                                    <button className="w-full text-center text-xs text-neutral-400 hover:text-neutral-600 py-2">
                                        참여자 전체 보기
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 border-t border-neutral-100">
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setIsProposalOpen(true);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-700"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                                        </svg>
                                        <span className="text-sm font-medium">제안서 열기</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveModal('leaveRoom')}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-700"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 17l5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        </svg>
                                        <span className="text-sm font-medium">방 나가기</span>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 border-t border-neutral-100 p-2">
                                <button
                                    onClick={() => setActiveModal('deleteRoom')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-50 transition-colors text-error"
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
                onConfirm={handleConfirmAction}
            />
            <DeleteRoomModal
                isOpen={activeModal === 'deleteRoom'}
                onClose={() => setActiveModal(null)}
                onConfirm={handleConfirmAction}
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
