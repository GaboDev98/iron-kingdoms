// Save-game shape. Bump SAVE_VERSION and extend migrate() in data.js when this changes.
import { RACES } from '../data.js';

export const SAVE_VERSION = 1;
export const SPAWN = { x: 2, z: 10 };

export function newState(race, now = Date.now()) {
  const r = RACES[race];
  if (!r) throw new Error(`Unknown people: ${race}`);
  return {
    v: SAVE_VERSION, race, hp: r.hp, maxHp: r.hp, str: r.str, def: r.def, level: 1, xp: 0, coins: 15,
    inv: [{ id: 'pocion', q: 2 }, { id: 'pan', q: 3 }],
    eq: { weapon: r.weapon, armor: r.armor },
    quest: { idx: 0, status: 'available', progress: 0 },
    pos: { ...SPAWN }, bossLoot: false, t: now,
  };
}
