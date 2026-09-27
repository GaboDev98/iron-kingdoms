---
name: history-review
description: Check Reinos de Hierro game text for anachronisms against the Danelaw around 950. Use when adding or editing player-facing Spanish text, when the user asks whether something is historically accurate, or when history.test.js fails.
---

# History review

The game is set in the Danelaw — northern and eastern England under Danish law
— around the year 950. Player-facing text must fit that window.

For anything more than a quick check, hand the job to the `history-reviewer`
agent, which reads `src/data.js` and reports without editing.

## Automated part

`tests/unit/history.test.js` enforces two things:

- every people in `RACES` has `era: [from, to]` spanning `SETTING.year`;
- no player-facing string matches the anachronism list.

Player-facing text means `RACES` `name`/`one`/`blurb`, `ITEMS` `name`/`desc`,
`ETYPES` `name`, and every `QUESTS` `title`/`label`/`intro`/`remind`/`done`.

```bash
npx vitest run tests/unit/history.test.js
```

## What the list does not catch

The regex list only finds terms someone already thought of. Read new text for:

- **Money.** Silver pennies, hacksilver, arm-rings. Never gold coins.
- **Armour.** Mail (*brynja*) is the good stuff and costs a fortune. No plate,
  no visored helms.
- **Weapons.** Spear, axe, seax, simple self bow. No longbow, crossbow or
  longsword.
- **Helmets.** Never horned. That is a 19th-century stage invention.
- **Medicine.** Salves, herbs and charms. Never "potions".
- **Places and names.** Jórvik, not York. Use names people used then.
- **Religion.** Danes in the Danelaw were converting; both Christian and
  Norse practice coexisted. Neither should be treated as universal.
- **Titles.** Jarl, thegn, ealdorman, reeve. Not baron, knight or duke.

## When you find one

Fix the text. Add a regex to `ANACHRONISMS` in `tests/unit/history.test.js`
with a short `why`, so the mistake cannot come back. Never extend the list to
allow something through — the list only ever grows.
