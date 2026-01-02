import React, { type ReactNode } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    successMessage?: string;
    actionButton?: ReactNode;
    innerAction?: ReactNode;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    successMessage,
    actionButton,
    innerAction,
    className = '',
    id,
    ...props
}) => {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {label && (
                <label htmlFor={id} className="text-sm font-medium text-neutral-700">
                    {label}
                </label>
            )}
            <div className="flex gap-2 items-stretch">
                <div className="relative flex-grow">
                    <input
                        id={id}
                        className={`w-full bg-white border rounded-xl py-3 px-4 text-sm text-neutral-800 transition-all outline-none placeholder:text-neutral-400 focus:border-primary-400 focus:ring-3 focus:ring-primary-100 disabled:bg-neutral-100 disabled:cursor-not-allowed ${error ? 'border-error' : 'border-neutral-200'
                            } ${innerAction ? 'pr-11' : ''}`}
                        {...props}
                    />
                    {innerAction && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                            {innerAction}
                        </div>
                    )}
                </div>
                {actionButton && (
                    <div className="shrink-0 flex items-stretch">
                        {actionButton}
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-error">{error}</p>}
            {successMessage && !error && (
                <p className="text-xs text-success">{successMessage}</p>
            )}
        </div>
    );
};

export default Input;
