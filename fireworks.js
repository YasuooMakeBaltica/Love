// Full-screen fireworks show, drawn on a canvas over a dimmed page.
// Includes three rockets that spell out "I", "LOVE", "YOU".
// Usage: launchFireworks(durationMs)

(function () {
  const COLORS = ["#ff4d8d", "#ff8fb8", "#ffd166", "#ffffff", "#c77dff", "#ff6b6b", "#ffb3c6"];
  const ROCKET_GRAVITY = 0.0008;    // px per ms²
  const PARTICLE_GRAVITY = 0.00012;
  const DRAG = 0.985;      // velocity kept per 16 ms frame

  let canvas, ctx, running = false;
  let rockets = [], particles = [];

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function setup() {
    canvas = document.createElement("canvas");
    canvas.className = "fireworks";
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const WORDS = ["I", "LOVE", "YOU"];
  const WORD_COLORS = ["#ff6fa5", "#ffd1e0"];
  // Word particles fly into place, hold, then drop and fade (ms).
  const WORD_FORM = 450, WORD_HOLD_UNTIL = 1800, WORD_LIFE = 2400;

  // `sidesOnly` keeps a rocket out of the middle while the words are showing.
  function launchRocket(sidesOnly) {
    const side = Math.random() < 0.5 ? rand(0.05, 0.25) : rand(0.75, 0.95);
    const x = (sidesOnly ? side : rand(0.15, 0.85)) * innerWidth;
    const targetY = rand(0.12, 0.45) * innerHeight;
    // Speed needed to coast up to targetY under gravity.
    const vy = -Math.sqrt(2 * ROCKET_GRAVITY * (innerHeight - targetY));
    rockets.push({ x, y: innerHeight, vx: rand(-0.03, 0.03), vy, color: pick(COLORS) });
  }

  function launchWordRocket(word) {
    const targetY = 0.3 * innerHeight;
    const vy = -Math.sqrt(2 * ROCKET_GRAVITY * (innerHeight - targetY));
    rockets.push({ x: innerWidth / 2, y: innerHeight, vx: 0, vy, color: WORD_COLORS[0], word });
  }

  // Points covering the word's letters, relative to its centre.
  function wordPoints(word) {
    const size = Math.min(innerWidth * 0.3, 160);
    const c = document.createElement("canvas");
    c.width = Math.ceil(size * 0.8 * word.length + size * 0.4);
    c.height = Math.ceil(size * 1.3);
    const g = c.getContext("2d");
    g.font = `600 ${size}px Quicksand, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(word, c.width / 2, c.height / 2);
    const data = g.getImageData(0, 0, c.width, c.height).data;
    const gap = Math.max(4, Math.round(size / 24));
    const points = [];
    for (let y = 0; y < c.height; y += gap) {
      for (let x = 0; x < c.width; x += gap) {
        if (data[(y * c.width + x) * 4 + 3] > 128) points.push([x - c.width / 2, y - c.height / 2]);
      }
    }
    return points;
  }

  function explodeWord(x, y, word) {
    wordPoints(word).forEach(([tx, ty], i) => {
      particles.push({
        x, y, ox: x, oy: y, tx, ty, vx: 0, vy: 0,
        color: WORD_COLORS[i % 2],
        life: 0,
        maxLife: WORD_LIFE + rand(-150, 150),
        size: rand(1.6, 2.2),
        word: true,
      });
    });
  }

  function explode(x, y, color) {
    const heart = Math.random() < 0.35;
    const count = heart ? 70 : Math.floor(rand(70, 110));
    const power = rand(0.22, 0.32) * Math.min(1, innerWidth / 500 + 0.4);
    const second = Math.random() < 0.5 ? pick(COLORS) : color;

    for (let i = 0; i < count; i++) {
      let vx, vy;
      if (heart) {
        // Parametric heart outline.
        const t = (i / count) * Math.PI * 2;
        vx = 16 * Math.sin(t) ** 3;
        vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        vx *= power / 16;
        vy *= power / 16;
      } else {
        const a = Math.random() * Math.PI * 2;
        const s = power * Math.sqrt(Math.random());
        vx = Math.cos(a) * s;
        vy = Math.sin(a) * s;
      }
      particles.push({
        x, y, vx, vy,
        color: i % 2 ? color : second,
        life: 0,
        maxLife: rand(1100, 1700),
        size: rand(1.4, 2.4),
        heart,
      });
    }
  }

  function step(dt) {
    const drag = Math.pow(DRAG, dt / 16);

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.vy += ROCKET_GRAVITY * dt;
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      // Spark trail.
      particles.push({ x: r.x + rand(-1, 1), y: r.y, vx: rand(-0.02, 0.02), vy: rand(0, 0.03), color: "#ffd9a0", life: 0, maxLife: 180, size: 1.1 });
      if (r.vy >= -0.05) {
        if (r.word) explodeWord(r.x, r.y, r.word);
        else explode(r.x, r.y, r.color);
        rockets.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
      if (p.word && p.life < WORD_HOLD_UNTIL) {
        const k = 1 - Math.pow(1 - Math.min(p.life / WORD_FORM, 1), 3); // ease-out
        p.x = p.ox + p.tx * k;
        p.y = p.oy + p.ty * k;
        continue;
      }
      p.vx *= drag;
      p.vy = p.vy * drag + PARTICLE_GRAVITY * dt * (p.heart ? 0.5 : 1);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalCompositeOperation = "lighter";
    for (const r of rockets) {
      ctx.fillStyle = "#fff3d6";
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of particles) {
      const fade = p.word
        ? Math.min(1, (p.maxLife - p.life) / (p.maxLife - WORD_HOLD_UNTIL))
        : 1 - p.life / p.maxLife;
      // Soft glow, then a bright core.
      ctx.globalAlpha = fade * 0.25;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = fade;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  window.launchFireworks = function (duration = 13000) {
    if (running) return;
    if (!canvas) setup();
    running = true;
    canvas.classList.add("show");

    // Steady launches, "I" "LOVE" "YOU" in the middle, then a big finale.
    const wordsFrom = 2000, wordGap = 2300;
    const wordsUntil = wordsFrom + WORDS.length * wordGap + 1500;
    WORDS.forEach((word, i) => setTimeout(() => launchWordRocket(word), wordsFrom + i * wordGap));
    for (let t = 300; t < duration - 2000; t += rand(280, 520)) {
      const duringWords = t > wordsFrom && t < wordsUntil;
      if (duringWords && Math.random() < 0.4) continue; // thin out so the words stand out
      setTimeout(() => launchRocket(duringWords), t);
    }
    for (let i = 0; i < 7; i++) setTimeout(() => launchRocket(false), duration - 2000 + i * 90);

    let last = performance.now();
    const startedAt = last;
    function frame(now) {
      const dt = Math.min(now - last, 50);
      last = now;
      step(dt);
      draw();
      const done = now - startedAt > duration && !rockets.length && !particles.length;
      if (done) {
        canvas.classList.remove("show");
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        running = false;
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };
})();
