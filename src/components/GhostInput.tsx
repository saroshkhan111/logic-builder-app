import React, { useState, useEffect, useRef } from 'react';
import { LucideSparkles } from 'lucide-react';

interface GhostInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suggestion?: string;
  onSuggestionRequest?: (value: string) => Promise<string | null>;
}

export const GhostInput: React.FC<GhostInputProps> = ({
  suggestion = '',
  onSuggestionRequest,
  onChange,
  value,
  ...props
}) => {
  const [localSuggestion, setLocalSuggestion] = useState(suggestion);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSuggestion(suggestion);
  }, [suggestion]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (onChange) onChange(e);

    if (onSuggestionRequest) {
      const result = await onSuggestionRequest(newValue);
      if (result) {
        setLocalSuggestion(result);
      }
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && localSuggestion) {
      e.preventDefault();
      const currentVal = inputRef.current?.value || '';
      const fullText = currentVal + localSuggestion;

      // Manually trigger the onChange with the accepted suggestion
      if (onChange) {
        const event = {
          target: { value: fullText },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
      setLocalSuggestion('');
    }
  };

  return (
    <div className="relative w-full group">
      <div className="absolute inset-0 flex items-center pointer-events-none">
        <input
          className="input bg-transparent text-slate-500 italic opacity-50"
          value={value + localSuggestion}
          readOnly
          {...props}
        />
      </div>
      <input
        ref={inputRef}
        className="input relative z-10 bg-transparent"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
      {localSuggestion && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-pulse">
          <LucideSparkles size={14} />
        </div>
      )}
    </div>
  );
};
