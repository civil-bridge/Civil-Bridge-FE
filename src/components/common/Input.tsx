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
        <div className={`input-container ${className}`}>
            {label && (
                <label htmlFor={id} className="input-label">
                    {label}
                </label>
            )}
            <div className="input-wrapper">
                <div className="input-field-container">
                    <input
                        id={id}
                        className={`input-field ${error ? 'error' : ''} ${innerAction ? 'has-inner-action' : ''}`}
                        {...props}
                    />
                    {innerAction && (
                        <div className="input-inner-action">
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
            {error && <p className="helper-text error">{error}</p>}
            {successMessage && !error && (
                <p className="helper-text success">{successMessage}</p>
            )}
        </div>
    );
};

export default Input;
