import React from 'react';
import Modal from '../common/Modal';

interface RoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data?: any) => void;
    isSubmitting?: boolean;
}

// 1. Read-only notice
export const ReadOnlyNoticeModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onConfirm }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="안내">
        <p className="text-neutral-600 leading-relaxed text-sm">
            방장만 제안서를 편집할 수 있습니다. <br />
            읽기 전용으로 보시겠습니까?
        </p>
        <div className="mt-6 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-50">아니오</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600">예</button>
        </div>
    </Modal>
);

// 2. Permission denied
export const PermissionDeniedModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="권한 없음">
        <p className="text-neutral-600 leading-relaxed text-sm">
            방장만 사용할 수 있는 기능입니다.
        </p>
        <div className="mt-6">
            <button onClick={onClose} className="w-full py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600">확인</button>
        </div>
    </Modal>
);

// 3. Leave room
export const LeaveRoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onConfirm }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="방 나가기">
        <p className="text-neutral-600 leading-relaxed text-sm">
            정말 이 토의실을 나가시겠습니까?
        </p>
        <div className="mt-6 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-50">취소</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600">확인</button>
        </div>
    </Modal>
);

// 4. Delete room
export const DeleteRoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onConfirm }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="방 삭제">
        <p className="text-neutral-600 leading-relaxed text-sm">
            방을 삭제하면 모든 채팅과 제안서가 삭제됩니다. <br />
            정말 삭제하시겠습니까?
        </p>
        <div className="mt-6 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-50">취소</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 bg-error text-white rounded-xl text-sm font-bold hover:opacity-90">삭제</button>
        </div>
    </Modal>
);

// 5. Submit proposal
export const SubmitProposalModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
    const [minAgreements, setMinAgreements] = React.useState<number>(10);
    const [deadlineDate, setDeadlineDate] = React.useState<string>('');
    const [deadlineTime, setDeadlineTime] = React.useState<string>('23:59');

    // Set default date to tomorrow
    React.useEffect(() => {
        if (isOpen) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setDeadlineDate(tomorrow.toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!deadlineDate || !deadlineTime) {
            alert('투표 마감 일시를 선택해주세요.');
            return;
        }

        const selectedDateTime = new Date(`${deadlineDate}T${deadlineTime}:59`);

        if (selectedDateTime <= new Date()) {
            alert('마감 시간은 현재 시간 이후여야 합니다.');
            return;
        }

        // Send local time as string because backend treats the string as local time (KST)
        const deadlineStr = `${deadlineDate}T${deadlineTime}:59`;
        onConfirm({
            minAgreements,
            deadline: deadlineStr
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="제안서 제출 및 투표 시작">
            <p className="text-neutral-600 leading-relaxed text-sm mb-4">
                제안서를 제출하면 투표가 시작되며 더 이상 수정할 수 없습니다. <br />
                투표 조건을 설정해주세요.
            </p>

            <div className="space-y-4 mb-6">
                <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">목표 동의 인원수 (최소 1명)</label>
                    <input
                        type="number"
                        min="1"
                        value={minAgreements}
                        onChange={(e) => setMinAgreements(Number(e.target.value))}
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">마감 날짜 및 시간</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="date"
                                value={deadlineDate}
                                onChange={(e) => setDeadlineDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full border border-neutral-200 rounded-lg pl-3 pr-8 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white"
                                style={{ colorScheme: 'light' }}
                            />
                        </div>
                        <input
                            type="time"
                            value={deadlineTime}
                            onChange={(e) => setDeadlineTime(e.target.value)}
                            className="w-32 border border-neutral-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
                >
                    취소
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            제출 중...
                        </>
                    ) : '제출 및 투표 시작'}
                </button>
            </div>
        </Modal>
    );
};

// 6. Kick participant
export const KickParticipantModal: React.FC<RoomModalProps & { name: string }> = ({ isOpen, onClose, onConfirm, name }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="강퇴 확인">
        <p className="text-neutral-600 leading-relaxed text-sm">
            <span className="font-bold text-neutral-800">{name}</span>님을 강퇴하시겠습니까?
        </p>
        <div className="mt-6 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-50">취소</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 bg-error text-white rounded-xl text-sm font-bold hover:opacity-90">강퇴</button>
        </div>
    </Modal>
);
