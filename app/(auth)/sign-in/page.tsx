'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-primary">SpendStack</h1>
        <p className="mt-1 text-sm text-n-500">Gamified rewards for your household</p>
      </div>

      <div className="rounded-2xl border border-n-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex rounded-lg bg-n-100 p-1">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
                mode === m ? 'bg-white text-navy shadow-sm' : 'text-n-500'
              )}
            >
              {m === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-navy mb-1">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-n-200 bg-white px-3 py-2 text-sm text-navy placeholder-n-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Jane Smith"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-navy mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-n-200 bg-white px-3 py-2 text-sm text-navy placeholder-n-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-navy mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-n-200 bg-white px-3 py-2 text-sm text-navy placeholder-n-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
