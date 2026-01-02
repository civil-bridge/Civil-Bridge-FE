import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                {title && (
                    <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                        <h3 className="font-bold text-neutral-800">{title}</h3>
                        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                <div className="p-6">
                    {children}
                </div>
                {footer && (
                    <div className="px-6 py-4 bg-neutral-50 flex gap-3 justify-end">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
