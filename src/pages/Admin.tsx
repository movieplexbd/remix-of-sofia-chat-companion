import { useState, useEffect } from 'react';
import AdminShell, { type AdminTab } from '../components/admin/AdminShell';
import AdminLogin, { isUnlocked, lock } from '../components/admin/AdminLogin';
import DashboardTab from '../components/admin/DashboardTab';
import QATab from '../components/admin/QATab';
import BulkTab from '../components/admin/BulkTab';
import KeyListTab from '../components/admin/KeyListTab';
import ConfigTab from '../components/admin/ConfigTab';
import AnalyticsTab from '../components/admin/AnalyticsTab';
import InsightsTab from '../components/admin/InsightsTab';
import PowerToolsTab from '../components/admin/PowerToolsTab';
import BackupTab from '../components/admin/BackupTab';
import AutoTrainerTab from '../components/admin/AutoTrainerTab';
import CharactersTab from '../components/admin/CharactersTab';
import SlidesTab from '../components/admin/SlidesTab';
import MindTab from '../components/admin/MindTab';
import GraphTab from '../components/admin/GraphTab';
import TestsTab from '../components/admin/TestsTab';
import OntologyTab from '../components/admin/OntologyTab';
import ConceptsTab from '../components/admin/ConceptsTab';
import FactsTab from '../components/admin/FactsTab';
import MasterTab from '../components/admin/MasterTab';
import { useAdmin } from '../hooks/useAdmin';
import { startAutoTrainer, stopAutoTrainer } from '../engine/intelligence/autoTrainer';
import { startAutoImprovement, stopAutoImprovement } from '../engine/intelligence/autonomousImprovement';
import { getSharedIntel } from '../lib/sharedIntel';
import { Toaster } from 'sonner';

export default function Admin() {
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const admin = useAdmin();

  // Boot the self-training scheduler while admin is open
  useEffect(() => {
    if (!unlocked) return;
    startAutoTrainer({
      getQA: () => admin.all.qaData || {},
      applyVariant: (key, variants) => admin.mergeIntoQA(key, variants),
    });
    startAutoImprovement(getSharedIntel());
    return () => { stopAutoTrainer(); stopAutoImprovement(); };
  }, [unlocked, admin]);

  if (!unlocked) return <AdminLogin onUnlock={() => setUnlocked(true)} />;

  return (
    <>
      <Toaster position="bottom-center" />
      <AdminShell
        active={tab}
        onSelect={setTab}
        onLogout={() => { lock(); setUnlocked(false); }}
      >
        {admin.busy && !Object.keys(admin.all.qaData || {}).length ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : tab === 'dashboard' ? <DashboardTab admin={admin} />
          : tab === 'master' ? <MasterTab admin={admin} />
          : tab === 'mind' ? <MindTab />
          : tab === 'graph' ? <GraphTab />
          : tab === 'tests' ? <TestsTab />
          : tab === 'qa' ? <QATab admin={admin} />
          : tab === 'bulk' ? <BulkTab admin={admin} />
          : tab === 'trainer' ? <AutoTrainerTab admin={admin} />
          : tab === 'power' ? <PowerToolsTab admin={admin} />
          : tab === 'backup' ? <BackupTab admin={admin} />
          : tab === 'synonyms' ? <KeyListTab admin={admin} path="synonymMap" title="Synonyms" desc="Map a canonical word to its variants. Used for query expansion." />
          : tab === 'intents' ? <KeyListTab admin={admin} path="intents" title="Intents" desc="Pattern / keyword groups that trigger specific responses." valueLabel='JSON: {"keywords":["..."],"responses":["..."]}' singleValue />
          : tab === 'entities' ? <KeyListTab admin={admin} path="entities" title="Entities" desc="Named-entity groups (people, places, products)." />
          : tab === 'config' ? <ConfigTab admin={admin} />
          : tab === 'analytics' ? <AnalyticsTab admin={admin} />
          : tab === 'insights' ? <InsightsTab admin={admin} />
          : tab === 'templates' ? <KeyListTab admin={admin} path="responseTemplates" title="Response Templates" desc="Templates for bot responses. Use {{name}}, {{answer}} etc." />
          : tab === 'spell' ? <KeyListTab admin={admin} path="spellCorrections" title="Spell Corrections" desc="Map common typos to correct words." singleValue />
          : tab === 'sentiment' ? <KeyListTab admin={admin} path="sentimentLexicon" title="Sentiment Lexicon" desc="Assign scores to words (-1 to 1)." singleValue />
          : tab === 'characters' ? <CharactersTab admin={admin} />
          : tab === 'slides' ? <SlidesTab admin={admin} />
          : tab === 'ontology' ? <OntologyTab />
          : tab === 'concepts' ? <ConceptsTab />
          : tab === 'facts' ? <FactsTab />
          : null}
      </AdminShell>
    </>
  );
}
