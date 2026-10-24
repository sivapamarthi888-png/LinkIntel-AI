import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  UserCheck,
  CircleCheck,
  CircleAlert,
  CircleHelp,
  CircleMinus,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import api, { extractApiError, VerificationResult } from '../services/api';
import { PageHeader, Card, CardHeader, Input, Label, Button } from '../components';

const initial = {
  companyName: '',
  recruiterName: '',
  recruiterEmailDomain: '',
  jobListingUrl: '',
  officialCareersUrl: '',
};

function StatusIcon({ status }: { status: string }) {
  if (status.includes('Supported')) return <CircleCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />;
  if (status.includes('Warning')) return <CircleAlert className="h-4 w-4 text-rose-600" aria-hidden="true" />;
  if (status.includes('Needs')) return <CircleHelp className="h-4 w-4 text-amber-600" aria-hidden="true" />;
  return <CircleMinus className="h-4 w-4 text-slate-400" aria-hidden="true" />;
}

function StatusClasses({ status }: { status: string }) {
  if (status.includes('Supported')) return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (status.includes('Warning')) return 'bg-rose-50 text-rose-700 ring-rose-200';
  if (status.includes('Needs')) return 'bg-amber-50 text-amber-700 ring-amber-200';
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}

export default function Verification() {
  const [formData, setFormData] = useState(initial);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((f) => ({ ...f, [key]: e.target.value }));

  const check = async () => {
    if (!formData.companyName.trim()) {
      toast.error('Company name is required to generate the checklist.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post<VerificationResult>('/verification-check', formData);
      setResult(res.data);
      toast.success('Verification checklist generated');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Recruiter & Company Verification"
        subtitle="A guided checklist to verify an opportunity yourself. This tool never marks an employer as verified."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader title="Opportunity details" subtitle="Only company name is required — more detail means a sharper checklist" />
          <div className="space-y-4 px-6 py-5">
            <div>
              <Label htmlFor="companyName">Company name *</Label>
              <Input id="companyName" value={formData.companyName} onChange={set('companyName')} placeholder="e.g. TechCorp Inc" />
            </div>
            <div>
              <Label htmlFor="recruiterName" hint="optional">
                Recruiter name
              </Label>
              <Input id="recruiterName" value={formData.recruiterName} onChange={set('recruiterName')} placeholder="e.g. Jane Smith" />
            </div>
            <div>
              <Label htmlFor="recruiterEmailDomain" hint="optional">
                Recruiter email or its domain
              </Label>
              <Input id="recruiterEmailDomain" value={formData.recruiterEmailDomain} onChange={set('recruiterEmailDomain')} placeholder="e.g. jane@techcorp.com or techcorp.com" />
            </div>
            <div>
              <Label htmlFor="jobListingUrl" hint="optional">
                Job listing URL you were sent
              </Label>
              <Input id="jobListingUrl" type="url" value={formData.jobListingUrl} onChange={set('jobListingUrl')} placeholder="https://…" />
            </div>
            <div>
              <Label htmlFor="officialCareersUrl" hint="optional">
                Official careers-page URL you found
              </Label>
              <Input id="officialCareersUrl" type="url" value={formData.officialCareersUrl} onChange={set('officialCareersUrl')} placeholder="https://…" />
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-xs text-gray-600">
              This assistant does <strong>not</strong> fetch any URLs or look up company records. Every result below is based only on
              what you type here, plus general safety guidance.
            </div>

            <Button onClick={check} disabled={loading} className="w-full">
              {loading ? 'Generating checklist…' : 'Generate verification checklist'}
            </Button>
          </div>
        </Card>

        {/* Results */}
        <div>
          {!result && !loading && (
            <Card className="flex h-full items-center justify-center p-10">
              <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                  <UserCheck className="h-7 w-7 text-blue-600" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-semibold text-gray-800">No checklist yet</p>
                <p className="mt-1 max-w-xs text-sm text-gray-500">Enter the company name and generate your verification checklist.</p>
              </div>
            </Card>
          )}
          {loading && (
            <Card className="flex h-full items-center justify-center">
              <div className="text-center" aria-busy="true">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" aria-hidden="true" />
                <p className="mt-3 text-sm text-gray-500">Building checklist…</p>
              </div>
            </Card>
          )}
          {result && (
            <Card>
              <div className="border-b border-gray-100 px-6 py-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Checklist for {result.companyName}</h2>
                </div>
                <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                  <ShieldX className="h-3.5 w-3.5" aria-hidden="true" />
                  Live verification: not performed in this prototype
                </p>
              </div>

              <div className="space-y-5 px-6 py-5">
                {/* Checklist */}
                <section aria-label="Verification checklist">
                  <ol className="space-y-2.5">
                    {result.checklist.map((item, i) => (
                      <li key={i} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="flex items-start gap-2 text-sm font-medium text-gray-900">
                            <span className="mt-0.5"><StatusIcon status={item.status} /></span>
                            {item.item}
                          </p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${StatusClasses({ status: item.status })}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-1.5 pl-6 text-xs leading-relaxed text-gray-600">{item.notes}</p>
                      </li>
                    ))}
                  </ol>
                </section>

                {/* Domain guidance */}
                <section aria-label="Domain consistency guidance" className="rounded-lg bg-blue-50/70 p-4">
                  <h3 className="text-sm font-semibold text-blue-900">Domain consistency guidance</h3>
                  <p className="mt-1.5 text-xs text-blue-800">{result.domainGuidance.rule}</p>
                  {result.domainGuidance.candidateOfficialDomains.length > 0 && (
                    <p className="mt-2 text-xs text-blue-800">
                      <span className="font-semibold">Suggested domains to check manually:</span>{' '}
                      {result.domainGuidance.candidateOfficialDomains.join(', ')}
                    </p>
                  )}
                  <p className="mt-1.5 text-[11px] leading-relaxed text-blue-700">{result.domainGuidance.note}</p>
                </section>

                {/* General guidance */}
                <section aria-label="General guidance">
                  <h3 className="mb-2 text-sm font-semibold text-gray-800">How to check — practical steps</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="rounded-lg bg-slate-50 p-3">
                      <span className="font-semibold">Careers page:</span> {result.guidance.officialCareersPage}
                    </li>
                    <li className="rounded-lg bg-slate-50 p-3">
                      <span className="font-semibold">Verification badges:</span> {result.guidance.verificationBadges}
                    </li>
                    <li className="rounded-lg bg-slate-50 p-3">
                      <span className="font-semibold">Email domain:</span> {result.guidance.domainConsistency}
                    </li>
                  </ul>
                </section>

                {/* Warnings */}
                <section aria-label="Critical safety warnings" className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-rose-800">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Non-negotiable safety rules
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-rose-700">
                    {result.guidance.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </section>

                <p className="rounded-lg bg-slate-50 p-3 text-xs text-gray-500">{result.disclaimer}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
