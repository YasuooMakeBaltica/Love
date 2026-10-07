// Full-screen fireworks show, drawn on a canvas over a dimmed page.
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

  function launchRocket() {
    const x = rand(0.15, 0.85) * innerWidth;
    const targetY = rand(0.12, 0.45) * innerHeight;
    // Speed needed to coast up to targetY under gravity.
    const vy = -Math.sqrt(2 * ROCKET_GRAVITY * (innerHeight - targetY));
    rockets.push({ x, y: innerHeight, vx: rand(-0.03, 0.03), vy, color: pick(COLORS) });
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
        explode(r.x, r.y, r.color);
        rockets.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
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
      const fade = 1 - p.life / p.maxLife;
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

  window.launchFireworks = function (duration = 9000) {
    if (running) return;
    if (!canvas) setup();
    running = true;
    canvas.classList.add("show");

    // Steady launches, then a big finale.
    const timers = [];
    for (let t = 300; t < duration - 2000; t += rand(280, 520)) timers.push(setTimeout(launchRocket, t));
    for (let i = 0; i < 7; i++) timers.push(setTimeout(launchRocket, duration - 2000 + i * 90));

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
