import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Shield,
  Database,
  Trash2,
  Download,
  RefreshCw,
  FileSearch,
  Lock,
  Server,
} from 'lucide-react';
import api, { extractApiError, HealthStatus } from '../services/api';
import { PageHeader, Card, CardHeader, Button } from '../components';

export default function Settings() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ applications: 0, roadmaps: 0, analyses: 0, matches: 0 });
  const [busy, setBusy] = useState(false);
  const [compact, setCompact] = useState(false);

  const loadHealth = useCallback(async () => {
    setHealthError(null);
    try {
      const res = await api.get<HealthStatus>('/health');
      setHealth(res.data);
    } catch (err) {
      setHealthError(extractApiError(err));
    }
  }, []);

  const loadCounts = useCallback(async () => {
    try {
      const res = await api.get('/demo-data/health');
      setCounts(res.data.counts || { applications: 0, roadmaps: 0, analyses: 0, matches: 0 });
    } catch {
      setCounts({ applications: 0, roadmaps: 0, analyses: 0, matches: 0 });
    }
  }, []);

  useEffect(() => {
    loadHealth();
    loadCounts();
  }, [loadHealth, loadCounts]);

  const seedSampleData = async () => {
    setBusy(true);
    try {
      await api.post('/demo-data/seed');
      toast.success('Sample applications created (marked as demo records)');
      await loadCounts();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const clearDemoData = async () => {
    if (!confirm('Clear ALL stored data — applications, roadmaps, job analyses and skill matches? This cannot be undone.')) return;
    setBusy(true);
    try {
      await api.delete('/demo-data');
      toast.success('All stored data cleared');
      await loadCounts();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const exportData = async () => {
    try {
      const [apps, roadmaps] = await Promise.all([api.get('/applications'), api.get('/roadmaps')]);
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), applications: apps.data, roadmaps: roadmaps.data }, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linkintel-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported as JSON');
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  return (
    <div>
      <PageHeader title="Settings & Privacy" subtitle="AI status, data management, and how your information is handled." />

      <div className="space-y-6">
        {/* AI configuration */}
        <Card>
          <CardHeader
            title="AI configuration"
            subtitle="Whether live Gemini AI analysis is enabled"
            action={
              <Button variant="secondary" onClick={loadHealth}>
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            }
          />
          <div className="px-6 py-5">
            {healthError ? (
              <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">Cannot reach the backend API: {healthError}</p>
            ) : !health ? (
              <p className="text-sm text-gray-400">Loading backend status…</p>
            ) : (
              <dl className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <dt className="text-sm text-gray-700">Operating mode</dt>
                  <dd>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                        health.mode === 'ai' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'
                      }`}
                    >
                      {health.mode === 'ai' ? 'AI mode (Gemini configured)' : 'Demo mode (rule-based analysis)'}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="text-sm text-gray-700">Google Gemini</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {health.geminiConfigured ? 'Configured via GEMINI_API_KEY (server-side only)' : 'Not configured'}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="text-sm text-gray-700">Configured model</dt>
                  <dd className="text-sm font-medium text-gray-900">{health.geminiModel}</dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="text-sm text-gray-700">Database</dt>
                  <dd className="text-sm font-medium text-gray-900 capitalize">{health.database}</dd>
                </div>
              </dl>
            )}
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-gray-500">
              Without an API key the app remains fully functional using deterministic, rule-based analysis — every result is
              labeled <strong>"Rule-Based Demo Analysis"</strong> so you always know what produced it.
            </p>
          </div>
        </Card>

        {/* Data management */}
        <Card>
          <CardHeader title="Stored data" subtitle="Counts from your local SQLite database" />
          <div className="px-6 py-5">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Applications', value: counts.applications },
                { label: 'Roadmaps', value: counts.roadmaps },
                { label: 'Job analyses', value: counts.analyses },
                { label: 'Skill matches', value: counts.matches },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-slate-50 p-3 text-center">
                  <dt className="text-xs text-gray-500">{s.label}</dt>
                  <dd className="mt-1 text-xl font-bold text-slate-900">{s.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={seedSampleData} disabled={busy}>
                <Database className="h-4 w-4" /> Seed sample applications
              </Button>
              <Button variant="secondary" onClick={exportData} disabled={busy}>
                <Download className="h-4 w-4" /> Export my data (JSON)
              </Button>
              <Button variant="danger" onClick={clearDemoData} disabled={busy}>
                <Trash2 className="h-4 w-4" /> Clear all stored data
              </Button>
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader title="Appearance" subtitle="Simple layout preference (light theme)" />
          <div className="px-6 py-5">
            <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">
              <span>
                <span className="block text-sm font-medium text-gray-900">Compact tables</span>
                <span className="mt-0.5 block text-xs text-gray-500">Reduces table padding for denser data display</span>
              </span>
              <input
                type="checkbox"
                checked={compact}
                onChange={(e) => setCompact(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </Card>

        {/* Privacy & security */}
        <Card>
          <CardHeader title="Privacy & security notes" subtitle="What this prototype does — and doesn't do" />
          <div className="space-y-4 px-6 py-5">
            <div className="flex gap-3 rounded-lg bg-slate-50 p-4">
              <Server className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Resume processing</p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                  Uploaded PDFs are stored only in a temporary server folder for the few seconds it takes to extract text, then
                  immediately deleted. Only a numeric summary (match score, counts) is saved in the database — never the resume
                  text itself. Full resume contents are not written to logs.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg bg-slate-50 p-4">
              <Lock className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-gray-900">API keys</p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                  The Gemini API key lives only in the backend environment (GEMINI_API_KEY). It is never included in the frontend
                  bundle, and every AI request is proxied through the backend.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg bg-slate-50 p-4">
              <Shield className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Honest limits of this prototype</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-relaxed text-gray-600">
                  <li>No user accounts or production-grade authentication by design.</li>
                  <li>No live external verifications — company lookups, URL fetching and badge checks are not performed.</li>
                  <li>Risk scores are heuristic estimates, not verified probabilities of fraud.</li>
                  <li>Rate limits protect AI endpoints, but this is not a hardened production API.</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg bg-slate-50 p-4">
              <FileSearch className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Independence</p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                  LinkIntel AI is an independent hackathon prototype. It is not affiliated with, endorsed by, or connected to
                  LinkedIn. It never scrapes or accesses LinkedIn data, and never claims that tracked applications were submitted
                  to LinkedIn or any employer.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
