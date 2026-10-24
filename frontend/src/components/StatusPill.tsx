const STATUS_STYLES: Record<string, string> = {
  Interested: 'bg-slate-100 text-slate-700 ring-slate-200',
  Applied: 'bg-blue-50 text-blue-700 ring-blue-200',
  Assessment: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Interview: 'bg-violet-50 text-violet-700 ring-violet-200',
  Offer: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  Withdrawn: 'bg-amber-50 text-amber-700 ring-amber-200',
};

export function StatusPill({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 ring-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cls}`}>
      {status}
    </span>
  );
}

export const ALL_STATUSES = ['Interested', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

export const STATUS_COLORS: Record<string, string> = {
  Interested: '#94a3b8',
  Applied: '#3b82f6',
  Assessment: '#6366f1',
  Interview: '#8b5cf6',
  Offer: '#10b981',
  Rejected: '#f43f5e',
  Withdrawn: '#f59e0b',
};
