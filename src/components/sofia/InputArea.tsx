import { useState, useCallback, useRef, useEffect } from 'react';
import { FaPaperPlane, FaMicrophone, FaMicrophoneSlash, FaFaceSmile } from 'react-icons/fa6';

interface InputAreaProps {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder: string;
  suggestions?: string[];
  onTyping?: (text: string) => void;
}

const EMOJI_LIST = [
  '😊','😂','😍','🥰','😎','🤔','😢','😅','🙏','👍',
  '❤️','🔥','✅','⭐','🎉','👀','💡','📚','🤖','⚡',
  '🇧🇩','💻','📱','🎵','🌟','💬','🙌','😮','🤣','😇',
];

export default function InputArea({ onSend, disabled, placeholder, suggestions = [], onTyping }: InputAreaProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const handleSend = useCallback((overrideText?: string) => {
    const toSend = (overrideText ?? text).trim();
    if (!toSend || disabled) return;
    onSend(toSend);
    setText('');
    setShowEmoji(false);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  }, [text, disabled, onSend]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);
    onTyping?.(val);
    setShowSuggestions(val.trim().length >= 2 && suggestions.length > 0);
    setActiveSuggestion(-1);
  }, [onTyping, suggestions.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestion(i => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestion(i => Math.max(i - 1, -1));
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        return;
      }
      if (e.key === 'Enter' && activeSuggestion >= 0) {
        e.preventDefault();
        const selected = suggestions[activeSuggestion];
        setText(selected);
        onTyping?.(selected);
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        setTimeout(() => inputRef.current?.focus(), 0);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend, showSuggestions, suggestions, activeSuggestion, onTyping]);

  const selectSuggestion = useCallback((s: string) => {
    setText(s);
    onTyping?.(s);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [onTyping]);

  const insertEmoji = useCallback((emoji: string) => {
    setText(prev => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const toggleVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'bn-BD';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText(prev => {
        const newVal = prev + transcript;
        onTyping?.(newVal);
        return newVal;
      });
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, onTyping]);

  // Close emoji panel on outside click
  useEffect(() => {
    if (!showEmoji) return;
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji]);

  // Hide suggestions when no match
  useEffect(() => {
    if (suggestions.length === 0) setShowSuggestions(false);
    else if (text.trim().length >= 2) setShowSuggestions(true);
  }, [suggestions, text]);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const hasSpeech = typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <div className="flex-shrink-0 bg-card border-t border-border/20 relative" ref={emojiRef}>
      {/* Smart Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 bg-card border border-border/30 rounded-t-xl shadow-lg overflow-hidden z-20 animate-fade-up">
          <div className="text-[10px] text-muted-foreground px-3 pt-1.5 pb-0.5 font-semibold uppercase tracking-wide">
            💡 Suggestions
          </div>
          {suggestions.map((s, i) => (
            <button
              key={s}
              onMouseDown={e => { e.preventDefault(); selectSuggestion(s); }}
              className={`w-full text-left text-sm px-3 py-2 transition-colors font-bengali truncate ${
                i === activeSuggestion
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-secondary/50 text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Emoji picker panel */}
      {showEmoji && (
        <div className="px-3 pt-2 pb-1 grid grid-cols-10 gap-1 animate-fade-up">
          {EMOJI_LIST.map(e => (
            <button
              key={e}
              onClick={() => insertEmoji(e)}
              className="text-xl w-8 h-8 flex items-center justify-center rounded hover:bg-secondary transition-colors active:scale-90"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 px-2 py-1.5">
        {/* Emoji toggle */}
        <button
          onClick={() => setShowEmoji(v => !v)}
          className={`w-9 h-9 flex items-center justify-center transition-colors rounded-full ${
            showEmoji ? 'text-primary bg-secondary' : 'text-muted-foreground hover:text-primary'
          }`}
        >
          <FaFaceSmile size={20} />
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (text.trim().length >= 2 && suggestions.length > 0) setShowSuggestions(true); }}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 px-3 py-2 border-none rounded-2xl text-sm outline-none bg-background text-foreground font-bengali transition-all focus:ring-1 focus:ring-primary/20"
        />

        {/* Mic or Send */}
        {text.trim() ? (
          <button
            onClick={() => handleSend()}
            disabled={disabled}
            className="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground transition-all hover:scale-105 active:scale-95 disabled:opacity-45 flex-shrink-0"
            style={{ background: 'var(--header-gradient)' }}
          >
            <FaPaperPlane size={16} />
          </button>
        ) : hasSpeech ? (
          <button
            onClick={toggleVoice}
            disabled={disabled}
            title="Voice input (Chrome/Edge)"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0 ${
              isListening ? 'bg-destructive text-white animate-pulse' : 'text-primary-foreground'
            } disabled:opacity-45`}
            style={!isListening ? { background: 'var(--header-gradient)' } : undefined}
          >
            {isListening ? <FaMicrophoneSlash size={16} /> : <FaMicrophone size={16} />}
          </button>
        ) : (
          <button disabled className="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground opacity-45 flex-shrink-0" style={{ background: 'var(--header-gradient)' }}>
            <FaPaperPlane size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
