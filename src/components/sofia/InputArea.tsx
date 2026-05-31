import { useState, useCallback, useRef, useEffect } from 'react';
import { FaPaperPlane, FaMicrophone, FaMicrophoneSlash, FaFaceSmile } from 'react-icons/fa6';

interface InputAreaProps {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder: string;
}

const EMOJI_LIST = [
  '😊','😂','😍','🥰','😎','🤔','😢','😅','🙏','👍',
  '❤️','🔥','✅','⭐','🎉','👀','💡','📚','🤖','⚡',
  '🇧🇩','💻','📱','🎵','🌟','💬','🙌','😮','🤣','😇',
];

export default function InputArea({ onSend, disabled, placeholder }: InputAreaProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const handleSend = useCallback(() => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
    setShowEmoji(false);
  }, [text, disabled, onSend]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

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
      setText(prev => prev + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  // Close emoji panel when clicking outside
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

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const hasSpeech = typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <div className="flex-shrink-0 bg-card border-t border-border/20">
      {/* Emoji picker panel */}
      {showEmoji && (
        <div
          ref={emojiRef}
          className="px-3 pt-2 pb-1 grid grid-cols-10 gap-1 animate-fade-up"
        >
          {EMOJI_LIST.map(e => (
            <button
              key={e}
              onClick={() => insertEmoji(e)}
              className="text-xl w-8 h-8 flex items-center justify-center rounded hover:bg-secondary transition-colors active:scale-90"
              aria-label={e}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 px-2 py-1.5">
        {/* Emoji toggle button */}
        <button
          onClick={() => { setShowEmoji(v => !v); }}
          className={`w-9 h-9 flex items-center justify-center transition-colors rounded-full ${
            showEmoji ? 'text-primary bg-secondary' : 'text-muted-foreground hover:text-primary'
          }`}
          aria-label="Emoji picker"
        >
          <FaFaceSmile size={20} />
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border-none rounded-2xl text-sm outline-none bg-background text-foreground font-bengali transition-all focus:ring-1 focus:ring-primary/20"
        />

        {/* Mic or Send */}
        {text.trim() ? (
          <button
            onClick={handleSend}
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
            title="Voice input (Chrome/Edge only)"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0 ${
              isListening
                ? 'bg-destructive text-white animate-pulse'
                : 'text-primary-foreground'
            } disabled:opacity-45`}
            style={!isListening ? { background: 'var(--header-gradient)' } : undefined}
          >
            {isListening ? <FaMicrophoneSlash size={16} /> : <FaMicrophone size={16} />}
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={true}
            className="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground opacity-45 flex-shrink-0"
            style={{ background: 'var(--header-gradient)' }}
          >
            <FaPaperPlane size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
