# 🧠 Logic Builder

A 6-step guided web app that teaches programming beginners how to think like 
programmers — from understanding a problem to writing optimized Python code.

**🌐 Live Demo:** [logic-builder-app.vercel.app](https://logic-builder-app.vercel.app)

---

## 📖 What It Does

Logic Builder walks users through **6 guided steps** to solve a programming 
problem — not just writing code, but understanding the thinking behind it.

Example: A user writes "Check if a number is even or odd", and the app helps 
them break it down, design a flowchart, write Python code, and test it — 
all in the browser.

---

## 🎯 The 6 Steps

1. **Problem Statement** — Define inputs, outputs, and rules
2. **Requirements Analysis** — Identify data, tools, and concepts needed
3. **Algorithm Design** — Write pseudocode, get an auto-generated flowchart
4. **Code Writing** — Write Python code with PEP 8 validation
5. **Testing** — Auto-generate test cases, run them in-browser
6. **Optimization** — Analyze complexity and get refactoring suggestions

---

## 🚀 Features

- ✅ 6-step guided workflow (not just a code editor)
- ✅ Auto-generated flowchart from pseudocode
- ✅ Auto-generated test cases (5-6 per problem)
- ✅ Code complexity analysis (Big-O detection)
- ✅ Smart refactoring suggestions
- ✅ PEP 8 style validation
- ✅ Real Python execution via Pyodide (WebAssembly)
- ✅ Works entirely in the browser

---

## 🛠 Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19** + **TypeScript**
- **Tailwind CSS 4** (styling)
- **Zustand** (state management)
- **Framer Motion** (animations)
- **Monaco Editor** (code editing)

### In-Browser Python
- **Pyodide** — CPython compiled to WebAssembly
- Runs user's Python code 100% in the browser
- No server needed for code execution

### Python Engine (Optional Backend)
- **FastAPI** — HTTP API for validation
- **Pydantic** — Data validation
- **uv** — Python package manager

### Testing
- **Vitest** — Frontend unit tests (98 tests)
- **Playwright** — E2E automated walkthrough
- **Pytest** — Python engine tests (11 tests)

### Dev Tools
- **ESLint** + **Prettier** (frontend)
- **Black** + **Flake8** (Python)
- **Husky** (pre-commit hooks)

---

## 🔐 No API Keys Required

**This project does NOT use any paid APIs or API keys.**

- ❌ No OpenAI API key
- ❌ No Anthropic API key
- ❌ No Gemini API key
- ❌ No paid services

**Everything runs locally:**
- Python code executes in the user's browser (via Pyodide)
- No code is sent to any server
- FastAPI engine is optional — the app works without it
- Works offline after initial load

---

## 🚦 Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm

### Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Python Engine (Optional)

```bash
cd engine
uv sync
fastapi run
```

---

## 📄 License

MIT

---

Built by [Sarosh Khan](https://github.com/saroshkhan111)

