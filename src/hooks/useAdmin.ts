/**
 * useAdmin — Master control hook for Firebase Realtime DB.
 * Full CRUD on qaData, synonymMap, intents, entities, contextRules,
 * spellCorrections, sentimentLexicon, responseTemplates, botConfig.
 */
import { useCallback, useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, set, update, remove, push } from 'firebase/database';
import { firebaseConfig } from '../constants/firebaseConfig';

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(app);

export type CollectionName =
  | 'qaData' | 'synonymMap' | 'intents' | 'contextRules'
  | 'entities' | 'responseTemplates' | 'sentimentLexicon'
  | 'botConfig' | 'spellCorrections';

export interface QARecord {
  questions: string[];
  answer: string;
  category?: string;
  tags?: string[];
  feedback?: { positive: number; negative: number };
}

export function useAdmin() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [all, setAll] = useState<Record<CollectionName, any>>({
    qaData: {}, synonymMap: {}, intents: {}, contextRules: {},
    entities: {}, responseTemplates: {}, sentimentLexicon: {},
    botConfig: {}, spellCorrections: {},
  } as any);

  const reload = useCallback(async () => {
    setBusy(true); setError(null);
    try {
      const paths: CollectionName[] = ['qaData','synonymMap','intents','contextRules','entities','responseTemplates','sentimentLexicon','botConfig','spellCorrections'];
      const snaps = await Promise.all(paths.map(p => get(ref(db, p))));
      const next: any = {};
      paths.forEach((p, i) => { next[p] = snaps[i].exists() ? snaps[i].val() || {} : {}; });
      setAll(next);
    } catch (e: any) { setError(e?.message || 'load failed'); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // ---- QA CRUD ----
  const addQA = useCallback(async (qa: QARecord) => {
    const key = push(ref(db, 'qaData')).key!;
    await set(ref(db, `qaData/${key}`), {
      ...qa,
      feedback: qa.feedback || { positive: 0, negative: 0 },
    });
    return key;
  }, []);

  const updateQA = useCallback(async (key: string, patch: Partial<QARecord>) => {
    await update(ref(db, `qaData/${key}`), patch);
  }, []);

  const deleteQA = useCallback(async (key: string) => {
    await remove(ref(db, `qaData/${key}`));
  }, []);

  const bulkAddQA = useCallback(async (items: QARecord[], onProgress?: (n: number, total: number) => void) => {
    let ok = 0;
    for (let i = 0; i < items.length; i++) {
      try { await addQA(items[i]); ok++; } catch (e) { console.error(e); }
      onProgress?.(i + 1, items.length);
    }
    return ok;
  }, [addQA]);

  // ---- Generic key/value CRUD for synonyms/intents/etc. ----
  const setNode = useCallback(async (path: string, value: any) => {
    await set(ref(db, path), value);
  }, []);
  const removeNode = useCallback(async (path: string) => {
    await remove(ref(db, path));
  }, []);
  const updateNode = useCallback(async (path: string, patch: any) => {
    await update(ref(db, path), patch);
  }, []);

  const exportAll = useCallback(async () => {
    await reload();
    return all;
  }, [reload, all]);

  return {
    db, busy, error, all, reload,
    addQA, updateQA, deleteQA, bulkAddQA,
    setNode, removeNode, updateNode, exportAll,
  };
}
