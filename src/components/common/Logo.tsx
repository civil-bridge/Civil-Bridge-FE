import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`logo-container ${className}`}>
            <span className="logo-civil">Civil</span>
            <span className="logo-bridge">Bridge</span>
        </div>
    );
};

export default Logo;
