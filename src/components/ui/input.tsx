import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', ...props }, ref) => {
        return (
            <input
                className={`flex h-12 w-full rounded-xl border-2 border-input bg-background backdrop-blur-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${className}`}
                ref={ref}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
