import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { fetchLeaderboard, type LeaderboardRow } from '../../../utils/ideasApi';

function Avatar({ name }: { name: string }) {
    const initials = name
        .split(' ')
        .map((s) => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    return <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{initials || 'U'}</div>;
}

export default function Leaderboard() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [rows, setRows] = useState<LeaderboardRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const totals = useMemo(() => {
        const totalIdeas = rows.reduce((sum, row) => sum + (row.ideaCount || 0), 0);
        const totalUpvotes = rows.reduce((sum, row) => sum + (row.upvotes || 0), 0);
        const totalPoints = rows.reduce((sum, row) => sum + (row.points || 0), 0);
        return {
            contributors: rows.length,
            totalIdeas,
            totalUpvotes,
            totalPoints,
        };
    }, [rows]);

    useEffect(() => {
        dispatch(setPageTitle(t('innovation.leaderboard.title', { defaultValue: 'Innovation Leaderboard' })));
    }, [dispatch, t]);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchLeaderboard();
                setRows(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load leaderboard');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="space-y-6">
            <div className="panel bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden relative">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute -top-16 -right-16 w-80 h-80 bg-white rounded-full" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full" />
                </div>
                <div className="relative z-10 p-6 sm:p-8">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3">
                        <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                        <span>{t('innovation.leaderboard.badge', { defaultValue: 'Recognition' })}</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black flex items-center gap-3 mb-2">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                        </svg>
                        {t('innovation.leaderboard.title', { defaultValue: 'Innovation Leaderboard' })}
                    </h1>
                    <p className="text-white/90 max-w-2xl">{t('innovation.leaderboard.subtitle', { defaultValue: 'Celebrating the people driving the most impactful ideas.' })}</p>
                </div>
            </div>

            <div className="panel bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-900/20 dark:to-indigo-900/20 border border-indigo-200/60 dark:border-indigo-800/40">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {t('innovation.leaderboard.summary.contributors', { defaultValue: 'Contributors' })}: {totals.contributors}
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {t('innovation.leaderboard.summary.ideas', { defaultValue: 'Ideas' })}: {totals.totalIdeas}
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        {t('innovation.leaderboard.summary.upvotes', { defaultValue: 'Upvotes' })}: {totals.totalUpvotes}
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                        {t('innovation.leaderboard.summary.points', { defaultValue: 'Points' })}: {totals.totalPoints}
                    </span>
                </div>
            </div>

            <div className="panel">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-xl font-bold">{t('innovation.leaderboard.heading', { defaultValue: 'Top contributors' })}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('innovation.leaderboard.description', { defaultValue: 'Ranked by ideas submitted and community votes.' })}</p>
                    </div>
                </div>
                {loading ? (
                    <div className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                ) : error ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('innovation.leaderboard.error.title', { defaultValue: 'Unable to Load Leaderboard' })}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                            {t('innovation.leaderboard.error.message', { defaultValue: 'We encountered a problem loading the leaderboard. Please try again.' })}
                        </p>
                        <button onClick={() => window.location.reload()} className="btn btn-primary">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            {t('innovation.leaderboard.error.action', { defaultValue: 'Try Again' })}
                        </button>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="text-gray-500">{t('innovation.leaderboard.empty', { defaultValue: 'No data yet.' })}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                    <th className="py-2 pr-4">{t('innovation.leaderboard.table.rank', { defaultValue: 'Rank' })}</th>
                                    <th className="py-2 pr-4">{t('innovation.leaderboard.table.user', { defaultValue: 'User' })}</th>
                                    <th className="py-2 pr-4">{t('innovation.leaderboard.table.ideas', { defaultValue: 'Ideas' })}</th>
                                    <th className="py-2 pr-4">{t('innovation.leaderboard.table.upvotes', { defaultValue: 'Upvotes' })}</th>
                                    <th className="py-2 pr-4">{t('innovation.leaderboard.table.comments', { defaultValue: 'Comments' })}</th>
                                    <th className="py-2 pr-4">{t('innovation.leaderboard.table.points', { defaultValue: 'Points' })}</th>
                                    <th className="py-2 pr-4">{t('innovation.leaderboard.table.badge', { defaultValue: 'Badge' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, idx) => (
                                    <tr key={r.userId} className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="py-2 pr-4 font-medium">{idx + 1}</td>
                                        <td className="py-2 pr-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={r.name} />
                                                <div>
                                                    <div className="font-medium">{r.name}</div>
                                                    <div className="text-xs text-gray-500">{r.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 pr-4">{r.ideaCount}</td>
                                        <td className="py-2 pr-4">{r.upvotes}</td>
                                        <td className="py-2 pr-4">{r.comments}</td>
                                        <td className="py-2 pr-4 font-semibold">{r.points}</td>
                                        <td className="py-2 pr-4">
                                            {r.badge ? <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">{r.badge}</span> : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
