// ─────────────────────────────────────────────────────────────
//  Everything you'll want to personalise lives in this file.
// ─────────────────────────────────────────────────────────────

const CONFIG = {
  // Shown at the top of the page.
  names: "You & Me",

  // When we started dating: 8 October 2025, 15:35 Romania time.
  // The "together for" counter and the milestones count from here.
  // (+03:00 is Romanian summer time, which is in effect on 8 October.)
  startDate: "2025-10-08T15:35:00+03:00",

  // Until this moment the page counts down to it (our 1st anniversary),
  // then switches to counting how long we've been together.
  countdownTo: "2026-10-08T15:35:00+03:00",

  // Used to show milestone dates in Romanian time, wherever the page is opened.
  timeZone: "Europe/Bucharest",

  // Heading above the counter before and after the countdown ends.
  countdownTitle: "Time until our anniversary",
  datingTitle: "We've been together for",

  // Your personal note. Each string is its own paragraph.
  message: [
    "[Write your message to her here.]",
    "[Add as many paragraphs as you like. Each one goes in its own quotes, separated by commas.]",
  ],
  signature: "[Your name]",

  // Milestones: use `days` or `months` from the start date.
  milestones: [
    { label: "Our first day", days: 1 },
    { label: "One week", days: 7 },
    { label: "One month", months: 1 },
    { label: "100 days", days: 100 },
    { label: "Six months", months: 6 },
    { label: "One year", months: 12 },
    { label: "500 days", days: 500 },
    { label: "Two years", months: 24 },
    { label: "1,000 days", days: 1000 },
    { label: "Three years", months: 36 },
  ],
};
