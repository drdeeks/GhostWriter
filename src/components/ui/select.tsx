import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

interface SelectContextType {
    value: string;
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

interface SelectProps {
    value?: string;
    onValueChange?: (value: string) => void;
    children: ReactNode;
}

export function Select({ value = '', onValueChange, children }: SelectProps) {
    const [internalValue, setInternalValue] = useState(value);
    const [open, setOpen] = useState(false);

    const currentValue = value !== undefined ? value : internalValue;
    const handleValueChange = onValueChange || setInternalValue;

    return (
        <SelectContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, open, setOpen }}>
            <div className="relative">
                {children}
            </div>
        </SelectContext.Provider>
    );
}

interface SelectTriggerProps {
    children: ReactNode;
    className?: string;
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
    const context = useContext(SelectContext);
    if (!context) throw new Error('SelectTrigger must be used within Select');

    return (
        <button
            type="button"
            className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            onClick={() => context.setOpen(!context.open)}
        >
            {children}
            <svg
                className={`h-4 w-4 opacity-50 transition-transform ${context.open ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
            >
                <path d="M7 9l5 5 5-5" />
            </svg>
        </button>
    );
}

interface SelectValueProps {
    placeholder?: string;
}

export function SelectValue({ placeholder = 'Select...' }: SelectValueProps) {
    const context = useContext(SelectContext);
    if (!context) throw new Error('SelectValue must be used within Select');

    return <span>{context.value || placeholder}</span>;
}

interface SelectContentProps {
    children: ReactNode;
    className?: string;
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
    const context = useContext(SelectContext);
    if (!context) throw new Error('SelectContent must be used within Select');

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                context.setOpen(false);
            }
        };

        if (context.open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [context.open, context.setOpen]);

    if (!context.open) return null;

    return (
        <div
            ref={ref}
            className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 ${className}`}
        >
            {children}
        </div>
    );
}

interface SelectItemProps {
    value: string;
    children: ReactNode;
    className?: string;
}

export function SelectItem({ value, children, className = '' }: SelectItemProps) {
    const context = useContext(SelectContext);
    if (!context) throw new Error('SelectItem must be used within Select');

    return (
        <div
            className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground ${className}`}
            onClick={() => {
                context.onValueChange(value);
                context.setOpen(false);
            }}
        >
            {context.value === value && (
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </span>
            )}
            {children}
        </div>
    );
}
