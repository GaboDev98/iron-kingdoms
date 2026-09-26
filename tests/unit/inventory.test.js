import { describe, it, expect } from 'vitest';
import { addItem, removeItem, countItem, equipFromSlot, INV_MAX } from '../../src/core/inventory.js';
import { newState } from '../../src/core/state.js';

describe('addItem', () => {
  it('stacks stackable items into one slot', () => {
    const inv = [];
    addItem(inv, 'pan', 2); addItem(inv, 'pan', 3);
    expect(inv).toEqual([{ id: 'pan', q: 5 }]);
  });
  it('gives non-stackable items one slot each', () => {
    const inv = [];
    addItem(inv, 'lanza', 2);
    expect(inv).toHaveLength(2);
  });
  it('refuses new slots when full but still stacks', () => {
    const inv = Array.from({ length: INV_MAX - 1 }, () => ({ id: 'seax', q: 1 })).concat([{ id: 'pan', q: 1 }]);
    expect(addItem(inv, 'lanza')).toBe(false);
    expect(addItem(inv, 'pocion')).toBe(false);
    expect(addItem(inv, 'pan', 2)).toBe(true);
    expect(countItem(inv, 'pan')).toBe(3);
  });
  it('is all-or-nothing for several non-stackable items', () => {
    const inv = Array.from({ length: INV_MAX - 1 }, () => ({ id: 'seax', q: 1 }));
    expect(addItem(inv, 'lanza', 2)).toBe(false);
    expect(inv).toHaveLength(INV_MAX - 1);
  });
  it('throws on unknown items', () => expect(() => addItem([], 'laser')).toThrow(/Unknown item/));
});

describe('removeItem', () => {
  it('removes across slots and drops empty slots', () => {
    const inv = [{ id: 'lanza', q: 1 }, { id: 'pan', q: 2 }, { id: 'lanza', q: 1 }];
    expect(removeItem(inv, 'lanza', 2)).toBe(2);
    expect(inv).toEqual([{ id: 'pan', q: 2 }]);
  });
  it('reports how many it could actually remove', () => {
    const inv = [{ id: 'pan', q: 2 }];
    expect(removeItem(inv, 'pan', 5)).toBe(2);
    expect(inv).toEqual([]);
  });
});

describe('equipFromSlot', () => {
  it('swaps a weapon with the equipped one', () => {
    const s = newState('vikingos');
    s.inv = [{ id: 'lanza', q: 1 }];
    expect(equipFromSlot(s, 0)).toBe('lanza');
    expect(s.eq.weapon).toBe('lanza');
    expect(s.inv).toEqual([{ id: 'hacha', q: 1 }]);
  });
  it('equips armor into the armor slot', () => {
    const s = newState('vikingos');
    s.inv = [{ id: 'cota', q: 1 }];
    equipFromSlot(s, 0);
    expect(s.eq.armor).toBe('cota');
  });
  it('ignores consumables and empty slots', () => {
    const s = newState('vikingos');
    expect(equipFromSlot(s, 0)).toBeNull();
    expect(equipFromSlot(s, 99)).toBeNull();
  });
});
