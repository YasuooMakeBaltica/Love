(function () {
  const start = new Date(CONFIG.startDate);
  const DAY = 24 * 60 * 60 * 1000;

  const $ = (sel) => document.querySelector(sel);
  const units = {};
  document.querySelectorAll(".unit").forEach((el) => {
    units[el.dataset.unit] = { el, value: el.querySelector(".value"), label: el.querySelector(".label") };
  });

  // Adds whole calendar months, clamping the day (31 Jan + 1 month → 28/29 Feb).
  function addMonths(date, n) {
    const d = new Date(date);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
    return d;
  }

  // Calendar-aware difference between two dates (from < to).
  function diff(from, to) {
    let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    let anchor = addMonths(from, months);
    if (anchor > to) {
      months -= 1;
      anchor = addMonths(from, months);
    }
    let ms = to - anchor;
    const days = Math.floor(ms / DAY); ms -= days * DAY;
    const hours = Math.floor(ms / 3600000); ms -= hours * 3600000;
    const minutes = Math.floor(ms / 60000); ms -= minutes * 60000;
    const seconds = Math.floor(ms / 1000);
    return { years: Math.floor(months / 12), months: months % 12, days, hours, minutes, seconds };
  }

  const plural = (n, word) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

  // ── Counter ───────────────────────────────────────

  let wasCounting = null;

  function tick() {
    const now = new Date();
    const together = now >= start;
    // Round the countdown up to the next whole second so it hits 0 exactly at the start.
    const parts = together ? diff(start, now) : diff(new Date(now.getTime() - 999), start);

    for (const [name, u] of Object.entries(units)) {
      const n = parts[name];
      u.value.textContent = n;
      u.label.textContent = n === 1 ? name.slice(0, -1) : name;
    }
    // Hide years/months while they're still zero so the countdown stays tidy.
    units.years.el.hidden = parts.years === 0;
    units.months.el.hidden = parts.years === 0 && parts.months === 0;

    if (together !== wasCounting) {
      $("#counter-title").textContent = together ? CONFIG.datingTitle : CONFIG.countdownTitle;
      if (wasCounting === false) celebrate();
      wasCounting = together;
      renderMilestones();
    }

    if (together) {
      const totalDays = Math.floor((now - start) / DAY);
      $("#counter-sub").textContent = totalDays === 0
        ? "Day one 💗"
        : `That's ${plural(totalDays, "day")} and counting 💗`;
    } else {
      $("#counter-sub").textContent = `Starts ${formatDate(start, true)}`;
    }
  }

  function formatDate(date, withTime) {
    const opts = { day: "numeric", month: "long", year: "numeric", timeZone: CONFIG.timeZone };
    if (withTime) Object.assign(opts, { hour: "2-digit", minute: "2-digit", hour12: false });
    return date.toLocaleString("en-GB", opts);
  }

  // ── Milestones ────────────────────────────────────

  function milestoneDate(m) {
    return m.months != null ? addMonths(start, m.months) : new Date(start.getTime() + m.days * DAY);
  }

  function calendarDaysBetween(a, b) {
    const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.round((midnight(b) - midnight(a)) / DAY);
  }

  function renderMilestones() {
    const now = new Date();
    const list = $("#milestones");
    list.innerHTML = "";
    let nextFound = false;

    CONFIG.milestones
      .map((m) => ({ ...m, date: milestoneDate(m) }))
      .sort((a, b) => a.date - b.date)
      .forEach((m) => {
        const li = document.createElement("li");
        const reached = now >= m.date;
        let status;
        if (reached) {
          li.className = "reached";
          status = "✓ reached";
        } else if (!nextFound) {
          nextFound = true;
          li.className = "next";
          const daysLeft = calendarDaysBetween(now, m.date);
          status = daysLeft === 0 ? "today!" : daysLeft === 1 ? "tomorrow!" : `in ${daysLeft} days`;
        } else {
          status = "";
        }
        li.innerHTML = `
          <span class="dot">${reached ? "♥" : "♡"}</span>
          <span class="text"><div class="name"></div><div class="date"></div></span>
          <span class="status"></span>`;
        li.querySelector(".name").textContent = m.label;
        li.querySelector(".date").textContent = formatDate(m.date);
        li.querySelector(".status").textContent = status;
        list.appendChild(li);
      });
  }

  // ── Message & gallery ─────────────────────────────

  function renderMessage() {
    $("#names").textContent = CONFIG.names;
    document.title = CONFIG.names;
    const body = $("#message-body");
    CONFIG.message.forEach((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      body.appendChild(p);
    });
    $("#signature").textContent = CONFIG.signature;
  }

  function renderGallery() {
    const gallery = $("#gallery");
    if (!CONFIG.photos.length) {
      gallery.innerHTML = '<p class="empty">Our photos will live here 📸</p>';
      return;
    }
    CONFIG.photos.forEach((photo) => {
      const fig = document.createElement("figure");
      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = photo.caption || "";
      img.loading = "lazy";
      fig.appendChild(img);
      if (photo.caption) {
        const cap = document.createElement("figcaption");
        cap.textContent = photo.caption;
        fig.appendChild(cap);
      }
      fig.addEventListener("click", () => openLightbox(photo));
      gallery.appendChild(fig);
    });
  }

  const lightbox = $("#lightbox");
  function openLightbox(photo) {
    lightbox.querySelector("img").src = photo.src;
    lightbox.querySelector("img").alt = photo.caption || "";
    lightbox.querySelector("figcaption").textContent = photo.caption || "";
    lightbox.hidden = false;
  }
  lightbox.addEventListener("click", (e) => {
    if (e.target.tagName !== "IMG") lightbox.hidden = true;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") lightbox.hidden = true;
  });

  // ── Floating hearts ───────────────────────────────

  const heartLayer = $(".hearts");
  const heartChars = ["♥", "💗", "💕", "♡"];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function spawnHeart() {
    const h = document.createElement("span");
    h.className = "heart";
    h.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];
    h.style.left = Math.random() * 100 + "vw";
    h.style.fontSize = 12 + Math.random() * 22 + "px";
    h.style.color = Math.random() < 0.5 ? "#e8668f" : "#ffadc6";
    h.style.animationDuration = 8 + Math.random() * 8 + "s";
    h.addEventListener("animationend", () => h.remove());
    heartLayer.appendChild(h);
  }

  // A burst of hearts for the moment the countdown hits zero.
  function celebrate() {
    if (reducedMotion) return;
    for (let i = 0; i < 40; i++) setTimeout(spawnHeart, i * 60);
  }

  // ── Start ─────────────────────────────────────────

  renderMessage();
  renderGallery();
  tick();
  setInterval(tick, 1000);
  setInterval(renderMilestones, 60 * 1000);

  if (!reducedMotion) {
    for (let i = 0; i < 6; i++) setTimeout(spawnHeart, i * 400);
    setInterval(spawnHeart, 1200);
  }
})();
