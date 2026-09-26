import { describe, it, expect } from 'vitest';
import { acceptQuest, evaluateQuest, recordKill, completeQuest, currentQuest } from '../../src/core/quests.js';
import { newState } from '../../src/core/state.js';
import { addItem, countItem } from '../../src/core/inventory.js';
import { QUESTS } from '../../src/data.js';

describe('quest chain', () => {
  it('plays the whole chain from start to finish', () => {
    const s = newState('irlandeses');
    // 1. Wolves (kill quest)
    expect(recordKill(s, 'lobo')).toBe(false); // not accepted yet
    expect(acceptQuest(s)).toBe(true);
    expect(recordKill(s, 'bandido')).toBe(false); // wrong target
    for (let i = 0; i < 3; i++) recordKill(s, 'lobo');
    expect(evaluateQuest(s)).toBe(true);
    expect(s.quest.status).toBe('ready');
    const coins = s.coins;
    const r1 = completeQuest(s);
    expect(r1.xp).toBe(QUESTS[0].reward.xp);
    expect(s.coins).toBe(coins + QUESTS[0].reward.coins);

    // 2. Herbs (collect quest): consumes the herbs on hand-in
    acceptQuest(s);
    addItem(s.inv, 'hierba', 4);
    evaluateQuest(s);
    expect(s.quest.status).toBe('active');
    addItem(s.inv, 'hierba', 1);
    expect(evaluateQuest(s)).toBe(true);
    completeQuest(s);
    expect(countItem(s.inv, 'hierba')).toBe(0);

    // 3. Outlaw chief (item quest)
    acceptQuest(s);
    addItem(s.inv, 'sello');
    evaluateQuest(s);
    completeQuest(s);
    expect(countItem(s.inv, 'espada')).toBe(1);
    expect(currentQuest(s)).toBeNull();
    expect(acceptQuest(s)).toBe(false);
  });

  it('goes back to active if quest items are dropped', () => {
    const s = newState('francos');
    s.quest = { idx: 1, status: 'active', progress: 0 };
    addItem(s.inv, 'hierba', 5);
    evaluateQuest(s);
    s.inv = s.inv.filter((x) => x.id !== 'hierba');
    evaluateQuest(s);
    expect(s.quest.status).toBe('active');
  });

  it('will not complete a quest that is not ready', () => {
    const s = newState('francos');
    expect(completeQuest(s)).toBeNull();
  });
});
