# 🤖 Anna AI OS — Developer Apps & Executa Ecosystem

![Anna Platform](https://img.shields.io/badge/Anna_AI_OS-Developer_Apps-00f2fe?style=for-the-badge&logo=cpu&logoColor=white)
![Schema 2](https://img.shields.io/badge/Manifest_Schema-2_&_3-00f5a0?style=for-the-badge&logo=json)
![Python Executa](https://img.shields.io/badge/Executa_Plugin-Python_JSON--RPC_2.0-3776ab?style=for-the-badge&logo=python&logoColor=white)
![CLI Certified](https://img.shields.io/badge/@anna--ai/cli-Passed-brightgreen?style=for-the-badge)

Welcome to the official **Anna AI OS** developer repository containing production-ready Anna Apps, Executa plugins, and host API integrations.

---

## 📦 Featured Anna Apps

### 1. 🎯 [Focus Flow](./focus-flow) — Deep Work Studio
AI-powered Pomodoro timer, ambient soundscape synthesizer, and focus planner for Anna AI OS.
- **Key Features**:
  - Animated SVG radial progress ring with custom mode presets (Focus 25m, Short Break 5m, Long Break 15m).
  - Web Audio API Soundscape Synthesizer (Synthesizes Rain, Pink Noise, and 8Hz Binaural Alpha Waves directly in browser).
  - Executa Python Plugin tool `plan_focus_session`, `log_session`, `get_break_recommendation`, `get_analytics_summary`.
  - Host Storage persistence (`anna.storage.get` / `anna.storage.set`) and streak analytics.

### 2. 🍏 [0-Spoilage](./zero-spoilage) — Smart Pantry & Farm-to-Fork Studio
Perishable food waste prevention assistant built for agricultural logistics and home pantry management.
- **Key Features**:
  - Pantry Tracker with real-time expiry countdowns and color-coded urgency badges (Critical 🔴, Urgent 🟡, Safe 🟢).
  - AI Visual Quality & Ripeness Grading (Grade A Export / Grade B Market / Grade C Processing).
  - Zero-Waste Recipe Generator using expiring pantry ingredients.
  - Dynamic 4-Day Progressive Markdown Schedule (Day 0: 0% → Day 1: 15% → Day 2: 35% → Day 3: 60% Flash Sale).
  - Farm-to-Fork Traceability & Batch Harvest Storyteller.

---

## 🛠️ Project Structure

```text
ANNA-AI-OS/
├── focus-flow/                        # Anna App 1: Focus Flow Deep Work Studio
│   ├── manifest.json                  # Schema 2 Manifest
│   ├── app.json                       # Store listing metadata
│   ├── bundle/                        # Interactive SPA bundle (index.html, style.css, app.js)
│   └── executas/focus-flow/           # Python stdio JSON-RPC 2.0 Executa plugin
├── zero-spoilage/                     # Anna App 2: 0-Spoilage / AgriFresh Studio
│   ├── manifest.json                  # Schema 2 Manifest
│   ├── app.json                       # Store listing metadata
│   ├── executa.json                   # Executa launcher configuration
│   ├── bundle/                        # Interactive SPA bundle (index.html, style.css, app.js)
│   └── executas/zero-spoilage/        # Python stdio JSON-RPC 2.0 Executa plugin
├── docs/                              # Anna Developer Hub specifications
│   └── ANNA_DEVELOPER_HUB.md
├── .gitignore                         # Workspace gitignore rules
└── README.md                          # Master README
```

---

## ⚡ Quick Start & Local Harness Development

### Prerequisites
- **Node.js 22+**
- **uv** (Astral Python Manager)
- **`@anna-ai/cli`**:
  ```bash
  npm i -g @anna-ai/cli
  ```

### 1. Validate Anna Apps
Run validation against the Anna schema rules:

```bash
cd focus-flow
npx -y @anna-ai/cli validate --strict

cd ../zero-spoilage
npx -y @anna-ai/cli validate --strict
```

### 2. Launch Local Dev Harness
Run the local mock dashboard harness for any app:

```bash
cd focus-flow
npx -y @anna-ai/cli dev
```

Open `http://localhost:5180/` in your browser to interact with the mounted Anna App.

---

## 🤝 Verification & Submission Checklist

- [x] Schema 2 / 3 Manifest validation passed (`anna-app validate --strict`)
- [x] Stdio JSON-RPC 2.0 Executa plugin contract verified (`describe`, `health`, `invoke`)
- [x] Web Audio synth & Host API RPC bridge integrated (`AnnaAppRuntime.connect()`)
- [x] Persistent storage state management implemented (`anna.storage.*`)

---

*Built with ❤️ for Anna AI OS.*
