import * as React from "react"
import { cn } from "@/lib/utils"

// Utility functions for masks
const applyMask = (value: string, mask: string) => {
  let result = '';
  let valueIndex = 0;
  
  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    if (mask[i] === '0') {
      result += value[valueIndex];
      valueIndex++;
    } else {
      result += mask[i];
    }
  }
  
  return result;
};

const removeNonDigits = (value: string) => value.replace(/\D/g, '');

// Base masked input component
interface MaskedInputProps extends Omit<React.ComponentProps<"input">, 'onChange' | 'value'> {
  mask: string;
  maxLength: number;
  value?: string;
  onChange?: (value: string) => void;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, maxLength, value = '', onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');
    
    // Initialize display value from prop value
    React.useEffect(() => {
      if (value) {
        const cleanValue = removeNonDigits(value);
        setDisplayValue(applyMask(cleanValue, mask));
      }
    }, [value, mask]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Remove all non-digits
      const cleanValue = removeNonDigits(inputValue);
      
      // Limit to maxLength
      const limitedValue = cleanValue.slice(0, maxLength);
      
      // Apply mask for display
      const maskedValue = applyMask(limitedValue, mask);
      
      setDisplayValue(maskedValue);
      
      // Call onChange with clean value (numbers only)
      if (onChange) {
        onChange(limitedValue);
      }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter
      if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right, down, up
        (e.keyCode >= 35 && e.keyCode <= 40)) {
        return;
      }
      
      // Ensure that it is a number and stop the keypress
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    };
    
    return (
      <input
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";

// CPF Input Component - Format: 000.000.000-00
interface InputCPFProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  onChange?: (value: string) => void;
}

const InputCPF = React.forwardRef<HTMLInputElement, InputCPFProps>(
  ({ placeholder = "000.000.000-00", onChange, ...props }, ref) => {
    const handleChange = (cleanValue: string) => {
      // Create a fake event for form compatibility
      const event = {
        target: {
          name: props.name || 'cpf',
          value: cleanValue
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (onChange) {
        onChange(cleanValue);
      }
      
      // Call original onChange if exists for form compatibility
      if (props.onChange) {
        props.onChange(event);
      }
    };

    return (
      <MaskedInput
        ref={ref}
        mask="000.000.000-00"
        maxLength={11}
        placeholder={placeholder}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

InputCPF.displayName = "InputCPF";

// WhatsApp Input Component - Format: (00) 00000-0000
interface InputWhatsAppProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  onChange?: (value: string) => void;
}

const InputWhatsApp = React.forwardRef<HTMLInputElement, InputWhatsAppProps>(
  ({ placeholder = "(00) 00000-0000", onChange, ...props }, ref) => {
    const handleChange = (cleanValue: string) => {
      // Create a fake event for form compatibility
      const event = {
        target: {
          name: props.name || 'whatsapp',
          value: cleanValue
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (onChange) {
        onChange(cleanValue);
      }
      
      // Call original onChange if exists for form compatibility
      if (props.onChange) {
        props.onChange(event);
      }
    };

    return (
      <MaskedInput
        ref={ref}
        mask="(00) 00000-0000"
        maxLength={11}
        placeholder={placeholder}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

InputWhatsApp.displayName = "InputWhatsApp";

// CEP Input Component - Format: 00000-000
interface InputCEPProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  onChange?: (value: string) => void;
}

const InputCEP = React.forwardRef<HTMLInputElement, InputCEPProps>(
  ({ placeholder = "00000-000", onChange, ...props }, ref) => {
    const handleChange = (cleanValue: string) => {
      // Create a fake event for form compatibility
      const event = {
        target: {
          name: props.name || 'cep',
          value: cleanValue
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (onChange) {
        onChange(cleanValue);
      }
      
      // Call original onChange if exists for form compatibility
      if (props.onChange) {
        props.onChange(event);
      }
    };

    return (
      <MaskedInput
        ref={ref}
        mask="00000-000"
        maxLength={8}
        placeholder={placeholder}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

InputCEP.displayName = "InputCEP";

export { InputCPF, InputWhatsApp, InputCEP, MaskedInput };