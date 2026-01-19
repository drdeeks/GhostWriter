import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

interface CardHeaderProps {
    children: ReactNode;
    className?: string;
}

interface CardContentProps {
    children: ReactNode;
    className?: string;
}

interface CardTitleProps {
    children: ReactNode;
    className?: string;
}

interface CardFooterProps {
    children: ReactNode;
    className?: string;
}

export function Card({ children, className = '', onClick }: CardProps) {
    return (
        <div
            className={`bg-gray-900/80 backdrop-blur-sm border-2 border-gray-700/50 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-cyan-500/50' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
    return (
        <div className={`p-6 pb-4 ${className}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
    return (
        <h3 className={`text-lg font-semibold leading-none tracking-tight text-gray-100 ${className}`}>
            {children}
        </h3>
    );
}

export function CardContent({ children, className = '' }: CardContentProps) {
    return (
        <div className={`p-6 pt-0 ${className}`}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
    return (
        <div className={`p-6 pt-4 ${className}`}>
            {children}
        </div>
    );
}
