// Implement This Plan - Core Game Logic
window.GAME = (function(){
  let state = {
    phase: 'start', // start, planning, executing, summary
    plan: [],
    plannedTasks: [],
    completedTasks: [],
    failedTasks: [],
    startTime: 0,
    endTime: 0,
    timer: 0,
    timeLimit: 0,
    score: 0,
    difficulty: 1,
    seed: Math.floor(Math.random()*1000000)
  };

  const PHASES = ['start', 'planning', 'executing', 'summary'];
  const DIFFICULTIES = [
    { label:'Easy', taskCount:8, time:330, id:1 },
    { label:'Normal', taskCount:12, time:380, id:2 },
    { label:'Hard', taskCount:16, time:420, id:3 }
  ];

  function startNewGame(diffId){
    let diff = DIFFICULTIES.find(d=>d.id===diffId) || DIFFICULTIES[1];
    state.phase = 'planning';
    state.difficulty = diffId;
    state.plan = [];
    state.completedTasks = [];
    state.failedTasks = [];
    state.startTime = 0;
    state.endTime = 0;
    state.timer = 0;
    state.score = 0;
    state.timeLimit = diff.time;
    state.plannedTasks = window.TASKS.generateTasks(diff.taskCount, state.seed);
    window.UI.render();
  }

  function startExecution(){
    state.phase = 'executing';
    state.completedTasks = [];
    state.failedTasks = [];
    state.startTime = Date.now();
    state.timer = state.timeLimit;
    window.UI.render();
    tickTimer();
  }

  function tickTimer(){
    if(state.phase!=='executing') return;
    let elapsed = Math.floor((Date.now()-state.startTime)/1000);
    state.timer = state.timeLimit - elapsed;
    if(state.timer <= 0){
      state.timer = 0;
      endGame();
      return;
    }
    window.UI.updateTimer(state.timer, state.timeLimit);
    window.UI.updateProgress();
    setTimeout(tickTimer, 1000);
  }

  function completeTask(idx){
    if(state.phase!=='executing') return;
    let task = state.plan[idx];
    if(task.completed || task.failed) return;
    task.completed = true;
    task.completedAt = Date.now();
    state.completedTasks.push(task);
    window.UI.updateTask(idx, task);
    window.UI.updateProgress();
    checkAutoAdvance(idx);
    if(state.completedTasks.length === state.plan.length){
      endGame();
    }
  }

  function failTask(idx){
    if(state.phase!=='executing') return;
    let task = state.plan[idx];
    if(task.completed || task.failed) return;
    task.failed = true;
    state.failedTasks.push(task);
    window.UI.updateTask(idx, task);
    window.UI.updateProgress();
    checkAutoAdvance(idx);
    if(state.completedTasks.length+state.failedTasks.length === state.plan.length){
      endGame();
    }
  }

  function checkAutoAdvance(idx){
    // If current completed, auto-scroll to next available
    let el = document.querySelector(`#g-task-${idx}`);
    if(el){
      let rect = el.getBoundingClientRect();
      if(rect.top < 40 || rect.bottom > (window.innerHeight-60)){
        el.scrollIntoView({behavior:'smooth',block:'center'});
      }
    }
  }

  function endGame(){
    state.phase = 'summary';
    state.endTime = Date.now();
    state.timer = 0;
    window.UI.render();
  }

  function planTask(idx, action){
    // Reorder or remove
    if(state.phase!=='planning') return;
    if(action==='up' && idx>0){
      [state.plan[idx-1], state.plan[idx]] = [state.plan[idx], state.plan[idx-1]];
    } else if(action==='down' && idx<state.plan.length-1){
      [state.plan[idx+1], state.plan[idx]] = [state.plan[idx], state.plan[idx+1]];
    } else if(action==='remove'){
      state.plan.splice(idx,1);
    }
    window.UI.renderPlanPanel();
  }

  function addTaskToPlan(taskIdx){
    if(state.phase!=='planning') return;
    let t = state.plannedTasks[taskIdx];
    if(state.plan.find(p=>p.id===t.id)) return;
    state.plan.push({...t});
    window.UI.renderPlanPanel();
  }

  function removeTaskFromPlan(planIdx){
    if(state.phase!=='planning') return;
    state.plan.splice(planIdx,1);
    window.UI.renderPlanPanel();
  }

  function resetToPlanning(){
    state.phase = 'planning';
    state.plan = [];
    state.completedTasks = [];
    state.failedTasks = [];
    state.startTime = 0;
    state.endTime = 0;
    state.timer = 0;
    window.UI.render();
  }

  function getScore(){
    if(state.phase!=='summary') return 0;
    let total = 0, completed = 0, failed = 0, prioSum = 0;
    for(let t of state.plan){
      if(t.completed) {
        completed++;
        total += t.prio*3 + 9;
      }
      if(t.failed) {
        failed++;
        total -= t.prio*2 + 6;
      }
      prioSum += t.prio;
    }
    // Time bonus
    let timeSpent = Math.floor((state.endTime-state.startTime)/1000);
    let timeBonus = Math.max(0, Math.round((state.timeLimit - timeSpent) * 2));
    total += timeBonus;
    return Math.max(0,total);
  }

  function getState(){
    return state;
  }

  function setPlanOrder(arr){
    if(state.phase!=='planning') return;
    state.plan = arr.map(id=>state.plannedTasks.find(t=>t.id===id));
    window.UI.renderPlanPanel();
  }

  return {
    PHASES, DIFFICULTIES,
    startNewGame, startExecution, completeTask, failTask,
    planTask, addTaskToPlan, removeTaskFromPlan, resetToPlanning,
    getScore, getState, setPlanOrder
  };
})();