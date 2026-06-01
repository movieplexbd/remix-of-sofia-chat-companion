import { useMemo } from 'react';
import { Database, BookA, Brain, Tag, MessageSquarePlus, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { Stat, Section } from './Stat';
import type { useAdmin } from '../../hooks/useAdmin';

type Admin = ReturnType<typeof useAdmin>;

export default function DashboardTab({ admin }: { admin: Admin }) {
  const counts = useMemo(() => {
    const qa = Object.values(admin.all.qaData || {}) as any[];
    let pos = 0, neg = 0;
    const byCat = new Map<string, number>();
    for (const q of qa) {
      pos += q?.feedback?.positive || 0;
      neg += q?.feedback?.negative || 0;
      const c = q?.category || 'general';
      byCat.set(c, (byCat.get(c) || 0) + 1);
    }
    return {
      qa: qa.length,
      synonyms: Object.keys(admin.all.synonymMap || {}).length,
      intents: Object.keys(admin.all.intents || {}).length,
      entities: Object.keys(admin.all.entities || {}).length,
      spell: Object.keys(admin.all.spellCorrections || {}).length,
      templates: Object.keys(admin.all.responseTemplates || {}).length,
      pos, neg,
      categories: Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [admin.all]);

  const total = counts.pos + counts.neg;
  const satisfaction = total ? Math.round((counts.pos / total) * 100) : 0;

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<MessageSquarePlus className="w-4 h-4" />} label="QA Pairs" value={counts.qa} />
        <Stat icon={<BookA className="w-4 h-4" />} label="Synonyms" value={counts.synonyms} />
        <Stat icon={<Brain className="w-4 h-4" />} label="Intents" value={counts.intents} />
        <Stat icon={<Tag className="w-4 h-4" />} label="Entities" value={counts.entities} />
        <Stat icon={<ThumbsUp className="w-4 h-4" />} label="Positive" value={counts.pos} />
        <Stat icon={<ThumbsDown className="w-4 h-4" />} label="Negative" value={counts.neg} />
        <Stat icon={<Sparkles className="w-4 h-4" />} label="Satisfaction" value={`${satisfaction}%`} hint={`${total} votes`} />
        <Stat icon={<Database className="w-4 h-4" />} label="Spell Fixes" value={counts.spell} />
      </div>

      <Section title="Categories" desc="QA distribution by category">
        {counts.categories.length === 0 ? (
          <div className="text-sm text-muted-foreground">No data yet.</div>
        ) : (
          <div className="space-y-2">
            {counts.categories.slice(0, 12).map(([cat, n]) => {
              const pct = Math.round((n / counts.qa) * 100);
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{cat}</span>
                    <span className="text-muted-foreground">{n} · {pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
