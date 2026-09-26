import { describe, it, expect } from 'vitest';
import { xpNeed, totalDefense, baseDamage, attackDamage, damageTaken, applyXp, deathPenalty, CRIT_MULT } from '../../src/core/combat.js';
import { newState } from '../../src/core/state.js';

const fixed = (...values) => { let i = 0; return () => values[i++ % values.length]; };

describe('progression', () => {
  it('needs more XP each level', () => expect(xpNeed(2)).toBeGreaterThan(xpNeed(1)));
  it('applies several level-ups at once and heals fully', () => {
    const s = newState('anglosajones');
    s.hp = 1;
    const gained = applyXp(s, xpNeed(1) + xpNeed(2) + 5);
    expect(gained).toBe(2);
    expect(s.level).toBe(3);
    expect(s.xp).toBe(5);
    expect(s.hp).toBe(s.maxHp);
  });
  it('does nothing below the threshold', () => {
    const s = newState('anglosajones');
    expect(applyXp(s, 1)).toBe(0);
  });
});

describe('damage', () => {
  it('adds armor to base defense', () => {
    const s = newState('bizantinos');
    expect(totalDefense(s)).toBe(s.def + 6);
  });
  it('varies ±15% around base damage without crits', () => {
    const s = newState('vikingos');
    const lo = attackDamage(s, fixed(0, 0.99)).v, hi = attackDamage(s, fixed(0.9999, 0.99)).v;
    expect(lo).toBe(Math.round(baseDamage(s) * 0.85));
    expect(hi).toBe(Math.round(baseDamage(s) * 1.15));
  });
  it('multiplies critical hits', () => {
    const s = newState('vikingos');
    const r = attackDamage(s, fixed(0.5, 0));
    expect(r.crit).toBe(true);
    expect(r.v).toBe(Math.round(baseDamage(s) * CRIT_MULT));
  });
  it('reduces incoming damage with diminishing returns and never below 1', () => {
    expect(damageTaken(20, 20, () => 0.5)).toBe(10);
    expect(damageTaken(1, 500, () => 0)).toBe(1);
  });
  it('loses 20% of coins on death, rounded down', () => expect(deathPenalty(57)).toBe(11));
});
