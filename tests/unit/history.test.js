// Historical-accuracy guardrails. The game is set in the Danelaw around 950 AD.
import { describe, it, expect } from 'vitest';
import { RACES, ITEMS, QUESTS, ETYPES, SETTING } from '../../src/data.js';

// Terms that belong to other periods. Extend this list when a review finds a new anachronism.
const ANACHRONISMS = [
  { term: /gladius|scutum|legionari/i, why: 'Roman Republic/early Empire, centuries before 950' },
  { term: /arco largo|longbow/i, why: 'English longbow is 13th-15th century' },
  { term: /espada larga|longsword/i, why: 'longsword is 13th-15th century' },
  { term: /francisca/i, why: 'francisca went out of use by the 8th century' },
  { term: /poci[oó]n|potion/i, why: 'use salves or herbal remedies instead' },
  { term: /monedas? de oro|gold coin/i, why: 'the Danelaw economy ran on silver pennies and hacksilver' },
  { term: /cuernos|horned helmet/i, why: 'horned Viking helmets are a 19th-century myth' },
  { term: /p[oó]lvora|gunpowder|ballesta|crossbow|plate armou?r|armadura de placas/i, why: 'not in use in 10th-century England' },
];

const allText = () => [
  ...Object.values(RACES).flatMap((r) => [r.name, r.one, r.blurb]),
  ...Object.values(ITEMS).flatMap((i) => [i.name, i.desc]),
  ...Object.values(ETYPES).map((e) => e.name),
  ...QUESTS.flatMap((q) => [q.title, q.label, q.intro(RACES.vikingos), q.remind, q.done]),
].filter(Boolean);

describe(`historical setting: ${SETTING.place}, ${SETTING.year}`, () => {
  it.each(Object.entries(RACES))('%s existed in the setting year', (_key, r) => {
    expect(r.era, 'each people needs era: [from, to]').toHaveLength(2);
    const [from, to] = r.era;
    expect(from).toBeLessThanOrEqual(SETTING.year);
    expect(to).toBeGreaterThanOrEqual(SETTING.year);
  });

  it.each(ANACHRONISMS)('player-facing text avoids $term ($why)', ({ term }) => {
    const hits = allText().filter((t) => term.test(t));
    expect(hits).toEqual([]);
  });
});
