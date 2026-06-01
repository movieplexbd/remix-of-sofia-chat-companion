import { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Section } from './Stat';
import type { useAdmin, QARecord } from '../../hooks/useAdmin';

type Admin = ReturnType<typeof useAdmin>;

interface Row extends QARecord { key: string; }

const EMPTY: QARecord = { questions: [''], answer: '', category: 'general', tags: [] };

export default function QATab({ admin }: { admin: Admin }) {
  const [q, setQ] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<QARecord>(EMPTY);
  const [showForm, setShowForm] = useState(false);

  const rows: Row[] = useMemo(() => {
    return Object.entries(admin.all.qaData || {}).map(([key, v]: any) => ({
      key,
      questions: Array.isArray(v.questions) ? v.questions : [v.question || ''],
      answer: v.answer || '',
      category: v.category || 'general',
      tags: v.tags || [],
      feedback: v.feedback || { positive: 0, negative: 0 },
    }));
  }, [admin.all.qaData]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter(r =>
      r.questions.some(qq => qq.toLowerCase().includes(needle)) ||
      r.answer.toLowerCase().includes(needle) ||
      r.category?.toLowerCase().includes(needle)
    );
  }, [rows, q]);

  function startNew() { setDraft(EMPTY); setEditingKey(null); setShowForm(true); }
  function startEdit(r: Row) {
    setDraft({ questions: r.questions, answer: r.answer, category: r.category, tags: r.tags });
    setEditingKey(r.key); setShowForm(true);
  }
  function cancel() { setShowForm(false); setEditingKey(null); setDraft(EMPTY); }

  async function save() {
    const qs = draft.questions.map(s => s.trim()).filter(Boolean);
    if (!qs.length || !draft.answer.trim()) { toast.error('Question and answer required'); return; }
    try {
      if (editingKey) {
        await admin.updateQA(editingKey, { ...draft, questions: qs });
        toast.success('Updated');
      } else {
        await admin.addQA({ ...draft, questions: qs });
        toast.success('Added');
      }
      await admin.reload();
      cancel();
    } catch (e: any) { toast.error(e?.message || 'Save failed'); }
  }

  async function del(key: string) {
    if (!confirm('Delete this QA?')) return;
    try { await admin.deleteQA(key); await admin.reload(); toast.success('Deleted'); }
    catch (e: any) { toast.error(e?.message || 'Delete failed'); }
  }

  return (
    <div className="space-y-4 max-w-6xl">
      <Section
        title={`QA Pairs (${rows.length})`}
        desc="Search, edit, or add Q&A entries one at a time."
        action={
          <button onClick={startNew} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-1.5 hover:opacity-90">
            <Plus className="w-4 h-4" /> Add
          </button>
        }
      >
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search questions, answers, categories..."
            className="w-full pl-9 pr-3 py-2 rounded-md bg-background border border-border text-sm"
          />
        </div>

        <div className="divide-y divide-border max-h-[55vh] overflow-y-auto -mx-4 md:-mx-5">
          {filtered.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">No entries.</div>}
          {filtered.map(r => (
            <div key={r.key} className="px-4 md:px-5 py-3 hover:bg-muted/40">
              <div className="flex justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{r.questions[0]}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.answer}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">{r.category}</span>
                    {r.questions.length > 1 && <span className="text-muted-foreground">+{r.questions.length - 1} variants</span>}
                    <span className="text-emerald-500">👍 {r.feedback?.positive || 0}</span>
                    <span className="text-rose-500">👎 {r.feedback?.negative || 0}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(r)} className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(r.key)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold">{editingKey ? 'Edit QA' : 'Add new QA'}</h3>
              <button onClick={cancel} className="p-1 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1.5">Questions (one per line)</label>
                <textarea
                  value={draft.questions.join('\n')}
                  onChange={e => setDraft({ ...draft, questions: e.target.value.split('\n') })}
                  rows={4}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm font-mono"
                  placeholder="Tumi ke?&#10;তুমি কে?&#10;Who are you?"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Add multiple variants to improve matching.</p>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5">Answer (Markdown supported)</label>
                <textarea
                  value={draft.answer}
                  onChange={e => setDraft({ ...draft, answer: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1.5">Category</label>
                  <input
                    value={draft.category || ''} onChange={e => setDraft({ ...draft, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5">Tags (comma)</label>
                  <input
                    value={(draft.tags || []).join(', ')}
                    onChange={e => setDraft({ ...draft, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button onClick={cancel} className="px-3 py-1.5 rounded-md bg-muted text-sm">Cancel</button>
              <button onClick={save} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-1.5">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
