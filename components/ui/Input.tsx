import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
    return (
        <input
            className={`w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 outline-none ${className}`}
            {...props}
        />
    );
};
