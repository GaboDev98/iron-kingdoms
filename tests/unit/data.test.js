import { describe, it, expect } from 'vitest';
import { RACES, ITEMS, QUESTS, ETYPES, SHOP, migrate } from '../../src/data.js';
import { newState } from '../../src/core/state.js';

describe('content integrity', () => {
  it.each(Object.entries(RACES))('%s starts with valid gear and look', (key, r) => {
    expect(ITEMS[r.weapon]?.type).toBe('weapon');
    expect(ITEMS[r.armor]?.type).toBe('armor');
    expect(r.hp).toBeGreaterThan(0);
    expect(r.look).toBeTruthy();
    expect(newState(key).race).toBe(key);
  });
  it('sells only real, priced items', () => {
    for (const id of SHOP) { expect(ITEMS[id]).toBeTruthy(); expect(ITEMS[id].price).toBeGreaterThan(0); }
  });
  it('references only existing items and enemies in quests', () => {
    for (const q of QUESTS) {
      if (q.type === 'kill') expect(ETYPES[q.target]).toBeTruthy(); else expect(ITEMS[q.item]).toBeTruthy();
      for (const [id] of q.reward.items) expect(ITEMS[id]).toBeTruthy();
      expect(typeof q.intro(RACES.vikingos)).toBe('string');
    }
  });
  it('gives every weapon a range and every consumable a heal amount', () => {
    for (const it of Object.values(ITEMS)) {
      if (it.type === 'weapon') expect(it.range).toBeGreaterThan(0);
      if (it.type === 'use') expect(it.heal).toBeGreaterThan(0);
    }
  });
});

describe('save migration', () => {
  it('maps old peoples and items to their 950 AD equivalents', () => {
    const old = { race: 'romanos', inv: [{ id: 'francisca', q: 1 }, { id: 'gone', q: 1 }], eq: { weapon: 'gladius', armor: 'scutum' } };
    const s = migrate(old);
    expect(s.race).toBe('bizantinos');
    expect(s.inv).toEqual([{ id: 'hachamano', q: 1 }]);
    expect(s.eq).toEqual({ weapon: 'spathion', armor: 'klibanion' });
  });
  it('falls back to starting gear for unknown equipment', () => {
    const s = migrate({ race: 'vikingos', inv: [], eq: { weapon: 'laser', armor: 'x' } });
    expect(s.eq).toEqual({ weapon: 'hacha', armor: 'tunica' });
  });
  it('rejects unusable saves', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate({ race: 'marcianos' })).toBeNull();
  });
});
