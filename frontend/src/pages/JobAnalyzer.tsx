import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  RotateCcw,
  TriangleAlert,
  CircleCheck,
  Lightbulb,
  MessageCircleQuestion,
  ClipboardCopy,
  Globe,
  HelpCircle,
} from 'lucide-react';
import api, { extractApiError, JobAnalysisResult, CompanyCheckResult } from '../services/api';
import { PageHeader, Card, CardHeader, Input, Textarea, Label, Button, ScoreGauge } from '../components';
import { RiskBadge, AnalysisTypeLabel } from '../components/RiskBadge';

function CompanyCheckPanel({ check }: { check: CompanyCheckResult }) {
  const [logoFailed, setLogoFailed] = useState(false);

  const levelStyles = {
    danger: 'border-rose-200 bg-rose-50 text-rose-800',
    warn: 'border-amber-200 bg-amber-50 text-amber-800',
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  } as const;

  const domainState = (p: CompanyCheckResult['probes'][number]) => {
    if (p.resolves === true && p.websiteResponded === true) return { icon: '✓', text: `Website live (HTTP ${p.httpStatus ?? ''})`, cls: 'text-emerald-700' };
    if (p.resolves === true) return { icon: '✓', text: 'Domain resolves, website did not respond', cls: 'text-amber-700' };
    if (p.resolves === false) return { icon: '✗', text: 'Domain does not exist in public DNS', cls: 'text-rose-700' };
    return { icon: '?', text: 'Check inconclusive (timeout/blocked)', cls: 'text-gray-500' };
  };

  return (
    <section aria-label="Company background check" className={`rounded-lg border p-4 ${levelStyles[check.verdictLevel]}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Globe className="h-4 w-4" aria-hidden="true" /> Company background check (live)
          </h3>
          <p className={`mt-1 text-sm font-medium ${check.verdictLevel === 'danger' ? 'text-rose-900' : ''}`}>{check.verdict}</p>
        </div>
        {check.logoUrl && !logoFailed && (
          <img
            src={check.logoUrl}
            alt={`Web icon found for ${check.foundDomain}`}
            className="h-12 w-12 rounded-lg border border-white/60 bg-white object-contain p-1"
            onError={() => setLogoFailed(true)}
          />
        )}
      </div>

      <ul className="mt-2 space-y-1 text-xs">
        {check.probes.map((p) => {
          const st = domainState(p);
          return (
            <li key={p.domain} className="flex items-start gap-1.5">
              <span aria-hidden="true" className="font-bold">{st.icon}</span>
              <span>
                <span className="font-mono font-semibold">{p.domain}</span>{' '}
                <span className={st.cls}>({st.text}; {p.source === 'recruiter-email' ? 'from recruiter email' : 'from company name'})</span>
              </span>
            </li>
          );
        })}
        {check.emailDomain && check.emailDomainIsFreemail && (
          <li className="flex items-start gap-1.5">
            <span aria-hidden="true" className="font-bold">!</span>
            <span>
              Recruiter email uses the free personal domain <span className="font-mono font-semibold">{check.emailDomain}</span>
            </span>
          </li>
        )}
      </ul>

      <div className="mt-2 space-y-1.5 text-xs">
        {check.signals.map((s, i) => (
          <p key={i}>{s}</p>
        ))}
        {check.aiWebSearch?.status === 'performed' && (
          <p>
            {check.aiWebSearch.summary}
            {check.aiWebSearch.sources.length > 0 && (
              <span className="ml-1 text-[11px] opacity-80">Sources: {check.aiWebSearch.sources.join(', ')}</span>
            )}
          </p>
        )}
      </div>

      <details className="mt-2">
        <summary className="flex cursor-pointer items-center gap-1 text-xs font-medium underline-offset-2 hover:underline">
          <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" /> What was checked automatically
        </summary>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[11px]">
          {check.checksPerformed.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
        <p className="mt-1 text-[11px] opacity-80">{check.disclaimer}</p>
      </details>
    </section>
  );
}

const initialForm = {
  jobTitle: '',
  companyName: '',
  jobDescription: '',
  advertisedSalary: '',
  recruiterEmailOrUrl: '',
};

const suspiciousSample = {
  jobTitle: 'Work From Home Data Entry',
  companyName: 'QuickCash Solutions',
  jobDescription:
    'Earn $5000/week from home! No experience needed. Immediate start — act now. Pay $99 registration fee upfront before onboarding. Send your OTP code and password to verify identity. Payment strictly by wire transfer or crypto. Guaranteed job offer, no interview required!',
  advertisedSalary: '$5000/week',
  recruiterEmailOrUrl: 'quickcash.hr@gmail.com',
};

const ordinarySample = {
  jobTitle: 'Junior Software Developer',
  companyName: 'TechCorp Inc',
  jobDescription:
    'TechCorp is seeking a Junior Software Developer to join our growing engineering team. You will build features with JavaScript and React under the guidance of senior engineers. Requirements: basic knowledge of JavaScript, React, HTML and CSS; familiarity with Git. We offer a competitive salary, health benefits, mentorship and a hybrid schedule. Apply through our careers page. We will schedule two interviews and a short technical assessment.',
  advertisedSalary: '$65,000–$75,000/year',
  recruiterEmailOrUrl: 'jobs@techcorp.com',
};

export default function JobAnalyzer() {
  const [formData, setFormData] = useState(initialForm);
  const [result, setResult] = useState<JobAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof initialForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData((f) => ({ ...f, [key]: e.target.value }));

  const analyze = async () => {
    if (!formData.jobTitle.trim() || !formData.companyName.trim() || !formData.jobDescription.trim()) {
      toast.error('Please fill in job title, company name, and the description or message.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post<JobAnalysisResult>('/job-analysis', formData);
      setResult(res.data);
      toast.success('Analysis complete');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const copyReport = async () => {
    if (!result) return;
    const report = [
      `LinkIntel AI — Job Scam Analysis Report`,
      `Generated: ${new Date(result.analysisTimestamp).toLocaleString()}`,
      `Analysis type: ${result.analysisType}`,
      ``,
      `Job title: ${formData.jobTitle}`,
      `Company: ${formData.companyName}`,
      ``,
      ...(result.companyCheck
        ? [
            `Company background check (live DNS/website probe): ${result.companyCheck.verdict}`,
            ...result.companyCheck.signals.map((s) => `- ${s}`),
            result.companyCheck.disclaimer,
            ``,
          ]
        : []),
      `Risk category: ${result.riskCategory}`,
      `Risk score: ${result.riskScore}/100 (estimate, not proof)`,
      ``,
      `Summary: ${result.shortExplanation}`,
      ``,
      `Warning signs:`,
      ...(result.detectedWarningSigns || []).map((w, i) => `${i + 1}. ${w.sign} — "${w.excerpt}" — ${w.why}`),
      ``,
      `Positive indicators:`,
      ...(result.positiveIndicators && result.positiveIndicators.length
        ? result.positiveIndicators.map((p) => `- ${p}`)
        : ['None detected in the supplied text.']),
      ``,
      `Recommended actions:`,
      ...result.recommendedNextActions.map((a) => `- ${a}`),
      ``,
      `Questions to ask the recruiter:`,
      ...result.questionsToAskRecruiter.map((q) => `- ${q}`),
      ``,
      result.uncertaintyDisclaimer,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(report);
      toast.success('Full report copied to clipboard');
    } catch {
      toast.error('Could not access clipboard');
    }
  };

  const resetAll = () => {
    setFormData(initialForm);
    setResult(null);
  };

  return (
    <div>
      <PageHeader
        title="AI Job Scam Detector"
        subtitle="Paste any job posting or recruiter message to surface potential warning signs — with evidence and next steps. The company's online presence is checked live in the background with every analysis."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader title="Job details" subtitle="Fields marked * are required" />
          <div className="space-y-4 px-6 py-5">
            <div>
              <Label htmlFor="jobTitle">Job title *</Label>
              <Input id="jobTitle" value={formData.jobTitle} onChange={set('jobTitle')} placeholder="e.g. Senior Backend Engineer" />
            </div>
            <div>
              <Label htmlFor="companyName">Company name *</Label>
              <Input id="companyName" value={formData.companyName} onChange={set('companyName')} placeholder="e.g. TechCorp Inc" />
            </div>
            <div>
              <Label htmlFor="jobDescription">Job description or recruiter message *</Label>
              <Textarea
                id="jobDescription"
                rows={7}
                value={formData.jobDescription}
                onChange={set('jobDescription')}
                placeholder="Paste the full posting or the recruiter's message here…"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="advertisedSalary" hint="optional">
                  Advertised salary
                </Label>
                <Input id="advertisedSalary" value={formData.advertisedSalary} onChange={set('advertisedSalary')} placeholder="e.g. $80k/year" />
              </div>
              <div>
                <Label htmlFor="recruiterEmailOrUrl" hint="optional">
                  Recruiter email or URL
                </Label>
                <Input id="recruiterEmailOrUrl" value={formData.recruiterEmailOrUrl} onChange={set('recruiterEmailOrUrl')} placeholder="e.g. hr@company.com" />
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-gray-600">
              High salaries, remote work, or reaching out on messaging apps are <strong>not</strong> treated as scam indicators on their own.
            </div>
            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              <Button onClick={analyze} disabled={loading}>
                {loading ? 'Analyzing…' : 'Analyze job'}
              </Button>
              <Button variant="danger" onClick={() => { setFormData(suspiciousSample); setResult(null); }} disabled={loading}>
                Suspicious sample
              </Button>
              <Button variant="subtle" onClick={() => { setFormData(ordinarySample); setResult(null); }} disabled={loading}>
                Ordinary sample
              </Button>
              <Button variant="secondary" onClick={resetAll} disabled={loading}>
                <RotateCcw className="h-4 w-4" /> Clear form
              </Button>
            </div>
          </div>
        </Card>

        {/* Result */}
        <div>
          {!result && !loading && (
            <Card className="flex h-full items-center justify-center p-10">
              <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                  <ShieldAlert className="h-7 w-7 text-blue-600" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-semibold text-gray-800">No analysis yet</p>
                <p className="mt-1 max-w-xs text-sm text-gray-500">
                  Fill in the details and press <strong>Analyze job</strong> — or load a sample to try demo mode.
                </p>
              </div>
            </Card>
          )}
          {loading && (
            <Card className="flex h-full items-center justify-center">
              <div className="text-center" aria-busy="true">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" aria-hidden="true" />
                <p className="mt-3 text-sm text-gray-500">Analyzing warning signs and checking the company online…</p>
              </div>
            </Card>
          )}
          {result && (
            <Card>
              <div className="border-b border-gray-100 px-6 py-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Analysis result</h2>
                  <RiskBadge category={result.riskCategory} />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(result.analysisTimestamp).toLocaleString()}
                  <span className="mx-2">•</span>
                  <AnalysisTypeLabel type={result.analysisType} />
                </p>
              </div>

              <div className="space-y-5 px-6 py-5">
                <div className="flex flex-col items-center gap-2">
                  <ScoreGauge score={result.riskScore} />
                  <p className="text-center text-sm text-gray-700">{result.shortExplanation}</p>
                </div>

                {result.companyCheck && (
                  <CompanyCheckPanel check={result.companyCheck} />
                )}

                {result.detectedWarningSigns && result.detectedWarningSigns.length > 0 ? (
                  <section aria-label="Warning signs">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-rose-700">
                      <TriangleAlert className="h-4 w-4" aria-hidden="true" /> Warning signs ({result.detectedWarningSigns.length})
                    </h3>
                    <ul className="space-y-2">
                      {result.detectedWarningSigns.map((w, i) => (
                        <li key={i} className="rounded-lg border border-rose-100 bg-rose-50/60 p-3">
                          <p className="text-sm font-semibold text-rose-800">{w.sign}</p>
                          {w.excerpt && (
                            <p className="mt-1 border-l-2 border-rose-300 pl-2 text-xs italic text-gray-600">"{w.excerpt}"</p>
                          )}
                          <p className="mt-1 text-xs text-gray-600">
                            <span className="font-medium text-gray-700">Why it matters:</span> {w.why}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : (
                  <p className="text-sm text-gray-600">No classic scam indicators found in the supplied text — that is <strong>not</strong> proof of legitimacy.</p>
                )}

                {result.positiveIndicators && result.positiveIndicators.length > 0 && (
                  <section aria-label="Positive indicators">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                      <CircleCheck className="h-4 w-4" aria-hidden="true" /> Positive indicators
                    </h3>
                    <ul className="space-y-1.5">
                      {result.positiveIndicators.map((p, i) => (
                        <li key={i} className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-800">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section aria-label="Recommended actions">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                    <Lightbulb className="h-4 w-4 text-blue-700" aria-hidden="true" /> Recommended next actions
                  </h3>
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
                    {result.recommendedNextActions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ol>
                </section>

                <section aria-label="Questions to ask the recruiter">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                    <MessageCircleQuestion className="h-4 w-4 text-blue-700" aria-hidden="true" /> Questions to ask the recruiter
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {result.questionsToAskRecruiter.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </section>

                <p className="rounded-lg bg-slate-50 p-3 text-xs text-gray-500">{result.uncertaintyDisclaimer}</p>

                <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  <Button variant="secondary" onClick={copyReport}>
                    <ClipboardCopy className="h-4 w-4" /> Copy report
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      resetAll();
                      document.getElementById('jobTitle')?.focus();
                    }}
                  >
                    <RotateCcw className="h-4 w-4" /> Analyze another job
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
