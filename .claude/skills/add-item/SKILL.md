---
name: add-item
description: Add a weapon, armour, consumable, material or quest item to Reinos de Hierro. Use when the user wants a new item, weapon, armour or shop entry, or says things like "add a hunting bow" or "añade un arma nueva".
---

# Add an item

Items live in `ITEMS` in `src/data.js`, keyed by a short lowercase id with no
accents.

## Fields by type

Every item needs `name`, `icon` and `desc` in Spanish, plus `type`.

| `type` | Extra fields |
|---|---|
| `weapon` | `dmg`, `range`, `kind` (`axe`, `spear`, `sword`, `knife`, `bow`), `ranged: true` if thrown or shot, `price` |
| `armor` | `def`, `price` |
| `use` | `heal`, `stack: true`, `price` |
| `mat` | `stack: true`, `price` |
| `quest` | nothing extra. No price, it is not sellable |

`kind` picks the 3D model the character holds, so reuse an existing value.

## Steps

1. **Check the history.** Tenth-century Danelaw: spear, axe, seax, simple bow,
   mail. No longbow, no crossbow, no longsword, no plate. Remedies are salves
   and herbs, never "potions" — see the anachronism list in
   `tests/unit/history.test.js`.
2. Add the entry to `ITEMS`.
3. Add it to `SHOP` if the smith should sell it.
4. Cover any new rule it introduces with a unit test in
   `tests/unit/inventory.test.js` or `tests/unit/combat.test.js`. A stackable
   item, a new `kind` or an unusual `range` are all worth a test.
5. Run the `history-review` skill over the new text.
6. **Run `npm run verify`.**

## Watch out

- Balance against what exists: `hacha` 17 damage at 45 silver, `espada` 22 at
  120, `cota` 7 defence at 70.
- Non-stackable items take one inventory slot each and `INV_MAX` is 20.
- If you rename or remove an existing id, add the old id to `ITEM_MAP` in
  `src/data.js` so saved games still load, and cover it in
  `tests/unit/data.test.js`.
