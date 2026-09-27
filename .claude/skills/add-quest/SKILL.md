---
name: add-quest
description: Add a quest to Reinos de Hierro. Use when the user wants a new quest, mission, task or objective chain, or says things like "add a quest to escort a merchant" or "añade una misión".
---

# Add a quest

`QUESTS` in `src/data.js` is an ordered array. The player works through it from
index 0, and `state.quest.idx` points at the current one, so **order matters**
and inserting in the middle shifts every later index.

## Shape

```js
{
  id: 'escolta',
  title: 'Escolta hasta Jórvik',
  type: 'kill' | 'collect' | 'item',
  target: 'lobo',        // kill only: an ETYPES key
  item: 'hierba',        // collect and item only: an ITEMS key
  goal: 3,
  label: 'Lobos cazados',            // HUD counter label
  intro: (r) => `...${r.one}...`,    // receives the player's RACES entry
  remind: 'Shown when the player asks again.',
  done: 'Shown on hand-in.',
  reward: { coins: 30, xp: 60, items: [['pocion', 2]] },
}
```

`type` decides how progress is counted: `kill` counts kills of `target`,
`collect` and `item` count `item` in the pack.

## Steps

1. Append the quest to `QUESTS`, or insert it and accept that later indices
   shift. Inserting before the end invalidates saved games mid-chain — add a
   `migrate()` step in `src/data.js` if you do.
2. Every `target` must exist in `ETYPES` and every `item` in `ITEMS`.
3. **Extend the chain test** in `tests/unit/quests.test.js`. It walks the whole
   quest chain end to end, so a new quest must be added there.
4. Keep all four text fields in Spanish and run the `history-review` skill
   over them.
5. **Run `npm run verify`.**

## Watch out

- `intro` is a function and receives the player's `RACES` entry, so it can
  address them as `${r.one}`. `remind` and `done` are plain strings.
- Rewards are silver, not gold.
- Do not use `confirm()` or `alert()` anywhere in quest flow — the claude.ai
  artifact viewer blocks them.
