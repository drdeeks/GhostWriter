import { LabelHTMLAttributes, forwardRef } from 'react';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    className?: string;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
    ({ className = '', ...props }, ref) => {
        return (
            <label
                ref={ref}
                className={`text-sm font-medium leading-none text-gray-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
                {...props}
            />
        );
    }
);

Label.displayName = 'Label';
