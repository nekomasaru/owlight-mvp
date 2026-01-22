import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface OwlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const OwlButton: React.FC<OwlButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    className = '',
    disabled,
    ...props
}) => {

    const baseStyles = "inline-flex items-center justify-center rounded-full font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-gradient-to-br from-terracotta to-terracotta-light text-white shadow-md hover:shadow-lg hover:-translate-y-0.5",
        secondary: "bg-sage text-white shadow-sm hover:bg-sage/90 hover:-translate-y-0.5",
        outline: "border-2 border-terracotta text-terracotta hover:bg-terracotta/5",
        ghost: "text-taupe hover:bg-warm-beige/30"
    };

    const sizes = {
        sm: "px-4 py-1.5 text-xs",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3 text-base"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="animate-spin mr-2">⏳</span>
            ) : icon ? (
                <span className="mr-2">{icon}</span>
            ) : null}
            {children}
        </button>
    );
};
