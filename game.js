// ============================================================
// Cursor Snake — game.js (ES6)
// A snake chases the mouse/touch cursor. Eating food grows it.
// Eating a "danger" item doesn't end the game — it just shows a
// fullscreen reveal (image + text) and plays a sound.
// ============================================================

// ---- CONFIG -------------------------------------------------

const CONFIG = {
  segmentSpacing: 6,      // trail samples between each snake segment
  headEase: 0.16,         // how quickly the head eases toward the cursor (0-1)
  startSegments: 5,
  segmentBaseSize: 26,    // px, head size — body tapers down from this
  minSegmentSize: 10,
  itemSize: 46,           // px, food/danger hit-circle diameter
  collideDistance: 34,    // px, distance between head & item center to count as "eaten"
  dangerRevealMs: 2600,   // how long the fullscreen danger reveal stays up
  respawnPadding: 60,     // keep items this far from the viewport edge
};

// Food: pick your own — simple emoji, no image assets needed.
const FOOD_TYPES = [
  { id: "apple", emoji: "🍎" },
  { id: "grapes", emoji: "🍇" },
  { id: "strawberry", emoji: "🍓" },
];

// Danger items: your 3 uploaded images + captions.
// `sound` is just a file path — drop your own audio files into
// assets/sounds/ with these exact names (or edit the paths below)
// and playback will work automatically. No sound is bundled.
const DANGER_TYPES = [
  {
    id: "danger1",
    image: "assets/images/danger1.png",
    text: "Ami Python Samin🐍",
    sound: "assets/sounds/danger1.mp3",
  },
  {
    id: "danger2",
    image: "assets/images/danger2.png",
    text: "Ami Borisaille monu",
    sound: "assets/sounds/danger2.mp3",
  },
  {
    id: "danger3",
    image: "assets/images/danger3.png",
    text: "Ami Nuakaille Bolod",
    sound: "assets/sounds/danger3.mp3",
  },
];

// ---- DOM refs -------------------------------------------------

const arena = document.getElementById("arena");
const scoreValueEl = document.getElementById("scoreValue");
const hintEl = document.getElementById("hint");
const dangerOverlay = document.getElementById("dangerOverlay");
const dangerImg = document.getElementById("dangerImg");
const dangerText = document.getElementById("dangerText");

// ---- Utility ----------------------------------------------------

const rand = (min, max) => Math.random() * (max - min) + min;

const randomSpawnPoint = () => ({
  x: rand(CONFIG.respawnPadding, window.innerWidth - CONFIG.respawnPadding),
  y: rand(CONFIG.respawnPadding, window.innerHeight - CONFIG.respawnPadding),
});

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** Plays a sound from a file path. Safe to call even if the file
 *  doesn't exist yet — it just fails silently in that case. */
function playSound(path) {
  if (!path) return;
  try {
    const audio = new Audio(path);
    audio.volume = 0.9;
    audio.play().catch(() => {
      /* file not added yet, or autoplay blocked — ignore */
    });
  } catch (_) {
    /* ignore */
  }
}

// ---- Cursor tracking -------------------------------------------

const cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

window.addEventListener("pointermove", (e) => {
  cursor.x = e.clientX;
  cursor.y = e.clientY;
  hideHintOnce();
});

window.addEventListener(
  "touchmove",
  (e) => {
    const t = e.touches[0];
    if (!t) return;
    cursor.x = t.clientX;
    cursor.y = t.clientY;
    hideHintOnce();
  },
  { passive: true }
);

let hintHidden = false;
function hideHintOnce() {
  if (hintHidden) return;
  hintHidden = true;
  hintEl.style.opacity = "0";
}

// ---- Snake --------------------------------------------------------

class Snake {
  constructor() {
    this.head = { x: cursor.x, y: cursor.y };
    this.trail = []; // history of head positions, newest first
    this.segmentCount = CONFIG.startSegments;
    this.segmentEls = [];
    this.maxTrailLength = 1200; // hard cap so the array can't grow forever

    for (let i = 0; i < this.segmentCount; i++) {
      const el = document.createElement("div");
      el.className = "segment item-pop";
      el.style.background = this.colorFor(i);
      arena.appendChild(el);
      this.segmentEls.push(el);
    }
  }

  colorFor(index) {
    // Head is brightest, tail fades toward a deeper teal.
    const t = index / Math.max(this.segmentCount - 1, 1);
    const r = Math.round(52 - t * 30);
    const g = Math.round(230 - t * 90);
    const b = Math.round(180 - t * 60);
    return `rgb(${r}, ${g}, ${b})`;
  }

  grow(amount = 1) {
    for (let i = 0; i < amount; i++) {
      const el = document.createElement("div");
      el.className = "segment item-pop";
      arena.appendChild(el);
      this.segmentEls.push(el);
    }
    this.segmentCount = this.segmentEls.length;
    const neededTrail = this.segmentCount * CONFIG.segmentSpacing + 10;
    if (neededTrail > this.maxTrailLength) {
      this.maxTrailLength = neededTrail;
    }
  }

  update() {
    // Ease the head toward the cursor.
    this.head.x += (cursor.x - this.head.x) * CONFIG.headEase;
    this.head.y += (cursor.y - this.head.y) * CONFIG.headEase;

    // Record head position history for the body to follow.
    this.trail.unshift({ x: this.head.x, y: this.head.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.length = this.maxTrailLength;
    }

    // Position each segment along the trail.
    for (let i = 0; i < this.segmentEls.length; i++) {
      const trailIndex = Math.min(
        i * CONFIG.segmentSpacing,
        this.trail.length - 1
      );
      const pos = this.trail[trailIndex] || this.head;
      const size = this.sizeFor(i);
      const el = this.segmentEls[i];
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.background = this.colorFor(i);
      el.style.transform = `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`;
      el.style.boxShadow =
        i === 0 ? "0 0 18px rgba(70,255,190,0.55)" : "0 0 8px rgba(70,255,190,0.2)";
    }
  }

  sizeFor(index) {
    const t = index / Math.max(this.segmentCount - 1, 1);
    return CONFIG.segmentBaseSize - t * (CONFIG.segmentBaseSize - CONFIG.minSegmentSize);
  }
}

// ---- Items (food + danger) ---------------------------------------

class ItemSpawner {
  constructor(kind, typeList, onEat) {
    this.kind = kind; // "food" | "danger"
    this.typeList = typeList;
    this.onEat = onEat;
    this.items = []; // { type, pos, el }
  }

  spawnAll(count) {
    for (let i = 0; i < count; i++) {
      this.spawnOne(this.typeList[i % this.typeList.length]);
    }
  }

  spawnOne(type) {
    const pos = randomSpawnPoint();
    const el = document.createElement("div");
    el.className = "item item-pop flex items-center justify-center";
    el.style.width = `${CONFIG.itemSize}px`;
    el.style.height = `${CONFIG.itemSize}px`;
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.transform = `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`;

    if (this.kind === "food") {
      el.style.fontSize = `${CONFIG.itemSize * 0.7}px`;
      el.style.filter = "drop-shadow(0 0 10px rgba(255,255,255,0.25))";
      el.textContent = type.emoji;
    } else {
      el.style.borderRadius = "12px";
      el.style.overflow = "hidden";
      el.style.border = "2px solid rgba(255,80,80,0.7)";
      el.style.boxShadow = "0 0 16px rgba(255,60,60,0.45)";
      el.style.background = "#000";
      const img = document.createElement("img");
      img.src = type.image;
      img.alt = type.text;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      el.appendChild(img);
    }

    arena.appendChild(el);
    this.items.push({ type, pos, el });
  }

  checkCollisions(headPos) {
    for (const item of this.items) {
      if (distance(headPos, item.pos) < CONFIG.collideDistance) {
        this.eat(item);
        break; // one item per frame is plenty
      }
    }
  }

  eat(item) {
    item.el.remove();
    this.items = this.items.filter((i) => i !== item);
    this.onEat(item.type);
    // respawn a fresh one of the same type so there are always 3 on screen
    this.spawnOne(item.type);
  }
}

// ---- Score ------------------------------------------------------

let score = 0;
function addScore(points) {
  score += points;
  scoreValueEl.textContent = String(score);
  scoreValueEl.animate(
    [{ transform: "scale(1.35)" }, { transform: "scale(1)" }],
    { duration: 220, easing: "ease-out" }
  );
}

// ---- Danger reveal overlay ----------------------------------------

let dangerTimeout = null;

function showDangerReveal(type) {
  dangerImg.src = type.image;
  dangerImg.alt = type.text;
  dangerText.textContent = type.text;
  dangerOverlay.style.display = "flex";

  playSound(type.sound);

  clearTimeout(dangerTimeout);
  dangerTimeout = setTimeout(hideDangerReveal, CONFIG.dangerRevealMs);
}

function hideDangerReveal() {
  dangerOverlay.style.display = "none";
  clearTimeout(dangerTimeout);
}

dangerOverlay.addEventListener("click", hideDangerReveal);

// ---- Wire it all together ------------------------------------------

const snake = new Snake();

const foodSpawner = new ItemSpawner("food", FOOD_TYPES, () => {
  snake.grow(1);
  addScore(10);
});

const dangerSpawner = new ItemSpawner("danger", DANGER_TYPES, (type) => {
  showDangerReveal(type);
});

foodSpawner.spawnAll(3);
dangerSpawner.spawnAll(3);

function loop() {
  snake.update();
  foodSpawner.checkCollisions(snake.head);
  dangerSpawner.checkCollisions(snake.head);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Keep spawn positions sane on resize.
window.addEventListener("resize", () => {
  cursor.x = Math.min(cursor.x, window.innerWidth);
  cursor.y = Math.min(cursor.y, window.innerHeight);
});
