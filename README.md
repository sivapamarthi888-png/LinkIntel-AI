# LinkIntel AI

**Smarter Job Search. Safer Decisions. Better Careers.**

An independent AI-powered enhancement of the job-search experience, built for the *Build the Future — Solve a Real-World Problem* hackathon theme. Recruiters impersonation, fake job posts, unclear requirements and scattered application tracking make job hunting risky and messy. LinkIntel AI tackles that with five integrated modules in a single dashboard.

> This is an independent prototype. It is **not** affiliated with or endorsed by LinkedIn. It never scrapes LinkedIn, never accesses private LinkedIn data, and never claims tracked applications were submitted to LinkedIn or any employer.

## Features

| Module | What it does |
|---|---|
| **AI Job Scam Detector** | Risk category + 0–100 score, warning signs with verbatim excerpts, why each matters, positive indicators, recommended actions, questions for the recruiter, copy-report, timestamp |
| **Resume-to-Job Skill Matcher** | PDF upload (validated, temp file deleted after processing) or pasted text, match % with methodology, matched / missing skills, transferable skills, learning + project + interview suggestions |
| **Recruiter & Company Verification** | Guided checklist with four honest statuses: *Supported by supplied evidence / Needs checking / Warning detected / Not independently verified*. Domain consistency guidance, freemail nuance, payment/OTP guardrails. Never claims live verification |
| **Personalized Career Roadmap** | 7 career tracks (Frontend, Backend, Full-Stack, Data Analyst, AI/ML, Cybersecurity, Cloud). Skill-gap summary, ordered milestones with per-item completion saved to SQLite, weekly schedule, projects, portfolio & interview prep, effort assumptions. Save, reopen, regenerate, reset |
| **Smart Application Tracker** | Full CRUD with 7 statuses, search / filter / sort, upcoming interviews, upcoming + overdue follow-ups, status chart from real data, seeded sample data and clear-demo-data |
| **Dashboard** | Real stats: totals, interviews, offers, average skill match, status breakdown chart, recent activity, roadmap progress, quick actions |

### Demo mode (no API key needed)

The app runs **fully functional without any API key**: deterministic rule-based analysis, clearly labeled `Rule-Based Demo Analysis` / `Demo Roadmap (Rule-Based)`. Nothing pretends to be AI output. Add a Gemini key on the server and results are labeled `Gemini AI Analysis` instead.

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Lucide icons, Recharts, React Hook Form + Zod, axios, react-hot-toast, Vitest + React Testing Library
- **Backend:** Node.js, Express 4, TypeScript, Zod validation, express-rate-limit, multer, pdf-parse, SQLite (sqlite3), Vitest + Supertest, Google Gen AI SDK (`@google/genai`) with configurable model, timeout, retries and schema-validated structured output
- **Deployment:** Vercel-compatible frontend (`vercel.json` included), Node-compatible backend

## Quick start

```bash
# 1. Install everything (workspace: frontend + backend)
npm install

# 2. (Optional) configure environment
cp .env.example backend/.env    # add GEMINI_API_KEY if you have one

# 3. Run backend + frontend together
npm run dev
```

| URL | What |
|---|---|
| http://localhost:5173 | Frontend |
| http://localhost:5000/api/health | Backend health |

### Enable Gemini AI (optional)

1. Get an API key from Google AI Studio.
2. Set it in `backend/.env` (never in frontend code):
   ```env
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL_NAME=gemini-2.5-flash
   GEMINI_FALLBACK_MODELS=gemini-2.5-flash-lite
   PORT=5000
   CLIENT_URL=http://localhost:5173
   DATABASE_PATH=./data/linkintel.db
   ```
3. Restart the backend. `/api/health` will report `"mode": "ai"`. If Gemini errors, times out, or returns invalid output, the backend automatically falls back to the rule-based analysis and says so in the result — no opaquely fake AI responses.

### Demo mode (no key)

Start with no key set. Every analysis works and is labeled as rule-based demo output. Use **Settings → Data management** to *Seed sample applications* or **Clear all stored data**, or the sample loaders on the Job Analyzer and Skill Matcher pages.

## Testing & builds

```bash
npm test          # backend (Vitest + Supertest) and frontend (Vitest + RTL)
npm run build     # production builds for both
```

Current status: **30 backend tests** (applications CRUD + validation, scam analysis thresholds, skill matching, verification honesty, roadmap generation + progress persistence, dashboard aggregation, 404s) and **17 frontend tests** (labels/roles, sample loaders, result rendering, demo/AI labeling, empty/error/loading states, chart data) — all passing. Production builds pass for both packages.

## API

```
GET    /api/health
GET    /api/dashboard
POST   /api/job-analysis
POST   /api/skill-match          (multipart: resume PDF or resumeText field + jobDescription)
POST   /api/verification-check
POST   /api/career-roadmap
GET    /api/roadmaps
GET    /api/roadmaps/:id
PATCH  /api/roadmaps/:id
PATCH  /api/applications/:id
DELETE /api/roadmaps/:id/progress
GET    /api/applications         (?search=&status=&sort=date_desc|date_asc)
POST   /api/applications
GET    /api/applications/:id
DELETE /api/applications/:id
POST   /api/demo-data/seed
DELETE /api/demo-data
GET    /api/demo-data/health
```

Consistent JSON errors: `{ error: string, details?: [{ field, message }] }` with correct 400/404/500 status codes, centralized error handler, and rate limits on the AI endpoints.

## Deployment

**Frontend → Vercel:** the repo root has `vercel.json` (`rootDirectory: frontend`, build `npm run build`, output `dist`, SPA rewrites). Deploy the repo to Vercel and it works.

**Backend → any Node host:** `cd backend && npm install && npm run build && npm start` (serves on `PORT`, default 5000). Configure `CLIENT_URL` for CORS and `DATABASE_PATH` for persistent storage.

## Routes

`/` landing • `/dashboard` • `/job-analyzer` • `/skill-match` • `/verification` • `/career-roadmap` • `/applications` • `/settings` — direct navigation and refresh work on all of them (SPA fallback in dev proxy + Vercel rewrites).

## Security & privacy notes

- The Gemini key exists only in backend env; never in frontend bundles.
- Uploaded resumes are parsed server-side and the temp file is deleted immediately; only numeric summaries persist; full resume text is never logged.
- Body size limits (1 MB JSON) and upload limits (5 MB, PDF only, magic-byte check).
- Zod validation on every mutating endpoint; safe parameterized SQL; CORS restricted to `CLIENT_URL`; rate limits on AI endpoints.
- No authentication is implemented — this is a prototype; do not treat it as production-grade security.
- Analysis outputs are heuristic estimates; the verification assistant deliberately reports *Not independently verified* unless evidence was supplied, and never performs live external checks (no SSRF-prone fetching).

## Troubleshooting

- **Open the app at http://localhost:5173 (Vite dev server) — not VS Code Live Server (port 5500).** Live Server serves static files only; it cannot run a Vite project. `npm run dev` starts Vite automatically.
- **CSS warnings on `frontend/dist/assets/*.css`** (e.g. "define the standard property 'appearance'") are VS Code linting the *minified build output* — auto-generated Tailwind preflight, not your code. The repo's `.vscode/settings.json` excludes `dist/` from watching, and `src/index.css` adds standard-property companions so fresh builds lint clean.
- If `npm install` or a build fails with odd module/version errors, delete `node_modules` and `package-lock.json` at the repo root and reinstall.

## Known limitations

- Rule-based analysis is heuristic — scores are estimates, never proof of legitimacy or fraud.
- No live company-registry, URL-reputation, or badge verification integrations (stated as such in the UI).
- Single-user local SQLite; no auth or multi-tenancy.
- PDF text extraction works for text-layer PDFs; scanned image-only PDFs are rejected with a clear message.
