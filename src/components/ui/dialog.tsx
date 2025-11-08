import { ReactNode, createContext, useEffect, useRef } from 'react';

interface DialogContextType {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onOpenChange(false);
            }
        };

        if (open) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [open, onOpenChange]);

    useEffect(() => {
        if (open && dialogRef.current) {
            dialogRef.current.focus();
        }
    }, [open]);

    if (!open) return null;

    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => onOpenChange(false)}
                />
                {/* Dialog content */}
                <div
                    ref={dialogRef}
                    className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg bg-white p-0 shadow-xl dark:bg-gray-900"
                    tabIndex={-1}
                >
                    {children}
                </div>
            </div>
        </DialogContext.Provider>
    );
}

interface DialogContentProps {
    children: ReactNode;
    className?: string;
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
    return (
        <div className={`p-6 ${className}`}>
            {children}
        </div>
    );
}

interface DialogHeaderProps {
    children: ReactNode;
    className?: string;
}

export function DialogHeader({ children, className = '' }: DialogHeaderProps) {
    return (
        <div className={`mb-4 ${className}`}>
            {children}
        </div>
    );
}

interface DialogTitleProps {
    children: ReactNode;
    className?: string;
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
    return (
        <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
            {children}
        </h2>
    );
}

interface DialogDescriptionProps {
    children: ReactNode;
    className?: string;
}

export function DialogDescription({ children, className = '' }: DialogDescriptionProps) {
    return (
        <p className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}>
            {children}
        </p>
    );
}

interface DialogFooterProps {
    children: ReactNode;
    className?: string;
}

export function DialogFooter({ children, className = '' }: DialogFooterProps) {
    return (
        <div className={`mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end ${className}`}>
            {children}
        </div>
    );
}
