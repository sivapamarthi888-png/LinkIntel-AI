export function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const color = clamped >= 60 ? '#e11d48' : clamped >= 20 ? '#d97706' : '#059669';
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`Risk score ${clamped} out of 100`}>
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{clamped}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">Risk score (estimate)</p>
    </div>
  );
}

export function MatchScoreRing({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const color = clamped >= 70 ? '#059669' : clamped >= 40 ? '#d97706' : '#e11d48';
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`Match score ${clamped}%`}>
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{clamped}%</span>
          <span className="text-xs text-gray-500">match</span>
        </div>
      </div>
    </div>
  );
}
