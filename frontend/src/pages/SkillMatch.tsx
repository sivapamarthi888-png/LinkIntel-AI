import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FileSearch,
  Upload,
  FileText,
  RotateCcw,
  CircleCheck,
  CircleMinus,
  Repeat,
  Wrench,
  FolderGit2,
  FileWarning,
  GraduationCap,
} from 'lucide-react';
import api, { extractApiError, SkillMatchResult } from '../services/api';
import { PageHeader, Card, CardHeader, Input, Label, Textarea, Button, MatchScoreRing } from '../components';
import { AnalysisTypeLabel } from '../components/RiskBadge';

const SAMPLE_RESUME = `John Doe — Software Developer
Email: john.doe@example.com

SKILLS
JavaScript, React, HTML5, CSS3, Git, REST APIs, Jest, Agile

EXPERIENCE
Personal portfolio site — built with React and CSS (2024)
Intern project at TechStart — REST API consumed in a React dashboard

EDUCATION
BSc Computer Science, 2023`;

const SAMPLE_JOB = `Frontend Developer — TechCorp Inc

We are hiring a frontend developer to build user-facing products.

Requirements:
- 2+ years with JavaScript and TypeScript
- Strong React experience (hooks, state management)
- Solid HTML/CSS and responsive design
- Experience with REST APIs and Git workflows
- Knowledge of Node.js is a plus for our full-stack teams
- SQL basics for analytics dashboards
- Strong communication skills

Nice to have: Next.js, Tailwind CSS.`;

export default function SkillMatch() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [result, setResult] = useState<SkillMatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [resumeSource, setResumeSource] = useState<'text' | 'pdf'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are supported. Or paste your resume text instead.');
      e.target.value = '';
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File too large — the limit is 5 MB.');
      e.target.value = '';
      return;
    }
    setFile(f);
    setPdfFileName(f.name);
    setResumeSource('pdf');
    setResult(null);
  };

  const loadSamples = () => {
    setResumeText(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JOB);
    setTargetJobTitle('Frontend Developer');
    setFile(null);
    setPdfFileName(null);
    setResumeSource('text');
    setResult(null);
  };

  const resetAll = () => {
    setResumeText('');
    setJobDescription('');
    setTargetJobTitle('');
    setFile(null);
    setPdfFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setResumeSource('text');
    setResult(null);
  };

  const match = async () => {
    if (resumeSource === 'text' && !resumeText.trim()) {
      toast.error('Paste your resume text or upload a PDF.');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Job description is required.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      if (resumeSource === 'pdf' && file) {
        fd.append('resume', file);
      } else {
        fd.append('resumeText', resumeText);
      }
      fd.append('jobDescription', jobDescription);
      fd.append('targetJobTitle', targetJobTitle);
      const res = await api.post<SkillMatchResult>('/skill-match', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success('Skill match complete');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setLoading(false);
      // Cleanup local file reference after processing — server deletes its temp copy
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <PageHeader
        title="Resume-to-Job Skill Matcher"
        subtitle="Compare your resume with a job description to see matched skills, gaps and concrete next steps."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <Card>
          <CardHeader
            title="Your inputs"
            subtitle="Attach a PDF resume or paste text"
            action={
              <Button variant="subtle" onClick={loadSamples} disabled={loading}>
                <FileText className="h-4 w-4" /> Load sample inputs
              </Button>
            }
          />
          <div className="space-y-4 px-6 py-5">
            {/* Resume input */}
            <div>
              <Label htmlFor="resume-upload">Resume</Label>
              <div className="mt-1 rounded-xl border-2 border-dashed border-gray-300 bg-slate-50 p-4 text-center">
                <Upload className="mx-auto h-7 w-7 text-gray-400" aria-hidden="true" />
                <div className="mt-2 flex items-center justify-center gap-2">
                  <label htmlFor="resume-upload" className="cursor-pointer text-sm font-semibold text-blue-700 hover:text-blue-800">
                    Choose PDF
                  </label>
                  <span className="text-xs text-gray-400">or switch to text below</span>
                </div>
                <input
                  ref={fileInputRef}
                  id="resume-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                {pdfFileName && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> {pdfFileName} selected
                    <button
                      type="button"
                      className="ml-1 text-emerald-500 hover:text-emerald-800"
                      onClick={() => {
                        setFile(null);
                        setPdfFileName(null);
                        setResumeSource('text');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      aria-label="Remove selected PDF"
                    >
                      ✕
                    </button>
                  </p>
                )}
                <p className="mt-2 text-[11px] text-gray-400">PDF only, max 5 MB. Text is extracted server-side and the temporary file is deleted after processing.</p>
              </div>
              <Textarea
                id="resume-text"
                rows={6}
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  if (e.target.value) setResumeSource('text');
                }}
                placeholder="Or paste your resume text here (used when no PDF is selected)…"
                className="mt-3"
                aria-label="Resume text"
              />
            </div>

            <div>
              <Label htmlFor="targetJobTitle" hint="optional">
                Target job title
              </Label>
              <Input id="targetJobTitle" value={targetJobTitle} onChange={(e) => setTargetJobTitle(e.target.value)} placeholder="e.g. Frontend Developer" />
            </div>

            <div>
              <Label htmlFor="jobDescription">Job description *</Label>
              <Textarea id="jobDescription" rows={7} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description here…" />
            </div>

            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              <Button onClick={match} disabled={loading}>
                {loading ? 'Matching…' : 'Match skills'}
              </Button>
              <Button variant="secondary" onClick={resetAll} disabled={loading}>
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Results */}
        <div>
          {!result && !loading && (
            <Card className="flex h-full items-center justify-center p-10">
              <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                  <FileSearch className="h-7 w-7 text-blue-600" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-semibold text-gray-800">No match yet</p>
                <p className="mt-1 max-w-xs text-sm text-gray-500">Add your resume and a job description, then press Match skills.</p>
              </div>
            </Card>
          )}
          {loading && (
            <Card className="flex h-full items-center justify-center">
              <div className="text-center" aria-busy="true">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" aria-hidden="true" />
                <p className="mt-3 text-sm text-gray-500">Comparing skills…</p>
              </div>
            </Card>
          )}
          {result && (
            <Card>
              <div className="border-b border-gray-100 px-6 py-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Match result</h2>
                  <AnalysisTypeLabel type={result.analysisType} />
                </div>
                {result.targetJobTitle && <p className="mt-1 text-xs text-gray-500">Target: {result.targetJobTitle}</p>}
              </div>

              <div className="space-y-5 px-6 py-5">
                <div className="flex flex-col items-center gap-2">
                  <MatchScoreRing percent={result.matchPercentage} />
                  <p className="max-w-sm text-center text-xs text-gray-500">{result.explanation}</p>
                </div>

                <section aria-label="Matched skills">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                    <CircleCheck className="h-4 w-4" aria-hidden="true" /> Matched skills ({result.matchedSkills.length})
                  </h3>
                  {result.matchedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchedSkills.map((s) => (
                        <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">None detected — check that your resume mentions key skills explicitly.</p>
                  )}
                  <p className="mt-2 text-[11px] text-gray-400">A missing keyword is not proof you lack a skill — it may be worded differently in your resume.</p>
                </section>

                {result.missingOrWeaklyEvidencedSkills.length > 0 && (
                  <section aria-label="Missing or weakly evidenced skills">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                      <CircleMinus className="h-4 w-4" aria-hidden="true" /> Missing or weakly evidenced ({result.missingOrWeaklyEvidencedSkills.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missingOrWeaklyEvidencedSkills.map((s) => (
                        <span key={s} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {result.transferableSkills.length > 0 && (
                  <section aria-label="Transferable skills">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-blue-700">
                      <Repeat className="h-4 w-4" aria-hidden="true" /> Transferable skills
                    </h3>
                    <ul className="space-y-1.5">
                      {result.transferableSkills.map((t) => (
                        <li key={t.skill} className="rounded-lg bg-blue-50/70 px-3 py-2 text-sm text-blue-800">
                          <span className="font-semibold">{t.skill}</span> — {t.reason}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {result.importantJobRequirements.length > 0 && (
                  <section aria-label="Important job requirements">
                    <h3 className="mb-2 text-sm font-semibold text-gray-800">Key requirements in the job</h3>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                      {result.importantJobRequirements.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {result.recommendedSkillsToLearn.length > 0 && (
                  <section aria-label="Recommended skills to learn">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                      <GraduationCap className="h-4 w-4 text-blue-700" aria-hidden="true" /> Skills to learn
                    </h3>
                    <ul className="space-y-1.5">
                      {result.recommendedSkillsToLearn.map((r) => (
                        <li key={r.skill} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-gray-700">
                          <span className="font-semibold text-gray-900">{r.skill}</span>
                          {r.category && <span className="ml-1.5 text-[11px] uppercase tracking-wide text-gray-400">{r.category}</span>}
                          <p className="text-xs text-gray-500">{r.reason}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {result.portfolioProjectSuggestions.length > 0 && (
                  <section aria-label="Portfolio project suggestions">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                      <FolderGit2 className="h-4 w-4 text-blue-700" aria-hidden="true" /> Portfolio project ideas
                    </h3>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                      {result.portfolioProjectSuggestions.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </section>
                )}

                <section aria-label="Resume improvement suggestions">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                    <FileWarning className="h-4 w-4 text-blue-700" aria-hidden="true" /> Resume improvements
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {result.resumeImprovementSuggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </section>

                {result.interviewPreparationTopics.length > 0 && (
                  <section aria-label="Interview preparation">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                      <Wrench className="h-4 w-4 text-blue-700" aria-hidden="true" /> Interview preparation
                    </h3>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                      {result.interviewPreparationTopics.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </section>
                )}

                <div className="flex border-t border-gray-100 pt-4">
                  <Button variant="ghost" onClick={resetAll}>
                    <RotateCcw className="h-4 w-4" /> Match another job
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
