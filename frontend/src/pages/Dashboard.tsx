import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CalendarClock,
  Trophy,
  Percent,
  ShieldAlert,
  Map as MapIcon,
  FileSearch,
  UserCheck,
  ArrowUpRight,
  Activity,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import api, { extractApiError, DashboardData } from '../services/api';
import { PageHeader, Card, CardHeader, EmptyState, ListSkeleton, Button } from '../components';
import { STATUS_COLORS, ALL_STATUSES } from '../components/StatusPill';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  to,
  tone = 'blue',
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  to: string;
  tone?: 'blue' | 'violet' | 'emerald' | 'amber';
}) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <Link to={to} className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <span className={`rounded-lg p-2.5 ${tones[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 opacity-0 transition group-hover:opacity-100">
        Open <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
      </span>
    </Link>
  );
}

const QUICK_ACTIONS = [
  { to: '/job-analyzer', icon: ShieldAlert, title: 'Analyze a job', desc: 'Check for scam warning signs' },
  { to: '/skill-match', icon: FileSearch, title: 'Match your resume', desc: 'See fit against a job description' },
  { to: '/verification', icon: UserCheck, title: 'Verify a recruiter', desc: 'Run the credibility checklist' },
  { to: '/career-roadmap', icon: MapIcon, title: 'Plan a career', desc: 'Generate a learning roadmap' },
];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<DashboardData>('/dashboard');
      setData(res.data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Loading your career intelligence overview…" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ListSkeleton rows={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <EmptyState
          title="Could not load dashboard"
          description={error}
          action={
            <Button onClick={load} variant="primary">
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          }
        />
      </div>
    );
  }

  const chartData = ALL_STATUSES.map((s) => ({
    name: s,
    count: data?.statusCounts?.[s] || 0,
  })).filter((d) => d.count > 0);

  const hasNoApplications = (data?.totalApplications || 0) === 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your live job-search intelligence. All numbers come from data you actually entered."
        actions={
          <Button variant="secondary" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Total applications" value={data!.totalApplications} sub={`${data!.activeApplications} active`} to="/applications" />
        <StatCard icon={CalendarClock} label="Interviews scheduled" value={data!.interviewsScheduled} sub={`${data!.upcomingFollowUpCount} follow-ups due`} to="/applications" tone="violet" />
        <StatCard icon={Trophy} label="Offers received" value={data!.offersReceived} sub="Celebrate and evaluate" to="/applications" tone="emerald" />
        <StatCard
          icon={Percent}
          label="Avg skill match"
          value={data!.avgSkillMatch !== null ? `${data!.avgSkillMatch}%` : '—'}
          sub={data!.avgSkillMatch !== null ? 'Across your analyses' : 'Run a skill match first'}
          to="/skill-match"
          tone="amber"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Status chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="Application status breakdown" subtitle="Counts by current status" />
          <div className="px-6 py-4">
            {hasNoApplications ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">No applications tracked yet.</p>
                <Link to="/applications" className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline">
                  Add your first application →
                </Link>
              </div>
            ) : chartData.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No valid status data found.</p>
            ) : (
              <div className="h-64" role="img" aria-label="Bar chart of applications by status">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(59,130,246,0.06)' }}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader title="Recent activity" subtitle="Latest analyses and matches" />
          <div className="px-6 py-4">
            {data!.recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                Nothing yet. Run a job analysis or skill match to get started.
              </p>
            ) : (
              <ul className="space-y-3">
                {data!.recentActivity.map((a) => (
                  <li key={`${a.type}-${a.id}`} className="flex items-start gap-3">
                    <span className={`mt-0.5 rounded-md p-1.5 ${a.type === 'job_analysis' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                      <Activity className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm text-gray-800">{a.summary}</p>
                      <p className="text-[11px] text-gray-400">{new Date(a.timestamp).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming interviews + follow-ups */}
        <Card>
          <CardHeader title="Upcoming interviews & follow-ups" subtitle="Sorted by date" />
          <div className="px-6 py-4">
            {data!.upcomingInterviews.length === 0 && data!.upcomingFollowUps.length === 0 && data!.overdueFollowUps.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No scheduled interviews or follow-ups.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data!.overdueFollowUps.map((a) => (
                  <li key={`overdue-${a.id}`} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.job_title}</p>
                      <p className="text-xs text-gray-500">{a.company}</p>
                    </div>
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                      Follow-up overdue ({a.follow_up_date})
                    </span>
                  </li>
                ))}
                {[...data!.upcomingInterviews].map((a) => (
                  <li key={`iv-${a.id}`} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.job_title}</p>
                      <p className="text-xs text-gray-500">{a.company}</p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                      Interview {a.interview_date}
                    </span>
                  </li>
                ))}
                {[...data!.upcomingFollowUps].map((a) => (
                  <li key={`fu-${a.id}`} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.job_title}</p>
                      <p className="text-xs text-gray-500">{a.company}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      Follow-up {a.follow_up_date}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Roadmap progress + recent job analyses */}
        <Card>
          <CardHeader title="Recent job analyses" subtitle="Most recent scam-risk checks" />
          <div className="px-6 py-4">
            {data!.recentJobAnalyses.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No job analyses yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data!.recentJobAnalyses.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{a.jobTitle}</p>
                      <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">Score {a.riskScore}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          a.riskCategory === 'High'
                            ? 'bg-rose-50 text-rose-600'
                            : a.riskCategory === 'Medium'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {a.riskCategory}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {data!.roadmapProgress.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Roadmap progress</p>
                {data!.roadmapProgress.map((r) => (
                  <Link key={r.id} to="/career-roadmap" className="mb-2 block rounded-lg bg-slate-50 px-3 py-2 transition hover:bg-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{r.targetCareer}</span>
                      <span className="text-xs font-semibold text-blue-700">{r.completionPercent}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${r.completionPercent}%` }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Quick actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="inline-flex rounded-lg bg-blue-50 p-2.5 text-blue-700">
                <q.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-gray-900">{q.title}</h3>
              <p className="mt-0.5 text-xs text-gray-500">{q.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
