// Task system: generates a unique list of tasks per game
window.TASKS = {
  sampleTasks: [
    { desc: "Initialize project repository", prio: 2 },
    { desc: "Set up continuous integration", prio: 1 },
    { desc: "Implement user login", prio: 3 },
    { desc: "Design main dashboard UI", prio: 2 },
    { desc: "Write unit tests", prio: 2 },
    { desc: "Document API endpoints", prio: 1 },
    { desc: "Optimize database queries", prio: 3 },
    { desc: "Integrate third-party analytics", prio: 2 },
    { desc: "Deploy to production server", prio: 3 },
    { desc: "Review pull requests", prio: 1 },
    { desc: "Refactor legacy code", prio: 2 },
    { desc: "Conduct user feedback survey", prio: 1 },
    { desc: "Fix critical bugs", prio: 3 },
    { desc: "Update dependencies", prio: 2 },
    { desc: "Implement dark mode", prio: 1 },
    { desc: "Set up automated backups", prio: 2 }
  ],

  // Deterministic pseudo-random shuffle based on seed
  shuffle(arr, seed) {
    let a = arr.slice();
    let rnd = function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = a.length - 1; i > 0; i--) {
      let j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  generateTasks(count, seed) {
    let pool = this.shuffle(this.sampleTasks, seed);
    return pool.slice(0, count).map((t, i) => ({
      id: "task-" + i,
      desc: t.desc,
      prio: t.prio
    }));
  }
};