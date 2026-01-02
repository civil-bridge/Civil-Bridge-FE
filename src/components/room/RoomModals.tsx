import React from 'react';
import Modal from '../common/Modal';

interface RoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
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
export const SubmitProposalModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onConfirm }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="제안서 제출">
        <p className="text-neutral-600 leading-relaxed text-sm">
            제안서를 제출하시겠습니까? <br />
            제출 후에는 수정할 수 없습니다.
        </p>
        <div className="mt-6 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-50">취소</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600">제출</button>
        </div>
    </Modal>
);

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
