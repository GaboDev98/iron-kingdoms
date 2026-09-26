// Pure combat and progression math. Randomness is injected so results are testable.
import { ITEMS, RACES } from '../data.js';

export const CRIT_CHANCE = 0.1;
export const CRIT_MULT = 1.6;
export const DEATH_COIN_LOSS = 0.2;

/** XP needed to go from `level` to `level + 1`. */
export const xpNeed = (level) => 80 + level * 60;

/** Base defense plus equipped armor. */
export const totalDefense = (state) => state.def + (ITEMS[state.eq.armor]?.def || 0);

/** Displayed (average) player damage. */
export const baseDamage = (state) => {
  const w = ITEMS[state.eq.weapon];
  return (w.dmg + state.str * 0.6) * RACES[state.race].dmg;
};

/**
 * Damage dealt by the player. `rand` returns numbers in [0, 1).
 * Varies ±15% around baseDamage; 10% chance of a 1.6× critical hit.
 */
export function attackDamage(state, rand = Math.random) {
  let d = baseDamage(state) * (0.85 + rand() * 0.3);
  const crit = rand() < CRIT_CHANCE;
  if (crit) d *= CRIT_MULT;
  return { v: Math.round(d), crit };
}

/** Damage received after defense. Diminishing returns: def 20 halves damage. Never below 1. */
export function damageTaken(dmg, def, rand = Math.random) {
  return Math.max(1, Math.round(dmg * (1 - def / (def + 20)) * (0.85 + rand() * 0.3)));
}

/** Adds XP, applying every level-up it triggers. Mutates state. Returns levels gained. */
export function applyXp(state, n) {
  let gained = 0;
  state.xp += n;
  while (state.xp >= xpNeed(state.level)) {
    state.xp -= xpNeed(state.level);
    state.level++;
    state.maxHp += 12;
    state.str += 1;
    state.hp = state.maxHp;
    gained++;
  }
  return gained;
}

/** Coins lost on death. */
export const deathPenalty = (coins) => Math.floor(coins * DEATH_COIN_LOSS);
