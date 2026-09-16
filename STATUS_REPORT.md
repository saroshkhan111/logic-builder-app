# 📊 Project Status Report — Logic Builder

_Generated: 2026-09-15 · Branch: `main` · Baseline commit: `fb88223` "feat: switch AI Chat to Groq with real responses"_

## 1. Snapshot

| Item | Status |
|---|---|
| App | 6-step guided logic-building tutor (Next.js 16 · React 19 · TS · Tailwind 4 · Zustand · Pyodide) |
| Working tree before this report | 14 modified + 18 new files, all uncommitted |
| Frontend tests (Vitest) | 15 files, **226/226 passing** (~38 s) |
| TypeScript | `tsc --noEmit` clean |
| ESLint | 6 pre-existing errors + 2 warnings in already-committed files → fixed (§4) |
| Docs | README updated for the Groq key requirement (§5) |

## 2. What the uncommitted work added

### A. AI Quiz tab (step-specific MCQ)
- `src/app/api/step-mcq/route.ts` — Groq endpoint (`openai/gpt-oss-120b`, `reasoning_effort: "low"`).
- `src/lib/stepMcq.ts` — prompt + defensive parser; per-step field guides fix the "Step 2 quiz asked about Step 1" drift; malformed answers return `null` instead of a wrong verdict.
- `src/components/AIGuide/MCQQuiz.tsx` — A–D options, ✅/❌ feedback, reason, correction block, regenerate; quiz hidden when switching steps.
- Sidebar gains a third **Quiz** tab (Tips / Chat / Quiz).

### B. Sequential AI field validation (Steps 1–6)
- `src/app/api/field-validate/route.ts` — judges ONE field against the problem context.
- `src/lib/fieldValidation.ts` — per-step "what this field expects" guides; English `reason` / `correction` / `nextHint`.
- `src/lib/useFieldValidation.ts` — 1 s debounce, sequence gating (field N only checked after N−1 accepted), stale-response guards, 100-entry FIFO cache, fail-open on AI failure.
- `src/components/validation/StepFieldValidation.tsx` — checklist footer with ✅ Correct / ❌ Incorrect rows, "Next focus" hint; **Next is locked until every field is correct** (AI-unavailable fields do not block).
- All 6 Step components replaced their free navigation buttons with this gate.

### C. Shared AI-response infrastructure
- `src/lib/jsonResponse.ts` — strict-JSON fallback chain (raw → fenced → first `{...}`) shared by every AI route.
- `src/lib/aiChatResponse.ts` — `{reply, correction}` parser + placeholder normalization.
- `/api/ai-chat` now returns a correction card (amber block) under assistant messages; Step 3's syntax checker also surfaces an AI `correction`.

## 3. Files in this changeset

- **New:** `api/step-mcq/` (route + test), `api/field-validate/route.ts`, `components/AIGuide/MCQQuiz.tsx` (+ test), `components/AIGuide/AIGuideSidebar.test.tsx`, `components/validation/StepFieldValidation.tsx`, `lib/{jsonResponse,aiChatResponse,stepMcq,fieldValidation,useFieldValidation}` (+ tests), `api/ai-chat/route.test.ts`
- **Modified:** `api/ai-chat/route.ts`, `api/analyze/route.ts`, `AIGuide/{AIChat,AIGuideSidebar,index}`, `algorithm/SyntaxChecker.tsx`, `lib/ai-syntax-checker.ts` (+ test), `components/steps/Step1…Step6`

## 4. Pre-existing lint fixes (committed separately)

- `src/lib/api/projects.ts` — `any` fields → `string[]` / `unknown`; empty interface → type alias.
- `src/app/api/projects/[id]/route.ts` — `updateData: any` → `Prisma.ProjectUpdateInput`.
- `src/lib/dryRunVisualizer.test.ts` — removed two unused type imports.

## 5. Docs

- README "No API Keys Required" section rewritten: AI features need a free `GROQ_API_KEY` (server-side only); core workflow still works offline. Vitest count updated (98 → 226).

## 6. Known gaps / follow-ups

1. `NEXTAUTH_SETUP.md` TODOs still open (generate `AUTH_SECRET`, Google OAuth credentials, auth test).
2. No dedicated unit tests yet for `fieldValidation` / `useFieldValidation` (exercised indirectly via UI tests) — worth adding.
3. Vitest hint: `pool: 'vmThreads'` would avoid re-creating happy-dom per file (~55 s → faster).
4. Deployed demo needs `GROQ_API_KEY` (and optionally `MISTRAL_API_KEY`) configured on Vercel for the AI panels to work there.
