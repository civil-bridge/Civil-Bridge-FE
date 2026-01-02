import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`flex items-center justify-center gap-2 font-sans text-[28px] font-bold leading-none ${className}`}>
            <span className="text-primary-500">Civil</span>
            <span className="text-neutral-700">Bridge</span>
        </div>
    );
};

export default Logo;
