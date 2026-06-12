# DARK SOULS II — 白金獎盃 Trophy Tracker

A self-contained, offline-friendly web app to track your **Dark Souls II Platinum** progress,
styled with an "ash & ember" Souls aesthetic. Trophy data (all 38) and the big
collect-them-all checklists (Sorceries / Miracles / Pyromancies / Hexes / Gestures / NPCs)
come from kennylight's guide on 巴哈姆特.

## Run it
Just open **`index.html`** in any modern browser (double-click it). No build step, no server needed.
Your progress is saved automatically in the browser's `localStorage`.

## Add your own trophy icons
Drop image files into the **`icons/`** folder, named by trophy number:

```
icons/trophy-01.png   ← No.01 黑暗靈魂 (Platinum)
icons/trophy-02.png   ← No.02 喪失的記憶
...
icons/trophy-38.png   ← No.38 黑暗靈魂之始
```

Square images (e.g. 256×256) look best. Any trophy without an icon shows a bonfire
placeholder until you add one.

## Features
- **Bonfire toggle** per trophy — light it when you earn the trophy.
- **Magic-collect checklists** — for "learn all spells" trophies, every single spell is a
  tick-box with where/how to get it. Mini progress counter per list.
- **Progress ring** + per-grade legend (Platinum / Gold / Silver / Bronze).
- **Filter** by grade, done / to-do, and **search** across names, descriptions and
  every spell location.
- **Reset** button to start a fresh playthrough.

## Files
| file | purpose |
|------|---------|
| `index.html` | page structure |
| `styles.css` | the Souls visual theme |
| `data.js`    | all 38 trophies + sub-checklists (edit here to tweak text/grades) |
| `app.js`     | rendering, persistence, filtering |
| `icons/`     | your trophy icon images |

## Editing the data
Open `data.js`. Each trophy is an object; the collect-them-all trophies have a
`checklist: [{ t: "name", d: "where to get it" }, ...]`. Grades are
`platinum | gold | silver | bronze`. Trophy grades are my best mapping
(1 Platinum / 2 Gold / 8 Silver / 27 Bronze) — adjust freely if you prefer.

Source: <https://home.gamer.com.tw/artwork.php?sn=2539886>
