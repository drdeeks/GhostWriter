import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', ...props }, ref) => {
        return (
            <input
                className={`flex h-12 w-full rounded-xl border-2 border-gray-600/50 bg-gray-800/80 backdrop-blur-sm px-4 py-3 text-sm text-gray-100 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${className}`}
                ref={ref}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
