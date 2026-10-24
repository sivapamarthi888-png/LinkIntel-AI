import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command } from 'lucide-react';

const LINKS = [
  { label: 'Dashboard', path: '/dashboard', keywords: 'home overview stats' },
  { label: 'Job Scam Detector', path: '/job-analyzer', keywords: 'scam fraud risk analyze job posting recruiter message' },
  { label: 'Skill Matcher', path: '/skill-match', keywords: 'resume skills match job description percent' },
  { label: 'Verification', path: '/verification', keywords: 'recruiter company verify checklist domain email' },
  { label: 'Career Roadmap', path: '/career-roadmap', keywords: 'roadmap learning plan milestones career' },
  { label: 'Applications', path: '/applications', keywords: 'tracker applications jobs status interview offer' },
  { label: 'Settings', path: '/settings', keywords: 'settings privacy demo data ai config' },
];

export function LocationSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim().length > 0
    ? LINKS.filter((l) =>
        l.label.toLowerCase().includes(query.toLowerCase()) || l.keywords.includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" aria-hidden="true">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="global-search-results"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results.length > 0) go(results[0].path);
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Search pages…"
        aria-label="Search pages"
        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-300" aria-hidden="true">
        <Command className="h-3.5 w-3.5" />
      </span>

      {open && results.length > 0 && (
        <ul
          id="global-search-results"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-200"
          role="listbox"
        >
          {results.map((r) => (
            <li key={r.path} role="option" aria-selected="false">
              <button
                onClick={() => go(r.path)}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
