'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import type { CoachMessage as CoachMessageType } from '@/types';
import { FLAGS } from '@/lib/config/featureFlags';

const SUGGESTIONS = [
  'How am I doing this month?',
  'Tips to earn more points',
  'How do I reach Gold tier?',
  'Best categories for points',
];

export default function CoachPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CoachMessageType[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your SpendStack coach powered by Claude 👋\n\nAsk me anything about your spending habits, saving goals, or how to earn more points faster.",
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Feature flag guard ──────────────────────────────────────────────────
  // Hooks are above — this early return is after all hook calls.
  // Set FLAGS.AI_COACH = false in lib/config/featureFlags.ts to hide.
  if (!FLAGS.AI_COACH) {
    return (
      <div className="flex flex-col gap-4 px-4 py-5 pb-6 animate-fade-in">
        <div>
          <h1 className="text-[26px] font-extrabold text-navy tracking-tight">AI Coach</h1>
          <p className="text-[13px] text-n-500 mt-1">Your personal spending coach</p>
        </div>
        <div className="rounded-2xl border border-n-200 bg-white p-8 text-center">
          <p className="text-[40px]" aria-hidden="true">🔒</p>
          <p className="text-[17px] font-extrabold text-navy mt-3">Coming Soon</p>
          <p className="text-[13px] text-n-500 mt-2 max-w-[240px] mx-auto">
            Your AI spending coach is on its way.
          </p>
        </div>
      </div>
    );
  }

  async function sendMessage(text: string) {
    if (!text.trim() || streaming || !user) return;

    const userMsg: CoachMessageType = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: acc };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 116px)' }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-3 shrink-0">
        <h1 className="text-[26px] font-extrabold text-navy tracking-tight">AI Coach</h1>
        <p className="text-[13px] text-n-500 mt-0.5">Your personal spending coach</p>
      </div>

      {/* ── Messages ────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3"
        aria-live="polite"
        aria-label="Conversation"
      >
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          const isStreaming = streaming && i === messages.length - 1 && !isUser;
          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-bold shrink-0 mr-2 mt-1">
                  S
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-white text-navy shadow-card rounded-tl-sm'
                }`}
              >
                {msg.content}
                {isStreaming && msg.content === '' && (
                  <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggestion chips (only at start) ────────────────────────── */}
      {messages.length === 1 && !streaming && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto shrink-0">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="shrink-0 px-3 py-1.5 rounded-full border border-n-200 text-[13px] font-medium text-navy bg-white hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ───────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 px-4 py-3 border-t border-n-200 bg-white/90 backdrop-blur-sm shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
          placeholder="Ask your coach…"
          aria-label="Message"
          className="flex-1 rounded-xl border border-n-200 bg-n-100 px-4 py-2.5 text-[14px] text-navy placeholder-n-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          aria-label="Send"
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold disabled:opacity-40 transition-opacity"
        >
          {streaming ? '…' : 'Send'}
        </button>
      </form>

      {/* Regulatory disclaimer */}
      <p className="px-4 pb-2 text-[10px] text-n-500 text-center shrink-0">
        Not regulated financial advice · For guidance only
      </p>
    </div>
  );
}
