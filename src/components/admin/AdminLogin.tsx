import { useState } from 'react';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

const KEY = 'sofia-admin-pass';
const DEFAULT_PASS = 'sofia-admin';

export default function AdminLogin({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState('');
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const saved = localStorage.getItem(KEY) || DEFAULT_PASS;
    if (pw === saved) {
      sessionStorage.setItem('sofia-admin-ok', '1');
      onUnlock();
    } else {
      toast.error('Wrong password');
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <form onSubmit={submit} className="bg-card border border-border rounded-xl p-6 w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center text-center gap-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Lock className="w-5 h-5" /></div>
          <h1 className="font-semibold">Sofia Admin</h1>
          <p className="text-xs text-muted-foreground">Master control access</p>
        </div>
        <input
          type="password" autoFocus value={pw} onChange={e => setPw(e.target.value)}
          placeholder="Password"
          className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm"
        />
        <button type="submit" className="w-full px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">Unlock</button>
        <p className="text-[10px] text-center text-muted-foreground">Default: <code className="font-mono">{DEFAULT_PASS}</code> — change via Config tab later.</p>
      </form>
    </div>
  );
}

export function isUnlocked() { return sessionStorage.getItem('sofia-admin-ok') === '1'; }
export function lock() { sessionStorage.removeItem('sofia-admin-ok'); }
