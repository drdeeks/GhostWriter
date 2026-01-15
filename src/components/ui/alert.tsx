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
            className={`relative w-full rounded-xl border-2 border-gray-700/50 bg-gray-800/80 backdrop-blur-sm p-4 text-gray-100 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-300 ${className}`}
        >
            {children}
        </div>
    );
}

export function AlertDescription({ children, className = '' }: AlertDescriptionProps) {
    return (
        <div className={`text-sm text-gray-300 [&_p]:leading-relaxed ${className}`}>
            {children}
        </div>
    );
}
