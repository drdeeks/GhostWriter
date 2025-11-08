import { ReactNode, createContext, useContext, useId } from 'react';

interface RadioGroupContextType {
    value: string;
    onValueChange: (value: string) => void;
    name: string;
}

const RadioGroupContext = createContext<RadioGroupContextType | undefined>(undefined);

interface RadioGroupProps {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
    className?: string;
}

export function RadioGroup({ value, onValueChange, children, className = '' }: RadioGroupProps) {
    const name = useId();

    return (
        <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
            <div className={className} role="radiogroup">
                {children}
            </div>
        </RadioGroupContext.Provider>
    );
}

interface RadioGroupItemProps {
    value: string;
    id?: string;
    disabled?: boolean;
    className?: string;
}

export function RadioGroupItem({ value, id, disabled = false, className = '' }: RadioGroupItemProps) {
    const context = useContext(RadioGroupContext);
    if (!context) throw new Error('RadioGroupItem must be used within RadioGroup');

    const { value: selectedValue, onValueChange, name } = context;
    const isSelected = selectedValue === value;
    const itemId = id || `${name}-${value}`;

    return (
        <input
            type="radio"
            id={itemId}
            name={name}
            value={value}
            checked={isSelected}
            onChange={() => onValueChange(value)}
            disabled={disabled}
            className={`
        peer sr-only
        ${className}
      `}
        />
    );
}
