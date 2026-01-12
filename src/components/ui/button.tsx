import { ButtonHTMLAttributes, ReactNode } from 'react';
import { useHaptic } from '@/lib/haptic';
import { HAPTIC_PATTERNS } from '@/lib/constants';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    className?: string;
    hapticFeedback?: keyof typeof HAPTIC_PATTERNS | false;
    size?: 'sm' | 'default' | 'lg' | 'xl';
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function Button({ 
    children, 
    className = '', 
    hapticFeedback = 'medium',
    size = 'default',
    variant = 'default',
    onClick,
    ...props 
}: ButtonProps) {
    const haptic = useHaptic();

    const sizeClasses = {
        sm: 'h-9 px-3 text-sm',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg min-w-[44px]', // Mobile-optimized
    };

    const variantClasses = {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        // Trigger haptic feedback if enabled
        if (hapticFeedback && !props.disabled) {
            haptic.trigger(hapticFeedback);
        }
        
        // Call original onClick handler
        onClick?.(event);
    };

    const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none haptic-feedback mobile-touch';
    
    const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

    return (
        <button
            className={combinedClasses}
            onClick={handleClick}
            {...props}
        >
            {children}
        </button>
    );
}
