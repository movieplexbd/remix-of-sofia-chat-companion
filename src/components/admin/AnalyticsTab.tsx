import { useMemo } from 'react';
import { Section, Stat } from './Stat';
import { BarChart3, Activity, Zap } from 'lucide-react';
import type { useAdmin } from '../../hooks/useAdmin';

type Admin = ReturnType<typeof useAdmin>;

/**
 * Analytics — reads in-browser intelligence layer state (top queries, clicked
 * results, engine weights). Falls back to dataset-derived metrics if intel
 * has no session data yet.
 */
export default function AnalyticsTab({ admin }: { admin: Admin }) {
  const diag = useMemo(() => {
    try {
      const raw = localStorage.getItem('sofia-feedback-v1');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);
  const weightsRaw = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('sofia-engine-weights-v1') || 'null'); }
    catch { return null; }
  }, []);

  const topQueries: { q: string; n: number }[] = diag?.queries
    ? Object.entries(diag.queries).map(([q, n]: any) => ({ q, n: Number(n) })).sort((a, b) => b.n - a.n).slice(0, 15)
    : [];
  const topClicks: { key: string; n: number }[] = diag?.clicked
    ? Object.entries(diag.clicked).map(([key, n]: any) => ({ key, n: Number(n) })).sort((a, b) => b.n - a.n).slice(0, 15)
    : [];

  const qaCount = Object.keys(admin.all.qaData || {}).length;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<BarChart3 className="w-4 h-4" />} label="Tracked queries" value={topQueries.length} />
        <Stat icon={<Activity className="w-4 h-4" />} label="Clicked results" value={topClicks.length} />
        <Stat icon={<Zap className="w-4 h-4" />} label="Adaptive weights" value={weightsRaw ? Object.keys(weightsRaw).length : 0} />
        <Stat label="Dataset size" value={qaCount} />
      </div>

      <Section title="Top user queries" desc="From this browser's session memory (intelligence layer).">
        {topQueries.length === 0 ? <Empty /> : (
          <ul className="divide-y divide-border max-h-80 overflow-y-auto">
            {topQueries.map(({ q, n }) => (
              <li key={q} className="py-1.5 flex justify-between text-sm">
                <span className="truncate">{q}</span>
                <span className="text-muted-foreground font-mono text-xs">{n}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Adaptive engine weights" desc="Live weights learned from user clicks / ignores.">
        {!weightsRaw ? <Empty /> : (
          <div className="space-y-2">
            {Object.entries(weightsRaw).map(([k, v]: any) => (
              <div key={k}>
                <div className="flex justify-between text-xs mb-1"><span className="font-mono">{k}</span><span>{Number(v).toFixed(2)}</span></div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, Number(v) * 40)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Most clicked answers" desc="Result keys that users select most often.">
        {topClicks.length === 0 ? <Empty /> : (
          <ul className="divide-y divide-border max-h-80 overflow-y-auto">
            {topClicks.map(({ key, n }) => {
              const row = (admin.all.qaData || {})[key];
              const q = row?.questions?.[0] || row?.question || key;
              return (
                <li key={key} className="py-1.5 flex justify-between text-sm gap-3">
                  <span className="truncate">{q}</span>
                  <span className="text-muted-foreground font-mono text-xs">{n}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Empty() { return <div className="text-sm text-muted-foreground">No data yet. Chat with Sofia to generate analytics.</div>; }
