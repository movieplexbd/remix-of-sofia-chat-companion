import { useMemo, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Section } from './Stat';
import type { useAdmin, CollectionName } from '../../hooks/useAdmin';

type Admin = ReturnType<typeof useAdmin>;

/**
 * Generic editor for "key -> string[]" collections:
 * synonymMap, entities, spellCorrections (string->string treated as [string])
 */
export default function KeyListTab({
  admin, path, title, desc, valueLabel = 'Values (comma-separated)',
  singleValue = false,
}: {
  admin: Admin; path: CollectionName; title: string; desc?: string;
  valueLabel?: string; singleValue?: boolean;
}) {
  const data = (admin.all as any)[path] || {};
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [filter, setFilter] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});

  const entries = useMemo(() => {
    const arr = Object.entries(data) as [string, any][];
    if (!filter.trim()) return arr;
    const n = filter.toLowerCase();
    return arr.filter(([k, v]) => k.toLowerCase().includes(n) || JSON.stringify(v).toLowerCase().includes(n));
  }, [data, filter]);

  function toEditable(v: any): string {
    if (Array.isArray(v)) return v.join(', ');
    if (typeof v === 'string') return v;
    return JSON.stringify(v);
  }
  function fromEditable(s: string) {
    if (singleValue) return s;
    return s.split(',').map(x => x.trim()).filter(Boolean);
  }

  async function add() {
    const k = newKey.trim();
    if (!k) { toast.error('Key required'); return; }
    try {
      await admin.setNode(`${path}/${k}`, fromEditable(newVal));
      await admin.reload();
      setNewKey(''); setNewVal('');
      toast.success('Added');
    } catch (e: any) { toast.error(e?.message); }
  }

  async function saveOne(k: string) {
    const v = edits[k] ?? toEditable(data[k]);
    try {
      await admin.setNode(`${path}/${k}`, fromEditable(v));
      await admin.reload();
      setEdits(prev => { const { [k]: _, ...rest } = prev; return rest; });
      toast.success('Saved');
    } catch (e: any) { toast.error(e?.message); }
  }

  async function del(k: string) {
    if (!confirm(`Delete "${k}"?`)) return;
    try { await admin.removeNode(`${path}/${k}`); await admin.reload(); toast.success('Deleted'); }
    catch (e: any) { toast.error(e?.message); }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <Section title={`${title} (${Object.keys(data).length})`} desc={desc}>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2">
          <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="Key" className="px-3 py-2 rounded-md bg-background border border-border text-sm" />
          <input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder={valueLabel} className="px-3 py-2 rounded-md bg-background border border-border text-sm" />
          <button onClick={add} className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" />Add</button>
        </div>

        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter…" className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm" />

        <div className="max-h-[55vh] overflow-y-auto divide-y divide-border border border-border rounded-md">
          {entries.length === 0 && <div className="px-3 py-6 text-center text-sm text-muted-foreground">No entries.</div>}
          {entries.map(([k, v]) => {
            const editing = edits[k] !== undefined;
            return (
              <div key={k} className="p-2.5 flex flex-col md:flex-row md:items-center gap-2">
                <div className="font-mono text-xs font-semibold md:w-40 truncate">{k}</div>
                <input
                  value={editing ? edits[k] : toEditable(v)}
                  onChange={e => setEdits(prev => ({ ...prev, [k]: e.target.value }))}
                  className="flex-1 px-2 py-1.5 rounded bg-background border border-border text-xs font-mono"
                />
                <div className="flex gap-1">
                  {editing && <button onClick={() => saveOne(k)} className="p-1.5 rounded bg-primary text-primary-foreground"><Save className="w-3.5 h-3.5" /></button>}
                  <button onClick={() => del(k)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
