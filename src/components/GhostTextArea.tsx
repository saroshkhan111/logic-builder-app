import React, { useState, useEffect, useRef } from 'react';
import { LucideSparkles } from 'lucide-react';

interface GhostTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  suggestion?: string;
  onSuggestionRequest?: (value: string) => Promise<string | null>;
}

export const GhostTextArea: React.FC<GhostTextAreaProps> = ({
  suggestion = '',
  onSuggestionRequest,
  onChange,
  value,
  ...props
}) => {
  const [localSuggestion, setLocalSuggestion] = useState(suggestion);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalSuggestion(suggestion);
  }, [suggestion]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (onChange) onChange(e);

    if (onSuggestionRequest) {
      const result = await onSuggestionRequest(newValue);
      if (result) {
        setLocalSuggestion(result);
      }
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && localSuggestion) {
      e.preventDefault();
      const currentVal = textAreaRef.current?.value || '';
      const fullText = currentVal + localSuggestion;

      if (onChange) {
        const event = {
          target: { value: fullText },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(event);
      }
      setLocalSuggestion('');
    }
  };

  return (
    <div className="relative w-full group">
      <div className="absolute inset-0 pointer-events-none">
        <textarea
          className="textarea bg-transparent text-slate-500 italic opacity-50 resize-none"
          value={value + localSuggestion}
          readOnly
          {...props}
        />
      </div>
      <textarea
        ref={textAreaRef}
        className="textarea relative z-10 bg-transparent"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
      {localSuggestion && (
        <div className="absolute right-3 bottom-3 text-primary animate-pulse">
          <LucideSparkles size={14} />
        </div>
      )}
    </div>
  );
};
