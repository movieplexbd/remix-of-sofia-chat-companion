/**
 * Shared IntelligenceAPI singleton for admin tools.
 * Engines persist to localStorage, so admin diagnostics see the same state
 * as the chat session.
 */
import { createIntelligence, type IntelligenceAPI } from '../engine/intelligence';

let _intel: IntelligenceAPI | null = null;

export function getSharedIntel(): IntelligenceAPI {
  if (!_intel) _intel = createIntelligence({});
  return _intel;
}
