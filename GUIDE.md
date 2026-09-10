# 🍼 Logic Builder App — Complete Beginner's Guide ("Spoonfeeding Edition")

This guide explains **everything** step by step: what this project is, why it
matters (business value), how to run it, and how to verify everything works —
assuming **zero prior knowledge**.

---

## 1. What Is This Project? (Plain English)

**Logic Builder** is a learning tool that teaches beginners *how to think like
a programmer* — before they write real code.

The user walks through **6 guided steps**:

1. **Understand** the problem
2. **Plan** the logic
3. **Design a flowchart** (drag-and-drop, visual)
4. **Write pseudocode**
5. **Write real Python code** (executed *inside the browser*)
6. **Optimize** and check code style (PEP 8)

It's built as a **hybrid application**:

| Part | Technology | What it does |
|---|---|---|
| 🎨 **Frontend** | Next.js 16 + React 19 + TypeScript | The website the user sees and interacts with |
| 🐍 **Python Engine** | `uv`-managed Python + FastAPI | A "brain" that validates logic flows and checks code style |
| ⚡ **In-browser Python** | Pyodide (Python compiled to WebAssembly) | Runs the user's Python code instantly, no server needed |

---

## 2. Business Value 💰 (Why Does This Matter?)

### The problem it solves
Millions of people want to learn programming but quit early because:
- Tutorials show *code*, but never teach *how to think about a problem*
- Existing tools are either too childish (Scratch) or too intimidating (IDEs)

### The value proposition
| Value | Explanation |
|---|---|
| 🎯 **Fills the "thinking gap"** | Teaches problem decomposition — the #1 skill employers report missing in junior devs |
| 📈 **Market opportunity** | Learn-to-code is a multi-billion-dollar market; the "logic-first" pre-coding niche is underserved |
| ⚡ **Zero-friction UX** | Python runs in the browser (Pyodide) — no installs, no setup, works on a Chromebook |
| 🧪 **Instant, automated feedback** | The Python engine validates flowcharts & PEP 8 style automatically — one tool acts like a tutor for hundreds of students |
| 🏫 **B2B potential** | Schools, bootcamps, and corporate training can license it; teachers get auto-graded exercises for free |
| 🔧 **Future-proof architecture** | Frontend and Python engine are fully decoupled — each can scale, deploy, and evolve independently |
| 💸 **Lower hosting cost** | Heavy execution happens client-side (in the browser), so the server does lightweight validation only |

**One-line pitch:**
> *"Logic Builder turns 'I don't know where to start' into a step-by-step
> visual journey from problem → flowchart → working, style-clean Python code."*

---

## 3. Prerequisites (Install Once)

You need **3 tools**. Follow exactly:

### 3.1 Node.js (runs the frontend)
1. Go to <https://nodejs.org>
2. Download the **LTS** version
3. Install with all defaults (keep clicking "Next")
4. Open a **new** terminal and verify:
   ```bash
   node --version    # should print v20+ or higher
   npm --version     # should print 10+
   ```

### 3.2 uv (runs the Python engine)
`uv` is a super-fast Python package manager.

- **Windows** (PowerShell):
  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```
- **macOS / Linux**:
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
Then close and reopen your terminal, and verify:
```bash
uv --version    # should print 0.12+ or similar
```

> ⚠️ **You do NOT need to install Python manually.** `uv` handles Python
> versions for you.

### 3.3 VS Code (recommended editor)
Install from <https://code.visualstudio.com>, then open the project folder:
`File → Open Folder → logic-builder-app`

---

## 4. Running the Project (First Time)

Open a terminal **inside the project folder**:

```bash
cd path\to\logic-builder-app
```

### Step 1 — Install frontend dependencies
```bash
npm install
```
⏳ Takes 1–3 minutes. Downloads React, Next.js, etc. into `node_modules/`.

### Step 2 — Install Python dependencies
```bash
uv sync
```
⏳ Takes ~30 seconds. Creates `.venv/` (a private Python environment) and
installs FastAPI, pytest, black, flake8 automatically.

> 💡 `uv sync` reads `pyproject.toml` + `uv.lock` and installs **exactly**
> the versions everyone else on the team uses. No "works on my machine"
> problems.

### Step 3 — Start both servers
Open **two terminals**:

**Terminal A — the website:**
```bash
npm run dev
```
✅ Success looks like: `Ready on http://localhost:3000`

**Terminal B — the Python API:**
```bash
npm run py:api
```
✅ Success looks like: `Uvicorn running on http://127.0.0.1:8000`

### Step 4 — Look at it! 🎉
| URL | What you'll see |
|---|---|
| <http://localhost:3000> | The app homepage |
| <http://localhost:8000/docs> | Auto-generated interactive API docs (click "Try it out"!) |
| <http://localhost:8000/health> | Raw JSON: `{"status": "ok", "version": "0.1.0"}` |

To **stop** a server: press `Ctrl + C` in its terminal.

---

## 5. Checking That Everything Works ✔️

Run these from the project root. All should end in ✅.

### Frontend checks
```bash
npm run lint        # code style rules (ESLint) — no output = pass
npx tsc --noEmit    # type checking — no output = pass
npm test            # unit tests (Vitest) — expect "Tests 8 passed"
npm run build       # production build — expect "Compiled successfully"
```

### Python checks
```bash
npm run py:test     # engine tests — expect "11 passed"
npm run py:lint     # style check (flake8) — no output = pass
npm run py:format   # auto-fix formatting (black) — run anytime
npm run py:check    # formatting check + lint — no output = pass
```

### One command to rule them all 👑
```bash
npm run py:checks   # runs black check + flake8 + pytest together
```
Expected last line: `All checks passed.`

### Manual API test (copy-paste in a third terminal)
```bash
curl http://localhost:8000/health
```
Expected: `{"status":"ok","version":"0.1.0"}`

---

## 6. Project Map (What Lives Where)

```
logic-builder-app/
│
├── src/                        🎨 FRONTEND (TypeScript/React)
│   ├── app/                    Pages & routing (App Router)
│   ├── components/
│   │   └── layout/ThemeProvider.tsx   Light/dark mode switch
│   ├── store/
│   │   └── logicFlowStore.ts   Flowchart nodes & edges (zustand)
│   ├── lib/
│   │   ├── utils.ts            Small helpers (className merging)
│   │   ├── pyodide/runner.ts   Runs Python inside the browser
│   │   └── test-setup.ts       Test configuration
│   └── types/flow.ts           Shared TypeScript types
│
├── python_engine/              🐍 PYTHON ENGINE
│   ├── core/
│   │   ├── validation.py       FlowValidator — checks flowcharts
│   │   └── pep8_parser.py      parse_pep8 — checks code style
│   ├── api/
│   │   ├── main.py             FastAPI endpoints
│   │   └── schemas.py          Request/response data shapes
│   ├── scripts/run_checks.py   Runs all Python checks at once
│   ├── tests/                  Pytest test suite
│   └── README.md               Engine-specific docs
│
├── pyproject.toml              📋 Python dependencies & tool settings
├── uv.lock                     🔒 Exact locked Python versions
├── package.json                📋 Node dependencies & npm scripts
└── .venv/                      🗄️ Private Python env (auto-generated, never edit)
```

---

## 7. Cheat Sheet — Every Command

### Daily driving
| Command | What it does |
|---|---|
| `npm run dev` | Start website (dev mode, auto-reload) |
| `npm run py:api` | Start Python API server |
| `npm test` | Run frontend tests once |
| `npm run py:checks` | Run ALL Python quality checks |

### Less often
| Command | What it does |
|---|---|
| `npm install` | (Re)install Node packages after pulling changes |
| `uv sync` | (Re)install Python packages after pulling changes |
| `npm run build` | Production build (what gets deployed) |
| `npm run format` | Auto-format all frontend code (Prettier) |
| `npm run py:format` | Auto-format all Python code (Black) |
| `npm run test:coverage` | Tests + code-coverage report |
| `npm run lint:fix` | Auto-fix lint problems |

> 💡 **Golden rule:** before committing code, run `npm run lint`,
> `npm test`, and `npm run py:checks`. If all pass, you're safe.

---

## 8. Common Problems & Fixes 🔧

| Symptom | Cause | Fix |
|---|---|---|
| `'npm' is not recognized` | Node not installed, or terminal opened before install | Install Node, **close & reopen terminal** |
| `'uv' is not recognized` | uv not installed, or PATH not refreshed | Install uv, **close & reopen terminal** |
| `EADDRINUSE :3000` | Port already in use | Kill the old terminal, or `npm run dev -- -p 3001` |
| Tests fail with `Cannot find import "@/..."` | Dependencies out of date | `npm install`, then `npm test` again |
| `ModuleNotFoundError` in Python | Python env out of date | Run `uv sync` |
| Weird Python behavior | Stale virtualenv | Delete `.venv/`, run `uv sync` again |
| Build fails on CSS | Stale build cache | Delete `.next/`, run `npm run build` again |

---

## 9. How the Pieces Talk to Each Other 🔌

```
┌─────────────────────┐         ┌──────────────────────────┐
│  Browser            │         │  Python Engine (FastAPI) │
│  ┌───────────────┐  │  HTTP   │                          │
│  │ Next.js UI    │──┼────────►│  POST /validate/flow     │
│  │ (flowchart)   │  │  JSON   │  POST /parse/pep8        │
│  └───────┬───────┘  │         │  GET  /health            │
│          │          │         └──────────────────────────┘
│  ┌───────▼───────┐  │
│  │ Pyodide       │  │   User's Python code runs 100% locally
│  │ (in-browser)  │  │   — fast, private, zero server cost
│  └───────────────┘  │
└─────────────────────┘
```

- **Flowchart validation** → sent to the Python engine over HTTP
- **Code execution** → happens instantly in the browser via Pyodide
- **Style checking** → quick client-side parse + thorough engine check

---

## 10. New Team Member Onboarding Checklist ✅

Day 1, in order:

- [ ] Install Node.js, uv, VS Code (Section 3)
- [ ] `git clone <repo>` then `cd logic-builder-app`
- [ ] `npm install`
- [ ] `uv sync`
- [ ] `npm run dev` → open <http://localhost:3000> ✅
- [ ] `npm run py:api` → open <http://localhost:8000/docs> ✅
- [ ] `npm test` → 8 passed ✅
- [ ] `npm run py:checks` → "All checks passed." ✅
- [ ] Read `README.md` and `python_engine/README.md`
- [ ] You're productive. Welcome aboard! 🚀

---

*Last updated: September 2026 · Next.js 16.3.4 · uv 0.12+ · Python 3.12+*
