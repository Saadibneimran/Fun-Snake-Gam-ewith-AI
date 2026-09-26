https://saadibneimran.github.io/Fun-Snake-Gam-ewith-AI/
# Cursor Snake

Open `index.html` directly in a browser (double-click it, or use a local
server like VS Code's "Live Server"). No build step needed.

## Structure
```
index.html          – markup + Tailwind (via CDN) + styles
game.js              – all game logic (ES6)
assets/images/       – danger1.png, danger2.png, danger3.png (your photos)
assets/sounds/       – put your 3 sound files here (see below)
```

## Adding your sounds
The code already calls the right audio files — just drop these in,
named exactly like this, and they'll play automatically:

```
assets/sounds/danger1.mp3
assets/sounds/danger2.mp3
assets/sounds/danger3.mp3
```

Want different filenames/paths? Edit the `sound:` field for each entry
in the `DANGER_TYPES` array near the top of `game.js`.

## Tweaking things
Everything adjustable lives in the `CONFIG` object at the top of
`game.js`: snake speed/easing, segment size, item size, hit-detection
radius, how long the danger reveal stays on screen, etc.

Food is 3 emoji (🍎🍇🍓) defined in `FOOD_TYPES` — swap them for
anything you like, or replace with image-based items the same way
danger items are built.
