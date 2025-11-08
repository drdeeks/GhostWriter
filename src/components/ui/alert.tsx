import { ReactNode } from 'react';

interface AlertProps {
    children: ReactNode;
    className?: string;
}

interface AlertDescriptionProps {
    children: ReactNode;
    className?: string;
}

export function Alert({ children, className = '' }: AlertProps) {
    return (
        <div
            className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${className}`}
        >
            {children}
        </div>
    );
}

export function AlertDescription({ children, className = '' }: AlertDescriptionProps) {
    return (
        <div className={`text-sm [&_p]:leading-relaxed ${className}`}>
            {children}
        </div>
    );
}
