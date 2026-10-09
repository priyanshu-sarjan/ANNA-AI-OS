// 0-Spoilage Application Logic
import { AnnaAppRuntime } from "/static/anna-apps/_sdk/latest/index.js";

const TOOL_ID = "tool-dev-zero-spoilage";

const state = {
  anna: null,
  inventory: [
    { id: 1, name: "Fresh Spinach", category: "Produce", expiry_date: getFutureDate(1), quantity: "2 bunches", days_left: 1, urgency: "critical" },
    { id: 2, name: "Organic Milk", category: "Dairy", expiry_date: getFutureDate(2), quantity: "1 Litre", days_left: 2, urgency: "urgent" },
    { id: 3, name: "Cherry Tomatoes", category: "Produce", expiry_date: getFutureDate(4), quantity: "500g", days_left: 4, urgency: "warning" },
    { id: 4, name: "Whole Grain Bread", category: "Bakery", expiry_date: getFutureDate(6), quantity: "1 loaf", days_left: 6, urgency: "safe" }
  ],
  selectedIngredients: ["Fresh Spinach", "Organic Milk"]
};

function getFutureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
}

async function main() {
  // 1. Host Connection
  try {
    state.anna = await AnnaAppRuntime.connect();
    const statusEl = document.getElementById("connection-status");
    if (statusEl) {
      statusEl.textContent = "Host Connected";
      statusEl.className = "badge status-badge";
    }
    await state.anna.window.set_title({ title: "0-Spoilage — Smart Pantry & Farm-to-Fork Studio" });
  } catch (e) {
    const statusEl = document.getElementById("connection-status");
    if (statusEl) {
      statusEl.textContent = "Standalone Mode";
      statusEl.style.background = "rgba(255,255,255,0.1)";
      statusEl.style.color = "#94a3b8";
    }
  }

  // 2. Storage
  await loadInventoryFromStorage();

  // 3. UI Init
  initNavigation();
  initPantryUI();
  initGradingUI();
  initRecipesUI();
  initTraceabilityUI();

  // 4. Initial Render
  renderInventory();
  updateExpiringBadge();
}

/* ==========================================================================
   STORAGE LOGIC
   ========================================================================== */
async function loadInventoryFromStorage() {
  if (!state.anna) {
    try {
      const stored = localStorage.getItem("zero-spoilage:inventory");
      if (stored) state.inventory = JSON.parse(stored);
    } catch (_) {}
    return;
  }

  try {
    const res = await state.anna.storage.get({ key: "zero-spoilage:inventory" });
    if (res && res.value) {
      state.inventory = JSON.parse(res.value);
    }
  } catch (e) {
    console.warn("Storage load error:", e);
  }
}

async function saveInventoryToStorage() {
  const json = JSON.stringify(state.inventory);
  if (state.anna) {
    try { await state.anna.storage.set({ key: "zero-spoilage:inventory", value: json }); } catch (_) {}
  } else {
    localStorage.setItem("zero-spoilage:inventory", json);
  }
  updateExpiringBadge();
}

function updateExpiringBadge() {
  const expiringCount = state.inventory.filter(i => calculateDaysLeft(i.expiry_date) <= 3).length;
  const badge = document.getElementById("expiring-badge");
  if (badge) {
    badge.textContent = `${expiringCount} Expiring Soon`;
    badge.className = expiringCount > 0 ? "badge urgent-badge" : "badge status-badge";
  }
}

function calculateDaysLeft(expiryStr) {
  try {
    const exp = new Date(expiryStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    return diff;
  } catch (_) {
    return 999;
  }
}

function getUrgency(days) {
  if (days <= 1) return "critical";
  if (days <= 3) return "urgent";
  if (days <= 5) return "warning";
  return "safe";
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
   PANTRY TRACKER LOGIC
   ========================================================================== */
function initPantryUI() {
  const form = document.getElementById("add-grocery-form");
  const filterBtns = document.querySelectorAll(".inventory-filters .filter-btn");
  const btnScan = document.getElementById("btn-scan-expiring");

  // Default expiry date to 5 days from now
  const expiryInput = document.getElementById("item-expiry-input");
  if (expiryInput) expiryInput.value = getFutureDate(5);

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("item-name-input").value.trim();
      const cat = document.getElementById("item-category-select").value;
      const qty = document.getElementById("item-qty-input").value.trim() || "1";
      const exp = document.getElementById("item-expiry-input").value;

      if (!name || !exp) return;

      let newItem;
      if (state.anna) {
        try {
          const res = await state.anna.tools.invoke({
            tool_id: TOOL_ID,
            method: "add_grocery_item",
            args: { name, category: cat, expiry_date: exp, quantity: qty }
          });
          if (res && res.data && res.data.item) {
            newItem = res.data.item;
          }
        } catch (err) {
          console.warn("Executa add_grocery_item error:", err);
        }
      }

      if (!newItem) {
        const days = calculateDaysLeft(exp);
        newItem = {
          id: Date.now(),
          name,
          category: cat,
          expiry_date: exp,
          quantity: qty,
          days_left: days,
          urgency: getUrgency(days)
        };
      }

      state.inventory.unshift(newItem);
      document.getElementById("item-name-input").value = "";
      document.getElementById("item-qty-input").value = "";

      await saveInventoryToStorage();
      renderInventory();
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderInventory(btn.dataset.filter);
    });
  });

  if (btnScan) {
    btnScan.addEventListener("click", async () => {
      let expiringList = [];
      if (state.anna) {
        try {
          const res = await state.anna.tools.invoke({
            tool_id: TOOL_ID,
            method: "check_expiring_items",
            args: { days_threshold: 3 }
          });
          if (res && res.data && res.data.items) {
            expiringList = res.data.items;
          }
        } catch (e) {
          console.warn("Executa check_expiring_items error:", e);
        }
      }
      
      const filterUrgentBtn = document.querySelector('.inventory-filters .filter-btn[data-filter="urgent"]');
      if (filterUrgentBtn) filterUrgentBtn.click();
    });
  }
}

function renderInventory(filter = "all") {
  const container = document.getElementById("inventory-list");
  if (!container) return;

  let filtered = state.inventory.map((item) => {
    const days = calculateDaysLeft(item.expiry_date);
    return { ...item, days_left: days, urgency: getUrgency(days) };
  });

  if (filter === "critical") filtered = filtered.filter((i) => i.days_left <= 1);
  if (filter === "urgent") filtered = filtered.filter((i) => i.days_left <= 3);
  if (filter === "safe") filtered = filtered.filter((i) => i.days_left > 3);

  filtered.sort((a, b) => a.days_left - b.days_left);

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 32px;">No items match this filter. All clear!</div>`;
    return;
  }

  const getCatIcon = (cat) => {
    switch ((cat || "").toLowerCase()) {
      case "produce": return "🥦";
      case "fruits": return "🍎";
      case "dairy": return "🥛";
      case "bakery": return "🍞";
      case "meat": return "🥩";
      default: return "🥫";
    }
  };

  container.innerHTML = filtered
    .map(
      (item) => `
    <div class="item-row" data-id="${item.id}">
      <div class="item-left">
        <span class="item-icon">${getCatIcon(item.category)}</span>
        <div class="item-info">
          <span class="item-name">${escapeHtml(item.name)} <small style="color: var(--text-dim);">(${escapeHtml(item.quantity)})</small></span>
          <span class="item-meta">Category: ${escapeHtml(item.category)} • Expires: ${item.expiry_date}</span>
        </div>
      </div>
      <div class="item-right">
        <span class="badge badge-${item.urgency}">
          ${item.days_left <= 0 ? "EXPIRED" : item.days_left === 1 ? "1 Day Left" : item.days_left + " Days Left"}
        </span>
        <button class="btn btn-sm btn-secondary btn-cook-item" data-name="${escapeHtml(item.name)}">Cook Recipe</button>
        <button class="btn btn-sm btn-ghost btn-delete-item" data-id="${item.id}">✕</button>
      </div>
    </div>
  `
    )
    .join("");

  // Bind Events
  container.querySelectorAll(".btn-delete-item").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = parseInt(e.target.dataset.id, 10);
      state.inventory = state.inventory.filter((x) => x.id !== id);
      await saveInventoryToStorage();
      renderInventory(filter);
    });
  });

  container.querySelectorAll(".btn-cook-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const name = e.target.dataset.name;
      if (!state.selectedIngredients.includes(name)) {
        state.selectedIngredients.push(name);
      }
      document.querySelector('.nav-btn[data-tab="recipes"]')?.click();
      renderIngredientsTags();
      document.getElementById("btn-generate-recipes")?.click();
    });
  });
}

/* ==========================================================================
   AI QUALITY GRADING LOGIC
   ========================================================================== */
function initGradingUI() {
  const form = document.getElementById("grading-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const produce = document.getElementById("produce-name").value.trim();
    const cond = document.getElementById("visual-condition").value;
    const btn = document.getElementById("btn-run-grading");

    if (!produce) return;
    btn.disabled = true;
    btn.textContent = "Analyzing Quality...";

    try {
      let gradeData;
      if (state.anna) {
        const res = await state.anna.tools.invoke({
          tool_id: TOOL_ID,
          method: "analyze_produce_quality",
          args: { produce_name: produce, visual_condition: cond }
        });
        if (res && res.data) gradeData = res.data;
      }

      if (!gradeData) {
        gradeData = {
          produce_name: produce,
          commercial_grade: cond.includes("Fresh") ? "Grade A Export" : "Grade B Local Market",
          ripeness_percent: cond.includes("Fresh") ? 85 : 94,
          estimated_shelf_life_days: cond.includes("Fresh") ? 7 : 3,
          recommended_cold_storage: "4°C - 7°C (High Humidity)",
          markdown_schedule: cond.includes("Fresh") ? "Day 0: 0% Markdown" : "Day 1: 15% Markdown"
        };
      }

      renderGradingResults(gradeData);
    } catch (err) {
      alert("Error grading produce: " + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Run AI Quality Grading";
    }
  });
}

function renderGradingResults(data) {
  const card = document.getElementById("grading-results-card");
  if (!card) return;

  card.classList.remove("hidden");
  document.getElementById("grade-produce-title").textContent = `${data.produce_name} Quality Scorecard`;
  document.getElementById("grade-badge").textContent = data.commercial_grade;
  document.getElementById("grade-ripeness").textContent = `${data.ripeness_percent}%`;
  document.getElementById("grade-shelf").textContent = `${data.estimated_shelf_life_days} Days`;
  document.getElementById("grade-temp").textContent = data.recommended_cold_storage;
  document.getElementById("grade-markdown").textContent = data.markdown_schedule;
}

/* ==========================================================================
   RECIPES STUDIO LOGIC
   ========================================================================== */
function initRecipesUI() {
  const btnSelectExpiring = document.getElementById("btn-use-expiring-ingredients");
  const btnGenerate = document.getElementById("btn-generate-recipes");

  if (btnSelectExpiring) {
    btnSelectExpiring.addEventListener("click", () => {
      const expiring = state.inventory
        .filter((i) => calculateDaysLeft(i.expiry_date) <= 3)
        .map((i) => i.name);

      state.selectedIngredients = Array.from(new Set([...state.selectedIngredients, ...expiring]));
      renderIngredientsTags();
    });
  }

  if (btnGenerate) {
    btnGenerate.addEventListener("click", async () => {
      if (state.selectedIngredients.length === 0) {
        state.selectedIngredients = ["Spinach", "Tomatoes", "Milk"];
        renderIngredientsTags();
      }

      btnGenerate.disabled = true;
      btnGenerate.textContent = "Generating Zero-Waste Recipes...";

      try {
        let recipeData;
        if (state.anna) {
          const res = await state.anna.tools.invoke({
            tool_id: TOOL_ID,
            method: "generate_spoilage_prevention_recipes",
            args: { ingredients: state.selectedIngredients }
          });
          if (res && res.data) recipeData = res.data;
        }

        if (!recipeData) {
          recipeData = {
            recipes: [
              {
                title: `Zero-Waste ${state.selectedIngredients[0] || "Pantry"} Frittata`,
                prep_time: "15 mins",
                difficulty: "Easy",
                instructions: ["Sauté ingredients in olive oil.", "Pour 4 whisked eggs.", "Cook on low heat until firm."],
                storage_tip: "Refrigerate leftovers for up to 3 days."
              },
              {
                title: `Anti-Waste Harvest Soup`,
                prep_time: "20 mins",
                difficulty: "Easy",
                instructions: ["Dice ingredients and simmer in broth for 12 mins.", "Blend half for creamy texture."],
                storage_tip: "Freeze in portions for 2 months."
              }
            ]
          };
        }

        renderRecipesResults(recipeData.recipes);
      } catch (err) {
        alert("Error generating recipes: " + err.message);
      } finally {
        btnGenerate.disabled = false;
        btnGenerate.textContent = "Generate 3 Anti-Waste Recipes";
      }
    });
  }

  renderIngredientsTags();
}

function renderIngredientsTags() {
  const container = document.getElementById("selected-ingredients-tags");
  if (!container) return;

  if (state.selectedIngredients.length === 0) {
    container.innerHTML = `<span style="font-size: 0.85rem; color: var(--text-muted);">No ingredients selected yet. Click button above or select from Pantry.</span>`;
    return;
  }

  container.innerHTML = state.selectedIngredients
    .map(
      (ing) => `
    <span class="tag-badge">
      ${escapeHtml(ing)}
    </span>
  `
    )
    .join("");
}

function renderRecipesResults(recipes) {
  const container = document.getElementById("recipes-results-grid");
  if (!container) return;

  container.innerHTML = recipes
    .map(
      (r) => `
    <div class="recipe-card">
      <div>
        <h4>${escapeHtml(r.title)}</h4>
        <div class="recipe-meta">
          <span>⏱️ ${r.prep_time}</span>
          <span>⚡ ${r.difficulty}</span>
        </div>
        <ol class="recipe-instructions">
          ${(r.instructions || []).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ol>
      </div>
      <div style="font-size: 0.8rem; color: var(--accent-emerald); background: rgba(0,245,160,0.08); padding: 8px 12px; border-radius: 6px; margin-top: 12px;">
        💡 <strong>Storage:</strong> ${escapeHtml(r.storage_tip || "Eat fresh!")}
      </div>
    </div>
  `
    )
    .join("");
}

/* ==========================================================================
   FARM TRACEABILITY LOGIC
   ========================================================================== */
function initTraceabilityUI() {
  const btnTrace = document.getElementById("btn-trace-batch");
  if (!btnTrace) return;

  btnTrace.addEventListener("click", () => {
    const batchId = document.getElementById("batch-id-input").value.trim() || "BATCH-2026-SPINACH-09";
    document.getElementById("trace-output").classList.remove("hidden");
  });
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main();
