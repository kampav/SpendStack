'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { PageHeader } from '@/components/shared/PageHeader';
import { CoachMessage } from '@/components/coach/CoachMessage';
import type { CoachMessage as CoachMessageType } from '@/types';

export default function CoachPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CoachMessageType[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your SpendStack coach 👋 Ask me anything about your spending, saving goals, or how to earn more points.",
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming || !user) return;

    const userMsg: CoachMessageType = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    // Add placeholder assistant message
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

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
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: accumulated };
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

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <PageHeader title="AI Coach" subtitle="Your personal spending coach" className="mb-4" />

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-4" aria-live="polite" aria-label="Conversation">
        {messages.map((msg, i) => (
          <CoachMessage key={i} message={msg} />
        ))}
        {streaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm bg-n-100 px-4 py-2.5 text-sm text-n-500">
              <span className="animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 border-t border-n-200 pt-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
          placeholder="Ask your coach…"
          aria-label="Message input"
          className="flex-1 rounded-xl border border-n-200 bg-white px-3 py-2.5 text-sm text-navy placeholder-n-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          aria-label="Send"
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
