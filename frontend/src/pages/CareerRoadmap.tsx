import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Map as MapIcon,
  CheckCircle,
  Circle,
  RotateCcw,
  RefreshCw,
  FolderOpen,
  BookOpen,
  FolderGit2,
  Users,
  Wrench,
} from 'lucide-react';
import api, { extractApiError, Roadmap } from '../services/api';
import { PageHeader, Card, CardHeader, Input, Select, Label, Textarea, Button, EmptyState } from '../components';
import { AnalysisTypeLabel } from '../components/RiskBadge';

const CAREERS = [
  'Frontend Developer',
  'Backend Developer',
  'Full-Stack Developer',
  'Data Analyst',
  'AI/ML Engineer',
  'Cybersecurity Analyst',
  'Cloud Engineer',
];

const EDUCATION = ['High School', 'Associate Degree', 'Bachelor Degree', 'Master Degree', 'Self-Taught'];
const EXPERIENCE = ['Beginner', 'Some Experience', 'Intermediate'];
const PERIODS = ['3 months', '6 months', '9 months', '12 months', '18 months'];

interface SavedRoadmapSummary {
  id: string;
  targetCareer: string;
  updatedAt: string;
  tracked: number;
  completed: number;
}

export default function CareerRoadmap() {
  const [form, setForm] = useState({
    targetCareer: 'Frontend Developer',
    educationLevel: 'Bachelor Degree',
    currentSkills: '',
    experienceLevel: 'Beginner',
    studyHoursPerWeek: 10,
    targetPreparationPeriod: '6 months',
  });
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<SavedRoadmapSummary[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    setSavedLoading(true);
    try {
      const res = await api.get<SavedRoadmapSummary[]>('/roadmaps');
      setSaved(res.data);
    } catch {
      // non-fatal
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const generate = async () => {
    setLoading(true);
    setRoadmap(null);
    setProgress({});
    try {
      const res = await api.post<Roadmap>('/career-roadmap', form);
      setRoadmap(res.data);
      setProgress(res.data.progress || {});
      toast.success('Roadmap generated and saved');
      loadSaved();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const openSaved = async (id: string) => {
    try {
      const res = await api.get<Roadmap>(`/roadmaps/${id}`);
      setRoadmap(res.data);
      setProgress(res.data.progress || {});
      if (res.data.input) {
        setForm((f) => ({ ...f, ...res.data.input, currentSkills: res.data.input?.currentSkills || '' }));
      }
      toast.success(`Opened saved roadmap for ${res.data.targetCareer}`);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const persistProgress = async (id: string, next: Record<string, boolean>) => {
    try {
      await api.patch(`/roadmaps/${id}`, { progress: next });
      loadSaved();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const toggleMilestone = (id: number) => {
    setProgress((p) => {
      const next = { ...p, [id]: !p[id] };
      if (roadmap) persistProgress(roadmap.id, next);
      return next;
    });
  };

  const resetProgress = async () => {
    if (!roadmap) return;
    try {
      await api.delete(`/roadmaps/${roadmap.id}/progress`);
      setProgress({});
      toast.success('Progress reset');
      loadSaved();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const completedCount = Object.values(progress).filter(Boolean).length;
  const milestones = roadmap?.milestones || [];
  const completionPercent = milestones.length === 0 ? 0 : Math.round((completedCount / milestones.length) * 100);

  return (
    <div>
      <PageHeader
        title="Personalized Career Roadmap"
        subtitle="Generate a structured learning plan for your target career, track your milestones and reopen saved roadmaps."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Generator + saved */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Generate a roadmap" subtitle="AI when configured, demo templates otherwise" />
            <div className="space-y-4 px-6 py-5">
              <div>
                <Label htmlFor="targetCareer">Target career</Label>
                <Select id="targetCareer" value={form.targetCareer} onChange={(e) => setForm({ ...form, targetCareer: e.target.value })}>
                  {CAREERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="educationLevel">Education level</Label>
                <Select id="educationLevel" value={form.educationLevel} onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}>
                  {EDUCATION.map((e2) => (
                    <option key={e2} value={e2}>
                      {e2}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="experienceLevel">Experience level</Label>
                <Select id="experienceLevel" value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>
                  {EXPERIENCE.map((e2) => (
                    <option key={e2} value={e2}>
                      {e2}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="currentSkills" hint="optional">
                  Current skills
                </Label>
                <Textarea
                  id="currentSkills"
                  rows={2}
                  value={form.currentSkills}
                  onChange={(e) => setForm({ ...form, currentSkills: e.target.value })}
                  placeholder="e.g. HTML, CSS, JavaScript basics"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studyHoursPerWeek">Study hours / week</Label>
                  <Input
                    id="studyHoursPerWeek"
                    type="number"
                    min={1}
                    max={80}
                    value={form.studyHoursPerWeek}
                    onChange={(e) => setForm({ ...form, studyHoursPerWeek: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="targetPreparationPeriod">Target period</Label>
                  <Select id="targetPreparationPeriod" value={form.targetPreparationPeriod} onChange={(e) => setForm({ ...form, targetPreparationPeriod: e.target.value })}>
                    {PERIODS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <Button onClick={generate} disabled={loading} className="w-full">
                {loading ? 'Generating…' : <><RefreshCw className="h-4 w-4" /> Generate roadmap</>}
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Saved roadmaps" subtitle="Counted from your saved plans" />
            <div className="px-6 py-4">
              {savedLoading ? (
                <p className="py-4 text-center text-sm text-gray-400">Loading…</p>
              ) : saved.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">No saved roadmaps yet.</p>
              ) : (
                <ul className="space-y-2">
                  {saved.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => openSaved(r.id)}
                        className={`w-full rounded-lg border px-3 py-2.5 text-left transition hover:bg-slate-50 ${
                          roadmap?.id === r.id ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{r.targetCareer}</span>
                          <span className="text-xs text-gray-500">{new Date(r.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {r.completed}/{r.tracked || '—'} milestones done
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        {/* Roadmap display */}
        <div className="lg:col-span-2">
          {!roadmap && !loading && (
            <EmptyState
              icon={MapIcon}
              title="No roadmap yet"
              description="Choose your target career and study preferences, then generate a structured learning plan."
              action={<Button onClick={generate} disabled={loading}>Generate roadmap</Button>}
            />
          )}
          {loading && (
            <Card className="flex items-center justify-center py-16">
              <div className="text-center" aria-busy="true">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" aria-hidden="true" />
                <p className="mt-3 text-sm text-gray-500">Building your learning plan…</p>
              </div>
            </Card>
          )}
          {roadmap && (
            <Card>
              <div className="border-b border-gray-100 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{roadmap.targetCareer}</h2>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                      <AnalysisTypeLabel type={roadmap.roadmapType} />
                      {roadmap.updatedAt && <span>• saved {new Date(roadmap.updatedAt).toLocaleString()}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={resetProgress} disabled={completedCount === 0}>
                      <RotateCcw className="h-4 w-4" /> Reset progress
                    </Button>
                    <Button onClick={generate} disabled={loading}>
                      <RefreshCw className="h-4 w-4" /> Regenerate
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-700">{roadmap.skillGapSummary}</p>
                {milestones.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {completedCount} of {milestones.length} milestones complete
                      </span>
                      <span className="font-semibold text-blue-700">{completionPercent}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${completionPercent}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-5 px-6 py-5">
                {/* Milestones */}
                <section aria-label="Learning milestones">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                    <BookOpen className="h-4 w-4 text-blue-700" aria-hidden="true" /> Learning milestones
                  </h3>
                  <p className="mb-2 text-xs text-gray-400">Tick a milestone to save progress — it persists in your database.</p>
                  <ol className="space-y-2">
                    {milestones.map((m, idx) => {
                      const done = !!progress[m.id];
                      return (
                        <li key={m.id} className={`flex items-start gap-3 rounded-lg border p-3 transition ${done ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200'}`}>
                          <button
                            onClick={() => toggleMilestone(m.id)}
                            aria-pressed={done}
                            aria-label={`${done ? 'Mark incomplete' : 'Mark complete'}: ${m.title}`}
                            className="mt-0.5 rounded-full focus-visible:ring-2"
                          >
                            {done ? (
                              <CheckCircle className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-300 hover:text-blue-500" aria-hidden="true" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                              {idx + 1}. {m.title}
                            </p>
                            {m.description && <p className="mt-0.5 text-xs text-gray-500">{m.description}</p>}
                          </div>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {m.duration}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>

                {/* Weekly schedule */}
                {roadmap.weeklySchedule.length > 0 && (
                  <section aria-label="Weekly learning schedule">
                    <h3 className="mb-2 text-sm font-semibold text-gray-800">First weeks at a glance</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                          <tr>
                            <th scope="col" className="py-2 pr-3 text-left text-xs font-semibold text-gray-500">Week</th>
                            <th scope="col" className="py-2 pr-3 text-left text-xs font-semibold text-gray-500">Focus</th>
                            <th scope="col" className="py-2 pr-3 text-left text-xs font-semibold text-gray-500">Hours</th>
                            <th scope="col" className="py-2 text-left text-xs font-semibold text-gray-500">Tasks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {roadmap.weeklySchedule.map((w) => (
                            <tr key={w.week}>
                              <td className="py-2.5 pr-3 font-semibold text-gray-900">{w.week}</td>
                              <td className="py-2.5 pr-3 text-gray-700">{w.focus}</td>
                              <td className="py-2.5 pr-3 text-gray-500">{w.hours}h</td>
                              <td className="py-2.5 text-gray-700">{w.tasks.join(' • ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {roadmap.practicalProjects.length > 0 && (
                    <section aria-label="Practical projects">
                      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                        <FolderGit2 className="h-4 w-4 text-blue-700" aria-hidden="true" /> Practical projects
                      </h3>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                        {roadmap.practicalProjects.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {roadmap.practiceExercises.length > 0 && (
                    <section aria-label="Practice exercises">
                      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                        <Wrench className="h-4 w-4 text-blue-700" aria-hidden="true" /> Practice exercises
                      </h3>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                        {roadmap.practiceExercises.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {roadmap.portfolioRecommendations.length > 0 && (
                    <section aria-label="Portfolio recommendations">
                      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                        <FolderOpen className="h-4 w-4 text-blue-700" aria-hidden="true" /> Portfolio
                      </h3>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                        {roadmap.portfolioRecommendations.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {roadmap.interviewPreparationTopics.length > 0 && (
                    <section aria-label="Interview preparation">
                      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                        <Users className="h-4 w-4 text-blue-700" aria-hidden="true" /> Interview prep
                      </h3>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                        {roadmap.interviewPreparationTopics.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">Estimated effort:</span> {roadmap.estimatedEffort}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{roadmap.assumptions}</p>
                </div>

                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">{roadmap.disclaimer}</p>

                <div>
                  <p className="text-xs text-gray-400">Roadmap ID: <code>{roadmap.id}</code> — find it again any time in Saved roadmaps.</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
