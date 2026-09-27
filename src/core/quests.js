// Pure quest state machine: available -> active -> ready -> (next quest) available.
import { QUESTS } from '../data.js';
import { countItem, removeItem, addItem } from './inventory.js';

export const currentQuest = (state) => QUESTS[state.quest.idx] || null;

/** Re-evaluates progress for collect/item quests. Mutates state. Returns true if it just became ready. */
export function evaluateQuest(state) {
  const q = currentQuest(state), s = state.quest;
  if (!q || (s.status !== 'active' && s.status !== 'ready')) return false;
  if (q.type !== 'kill') s.progress = countItem(state.inv, q.item);
  const was = s.status;
  s.status = s.progress >= q.goal ? 'ready' : 'active';
  return was === 'active' && s.status === 'ready';
}

/** Counts a kill toward an active kill quest. Returns true if it counted. */
export function recordKill(state, enemyType) {
  const q = currentQuest(state);
  if (!q || state.quest.status !== 'active' || q.type !== 'kill' || q.target !== enemyType) return false;
  state.quest.progress++;
  return true;
}

export function acceptQuest(state) {
  if (!currentQuest(state) || state.quest.status !== 'available') return false;
  state.quest.status = 'active';
  state.quest.progress = 0;
  evaluateQuest(state);
  return true;
}

/**
 * Hands in a ready quest: consumes quest items, grants coins and items, advances to the next quest.
 * XP is returned (not applied) so the caller can show level-up feedback. Returns null if not ready.
 */
export function completeQuest(state) {
  const q = currentQuest(state);
  if (!q || state.quest.status !== 'ready') return null;
  if (q.type !== 'kill') removeItem(state.inv, q.item, q.goal);
  state.coins += q.reward.coins;
  q.reward.items.forEach(([id, n]) => addItem(state.inv, id, n));
  state.quest = { idx: state.quest.idx + 1, status: 'available', progress: 0 };
  return { quest: q, xp: q.reward.xp };
}
