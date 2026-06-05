/**
 * Phase 30 — Autonomous Planner
 * Converts a GoalTree into a prioritized, dependency-aware roadmap.
 */
import type { GoalTree } from './goalEngine';

export interface PlanTask {
  id: string;
  title: string;
  depends: string[];
  priority: number;  // 1 (highest) – 5
  phase: number;
}

export interface Plan {
  goal: string;
  tasks: PlanTask[];
  roadmap: string[][];   // grouped by phase
}

export function createPlan(tree: GoalTree): Plan {
  if (!tree.goal) return { goal: '', tasks: [], roadmap: [] };
  const tasks: PlanTask[] = tree.subGoals.map((title, idx) => ({
    id: `t${idx + 1}`,
    title,
    depends: idx === 0 ? [] : [`t${idx}`],
    priority: Math.min(5, 1 + Math.floor(idx / 2)),
    phase: Math.floor(idx / 2) + 1,
  }));
  return { goal: tree.goal, tasks, roadmap: buildRoadmap(tasks) };
}

export function buildRoadmap(tasks: PlanTask[]): string[][] {
  const phases: Record<number, string[]> = {};
  for (const t of tasks) {
    (phases[t.phase] ||= []).push(t.title);
  }
  return Object.keys(phases).sort((a, b) => +a - +b).map(k => phases[+k]);
}

export function analyzeDependencies(tasks: PlanTask[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const t of tasks) map[t.id] = t.depends;
  return map;
}

export function prioritizeTasks(tasks: PlanTask[]): PlanTask[] {
  return [...tasks].sort((a, b) => a.priority - b.priority || a.phase - b.phase);
}
