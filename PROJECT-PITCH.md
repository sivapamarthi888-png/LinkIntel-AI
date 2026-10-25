# LinkIntel AI — **Smarter Job Search. Safer Decisions. Better Careers.**

<!-- 🔗 Live: https://linkintel-ai.vercel.app · Backend: https://linkintel-api.onrender.com/api/health · Code: https://github.com/sivapamarthi888-png/LinkIntel-AI -->

---

## 🚩 Problem Statement

Job seekers — especially students and freshers — are increasingly targeted by **recruitment fraud**:
fake offers demanding up-front "fees" or OTPs, scammers impersonating real companies from free
email accounts, guaranteed-job messages pressuring victims to "act now" — and fake companies
with no verifiable online presence. Existing defenses are scattered (blog articles, manual
checklists). **There is no single place** where a job seeker can check a job post for scam
patterns, verify the company in real time, and manage their job search.

## 💡 Proposed Solution — LinkIntel AI

A unified web platform with **five integrated modules**, ending on one **live dashboard**:

| Module | What it does |
|---|---|
| 🛡️ **AI Job Scam Detector** | Scores any job post/recruiter message (0–100) with **quoted evidence** per warning sign, "why it matters" explanations, recruiter questions — plus an **automated live Company Background Check** |
| 📄 **Skill Matcher** | Real PDF resume + job description → match %, matched/missing skills, learning & portfolio recommendations, interview prep |
| ✅ **Verification Center** | Structured recruiter/company checklist with always-on guardrails: *never pay fees, never share OTPs/IDs* |
| 🗺️ **Career Roadmap** | Personalized week-by-week plan; milestone progress **persists** in the database |
| 📊 **Applications + Dashboard** | Full CRUD tracker (interviews, follow-ups, overdue alerts) and aggregated stats in one dashboard |

**Honesty by design:** every result is clearly labeled — **"Rule-Based Demo Analysis"** or **"Gemini AI Analysis."** AI failures emit a schema-validated rule-based fallback (labeled as such). A test enforces rule-based output can *never* be branded "AI." Works fully with **zero API keys**.

## ⚙️ Technology Stack — and why

| Tech | Role | Why chosen |
|---|---|---|
| **TypeScript** | Frontend + backend | Compile-time safety; shared API types end-to-end; modern full-stack standard |
| **React 18 + Vite + Tailwind** | UI | Component model fits our 8 pages; instant builds; consistent responsive styling |
| **Node.js + Express** | REST API | One language across the stack; async I/O ideal for AI/external calls |
| **SQLite** | Database | Zero-config persistence (survives restarts); no ops — demo-safe |
| **Zod** | Validation | Runtime schema checks on every API input → precise 400-field errors |
| **@google/genai SDK** | Optional AI | Retries, timeouts, model fallback, Zod-validated outputs |
| **Vitest + RTL + Supertest** | Testing | **63 automated tests** (44 backend / 19 frontend), incl. honesty guarantees |

## 🚀 Deployment

- **Frontend:** Vercel — https://linkintel-ai.vercel.app (auto-deploys on push)
- **Backend:** Render — https://linkintel-api.onrender.com (Blueprint: `render.yaml`, free tier)
- **Code:** GitHub — https://github.com/sivapamarthi888-png/LinkIntel-AI
- Frontend↔backend wired over CORS via env vars (`VITE_API_BASE_URL`, `CLIENT_URL`) — hosts are swappable without code changes.

## ✨ Standout Features

1. **Live Company Background Check (auto, every analysis)** — real DNS + HTTPS probes of candidate domains (company name + recruiter email); verdict panel shows website found (with web icon, HTTP status) or "No verifiable online presence" with reasons. Optional Gemini **Google Search grounding** for full web research with cited sources.
2. **Gibberish/placeholder detection** — random-letter inputs ("Cvt v t / Tctctc") are flagged High Risk; fakes can never earn a clean "Low Risk" report.
3. **Evidence-based UI** — every warning cites the exact matched excerpt; one-click shareable analysis report.
4. **Real persistence** — SQLite: analyses, applications, roadmap ticks survive server restarts (demo-able live).
5. **Security & privacy** — server-side API keys only, rate limiting (10 analyses / 15 min), Zod validation everywhere, uploaded resumes deleted after parsing, JSON data export.
6. **Honesty labels + disclaimers** — scores are *estimates, never proof of fraud*; live-verification limits stated in-product.
7. **Quality gates** — 63 passing tests, clean production builds, friendly 404s, empty/error states, retry flows, sample-data buttons for instant demos.

## 🗺️ Roadmap

Company-registry & trademark lookups · browser extension flagging scam posts on job boards ·
multi-language support · richer Gemini web-search verification (wired — just add a key).

---

> **Pitch (30 sec):** *"LinkIntel AI scores any job post for scam patterns with evidence, automatically checks whether the company actually exists online, verifies recruiters, builds skill-based career roadmaps, and tracks applications — all clearly labeled, honestly rule-based or AI, and live for anyone to use with zero configuration."*
