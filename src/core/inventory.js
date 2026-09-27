// Pure inventory rules. An inventory is an array of { id, q } slots.
import { ITEMS } from '../data.js';

export const INV_MAX = 20;

export const countItem = (inv, id) => inv.reduce((n, s) => n + (s.id === id ? s.q : 0), 0);

/**
 * Adds q units of an item. Stackable items share one slot; others take one slot each.
 * Mutates inv. Returns false (and adds nothing) when there is no room.
 */
export function addItem(inv, id, q = 1, max = INV_MAX) {
  const it = ITEMS[id];
  if (!it) throw new Error(`Unknown item: ${id}`);
  if (it.stack) {
    const slot = inv.find((s) => s.id === id);
    if (slot) { slot.q += q; return true; }
    if (inv.length >= max) return false;
    inv.push({ id, q });
    return true;
  }
  if (inv.length + q > max) return false;
  for (let i = 0; i < q; i++) inv.push({ id, q: 1 });
  return true;
}

/** Removes up to q units, newest slots first. Mutates inv. Returns how many were removed. */
export function removeItem(inv, id, q = 1) {
  let left = q;
  for (let i = inv.length - 1; i >= 0 && left > 0; i--) {
    const s = inv[i];
    if (s.id !== id) continue;
    const k = Math.min(left, s.q);
    s.q -= k; left -= k;
    if (s.q <= 0) inv.splice(i, 1);
  }
  return q - left;
}

/** Swaps inventory slot i into the matching equipment slot. Returns the item that was equipped, or null. */
export function equipFromSlot(state, i) {
  const s = state.inv[i];
  if (!s) return null;
  const it = ITEMS[s.id];
  const slot = it.type === 'weapon' ? 'weapon' : it.type === 'armor' ? 'armor' : null;
  if (!slot) return null;
  const old = state.eq[slot];
  state.inv.splice(i, 1);
  state.eq[slot] = s.id;
  if (old) state.inv.push({ id: old, q: 1 });
  return s.id;
}
