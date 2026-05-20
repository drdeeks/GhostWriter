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
            className={`relative w-full rounded-xl border-2 border-border bg-card backdrop-blur-sm p-4 text-card-foreground [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-muted-foreground ${className}`}
        >
            {children}
        </div>
    );
}

export function AlertDescription({ children, className = '' }: AlertDescriptionProps) {
    return (
        <div className={`text-sm text-muted-foreground [&_p]:leading-relaxed ${className}`}>
            {children}
        </div>
    );
}
