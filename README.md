# Logic Builder App

A hybrid **Next.js 16 (App Router) frontend** + **`uv`-managed Python engine**.

## Architecture

```
logic-builder-app/
├── src/                        # Next.js frontend (App Router)
│   ├── app/                    #   routes & layouts
│   ├── components/             #   UI components (layout/, editor/, flow/, steps/)
│   ├── store/                  #   zustand stores
│   ├── lib/                    #   utilities, pyodide runner, test setup
│   └── types/                  #   shared TypeScript types
├── python_engine/              # uv-managed Python tooling
│   ├── core/                   #   validation engine, PEP 8 parser (pure logic)
│   ├── api/                    #   FastAPI app (schemas + main)
│   ├── scripts/                #   run_checks.py quality gate
│   └── tests/                  #   pytest suite
├── pyproject.toml              # Python deps & tool config (uv)
├── uv.lock                     # Locked Python dependency graph
└── .venv/                      # uv-managed virtualenv (gitignored)
```

## Getting Started

```bash
npm install     # frontend deps
uv sync         # python deps into .venv
npm run dev     # Next.js dev server → http://localhost:3000
npm run py:api  # FastAPI engine → http://localhost:8000/docs
```

## Scripts

| Frontend (`npm run`) | Python (`npm run`)          |
| -------------------- | --------------------------- |
| `dev` / `build`      | `py:sync` — uv sync         |
| `test` (vitest)      | `py:test` — pytest          |
| `lint` / `format`    | `py:lint` / `py:format`     |
|                      | `py:checks` — full gate     |
|                      | `py:api` — serve FastAPI    |

## Frontend stack

- Next.js 16 App Router, React 19, Tailwind CSS 4
- `zustand` — state, `reactflow` — logic-flow canvas
- `@monaco-editor/react` — code editor, `pyodide` — in-browser Python
- `framer-motion`, `lucide-react`

## Python engine

- `python_engine/core` — `FlowValidator` (flow-graph structural checks) and
  `parse_pep8` (PEP 8 style parser)
- `python_engine/api` — FastAPI service: `GET /health`,
  `POST /validate/flow`, `POST /parse/pep8`
- Managed entirely with [uv](https://docs.astral.sh/uv/); see
  `python_engine/README.md`.

