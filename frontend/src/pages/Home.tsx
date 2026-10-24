import { Link } from 'react-router-dom';
import { Sparkles, ShieldAlert, FileSearch, UserCheck, Map as MapIcon, Briefcase, ArrowRight, ArrowUpRight } from 'lucide-react';

const MODULES = [
  {
    to: '/job-analyzer',
    icon: ShieldAlert,
    tone: 'rose',
    title: 'AI Job Scam Detector',
    desc: 'Paste any posting or recruiter message. Get a risk score with evidence, why each warning matters, and the exact questions to ask next.',
    points: ['Rule-based and AI modes', 'Evidence-backed findings', 'Copyable report'],
  },
  {
    to: '/skill-match',
    icon: FileSearch,
    tone: 'blue',
    title: 'Resume-to-Job Skill Matcher',
    desc: 'Upload a PDF resume or paste text. See how well you match a job, which skills are missing, and what to build next.',
    points: ['PDF or pasted resume', 'Match % with methodology', 'Gap-to-project suggestions'],
  },
  {
    to: '/verification',
    icon: UserCheck,
    tone: 'teal',
    title: 'Recruiter & Company Verification',
    desc: 'A guided, honest checklist to verify an opportunity yourself — with clear labels for verified vs unverified evidence.',
    points: ['Domain consistency guidance', 'Badge & careers-page checks', 'Never claims live verification'],
  },
  {
    to: '/career-roadmap',
    icon: MapIcon,
    tone: 'violet',
    title: 'Personalized Career Roadmap',
    desc: 'Pick one of 7 career paths, enter your background, and get an ordered learning plan with milestones you can track.',
    points: ['7 career tracks', 'Weekly schedules & projects', 'Progress saved to database'],
  },
  {
    to: '/applications',
    icon: Briefcase,
    tone: 'amber',
    title: 'Smart Application Tracker',
    desc: 'Track every application with statuses, interview dates, follow-ups and overdue reminders — all searchable and filterable.',
    points: ['7 lifecycle statuses', 'Upcoming & overdue views', 'Charts from real data'],
  },
];

const toneClasses: Record<string, string> = {
  rose: 'bg-rose-50 text-rose-600',
  blue: 'bg-blue-50 text-blue-600',
  teal: 'bg-teal-50 text-teal-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
};

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="rounded-2xl bg-slate-900 px-6 py-16 text-center sm:px-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 shadow-lg shadow-blue-900/40">
          <Sparkles className="h-7 w-7 text-white" aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-teal-400">
          Build the Future — Solving a real-world problem
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          LinkIntel AI
        </h1>
        <p className="mt-4 text-lg font-medium text-blue-100">
          Smarter job search. Safer decisions. Better careers.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
          Job seekers face recruitment scams, impersonation, unclear job requirements, and hours of manual resume
          comparison and application juggling. LinkIntel AI brings risk analysis, skill matching, recruiter verification,
          career planning and application tracking together in one dashboard. It works fully in demo mode — no API key
          required.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500"
          >
            Open the dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/job-analyzer"
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            Try the scam detector
          </Link>
        </div>
        <p className="mt-6 text-[11px] text-slate-400">
          Independent prototype for a hackathon. Not affiliated with or endorsed by LinkedIn.
        </p>
      </section>

      {/* Modules */}
      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Five integrated modules</h2>
        <p className="mt-1 text-sm text-gray-500">All modules share one dashboard and one database of your data.</p>
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, idx) => (
            <Link
              key={m.to}
              to={m.to}
              className={`group rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-0.5 hover:shadow-md ${
                idx === 4 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <span className={`rounded-lg p-2.5 ${toneClasses[m.tone]}`}>
                  <m.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-gray-300 transition group-hover:text-blue-600" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{m.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{m.desc}</p>
              <ul className="mt-3 space-y-1">
                {m.points.map((p) => (
                  <li key={p} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="h-1 w-1 rounded-full bg-blue-500" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </Link>
          ))}

          {/* Honesty card */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800">What this tool will not do</h3>
            <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-amber-900 sm:grid-cols-2">
              <li>• It never marks an employer as "verified".</li>
              <li>• It never performs live URL or company-registry checks.</li>
              <li>• A low risk score is never proof of legitimacy.</li>
              <li>• It never submits applications to LinkedIn or employers.</li>
              <li>• It never invents experience or certifications.</li>
              <li>• It never requests payment or sensitive data.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Demo mode strip */}
      <section className="mt-10 rounded-xl border border-teal-200 bg-teal-50/70 px-6 py-5">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-teal-900">Runs in demo mode without any API key</h3>
            <p className="mt-0.5 text-sm text-teal-800">
              Deterministic rule-based analysis, clearly labeled. Add a Gemini API key on the server for live AI analysis.
            </p>
          </div>
          <Link to="/settings" className="shrink-0 text-sm font-semibold text-teal-700 underline-offset-4 hover:underline">
            Check AI status in Settings →
          </Link>
        </div>
      </section>
    </div>
  );
}
