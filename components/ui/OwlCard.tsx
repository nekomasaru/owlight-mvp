import React from 'react';

interface OwlCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

export const OwlCard: React.FC<OwlCardProps> = ({
    children,
    className = '',
    hover = false,
    onClick
}) => {
    return (
        <div
            className={`
        glass-panel rounded-2xl p-6 
        ${hover ? 'glass-panel-hover cursor-pointer' : ''}
        ${className}
      `}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
