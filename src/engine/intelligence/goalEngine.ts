/**
 * Phase 29 — Goal & Intent Engine
 * Extracts a goal tree from user input using verb/pattern heuristics.
 */
export interface GoalTree {
  goal: string;
  intent: string;
  subGoals: string[];
  objectives: string[];
}

const GOAL_PATTERNS = [
  /\b(?:i\s+want\s+to|i'd\s+like\s+to|i\s+plan\s+to|i\s+need\s+to)\s+(.+)/i,
  /\b(?:start|launch|build|create|make|open|grow)\s+(?:a|an|my)?\s*(.+)/i,
  /আমি\s+(.+?)\s+(?:করতে চাই|করব|করতে|শুরু)/,
  /(.+?)\s+(?:শুরু করতে চাই|করতে চাই|বানাতে চাই|তৈরি করতে চাই)/,
];

const SUBGOAL_TEMPLATES: Record<string, string[]> = {
  brand:    ['Product line', 'Supplier sourcing', 'Branding/logo', 'Website', 'Marketing plan', 'Launch'],
  business: ['Market research', 'Capital', 'Registration', 'Operations', 'Marketing'],
  app:      ['Wireframe', 'Tech stack', 'MVP build', 'Test', 'Launch'],
  website:  ['Domain', 'Design', 'Content', 'Build', 'SEO'],
  shop:     ['Location', 'Inventory', 'Staff', 'Marketing'],
  course:   ['Curriculum', 'Recording', 'Platform', 'Promotion'],
};

export function extractGoal(text: string): string {
  for (const p of GOAL_PATTERNS) {
    const m = text.match(p);
    if (m && m[1]) return m[1].trim().replace(/[।.!?]+$/, '');
  }
  return '';
}

export function identifyIntent(text: string): string {
  const t = text.toLowerCase();
  if (/\b(how|কিভাবে|কেমন করে)\b/.test(t)) return 'tutorial';
  if (/\b(why|কেন)\b/.test(t)) return 'explanation';
  if (/\b(best|recommend|suggest|উপদেশ|সাজেস্ট|ভালো)\b/.test(t)) return 'recommendation';
  if (/\b(plan|roadmap|পরিকল্পনা|রোডম্যাপ)\b/.test(t)) return 'plan';
  if (/\b(want|need|শুরু|বানাতে|তৈরি|launch|start)\b/.test(t)) return 'goal';
  return 'general';
}

function inferDomain(goal: string): string {
  const g = goal.toLowerCase();
  if (/brand|ব্র্যান্ড|clothing|পোশাক/.test(g)) return 'brand';
  if (/app|অ্যাপ|application/.test(g)) return 'app';
  if (/website|ওয়েবসাইট|site/.test(g)) return 'website';
  if (/shop|দোকান|store/.test(g)) return 'shop';
  if (/course|কোর্স|train/.test(g)) return 'course';
  if (/business|ব্যবসা/.test(g)) return 'business';
  return 'business';
}

export function createGoalTree(text: string): GoalTree {
  const goal = extractGoal(text);
  const intent = identifyIntent(text);
  if (!goal) return { goal: '', intent, subGoals: [], objectives: [] };
  const domain = inferDomain(goal);
  const subGoals = SUBGOAL_TEMPLATES[domain] || ['Research', 'Plan', 'Execute', 'Review'];
  return { goal, intent, subGoals, objectives: generateObjectives(subGoals) };
}

export function generateObjectives(subGoals: string[]): string[] {
  return subGoals.map((s, i) => `${i + 1}. ${s}`);
}
