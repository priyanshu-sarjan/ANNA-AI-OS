# 🤖 Anna AI OS — Developer Apps & Executa Ecosystem

![Anna Platform](https://img.shields.io/badge/Anna_AI_OS-Founding_Builder_Challenge_2026-00f2fe?style=for-the-badge&logo=cpu&logoColor=white)
![Participant](https://img.shields.io/badge/Participant-Priyanshu_Sarjan-00f5a0?style=for-the-badge&logo=github&logoColor=white)
![Schema 3](https://img.shields.io/badge/Manifest_Schema-3_Latest-a855f7?style=for-the-badge&logo=json)
![Python Executa](https://img.shields.io/badge/Executa_Plugin-Python_JSON--RPC_2.0-3776ab?style=for-the-badge&logo=python&logoColor=white)
![CLI Certified](https://img.shields.io/badge/@anna--ai/cli-Passed-brightgreen?style=for-the-badge)

Welcome to the official **Anna AI OS** repository for the **Anna AI OS Founding Builder Challenge 2026** ($80,000 Monthly Grant Pool). This repository contains production-ready, Schema-3 validated Anna Apps built with interactive web UIs, stdio JSON-RPC 2.0 Executa plugins, and host storage persistence.

---

## 👨‍💻 Participant Details
- **Builder**: Priyanshu Sarjan
- **Email**: priyanshusarjan@gmail.com
- **Challenge**: Anna AI OS Founding Builder Challenge 2026
- **Grant Target**: 200+ Qualified App MAU ($80,000 Monthly Grant Pool)

---

## 📦 Featured Anna Apps

### 1. 🎯 [Focus Flow](./focus-flow) — Deep Work Studio (Schema 3)
AI-powered Pomodoro timer, ambient soundscape synthesizer, and focus planner for Anna AI OS.
- **Qualified App Run Trigger**: Initiates a 25-minute deep focus block, generates AI focus session plans (`plan_focus_session`), and logs productivity metrics (`log_session`).
- **Key Features**:
  - Animated SVG radial progress ring with mode presets (Focus 25m, Short Break 5m, Long Break 15m).
  - Web Audio API Soundscape Synthesizer (Synthesizes Rain, Pink Noise, and 8Hz Binaural Alpha Waves directly in browser).
  - Executa Python Plugin tools: `plan_focus_session`, `log_session`, `get_break_recommendation`, `get_analytics_summary`.
  - Host Storage persistence (`anna.storage.get` / `anna.storage.set`) and streak analytics.

### 2. 🍏 [0-Spoilage](./zero-spoilage) — Smart Pantry & Farm-to-Fork Studio (Schema 3)
Perishable food waste prevention assistant built for agricultural logistics and home pantry management.
- **Qualified App Run Trigger**: Scans inventory for expiring items (`check_expiring_items`), grades produce quality (`analyze_produce_quality`), and generates zero-waste recipes (`generate_spoilage_prevention_recipes`).
- **Key Features**:
  - Pantry Tracker with real-time expiry countdowns and color-coded urgency badges (Critical 🔴, Urgent 🟡, Safe 🟢).
  - AI Visual Quality & Ripeness Grading (Grade A Export / Grade B Market / Grade C Processing).
  - Zero-Waste Recipe Generator using expiring pantry ingredients.
  - Dynamic 4-Day Progressive Markdown Schedule (Day 0: 0% → Day 1: 15% → Day 2: 35% → Day 3: 60% Flash Sale).
  - Farm-to-Fork Traceability & Batch Harvest Storyteller.

---

## 🛠️ Project Architecture

```text
ANNA-AI-OS/
├── focus-flow/                        # Anna App 1: Focus Flow Deep Work Studio (Schema 3)
│   ├── manifest.json                  # Schema 3 Manifest (ui.host_api + storage.kv)
│   ├── app.json                       # Store listing metadata
│   ├── bundle/                        # Interactive SPA bundle (index.html, style.css, app.js)
│   └── executas/focus-flow/           # Python stdio JSON-RPC 2.0 Executa plugin
├── zero-spoilage/                     # Anna App 2: 0-Spoilage / AgriFresh Studio (Schema 3)
│   ├── manifest.json                  # Schema 3 Manifest (ui.host_api + storage.kv)
│   ├── app.json                       # Store listing metadata
│   ├── executa.json                   # Executa launcher configuration
│   ├── bundle/                        # Interactive SPA bundle (index.html, style.css, app.js)
│   └── executas/zero-spoilage/        # Python stdio JSON-RPC 2.0 Executa plugin
├── docs/                              # Anna Developer Hub & Competition specifications
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

### 1. Validate Anna Apps (Schema 3)
Run validation against the latest Anna schema rules:

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

## 🏆 Founding Builder Grant Tiers & Rules

- **200+ MAU** — $50/month
- **500+ MAU** — $100/month
- **1,000+ MAU** — $200/month
- **4,000+ MAU** — $1,000/month
- **10,000+ MAU** — $2,500/month
- **20,000+ MAU** — $5,000/month

---

*Built with ❤️ by Priyanshu Sarjan for the Anna AI OS Founding Builder Challenge 2026.*
