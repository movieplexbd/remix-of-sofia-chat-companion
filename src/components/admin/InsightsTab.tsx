import { useMemo } from 'react';
import { AlertTriangle, TrendingDown, Sparkles, ThumbsDown } from 'lucide-react';
import { Section, Stat } from './Stat';
import type { useAdmin } from '../../hooks/useAdmin';

type Admin = ReturnType<typeof useAdmin>;

/**
 * Insights — surfaces what to improve next:
 *  - QA items with the worst feedback ratio
 *  - QA with only one question variant (low recall risk)
 *  - Very short answers (likely incomplete)
 *  - Duplicate questions across items
 *  - Uncategorized items
 */
export default function InsightsTab({ admin }: { admin: Admin }) {
  const insights = useMemo(() => {
    const qa = Object.entries(admin.all.qaData || {}).map(([k, v]: any) => ({
      key: k,
      questions: Array.isArray(v.questions) ? v.questions : [v.question || ''],
      answer: v.answer || '',
      category: v.category || 'general',
      pos: v?.feedback?.positive || 0,
      neg: v?.feedback?.negative || 0,
    }));

    const worst = qa
      .filter(x => x.neg > 0)
      .map(x => ({ ...x, ratio: x.neg / (x.pos + x.neg) }))
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 20);

    const lowRecall = qa.filter(x => x.questions.length < 2).slice(0, 20);
    const shortAns = qa.filter(x => x.answer.trim().length < 25).slice(0, 20);
    const uncategorized = qa.filter(x => !x.category || x.category === 'general').slice(0, 20);

    const qSeen = new Map<string, string[]>();
    for (const it of qa) {
      for (const q of it.questions) {
        const norm = q.trim().toLowerCase();
        if (!norm) continue;
        const arr = qSeen.get(norm) || [];
        arr.push(it.key); qSeen.set(norm, arr);
      }
    }
    const dupes = Array.from(qSeen.entries()).filter(([, keys]) => keys.length > 1).slice(0, 20);

    return { worst, lowRecall, shortAns, uncategorized, dupes, total: qa.length };
  }, [admin.all.qaData]);

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<ThumbsDown className="w-4 h-4" />} label="Poorly rated" value={insights.worst.length} />
        <Stat icon={<TrendingDown className="w-4 h-4" />} label="Single-variant" value={insights.lowRecall.length} hint="Add more phrasings" />
        <Stat icon={<AlertTriangle className="w-4 h-4" />} label="Short answers" value={insights.shortAns.length} hint="<25 chars" />
        <Stat icon={<Sparkles className="w-4 h-4" />} label="Duplicates" value={insights.dupes.length} />
      </div>

      <Section title="Worst-rated answers" desc="Highest negative-feedback ratio. Rewrite these first.">
        <ItemList items={insights.worst.map(x => ({
          title: x.questions[0],
          subtitle: `${Math.round(x.ratio * 100)}% negative · 👍 ${x.pos} · 👎 ${x.neg}`,
          body: x.answer,
        }))} />
      </Section>

      <Section title="Only one phrasing" desc="Add variants so the engine matches more user inputs.">
        <ItemList items={insights.lowRecall.map(x => ({ title: x.questions[0], subtitle: x.category, body: x.answer }))} />
      </Section>

      <Section title="Very short answers" desc="Possibly incomplete — expand with detail or examples.">
        <ItemList items={insights.shortAns.map(x => ({ title: x.questions[0], subtitle: `${x.answer.length} chars`, body: x.answer }))} />
      </Section>

      <Section title="Uncategorized" desc="Tag these to improve ranking and analytics.">
        <ItemList items={insights.uncategorized.map(x => ({ title: x.questions[0], subtitle: x.category, body: x.answer }))} />
      </Section>

      <Section title="Duplicate questions" desc="Same question across multiple entries — merge or distinguish.">
        {insights.dupes.length === 0 ? <Empty /> : (
          <ul className="space-y-1.5 text-sm">
            {insights.dupes.map(([q, keys]) => (
              <li key={q} className="p-2 rounded bg-muted/40">
                <div className="font-medium truncate">{q}</div>
                <div className="text-[11px] text-muted-foreground">in {keys.length} entries</div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Empty() { return <div className="text-sm text-muted-foreground">All clear here.</div>; }

function ItemList({ items }: { items: { title: string; subtitle: string; body: string }[] }) {
  if (items.length === 0) return <Empty />;
  return (
    <ul className="divide-y divide-border max-h-80 overflow-y-auto -mx-4 md:-mx-5">
      {items.map((it, i) => (
        <li key={i} className="px-4 md:px-5 py-2">
          <div className="text-sm font-medium truncate">{it.title}</div>
          <div className="text-[11px] text-muted-foreground">{it.subtitle}</div>
          <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{it.body}</div>
        </li>
      ))}
    </ul>
  );
}
