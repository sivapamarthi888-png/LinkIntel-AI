import { ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react';

export function RiskBadge({ category }: { category: 'Low' | 'Medium' | 'High' | string }) {
  const config: Record<string, { icon: any; classes: string; label: string }> = {
    Low: { icon: ShieldCheck, classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', label: 'Low Risk' },
    Medium: { icon: AlertTriangle, classes: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', label: 'Medium Risk' },
    High: { icon: ShieldX, classes: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200', label: 'High Risk' },
  };
  const c = config[category] || config.Low;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${c.classes}`}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {c.label}
    </span>
  );
}

export function AnalysisTypeLabel({ type }: { type: string }) {
  const isAI = type && (type.toLowerCase().includes('gemini') || type.toLowerCase().includes('ai'));
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
        isAI ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
      title={isAI ? 'Live Gemini AI analysis' : 'Deterministic rule-based analysis, labeled for clarity'}
    >
      {isAI ? 'AI Analysis' : 'Rule-Based Demo Analysis'}
    </span>
  );
}
