import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  FileSearch,
  UserCheck,
  Map as MapIcon,
  Briefcase,
  Settings as SettingsIcon,
  Menu,
  X,
  Sparkles,
  Home,
} from 'lucide-react';
import { LocationSearch } from './LocationSearch';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Job Scam Detector', href: '/job-analyzer', icon: ShieldAlert },
  { name: 'Skill Matcher', href: '/skill-match', icon: FileSearch },
  { name: 'Verification', href: '/verification', icon: UserCheck },
  { name: 'Career Roadmap', href: '/career-roadmap', icon: MapIcon },
  { name: 'Applications', href: '/applications', icon: Briefcase },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-4 pb-6 pt-1"
        aria-label="LinkIntel AI home"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 shadow-md">
          <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-lg font-bold leading-tight text-white">LinkIntel AI</span>
          <span className="block text-[10px] font-medium uppercase tracking-widest text-blue-300">
            Career Intelligence
          </span>
        </span>
      </Link>
      <nav className="flex-1 space-y-1 px-3" aria-label="Primary">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/10'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 px-4 py-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2 text-xs font-medium text-slate-400 transition hover:text-white"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to landing page
        </Link>
        <p className="mt-3 text-[11px] leading-snug text-slate-500">
          Independent prototype. Not affiliated with LinkedIn.
        </p>
      </div>
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`fixed inset-0 bg-slate-900/60 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        <div
          className={`fixed inset-y-0 left-0 flex w-72 flex-col bg-slate-900 pt-6 transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex justify-end px-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <SidebarNav onNavigate={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-slate-900 pt-7 lg:flex">
        <SidebarNav />
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-gray-100 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <LocationSearch />
            <Link
              to="/applications"
              className="hidden shrink-0 items-center gap-2 rounded-lg bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:inline-flex"
            >
              <Briefcase className="h-4 w-4" aria-hidden="true" />
              Track an application
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10" data-testid="page-container" data-page={location.pathname}>
          <div className="mx-auto w-full max-w-6xl">{children}</div>
          <footer className="mx-auto mt-12 w-full max-w-6xl border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
            <p>
              LinkIntel AI — an independent prototype for the Build the Future hackathon. Not affiliated with or endorsed by
              LinkedIn. Risk scores are estimates, never proof of legitimacy or fraud.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
