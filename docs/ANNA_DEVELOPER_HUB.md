# 🚀 Anna Developer Hub Reference & Architecture Guide

> Official documentation sitemap and architecture reference for building **Anna Apps**, **Executa Plugins**, and **Skills** on Anna AI OS.

---

## 📌 Architecture Overview

Anna AI OS empowers developers to build AI-native tools and applications with two main integration patterns:

1. **Executa Plugins (Tools)**:
   - Standalone executable processes speaking **JSON-RPC 2.0 over stdio**.
   - Language-agnostic (Python via `uv`, Node.js, Go, Rust, or pre-built binaries).
   - Methods:
     - `describe`: Exposes tool schemas and parameter contracts to the LLM.
     - `invoke`: Executes actions and returns structured envelopes `{"success": true, "data": ...}`.
     - `health`: Returns `{"status": "ready"}`.

2. **Anna Apps (UI + Executa + Manifest)**:
   - Complete sandboxed web applications bundled with interactive frontends and backend Executa plugins.
   - Mounted inside an iframe and bridged via `AnnaAppRuntime.connect()`.
   - Host RPC namespaces: `window.*`, `tools.*`, `storage.*`, `llm.*`, `web.*`, `image.*`, `upload.*`.

---

## 🛠️ Anna App Manifest Reference (Schema 2 & 3)

| Field | Type | Description |
|---|---|---|
| `schema` | integer | `2` (UI runtime enabled) or `3` (structured storage) |
| `required_executas` | array | Bundled Executa tool IDs required for installation |
| `host_capabilities` | array | Host capabilities (e.g. `aps.kv`, `llm.sample`, `web.search`) |
| `system_prompt_addendum` | string | Appended prompt instructions when `#`mentioned |
| `ui.bundle` | object | `{ "format": "static-spa", "entry": "index.html" }` |
| `ui.views` | array | UI window views (`main`, default size, min/max bounds) |
| `ui.host_api` | object | Allowed host RPC method names (`tools`, `storage`, `window`, `llm`) |

---

## ⚡ CLI Workflow (`@anna-ai/cli`)

- **Scaffold**: `anna-app init <dir> --slug <slug>`
- **Validate**: `anna-app validate --strict`
- **Run Local Harness**: `anna-app dev`
- **Publish**: `anna-app publish`
