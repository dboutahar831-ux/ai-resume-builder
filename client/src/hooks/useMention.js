import { useState, useRef, useCallback } from 'react';
import api from '../api/axios';

export function useMention() {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);
  const [mentionIds, setMentionIds] = useState([]);
  const inputRef = useRef();
  const timerRef = useRef();

  const onType = useCallback((value, cursorPos) => {
    const text = value.slice(0, cursorPos);
    const match = text.match(/@(\w*)$/);
    if (match) {
      setMentionStart(cursorPos - match[0].length);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          const res = await api.get(`/friends/mention?q=${encodeURIComponent(match[1])}`);
          setSuggestions(res.data);
          setShowSuggestions(res.data.length > 0);
        } catch { setShowSuggestions(false); }
      }, 200);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, []);

  const pickMention = useCallback((user, value, onChange) => {
    const input = inputRef.current;
    const cursor = input?.selectionStart ?? value.length;
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursor);
    // Store as @[name](id) so renderer can link to the profile
    const token = `@[${user.name}](${user.id})`;
    const newValue = `${before}${token} ${after}`;
    onChange(newValue);
    setMentionIds(prev => prev.includes(user.id) ? prev : [...prev, user.id]);
    setShowSuggestions(false);
    setSuggestions([]);
    setTimeout(() => {
      if (!input) return;
      const pos = mentionStart + token.length + 1;
      input.focus();
      input.setSelectionRange(pos, pos);
    }, 0);
  }, [mentionStart]);

  const reset = useCallback(() => {
    setMentionIds([]);
    setShowSuggestions(false);
    setSuggestions([]);
  }, []);

  return { inputRef, suggestions, showSuggestions, setShowSuggestions, mentionIds, reset, onType, pickMention };
}
