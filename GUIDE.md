# Logic Builder App — Quick Guide

Short setup guide. Full product overview lives in [README.md](./README.md).

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org) (LTS)
- **uv** (Python tooling) — [astral.sh/uv](https://github.com/astral-sh/uv)

```bash
node --version   # v20+
uv --version     # any recent release
```

## Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional Python engine:

```bash
uv sync
npm run py:api
```

## Test

```bash
npm test              # frontend (Vitest)
npm run py:checks     # Python format/lint/tests
```

Useful extras:

```bash
npm run build         # production build
npm run test:coverage # coverage report
npm run lint          # ESLint
```

## Docs

| Doc | What it covers |
|---|---|
| [README.md](./README.md) | Features, stack, live demo |
| [AGENTS.md](./AGENTS.md) | Agent/editor notes for this repo |
| [python_engine/](./python_engine/) | FastAPI validation engine |

> Before committing: `npm run lint`, `npm test`, and `npm run py:checks`.
