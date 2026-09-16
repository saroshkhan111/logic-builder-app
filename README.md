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
- ✅ AI Guide: chat tutor with corrections, per-step MCQ quizzes, field-by-field validation (Groq)
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
- **Vitest** — Frontend unit tests (226 tests)
- **Playwright** — E2E automated walkthrough
- **Pytest** — Python engine tests (11 tests)

### Dev Tools
- **ESLint** + **Prettier** (frontend)
- **Black** + **Flake8** (Python)
- **Husky** (pre-commit hooks)

---

## 🤖 AI Guide (Optional — Free Groq Key)

The core 6-step workflow (flowchart, test generation, Pyodide execution) needs **no API key and works offline**.

The optional **AI Guide** sidebar uses Groq's free API — model `openai/gpt-oss-120b`, key stays server-side:

- **Chat** — English tutor answers, with an amber "Correction" card when you make a mistake
- **Quiz** — one problem-specific MCQ for the step you're on
- **Field Validation** — checks each field in filling order and locks "Next" until every field is correct
- **Syntax AI-check (Step 3)** — Mistral pseudocode analysis (`MISTRAL_API_KEY`, optional; falls back to the static checker)

Setup:

```bash
# 1. Get a free key at https://console.groq.com/keys
# 2. Add it to .env.local
GROQ_API_KEY=gsk_your_key_here
```

Without a key the app still works — AI panels degrade gracefully ("AI not configured"). No OpenAI, Anthropic, Gemini, or other paid APIs are used.

**Everything core runs locally:**
- Python code executes in the user's browser (via Pyodide)
- FastAPI engine is optional — the app works without it

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
# Install Python deps (from repo root)
uv sync

# Start the FastAPI validation server
npm run py:api
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📄 License

MIT

---

Built by [Sarosh Khan](https://github.com/saroshkhan111)

