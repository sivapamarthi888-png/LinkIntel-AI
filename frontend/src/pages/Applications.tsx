import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  CalendarClock,
  CalendarX,
  Briefcase,
  Database,
} from 'lucide-react';
import { format } from 'date-fns';
import api, { extractApiError, Application } from '../services/api';
import { PageHeader, Card, CardHeader, Input, Select, Label, Textarea, Button, EmptyState, ListSkeleton } from '../components';
import { ALL_STATUSES, STATUS_COLORS, StatusPill } from '../components/StatusPill';

const initialForm = {
  job_title: '',
  company: '',
  job_url: '',
  application_date: format(new Date(), 'yyyy-MM-dd'),
  status: 'Interested',
  notes: '',
  follow_up_date: '',
  interview_date: '',
};

function isValidDateStr(s: string): boolean {
  return !s || /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function daysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return format(d, 'yyyy-MM-dd');
}

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc'>('date_desc');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [form, setForm] = useState({ ...initialForm });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<Application | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (filterStatus) params.status = filterStatus;
      params.sort = sortOrder;
      const res = await api.get<Application[]>('/applications', { params });
      setApplications(res.data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, sortOrder]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load]);

  const upcomingInterviews = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return applications
      .filter((a) => a.interview_date && a.interview_date >= today)
      .sort((a, b) => (a.interview_date! < b.interview_date! ? -1 : 1))
      .slice(0, 5);
  }, [applications]);

  const upcomingFollowUps = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return applications
      .filter((a) => a.follow_up_date && a.follow_up_date >= today && a.status !== 'Rejected' && a.status !== 'Withdrawn')
      .sort((a, b) => (a.follow_up_date! < b.follow_up_date! ? -1 : 1))
      .slice(0, 5);
  }, [applications]);

  const overdueFollowUps = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return applications.filter(
      (a) => a.follow_up_date && a.follow_up_date < today && a.status !== 'Rejected' && a.status !== 'Withdrawn'
    );
  }, [applications]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...initialForm });
    setFieldErrors({});
    setShowForm(true);
  };

  const openEdit = (app: Application) => {
    setEditing(app);
    setForm({
      job_title: app.job_title,
      company: app.company,
      job_url: app.job_url || '',
      application_date: app.application_date,
      status: app.status,
      notes: app.notes || '',
      follow_up_date: app.follow_up_date || '',
      interview_date: app.interview_date || '',
    });
    setFieldErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.job_title.trim()) errs.job_title = 'Job title is required.';
    if (!form.company.trim()) errs.company = 'Company is required.';
    if (!isValidDateStr(form.application_date) || !form.application_date) errs.application_date = 'A valid application date is required.';
    if (form.job_url && !/^https?:\/\//i.test(form.job_url)) errs.job_url = 'URL must start with http:// or https://';
    if (form.follow_up_date && !isValidDateStr(form.follow_up_date)) errs.follow_up_date = 'Invalid follow-up date.';
    if (form.interview_date && !isValidDateStr(form.interview_date)) errs.interview_date = 'Invalid interview date.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    const payload = {
      ...form,
      job_url: form.job_url || undefined,
      notes: form.notes || undefined,
      follow_up_date: form.follow_up_date || undefined,
      interview_date: form.interview_date || undefined,
    };
    try {
      if (editing) {
        await api.patch(`/applications/${editing.id}`, payload);
        toast.success('Application updated');
      } else {
        await api.post('/applications', payload);
        toast.success('Application added');
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/applications/${deleting.id}`);
      toast.success('Application deleted');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const seedSamples = async () => {
    try {
      await api.post('/demo-data/seed');
      toast.success('Sample applications added (demo records — not real submissions)');
      load();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const clearAll = async () => {
    if (!confirm('Delete ALL stored applications, roadmaps and analyses? This cannot be undone.')) return;
    try {
      await api.delete('/demo-data');
      toast.success('All data cleared');
      load();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const statusChartData = useMemo(
    () =>
      ALL_STATUSES.map((s) => ({ name: s, count: applications.filter((a) => a.status === s).length })).filter(
        (d) => d.count > 0
      ),
    [applications]
  );

  return (
    <div>
      <PageHeader
        title="Job Application Tracker"
        subtitle="Track every opportunity in one place. Records are stored in your local database — nothing is ever sent to LinkedIn or employers from here."
        actions={
          <>
            <Button variant="secondary" onClick={seedSamples}>
              <Database className="h-4 w-4" /> Load sample data
            </Button>
            <Button variant="danger" onClick={clearAll}>
              <Trash2 className="h-4 w-4" /> Clear all data
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add application
            </Button>
          </>
        }
      />

      {/* Upcoming panel */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader title="Upcoming interviews" subtitle={`${upcomingInterviews.length} scheduled`} />
          <div className="px-6 py-3">
            {upcomingInterviews.length === 0 ? (
              <p className="py-3 text-sm text-gray-500">No interviews scheduled.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {upcomingInterviews.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{a.job_title}</p>
                      <p className="text-xs text-gray-500">{a.company}</p>
                    </div>
                    <span className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                      <CalendarClock className="h-3 w-3" aria-hidden="true" />
                      {a.interview_date}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Upcoming follow-ups" subtitle={`${upcomingFollowUps.length} due`} />
          <div className="px-6 py-3">
            {upcomingFollowUps.length === 0 ? (
              <p className="py-3 text-sm text-gray-500">No follow-ups upcoming.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {upcomingFollowUps.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{a.job_title}</p>
                      <p className="text-xs text-gray-500">{a.company}</p>
                    </div>
                    <span className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      <CalendarClock className="h-3 w-3" aria-hidden="true" />
                      {a.follow_up_date}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Overdue follow-ups" subtitle={overdueFollowUps.length > 0 ? 'Action needed' : 'You are all caught up'} />
          <div className="px-6 py-3">
            {overdueFollowUps.length === 0 ? (
              <p className="py-3 text-sm text-gray-500">No overdue follow-ups.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {overdueFollowUps.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{a.job_title}</p>
                      <p className="text-xs text-gray-500">{a.company}</p>
                    </div>
                    <span className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                      <CalendarX className="h-3 w-3" aria-hidden="true" />
                      {a.follow_up_date}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader
            title={editing ? `Edit: ${editing.job_title} @ ${editing.company}` : 'Add a new application'}
            subtitle="Uses your local database. This does not submit anything to an employer or LinkedIn."
            action={
              <button onClick={() => setShowForm(false)} aria-label="Close form" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            }
          />
          <form onSubmit={submit} noValidate>
            <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
              <div>
                <Label htmlFor="f_job_title">Job title *</Label>
                <Input id="f_job_title" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} aria-invalid={!!fieldErrors.job_title} />
                {fieldErrors.job_title && <p className="mt-1 text-xs text-rose-600" role="alert">{fieldErrors.job_title}</p>}
              </div>
              <div>
                <Label htmlFor="f_company">Company *</Label>
                <Input id="f_company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} aria-invalid={!!fieldErrors.company} />
                {fieldErrors.company && <p className="mt-1 text-xs text-rose-600" role="alert">{fieldErrors.company}</p>}
              </div>
              <div>
                <Label htmlFor="f_job_url" hint="optional">
                  Job URL (https://)
                </Label>
                <Input id="f_job_url" type="url" value={form.job_url} onChange={(e) => setForm({ ...form, job_url: e.target.value })} aria-invalid={!!fieldErrors.job_url} />
                {fieldErrors.job_url && <p className="mt-1 text-xs text-rose-600" role="alert">{fieldErrors.job_url}</p>}
              </div>
              <div>
                <Label htmlFor="f_application_date">Application date *</Label>
                <Input id="f_application_date" type="date" value={form.application_date} onChange={(e) => setForm({ ...form, application_date: e.target.value })} />
                {fieldErrors.application_date && <p className="mt-1 text-xs text-rose-600" role="alert">{fieldErrors.application_date}</p>}
              </div>
              <div>
                <Label htmlFor="f_status">Status *</Label>
                <Select id="f_status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="f_follow_up" hint="optional">
                  Follow-up date
                </Label>
                <Input id="f_follow_up" type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} />
                {fieldErrors.follow_up_date && <p className="mt-1 text-xs text-rose-600" role="alert">{fieldErrors.follow_up_date}</p>}
              </div>
              <div>
                <Label htmlFor="f_interview" hint="optional">
                  Interview date
                </Label>
                <Input id="f_interview" type="date" value={form.interview_date} onChange={(e) => setForm({ ...form, interview_date: e.target.value })} />
                {fieldErrors.interview_date && <p className="mt-1 text-xs text-rose-600" role="alert">{fieldErrors.interview_date}</p>}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="f_notes" hint="optional">
                  Notes
                </Label>
                <Textarea id="f_notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Contacts, salary discussed, reminders…" />
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4">
              <Button type="submit">{editing ? 'Update application' : 'Create application'}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search / filter / sort */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" aria-hidden="true">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company or job title…"
            aria-label="Search applications"
            className="!mt-0 !pl-9"
          />
        </div>
        <div className="flex gap-3">
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
            className="!mt-0 w-40"
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'date_desc' | 'date_asc')}
            aria-label="Sort by date"
            className="!mt-0 w-40"
          >
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
          </Select>
        </div>
      </div>

      {/* Status bar chart */}
      {statusChartData.length > 0 && (
        <div className="mb-6" aria-hidden="true">
          <div className="flex flex-wrap gap-2">
            {statusChartData.map((d) => (
              <button
                key={d.name}
                onClick={() => setFilterStatus(filterStatus === d.name ? '' : d.name)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                  filterStatus === d.name ? 'ring-2' : 'ring-1 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: `${STATUS_COLORS[d.name]}18`, color: STATUS_COLORS[d.name] }}
              >
                {d.name}: {d.count}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <EmptyState title="Could not load applications" description={error} action={<Button onClick={load}>Retry</Button>} />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={search || filterStatus ? 'No matching applications' : 'No applications yet'}
          description={
            search || filterStatus
              ? 'Try a different search term or clear the status filter.'
              : 'Start tracking your opportunities — or load sample data to see how it works.'
          }
          action={
            !search && !filterStatus ? (
              <div className="flex gap-2">
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Add application
                </Button>
                <Button variant="secondary" onClick={seedSamples}>
                  <Database className="h-4 w-4" /> Load sample data
                </Button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Job & company</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Dates</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {applications.map((a) => {
                  const isOverdue =
                    a.follow_up_date && a.follow_up_date < daysFromToday(0) && !['Rejected', 'Withdrawn'].includes(a.status);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          {a.job_title}
                          {a.job_url && (
                            <a href={a.job_url} target="_blank" rel="noopener noreferrer" aria-label={`Open job posting for ${a.job_title} (user-supplied link)`} className="text-blue-600 hover:text-blue-800">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {isOverdue && (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">Follow-up overdue</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">{a.company}</p>
                        {a.notes && <p className="mt-1 max-w-md truncate text-xs text-gray-400">{a.notes}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={a.status} />
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        <p>Applied: {a.application_date}</p>
                        {a.interview_date && <p className="mt-0.5">Interview: {a.interview_date}</p>}
                        {a.follow_up_date && <p className="mt-0.5">Follow-up: {a.follow_up_date}</p>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEdit(a)} aria-label={`Edit ${a.job_title}`} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleting(a)} aria-label={`Delete ${a.job_title}`} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDeleting(null)} aria-hidden="true" />
          <Card className="relative w-full max-w-md">
            <div className="p-6">
              <h2 id="delete-dialog-title" className="text-base font-semibold text-gray-900">Delete application?</h2>
              <p className="mt-2 text-sm text-gray-600">
                Permanently delete <strong>{deleting.job_title}</strong> at <strong>{deleting.company}</strong>? This cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setDeleting(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={confirmDelete}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
