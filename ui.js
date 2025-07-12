window.UI = (function() {
  const $root = document.getElementById('game-root');

  function render() {
    const state = window.GAME.getState();
    $root.innerHTML = '';
    switch (state.phase) {
      case 'start': renderStartScreen(); break;
      case 'planning': renderPlanningScreen(); break;
      case 'executing': renderExecutingScreen(); break;
      case 'summary': renderSummaryScreen(); break;
    }
  }

  function renderStartScreen() {
    const panel = document.createElement('div');
    panel.className = 'g-panel';
    panel.innerHTML = `
      <div class="g-title">Implement This Plan</div>
      <div class="g-subtitle">
        Strategize, plan, and carry out your tasks efficiently.<br>
        <b>1. Plan</b> your task order.<br>
        <b>2. Implement</b> them, one by one.<br>
        <b>3. Beat the clock!</b>
      </div>
      <div class="g-section-title">Select Difficulty</div>
      <div id="g-diffbtns"></div>
    `;
    $root.appendChild(panel);
    const diffDiv = document.getElementById('g-diffbtns');
    window.GAME.DIFFICULTIES.forEach(d => {
      let btn = document.createElement('button');
      btn.className = 'g-btn';
      btn.innerText = d.label;
      btn.onclick = () => window.GAME.startNewGame(d.id);
      diffDiv.appendChild(btn);
    });
  }

  function renderPlanningScreen() {
    const state = window.GAME.getState();
    const panel = document.createElement('div');
    panel.className = 'g-panel';
    panel.innerHTML = `
      <div class="g-title">Plan Your Implementation</div>
      <div class="g-subtitle">Click "Add" to build your plan. Reorder with arrows. Remove if needed.<br>When ready, start implementing!</div>
      <div class="g-section-title">Available Tasks</div>
      <ul class="g-task-list" id="g-available-tasks"></ul>
      <div class="g-section-title" style="margin-top:14px;">Your Plan</div>
      <div id="g-plan-panel"></div>
      <button class="g-btn" id="g-btn-begin" style="margin-top:12px;">Start Implementing</button>
      <button class="g-btn" id="g-btn-back" style="margin-top:5px;">Back to Start</button>
    `;
    $root.appendChild(panel);

    const avail = document.getElementById('g-available-tasks');
    state.plannedTasks.forEach((t, i) => {
      let li = document.createElement('li');
      li.className = 'g-task';
      let inPlan = state.plan.find(p => p.id === t.id);
      li.innerHTML = `<span class="g-task-prio">P${t.prio}</span>
        <span class="g-task-desc">${t.desc}</span>`;
      let btn = document.createElement('button');
      btn.className = 'g-task-btn';
      btn.innerText = inPlan ? 'Added' : 'Add';
      btn.disabled = !!inPlan;
      btn.onclick = () => window.GAME.addTaskToPlan(i);
      li.appendChild(btn);
      avail.appendChild(li);
    });

    renderPlanPanel();

    document.getElementById('g-btn-begin').onclick = () => {
      if (state.plan.length < Math.floor(state.plannedTasks.length * 0.7)) {
        alert('Add more tasks to your plan before starting!');
        return;
      }
      window.GAME.startExecution();
    };
    document.getElementById('g-btn-back').onclick = () => {
      window.GAME.resetToPlanning();
      renderStartScreen();
    };
  }

  function renderPlanPanel() {
    let state = window.GAME.getState();
    let planDiv = document.getElementById('g-plan-panel');
    if (!planDiv) return;
    planDiv.innerHTML = '';
    if (!state.plan.length) {
      planDiv.innerHTML = `<div style="color:#888;margin:10px 0;">No tasks planned. Add some above!</div>`;
      return;
    }
    let ul = document.createElement('ul');
    ul.className = 'g-task-list';
    state.plan.forEach((t, i) => {
      let li = document.createElement('li');
      li.className = 'g-task';
      li.innerHTML = `<span class="g-task-prio">P${t.prio}</span>
        <span class="g-task-desc">${t.desc}</span>`;
      let upBtn = document.createElement('button');
      upBtn.className = 'g-plan-btn';
      upBtn.innerText = '↑';
      upBtn.onclick = () => window.GAME.planTask(i, 'up');
      upBtn.title = 'Move Up';
      let downBtn = document.createElement('button');
      downBtn.className = 'g-plan-btn';
      downBtn.innerText = '↓';
      downBtn.onclick = () => window.GAME.planTask(i, 'down');
      downBtn.title = 'Move Down';
      let rmBtn = document.createElement('button');
      rmBtn.className = 'g-plan-btn';
      rmBtn.innerText = '✕';
      rmBtn.onclick = () => window.GAME.planTask(i, 'remove');
      rmBtn.title = 'Remove';
      li.appendChild(upBtn);
      li.appendChild(downBtn);
      li.appendChild(rmBtn);
      ul.appendChild(li);
    });
    planDiv.appendChild(ul);
  }

  function renderExecutingScreen() {
    const state = window.GAME.getState();
    const panel = document.createElement('div');
    panel.className = 'g-panel';
    panel.innerHTML = `
      <div class="g-title">Implement Tasks</div>
      <div class="g-status-row">
        <span>${state.plan.length - state.completedTasks.length - state.failedTasks.length} left</span>
        <span class="g-timer" id="g-timer">${formatTime(state.timer)}</span>
      </div>
      <div class="g-progress-bar"><div class="g-progress-fill" id="g-progress-fill"></div></div>
      <ul class="g-task-list" id="g-exec-tasks"></ul>
      <button class="g-btn" id="g-btn-cancel" style="margin-top:10px;">Cancel to Plan</button>
    `;
    $root.appendChild(panel);

    renderExecTasks();

    document.getElementById('g-btn-cancel').onclick = () => window.GAME.resetToPlanning();
    updateTimer(state.timer, state.timeLimit);
    updateProgress();
  }

  function renderExecTasks() {
    const state = window.GAME.getState();
    const ul = document.getElementById('g-exec-tasks');
    ul.innerHTML = '';
    state.plan.forEach((t, i) => {
      let li = document.createElement('li');
      li.className = 'g-task';
      if (t.completed) li.classList.add('g-task-completed');
      if (t.failed) li.style.opacity = 0.5;
      li.id = 'g-task-' + i;
      li.innerHTML = `<span class="g-task-prio">P${t.prio}</span>
        <span class="g-task-desc">${t.desc}</span>`;
      if (!t.completed && !t.failed) {
        let btnC = document.createElement('button');
        btnC.className = 'g-task-btn';
        btnC.innerText = 'Complete';
        btnC.onclick = () => window.GAME.completeTask(i);
        let btnF = document.createElement('button');
        btnF.className = 'g-task-btn';
        btnF.innerText = 'Fail';
        btnF.onclick = () => window.GAME.failTask(i);
        li.appendChild(btnC);
        li.appendChild(btnF);
      } else if (t.completed) {
        let span = document.createElement('span');
        span.innerText = '✔';
        span.style.marginLeft = '10px';
        span.style.color = '#3884ff';
        li.appendChild(span);
      } else if (t.failed) {
        let span = document.createElement('span');
        span.innerText = '✖';
        span.style.marginLeft = '10px';
        span.style.color = '#ff3b3b';
        li.appendChild(span);
      }
      ul.appendChild(li);
    });
  }

  function renderSummaryScreen() {
    const state = window.GAME.getState();
    const score = window.GAME.getScore();
    const panel = document.createElement('div');
    panel.className = 'g-panel';
    panel.innerHTML = `
      <div class="g-title">Summary</div>
      <div class="g-summary">
        <b>Completed:</b> ${state.completedTasks.length}<br>
        <b>Failed:</b> ${state.failedTasks.length}<br>
        <b>Time Used:</b> ${formatTime(Math.floor((state.endTime - state.startTime) / 1000))}<br>
        <b>Score:</b> <span class="g-score">${score}</span>
      </div>
      <button class="g-btn" id="g-btn-retry">Retry</button>
      <button class="g-btn" id="g-btn-main">Back to Main Menu</button>
    `;
    $root.appendChild(panel);

    document.getElementById('g-btn-retry').onclick = () => window.GAME.resetToPlanning();
    document.getElementById('g-btn-main').onclick = () => {
      window.GAME.resetToPlanning();
      renderStartScreen();
    };
  }

  // Helper functions for timer and progress
  function formatTime(sec) {
    sec = Math.max(0, sec);
    let m = Math.floor(sec / 60), s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function updateTimer(timer, tot) {
    let el = document.getElementById('g-timer');
    if (el) el.innerText = formatTime(timer);
  }

  function updateProgress() {
    const state = window.GAME.getState();
    let pct = 0;
    if (state.plan.length) {
      pct = ((state.completedTasks.length + state.failedTasks.length) / state.plan.length) * 100;
    }
    let bar = document.getElementById('g-progress-fill');
    if (bar) bar.style.width = pct + '%';
  }

  function updateTask(idx, task) {
    renderExecTasks();
  }

  // Attach UI methods
  return {
    render,
    renderPlanPanel,
    updateTimer,
    updateProgress,
    updateTask
  };
})();