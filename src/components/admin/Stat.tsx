import type { ReactNode } from 'react';

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
      {icon && <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>}
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold leading-tight mt-0.5">{value}</div>
        {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
      </div>
    </div>
  );
}

export function Section({ title, desc, children, action }: { title: string; desc?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-base">{title}</h2>
          {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
