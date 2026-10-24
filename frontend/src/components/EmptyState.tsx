import { CircleDashed } from 'lucide-react';

export function EmptyState({
  icon: Icon = CircleDashed,
  title,
  description,
  action,
}: {
  icon?: any;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      <div className="rounded-full bg-slate-100 p-3">
        <Icon className="h-7 w-7 text-slate-400" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <SkeletonLine className="h-4 w-1/3" />
      <SkeletonLine className="mt-4 h-8 w-1/2" />
      <SkeletonLine className="mt-3 h-3 w-2/3" />
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <SkeletonLine className="h-4 w-1/2" />
          <SkeletonLine className="mt-2 h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}
