// Focus Flow — Deep Work Studio Application Logic
import { AnnaAppRuntime } from "/static/anna-apps/_sdk/latest/index.js";

const TOOL_ID = "tool-dev-focus-flow";

// Application State
const state = {
  anna: null,
  timerMode: "focus", // 'focus', 'short_break', 'long_break'
  totalSeconds: 25 * 60,
  secondsRemaining: 25 * 60,
  isRunning: false,
  timerInterval: null,
  activeTask: "Deep Work Session",
  subtasks: [],
  tasks: [],
  sessionHistory: [],
  streakDays: 1,
  
  // Ambient Sound Web Audio Contexts
  audioCtx: null,
  sounds: {
    rain: { node: null, gainNode: null, isPlaying: false, vol: 0.5 },
    pink: { node: null, gainNode: null, isPlaying: false, vol: 0.4 },
    binaural: { leftOsc: null, rightOsc: null, gainNode: null, isPlaying: false, vol: 0.3 }
  }
};

const CIRCUMFERENCE = 753.98; // 2 * PI * 120

async function main() {
  // 1. Initialize Host Connection
  try {
    state.anna = await AnnaAppRuntime.connect();
    const statusEl = document.getElementById("connection-status");
    if (statusEl) {
      statusEl.textContent = "Host Connected";
      statusEl.className = "badge status-badge";
    }
    await state.anna.window.set_title({ title: "Focus Flow — Deep Work Studio" });
  } catch (e) {
    const statusEl = document.getElementById("connection-status");
    if (statusEl) {
      statusEl.textContent = "Standalone Mode";
      statusEl.style.background = "rgba(255,255,255,0.1)";
      statusEl.style.color = "#9ca3af";
    }
  }

  // 2. Load Persisted Storage
  await loadStateFromStorage();

  // 3. Initialize UI Event Handlers
  initNavigation();
  initTimerUI();
  initSoundscape();
  initAIPlanner();
  initTasksUI();
  initAnalyticsUI();

  // 4. Update UI
  updateTimerDisplay();
  renderTasks();
  renderAnalytics();
}

/* ==========================================================================
   STORAGE LOGIC
   ========================================================================== */
async function loadStateFromStorage() {
  if (!state.anna) {
    // LocalStorage Fallback
    try {
      const storedTasks = localStorage.getItem("focus-flow:tasks");
      if (storedTasks) state.tasks = JSON.parse(storedTasks);
      const storedHist = localStorage.getItem("focus-flow:history");
      if (storedHist) state.sessionHistory = JSON.parse(storedHist);
    } catch (_) {}
    return;
  }

  try {
    const tasksRes = await state.anna.storage.get({ key: "focus-flow:tasks" });
    if (tasksRes && tasksRes.value) state.tasks = JSON.parse(tasksRes.value);
    
    const histRes = await state.anna.storage.get({ key: "focus-flow:history" });
    if (histRes && histRes.value) state.sessionHistory = JSON.parse(histRes.value);
  } catch (err) {
    console.warn("Storage load error:", err);
  }
}

async function saveTasksToStorage() {
  const json = JSON.stringify(state.tasks);
  if (state.anna) {
    try { await state.anna.storage.set({ key: "focus-flow:tasks", value: json }); } catch (_) {}
  } else {
    localStorage.setItem("focus-flow:tasks", json);
  }
}

async function saveHistoryToStorage() {
  const json = JSON.stringify(state.sessionHistory);
  if (state.anna) {
    try { await state.anna.storage.set({ key: "focus-flow:history", value: json }); } catch (_) {}
  } else {
    localStorage.setItem("focus-flow:history", json);
  }
}

/* ==========================================================================
   NAVIGATION LOGIC
   ========================================================================== */
function initNavigation() {
  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;
      navBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".tab-page").forEach((page) => {
        page.classList.remove("active");
        if (page.id === `tab-${tabName}`) {
          page.classList.add("active");
        }
      });
    });
  });
}

/* ==========================================================================
   TIMER STUDIO & RADIAL PROGRESS LOGIC
   ========================================================================== */
function initTimerUI() {
  const btnStart = document.getElementById("btn-start");
  const btnPause = document.getElementById("btn-pause");
  const btnReset = document.getElementById("btn-reset");
  const btnSkip = document.getElementById("btn-skip");
  const modeBtns = document.querySelectorAll(".mode-btn");

  const taskInput = document.getElementById("active-task-input");
  const btnSetTask = document.getElementById("btn-set-task");

  // Mode Selection
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const mode = btn.dataset.mode;
      const mins = parseInt(btn.dataset.duration, 10);
      setTimerMode(mode, mins);
    });
  });

  // Start & Pause
  btnStart.addEventListener("click", startTimer);
  btnPause.addEventListener("click", pauseTimer);
  btnReset.addEventListener("click", resetTimer);
  btnSkip.addEventListener("click", skipTimer);

  // Set Active Task
  if (btnSetTask && taskInput) {
    btnSetTask.addEventListener("click", () => {
      if (taskInput.value.trim()) {
        state.activeTask = taskInput.value.trim();
        document.getElementById("current-task-label").textContent = state.activeTask;
      }
    });
  }

  // Modal handlers
  document.getElementById("btn-close-modal")?.addEventListener("click", closeModal);
  document.getElementById("btn-dismiss-modal")?.addEventListener("click", closeModal);
  document.getElementById("btn-start-break")?.addEventListener("click", () => {
    closeModal();
    const breakBtn = document.querySelector('.mode-btn[data-mode="short_break"]');
    if (breakBtn) breakBtn.click();
    startTimer();
  });
}

function setTimerMode(mode, minutes) {
  pauseTimer();
  state.timerMode = mode;
  state.totalSeconds = minutes * 60;
  state.secondsRemaining = state.totalSeconds;

  const ringFill = document.getElementById("timer-progress-ring");
  if (ringFill) {
    ringFill.style.stroke = mode === "focus" ? "url(#ringGradient)" : "url(#breakGradient)";
  }

  const statusText = document.getElementById("timer-status-text");
  if (statusText) {
    statusText.textContent = mode === "focus" ? "Ready to Focus" : "Refresh Break Time";
  }

  updateTimerDisplay();
}

function startTimer() {
  if (state.isRunning) return;
  state.isRunning = true;

  document.getElementById("btn-start").classList.add("hidden");
  document.getElementById("btn-pause").classList.remove("hidden");
  document.getElementById("timer-status-text").textContent =
    state.timerMode === "focus" ? "Deep Focus in Progress" : "Break Time";

  state.timerInterval = setInterval(() => {
    state.secondsRemaining--;
    updateTimerDisplay();

    if (state.secondsRemaining <= 0) {
      onTimerComplete();
    }
  }, 1000);
}

function pauseTimer() {
  state.isRunning = false;
  clearInterval(state.timerInterval);
  document.getElementById("btn-start").classList.remove("hidden");
  document.getElementById("btn-pause").classList.add("hidden");
  document.getElementById("timer-status-text").textContent = "Paused";
}

function resetTimer() {
  pauseTimer();
  state.secondsRemaining = state.totalSeconds;
  document.getElementById("timer-status-text").textContent = "Reset";
  updateTimerDisplay();
}

function skipTimer() {
  pauseTimer();
  state.secondsRemaining = 0;
  updateTimerDisplay();
  onTimerComplete();
}

function updateTimerDisplay() {
  const mins = Math.floor(state.secondsRemaining / 60);
  const secs = state.secondsRemaining % 60;
  const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  document.getElementById("timer-countdown").textContent = timeStr;

  // Progress ring dashoffset
  const progress = state.secondsRemaining / state.totalSeconds;
  const offset = CIRCUMFERENCE * (1 - progress);
  const ringFill = document.getElementById("timer-progress-ring");
  if (ringFill) {
    ringFill.style.strokeDashoffset = offset;
  }
}

async function onTimerComplete() {
  pauseTimer();
  playNotificationSound();

  const completedMins = Math.round(state.totalSeconds / 60);
  let logResult = null;
  let breakRec = null;

  // Invoke Executa Tool for Logging
  if (state.anna) {
    try {
      const res = await state.anna.tools.invoke({
        tool_id: TOOL_ID,
        method: "log_session",
        args: {
          task_name: state.activeTask,
          duration_minutes: completedMins,
          mode: state.timerMode
        }
      });
      if (res && res.data) logResult = res.data;
    } catch (e) {
      console.warn("Executa log_session error:", e);
    }

    if (state.timerMode === "focus") {
      try {
        const breakRes = await state.anna.tools.invoke({
          tool_id: TOOL_ID,
          method: "get_break_recommendation",
          args: { focus_duration: completedMins }
        });
        if (breakRes && breakRes.data) breakRec = breakRes.data;
      } catch (e) {
        console.warn("Executa break rec error:", e);
      }
    }
  }

  // Push into Session History
  const sessionEntry = {
    timestamp: new Date().toLocaleString(),
    task_name: state.activeTask,
    mode: state.timerMode,
    duration_minutes: completedMins,
    score: logResult ? logResult.productivity_score : 100
  };
  state.sessionHistory.unshift(sessionEntry);
  await saveHistoryToStorage();
  renderAnalytics();

  // Show Modal if focus mode
  if (state.timerMode === "focus") {
    showBreakModal(completedMins, breakRec);
  }
}

function showBreakModal(mins, breakRec) {
  const modal = document.getElementById("break-modal");
  if (!modal) return;

  document.getElementById("modal-message").textContent = `🎉 You completed ${mins} minutes of deep work!`;
  
  if (breakRec) {
    document.getElementById("break-rec-title").textContent = breakRec.title;
    const stepsList = document.getElementById("break-rec-steps");
    stepsList.innerHTML = breakRec.steps.map(step => `<li>${step}</li>`).join("");
  } else {
    document.getElementById("break-rec-title").textContent = "Hydrate & Stretch";
    document.getElementById("break-rec-steps").innerHTML = `<li>Drink a glass of water.</li><li>Stretch your back and rest your eyes.</li>`;
  }

  modal.classList.remove("hidden");
}

function closeModal() {
  document.getElementById("break-modal")?.classList.add("hidden");
}

/* ==========================================================================
   AMBIENT AUDIO SOUNDSCAPE SYNTHESIZER
   ========================================================================== */
function getAudioContext() {
  if (!state.audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    state.audioCtx = new AudioCtx();
  }
  if (state.audioCtx.state === "suspended") {
    state.audioCtx.resume();
  }
  return state.audioCtx;
}

function initSoundscape() {
  const toggleBtns = document.querySelectorAll(".sound-toggle-btn");
  const volumeSliders = document.querySelectorAll(".sound-volume");

  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const soundKey = btn.dataset.sound;
      toggleSound(soundKey, btn);
    });
  });

  volumeSliders.forEach((slider) => {
    slider.addEventListener("input", () => {
      const soundKey = slider.dataset.sound;
      const vol = parseFloat(slider.value);
      state.sounds[soundKey].vol = vol;
      if (state.sounds[soundKey].gainNode) {
        state.sounds[soundKey].gainNode.gain.value = vol;
      }
    });
  });
}

function toggleSound(soundKey, btn) {
  const ctx = getAudioContext();
  const s = state.sounds[soundKey];

  if (s.isPlaying) {
    // Stop
    if (soundKey === "binaural") {
      s.leftOsc?.stop();
      s.rightOsc?.stop();
    } else {
      s.node?.stop();
    }
    s.isPlaying = false;
    btn.classList.remove("playing");
    btn.textContent = "Play";
  } else {
    // Start Synthesizer
    s.gainNode = ctx.createGain();
    s.gainNode.gain.value = s.vol;
    s.gainNode.connect(ctx.destination);

    if (soundKey === "rain" || soundKey === "pink") {
      // Noise Buffer
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (soundKey === "pink") {
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          data[i] *= 0.11;
          b6 = white * 0.115926;
        } else {
          // Rain Filtered Noise
          data[i] = white * 0.2;
        }
      }

      s.node = ctx.createBufferSource();
      s.node.buffer = buffer;
      s.node.loop = true;

      if (soundKey === "rain") {
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 800;
        s.node.connect(filter);
        filter.connect(s.gainNode);
      } else {
        s.node.connect(s.gainNode);
      }
      s.node.start();
    } else if (soundKey === "binaural") {
      // 8Hz Binaural Beat (200Hz left, 208Hz right)
      s.leftOsc = ctx.createOscillator();
      s.rightOsc = ctx.createOscillator();

      s.leftOsc.frequency.value = 200;
      s.rightOsc.frequency.value = 208;

      const merger = ctx.createChannelMerger(2);
      s.leftOsc.connect(merger, 0, 0);
      s.rightOsc.connect(merger, 0, 1);

      merger.connect(s.gainNode);
      s.leftOsc.start();
      s.rightOsc.start();
    }

    s.isPlaying = true;
    btn.classList.add("playing");
    btn.textContent = "Stop";
  }
}

function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.3); // E5

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (_) {}
}

/* ==========================================================================
   AI FOCUS PLANNER LOGIC
   ========================================================================== */
function initAIPlanner() {
  const form = document.getElementById("ai-planner-form");
  const quickPlanBtn = document.getElementById("btn-quick-plan");
  const applyBtn = document.getElementById("btn-apply-plan");

  if (quickPlanBtn) {
    quickPlanBtn.addEventListener("click", () => {
      document.querySelector('.nav-btn[data-tab="ai-planner"]')?.click();
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const goal = document.getElementById("planner-goal-input").value.trim();
      const mins = parseFloat(document.getElementById("planner-minutes-input").value) || 60;
      if (!goal) return;

      const btn = document.getElementById("btn-generate-plan");
      btn.disabled = true;
      btn.innerHTML = `<span>Generating Plan...</span>`;

      try {
        let planData;
        if (state.anna) {
          const res = await state.anna.tools.invoke({
            tool_id: TOOL_ID,
            method: "plan_focus_session",
            args: { goal, available_minutes: mins }
          });
          planData = res.data;
        } else {
          // Fallback simulation
          planData = {
            goal,
            total_minutes: mins,
            recommended_blocks: Math.ceil(mins / 30),
            subtasks: [
              `Analyze requirements for ${goal}`,
              `Execute Deep Work Interval 1`,
              `Refactor & run tests`
            ],
            tips: "Keep phone silenced during focus blocks."
          };
        }

        renderPlanOutput(planData);
      } catch (err) {
        alert("Error generating plan: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Generate Focus Plan</span>`;
      }
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const goalTitle = document.getElementById("plan-goal-title").textContent.replace("Goal: ", "");
      state.activeTask = goalTitle;
      document.getElementById("current-task-label").textContent = state.activeTask;

      // Append subtasks to task board
      state.subtasks.forEach((sub, i) => {
        state.tasks.unshift({
          id: Date.now() + i,
          title: sub,
          priority: i === 0 ? "high" : "medium",
          est: 1,
          completed: false
        });
      });
      saveTasksToStorage();
      renderTasks();

      // Switch to timer tab
      document.querySelector('.nav-btn[data-tab="timer"]')?.click();
    });
  }
}

function renderPlanOutput(plan) {
  const outputCard = document.getElementById("planner-output-card");
  outputCard.classList.remove("hidden");

  document.getElementById("plan-goal-title").textContent = `Goal: ${plan.goal}`;
  document.getElementById("meta-total-time").textContent = `${plan.total_minutes} mins`;
  document.getElementById("meta-blocks").textContent = `${plan.recommended_blocks} Sessions`;

  const list = document.getElementById("plan-subtasks-list");
  state.subtasks = plan.subtasks || [];
  list.innerHTML = state.subtasks.map((st) => `<li>🔹 ${st}</li>`).join("");

  document.getElementById("plan-tips").innerHTML = `💡 <strong>AI Tip:</strong> ${plan.tips || "Stay focused!"}`;
}

/* ==========================================================================
   TASKS MANAGER LOGIC
   ========================================================================== */
function initTasksUI() {
  const form = document.getElementById("add-task-form");
  const filterBtns = document.querySelectorAll(".filter-btn");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("task-title-input").value.trim();
      const prio = document.getElementById("task-priority-input").value;
      const est = parseInt(document.getElementById("task-est-input").value, 10) || 1;

      if (!title) return;

      state.tasks.unshift({
        id: Date.now(),
        title,
        priority: prio,
        est,
        completed: false
      });

      document.getElementById("task-title-input").value = "";
      saveTasksToStorage();
      renderTasks();
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderTasks(btn.dataset.filter);
    });
  });
}

function renderTasks(filter = "all") {
  const container = document.getElementById("tasks-list");
  if (!container) return;

  let filtered = state.tasks;
  if (filter === "pending") filtered = state.tasks.filter((t) => !t.completed);
  if (filter === "completed") filtered = state.tasks.filter((t) => t.completed);

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">No tasks found. Add a task above to start!</div>`;
    return;
  }

  container.innerHTML = filtered
    .map(
      (task) => `
    <div class="task-item ${task.completed ? "completed" : ""}" data-id="${task.id}">
      <div class="task-left">
        <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} data-id="${task.id}" />
        <span class="task-name">${escapeHtml(task.title)}</span>
        <span class="task-prio prio-${task.priority}">${task.priority}</span>
      </div>
      <div class="task-actions">
        <button class="btn btn-sm btn-secondary btn-focus-target" data-id="${task.id}">Target</button>
        <button class="btn btn-sm btn-ghost btn-delete-task" data-id="${task.id}">✕</button>
      </div>
    </div>
  `
    )
    .join("");

  // Bind Events
  container.querySelectorAll(".task-checkbox").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const id = parseInt(e.target.dataset.id, 10);
      const t = state.tasks.find((x) => x.id === id);
      if (t) {
        t.completed = e.target.checked;
        saveTasksToStorage();
        renderTasks(filter);
      }
    });
  });

  container.querySelectorAll(".btn-delete-task").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(e.target.dataset.id, 10);
      state.tasks = state.tasks.filter((x) => x.id !== id);
      saveTasksToStorage();
      renderTasks(filter);
    });
  });

  container.querySelectorAll(".btn-focus-target").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(e.target.dataset.id, 10);
      const t = state.tasks.find((x) => x.id === id);
      if (t) {
        state.activeTask = t.title;
        document.getElementById("current-task-label").textContent = state.activeTask;
        document.querySelector('.nav-btn[data-tab="timer"]')?.click();
      }
    });
  });
}

/* ==========================================================================
   ANALYTICS & STATS LOGIC
   ========================================================================== */
function initAnalyticsUI() {
  document.getElementById("btn-clear-history")?.addEventListener("click", async () => {
    if (confirm("Clear all session history?")) {
      state.sessionHistory = [];
      await saveHistoryToStorage();
      renderAnalytics();
    }
  });
}

function renderAnalytics() {
  const focusSessions = state.sessionHistory.filter((s) => s.mode === "focus");
  const totalMins = focusSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const totalHours = (totalMins / 60).toFixed(1);
  const completedCount = focusSessions.length;

  document.getElementById("stat-total-hours").textContent = `${totalHours} hrs`;
  document.getElementById("stat-completed-sessions").textContent = completedCount;
  document.getElementById("stat-streak").textContent = `${state.streakDays} Day${state.streakDays > 1 ? "s" : ""}`;

  let rating = "Getting Started";
  if (totalMins >= 240) rating = "Grandmaster";
  else if (totalMins >= 120) rating = "Master of Focus";
  else if (totalMins >= 60) rating = "Deep Work Pro";
  else if (totalMins >= 25) rating = "On Track";

  document.getElementById("stat-rating").textContent = rating;

  // History Table
  const tbody = document.getElementById("history-table-body");
  if (!tbody) return;

  if (state.sessionHistory.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No sessions logged yet. Complete a timer to record history!</td></tr>`;
    return;
  }

  tbody.innerHTML = state.sessionHistory
    .slice(0, 20)
    .map(
      (s) => `
    <tr>
      <td>${s.timestamp}</td>
      <td><strong>${escapeHtml(s.task_name)}</strong></td>
      <td><span class="badge ${s.mode === "focus" ? "ai-badge" : "status-badge"}">${s.mode}</span></td>
      <td>${s.duration_minutes} mins</td>
      <td><span style="color: var(--accent-emerald); font-weight: 600;">${s.score}%</span></td>
    </tr>
  `
    )
    .join("");
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main();
