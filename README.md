# Love

A little website with a live tracker for how long we've been together.

- Before **8 October 2026, 15:35 (Romania time)** it counts down to the start.
- After that, it counts up how long we've been together, in years, months, days, hours, minutes and seconds.
- It also has a personal message, automatic milestones (1 week, 100 days, 1 year…) and a photo gallery.

## Personalising it

Everything you'll want to change is in [`config.js`](config.js):

- `names`: the title at the top
- `message` / `signature`: your note to her
- `photos`: put the images in `photos/`, then list them, for example
  `{ src: "photos/first-date.jpg", caption: "Our first date" }`
- `milestones`: add or remove milestones

## Viewing it

Open `index.html` in a browser. No build step is needed.

To put it online for free, enable **GitHub Pages** in the repo settings
(Settings → Pages → deploy from branch `main`, folder `/`).
