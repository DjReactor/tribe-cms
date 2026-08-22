'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error('Invalid credentials');

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div
      className={cn(
        geistSans.variable,
        'tribe-dashboard font-sans antialiased',
        'flex min-h-screen items-center justify-center bg-muted/50 p-4 text-foreground'
      )}
    >
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-xs"
      >
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground">
            T
          </span>
          <div className="space-y-1">
            <h1 className="text-lg font-medium leading-none tracking-tight">Sign in to Tribe CMS</h1>
            <p className="text-sm text-muted-foreground">Business Portal</p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium leading-none">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium leading-none">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-all outline-none hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
