import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import adminService, { type BugReport } from '../../../services/adminService';
import IconLoader from '../../../components/Icon/IconLoader';
import IconAlertCircle from '../../../components/Icon/IconAlertCircle';
import IconSquareCheck from '../../../components/Icon/IconSquareCheck';

const PAGE_SIZE = 25;

const BugReports = () => {
    const dispatch = useDispatch();
    const [reports, setReports] = useState<BugReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [severityFilter, setSeverityFilter] = useState<string>('');
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);

    useEffect(() => {
        dispatch(setPageTitle('Bug Reports'));
    }, [dispatch]);

    const loadReports = async (options?: { page?: number }) => {
        setLoading(true);
        setError('');
        const nextPage = options?.page ?? page;
        try {
            const res = await adminService.getBugReports({
                limit: PAGE_SIZE,
                offset: nextPage * PAGE_SIZE,
                status: statusFilter || undefined,
                severity: severityFilter || undefined,
            });
            setReports(res.data || []);
            setTotal(res.pagination?.total || 0);
            setPage(nextPage);
        } catch (err: any) {
            setError(err?.message || 'Failed to load bug reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadReports({ page: 0 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, severityFilter]);

    const pageCount = useMemo(() => Math.ceil(total / PAGE_SIZE), [total]);

    const updateStatus = async (reportId: number, status: BugReport['status']) => {
        setSavingId(reportId);
        setSuccess('');
        setError('');
        try {
            await adminService.updateBugReportStatus(reportId, status);
            setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
            setSuccess('Bug report updated successfully');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err: any) {
            setError(err?.message || 'Failed to update bug report');
        } finally {
            setSavingId(null);
        }
    };

    const closeDetails = () => setSelectedReport(null);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <IconLoader className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bug Reports</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Review and triage user-reported issues.</p>
            </div>

            {success && (
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 text-green-800 dark:text-green-200 flex items-center gap-2">
                    <IconSquareCheck className="w-5 h-5" />
                    {success}
                </div>
            )}
            {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 text-red-800 dark:text-red-200 flex items-center gap-2">
                    <IconAlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="panel p-4 flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-semibold mb-2">Status</label>
                    <select className="form-select w-full" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All</option>
                        <option value="NEW">New</option>
                        <option value="TRIAGED">Triaged</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-semibold mb-2">Severity</label>
                    <select className="form-select w-full" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                        <option value="">All</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                    </select>
                </div>
                <button type="button" className="btn btn-outline-primary" onClick={() => loadReports({ page: 0 })}>
                    Refresh
                </button>
            </div>

            <div className="panel p-0 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-white-light/50 dark:bg-dark">
                        <tr>
                            <th className="px-4 py-3 text-left">Title</th>
                            <th className="px-4 py-3 text-left">Severity</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Reporter</th>
                            <th className="px-4 py-3 text-left">Created</th>
                            <th className="px-4 py-3 text-left">Screenshot</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length === 0 ? (
                            <tr>
                                <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                                    No bug reports found.
                                </td>
                            </tr>
                        ) : (
                            reports.map((report) => (
                                <tr key={report.id} className="border-b border-gray-100 dark:border-gray-800">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-900 dark:text-white">{report.title}</div>
                                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{report.description}</div>
                                        <button type="button" className="mt-2 text-xs text-primary hover:underline" onClick={() => setSelectedReport(report)}>
                                            View details
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800">{report.severity}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            className="form-select"
                                            value={report.status}
                                            onChange={(e) => updateStatus(report.id, e.target.value as BugReport['status'])}
                                            disabled={savingId === report.id}
                                        >
                                            <option value="NEW">New</option>
                                            <option value="TRIAGED">Triaged</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="RESOLVED">Resolved</option>
                                            <option value="CLOSED">Closed</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-900 dark:text-white">{report.reportedBy?.name || report.reportedBy?.email || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500">{report.reportedBy?.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(report.createdAt).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        {report.screenshotUrl ? (
                                            <a href={report.screenshotUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                                View
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">None</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedReport.title}</h2>
                                <p className="mt-1 text-sm text-gray-500">Reported on {new Date(selectedReport.createdAt).toLocaleString()}</p>
                            </div>
                            <button type="button" className="text-white-dark hover:text-danger" onClick={closeDetails}>
                                Close
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Summary</div>
                                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{selectedReport.description}</p>
                            </div>
                            <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reporter</div>
                                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                                    <div>{selectedReport.reportedBy?.name || selectedReport.reportedBy?.email || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{selectedReport.reportedBy?.email}</div>
                                </div>
                                <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Severity / Status</div>
                                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                                    {selectedReport.severity} • {selectedReport.status}
                                </div>
                                <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Screenshot</div>
                                <div className="mt-2 text-sm">
                                    {selectedReport.screenshotUrl ? (
                                        <a href={selectedReport.screenshotUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                            View screenshot
                                        </a>
                                    ) : (
                                        <span className="text-gray-400">None</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-lg border border-gray-100 p-4 dark:border-gray-800">
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">What gets captured automatically</div>
                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div>
                                    <div className="text-xs text-gray-500">Current page URL or referrer</div>
                                    {selectedReport.pageUrl ? (
                                        <a href={selectedReport.pageUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-primary break-all hover:underline">
                                            {selectedReport.pageUrl}
                                        </a>
                                    ) : (
                                        <div className="mt-1 text-xs text-gray-400">Not captured</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Browser and device details</div>
                                    <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 break-words">{selectedReport.userAgent || 'Not captured'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Module context (PMS or IH)</div>
                                    <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">{selectedReport.module || 'Not captured'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {pageCount > 1 && (
                <div className="flex items-center justify-between">
                    <button type="button" className="btn btn-outline-primary" disabled={page === 0} onClick={() => loadReports({ page: page - 1 })}>
                        Previous
                    </button>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Page {page + 1} of {pageCount}
                    </div>
                    <button type="button" className="btn btn-outline-primary" disabled={page + 1 >= pageCount} onClick={() => loadReports({ page: page + 1 })}>
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default BugReports;
