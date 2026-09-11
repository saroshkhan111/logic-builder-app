# Logic Builder

A 6-step guided web app that teaches programming beginners how to think like programmers.

---

## What It Does

Logic Builder walks you through solving a programming problem from start to finish. You start with a plain-English problem statement and end with working, tested, optimized Python code. Each step teaches a specific skill used by real programmers.

---

## The 6 Steps

1. **Problem Statement** — Define the inputs, outputs, and rules
2. **Requirements Analysis** — Identify the data, tools, and concepts you need
3. **Algorithm Design** — Write pseudocode and get an auto-generated flowchart
4. **Code Writing** — Write Python code with live PEP 8 style validation
5. **Testing** — Auto-generated test cases run in your browser
6. **Optimization** — Get complexity analysis and refactoring suggestions

---

## Demo

![Demo GIF](demo.gif)

[Watch Video Demo](https://youtube.com/your-video-link)

---

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand (state management)
- Framer Motion (animations)
- Monaco Editor (code editor)

### In-Browser Python
- Pyodide (CPython compiled to WebAssembly)
- Runs user code directly in the browser — no server needed

### Python Engine (Optional)
- FastAPI
- Pydantic
- uv (package manager)
- Used for flowchart validation and PEP 8 parsing

### Testing
- Vitest (frontend unit tests)
- Playwright (E2E tests)
- Pytest (Python engine tests)

### Dev Tools
- ESLint, Prettier (frontend)
- Black, Flake8 (Python)
- Husky (pre-commit hooks)

---

## No API Keys Required

**This app does not use any paid services or AI APIs.**

- Pyodide runs 100% in the browser (client-side)
- No OpenAI, Anthropic, or Gemini API keys needed
- No paid subscriptions or external services
- The FastAPI engine is optional — the app works fully without it

All code processing happens locally in the user's browser. Nothing is sent to any server.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+ (only if using the optional Python engine)

### Frontend

```bash
npm install
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

## Screenshots

| Step 1: Problem Statement | Step 4: Code Writing |
|---------------------------|----------------------|
| ![Step 1](screenshots/step1.png) | ![Step 4](screenshots/step4.png) |

| Step 5: Testing | Step 6: Optimization |
|-----------------|----------------------|
| ![Step 5](screenshots/step5.png) | ![Step 6](screenshots/step6.png) |

---

## Live Demo

[Live Demo](https://your-demo-url.vercel.app)

---

## Features

- 6-step guided workflow (not just a code editor)
- Auto-generated flowchart from pseudocode
- Auto-generated test cases (5-6 per problem)
- Code complexity analysis (Big-O detection)
- Smart refactoring suggestions
- PEP 8 style validation
- Real test execution via Pyodide
- Export and share functionality

---

## License

MIT

---

Built by [Sarosh Khan](https://github.com/saroshkhan111)

