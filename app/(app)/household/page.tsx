'use client';

import { useState, useEffect, FormEvent } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface HouseholdData {
  id:         string;
  name:       string;
  inviteCode: string;
  memberUids: string[];
}

export default function HouseholdPage() {
  const { user } = useAuth();

  const [household,   setHousehold]   = useState<HouseholdData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [creating,    setCreating]    = useState(false);
  const [joinCode,    setJoinCode]    = useState('');
  const [joining,     setJoining]     = useState(false);
  const [joinError,   setJoinError]   = useState('');
  const [copied,      setCopied]      = useState(false);
  const [toast,       setToast]       = useState('');

  // ── Load user's householdId from Firestore, then subscribe to household ──
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, async (snap) => {
      const householdId = snap.data()?.householdId as string | undefined;

      if (!householdId) {
        // Auto-create a household for this user
        setCreating(true);
        try {
          const token = await user.getIdToken();
          await fetch('/api/household/create', {
            method:  'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          // The onSnapshot will fire again with the new householdId
        } catch (err) {
          console.error('Failed to auto-create household', err);
          setLoading(false);
        } finally {
          setCreating(false);
        }
        return;
      }

      // Subscribe to the household document
      const hRef = doc(db, 'households', householdId);
      const hUnsub = onSnapshot(hRef, (hSnap) => {
        if (hSnap.exists()) {
          setHousehold({ id: hSnap.id, ...(hSnap.data() as Omit<HouseholdData, 'id'>) });
        }
        setLoading(false);
      });

      return hUnsub;
    });

    return unsub;
  }, [user]);

  async function handleCopy() {
    if (!household?.inviteCode) return;
    await navigator.clipboard.writeText(household.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (!household?.inviteCode) return;
    const text = `Join my SpendStack household! Code: ${household.inviteCode}`;
    if (navigator.share) {
      await navigator.share({ title: 'SpendStack Invite', text });
    } else {
      await navigator.clipboard.writeText(text);
      setToast('Invite text copied to clipboard!');
      setTimeout(() => setToast(''), 3000);
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    setJoinError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/household/join', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ code: joinCode.trim().toUpperCase() }),
      });
      const body = (await res.json()) as { error?: string; name?: string };
      if (!res.ok) {
        setJoinError(body.error ?? 'Invalid code. Try again.');
        return;
      }
      setToast(`Joined "${body.name}"!`);
      setJoinCode('');
    } catch {
      setJoinError('Something went wrong. Please try again.');
    } finally {
      setJoining(false);
    }
  }

  if (loading || creating) {
    return (
      <div className="flex flex-col gap-4 px-4 py-5">
        <div className="h-8 w-40 bg-n-200 animate-pulse rounded-lg" />
        <div className="h-48 bg-n-200 animate-pulse rounded-xl" />
        <div className="h-32 bg-n-200 animate-pulse rounded-xl" />
      </div>
    );
  }

  const code         = household?.inviteCode ?? '';
  const memberCount  = household?.memberUids.length ?? 1;

  return (
    <div className="flex flex-col gap-4 px-4 py-5 pb-6 animate-fade-in">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-[26px] font-extrabold text-navy tracking-tight">Household</h1>
        <p className="text-[13px] text-n-500 mt-1">
          {household?.name ?? 'Your household'} · {memberCount} member{memberCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <div role="alert" className="rounded-xl bg-accent/10 px-4 py-3 text-[14px] font-semibold text-accent">
          ✅ {toast}
        </div>
      )}

      {/* ── Invite code card ──────────────────────────────────────────── */}
      <Card className="bg-brand-gradient text-white border-0">
        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-white/70">
          Your invite code
        </p>
        <p
          className="text-[48px] font-black tracking-[0.25em] text-white mt-2 tabular"
          aria-label={`Invite code: ${code.split('').join(' ')}`}
        >
          {code}
        </p>
        <p className="text-[12px] text-white/70 mt-1 mb-4">
          Share this code so others can join your household
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-[14px] font-semibold text-white"
            aria-label="Copy invite code"
          >
            {copied ? '✓ Copied!' : '📋 Copy code'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-[14px] font-semibold text-white"
            aria-label="Share invite"
          >
            🔗 Share invite
          </button>
        </div>
      </Card>

      {/* ── Members count ─────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-bold text-navy">Household members</p>
            <p className="text-[13px] text-n-500 mt-0.5">
              {memberCount} member{memberCount !== 1 ? 's' : ''} in {household?.name}
            </p>
          </div>
          <div className="text-[32px]">👥</div>
        </div>
      </Card>

      {/* ── Join a different household ────────────────────────────────── */}
      <Card>
        <h3 className="text-[15px] font-bold text-navy mb-1">Join another household</h3>
        <p className="text-[13px] text-n-500 mb-3">
          Enter a 6-character code from someone else&apos;s household
        </p>
        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => {
              setJoinError('');
              setJoinCode(e.target.value.toUpperCase().slice(0, 6));
            }}
            placeholder="XXXXXX"
            maxLength={6}
            aria-label="Invite code"
            className="w-full rounded-xl border border-n-200 bg-n-100 px-4 py-3 text-[20px] font-bold text-navy tracking-[0.2em] text-center placeholder-n-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
          />
          {joinError && (
            <p role="alert" className="text-[13px] text-error font-semibold">
              ⚠️ {joinError}
            </p>
          )}
          <Button
            type="submit"
            loading={joining}
            disabled={joinCode.length < 6}
          >
            Join household
          </Button>
        </form>
      </Card>
    </div>
  );
}
