import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { setPageTitle } from '@/store/themeConfigSlice';
import ReactApexChart from 'react-apexcharts';
import PerfectScrollbar from 'react-perfect-scrollbar';
import IconDollarSignCircle from '@/components/Icon/IconDollarSignCircle';
import IconChecks from '@/components/Icon/IconChecks';
import IconClock from '@/components/Icon/IconClock';
import IconEye from '@/components/Icon/IconEye';
import IconThumbUp from '@/components/Icon/IconThumbUp';
import IconX from '@/components/Icon/IconX';
import IconPencil from '@/components/Icon/IconPencil';
import IconLock from '@/components/Icon/IconLock';
import { evaluationService } from '@/services/evaluationService';

const ExecutiveDirectorDashboard = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Executive Director Dashboard'));
    }, [dispatch]);

    type EDForm = {
        id: number;
        formNumber: string;
        totalAmount: number;
        status: 'PENDING' | 'ASSIGNED_TO_ED' | 'APPROVED' | 'REJECTED';
        createdAt: string;
        approvedAt?: string | null;
        request?: { reference?: string | null; totalEstimated?: number | null; procurementType?: string | null } | null;
        evaluation?: { evalNumber?: string | null } | null;
    };

    const [edForms, setEdForms] = useState<EDForm[]>([]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-JM', { style: 'currency', currency: 'JMD', maximumFractionDigits: 0 }).format(value || 0);

    const formatDate = (value?: string | null) => {
        if (!value) return '-';
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
    };

    // Fetch real data from API
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const forms = (await evaluationService.getEdForms()) as EDForm[];
                setEdForms(forms || []);
            } catch (error) {
                console.error('Error fetching executive dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

    const [loading, setLoading] = useState(true);

    // Executive-level statistics
    const [stats, setStats] = useState({
        pendingSignOffs: 0,
        completedApprovals: 0,
        totalBudgetValue: 0,
        thisQuarterApprovals: 0,
        avgProcessingTime: 0,
        complianceRate: 0,
    });

    // Executive approval trends chart
    const derived = useMemo(() => {
        const pending = edForms.filter((f) => f.status === 'ASSIGNED_TO_ED' || f.status === 'PENDING');
        const approved = edForms.filter((f) => f.status === 'APPROVED' && f.approvedAt);
        const rejected = edForms.filter((f) => f.status === 'REJECTED' && f.approvedAt);

        const totalBudgetValue = pending.reduce((sum, f) => sum + (Number(f.totalAmount) || 0), 0);

        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        const completedThisQuarter = approved.filter((f) => new Date(f.approvedAt as string) >= quarterStart).length;

        const avgProcessingTime =
            approved.length === 0
                ? 0
                : approved.reduce((sum, f) => {
                      const created = new Date(f.createdAt).getTime();
                      const approvedAt = new Date(f.approvedAt as string).getTime();
                      const days = Math.max(0, (approvedAt - created) / (1000 * 60 * 60 * 24));
                      return sum + days;
                  }, 0) / approved.length;

        const recentSignOffs = [...approved, ...rejected]
            .sort((a, b) => new Date(b.approvedAt as string).getTime() - new Date(a.approvedAt as string).getTime())
            .slice(0, 5)
            .map((f) => ({
                id: f.id,
                action: f.status === 'APPROVED' ? 'Approved' : 'Rejected',
                description: f.request?.reference || f.evaluation?.evalNumber || f.formNumber,
                amount: Number(f.totalAmount) || 0,
                signedDate: f.approvedAt ? String(f.approvedAt).split('T')[0] : '',
                processing: 'ED Approval Form',
            }));

        const pendingApprovals = pending.map((f) => ({
            id: f.id,
            formNumber: f.formNumber,
            requestRef: f.request?.reference || '-',
            evaluationRef: f.evaluation?.evalNumber || '-',
            amount: Number(f.totalAmount) || 0,
            createdAt: f.createdAt,
            status: f.status,
        }));

        return { pendingApprovals, recentSignOffs, totalBudgetValue, completedThisQuarter, avgProcessingTime };
    }, [edForms]);

    useEffect(() => {
        setStats((prev) => ({
            ...prev,
            pendingSignOffs: derived.pendingApprovals.length,
            completedApprovals: derived.completedThisQuarter,
            totalBudgetValue: derived.totalBudgetValue,
            thisQuarterApprovals: derived.completedThisQuarter,
            avgProcessingTime: Number(derived.avgProcessingTime.toFixed(1)),
        }));
    }, [derived]);

    const approvalTrendsChart = {
        series: [
            {
                name: 'Approved Amount ($000s)',
                data: Array.from({ length: 12 }, (_, idx) => {
                    const total = edForms
                        .filter((f) => f.status === 'APPROVED' && f.approvedAt && new Date(f.approvedAt).getMonth() === idx)
                        .reduce((sum, f) => sum + (Number(f.totalAmount) || 0), 0);
                    return Math.round(total / 1000);
                }),
            },
            {
                name: 'Number of Approvals',
                data: Array.from({ length: 12 }, (_, idx) =>
                    edForms.filter((f) => f.status === 'APPROVED' && f.approvedAt && new Date(f.approvedAt).getMonth() === idx).length,
                ),
            },
        ],
        options: {
            chart: {
                height: 300,
                type: 'line' as const,
                fontFamily: 'Nunito, sans-serif',
                zoom: {
                    enabled: false,
                },
                toolbar: {
                    show: false,
                },
            },
            colors: ['#1b55e2', '#00ab55'],
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                curve: 'smooth' as const,
                width: 3,
                lineCap: 'square' as const,
            },
            markers: {
                size: 6,
                colors: ['#1b55e2', '#00ab55'],
                strokeColors: '#fff',
                strokeWidth: 2,
                hover: {
                    size: 8,
                },
            },
            xaxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false,
                },
                labels: {
                    offsetX: isRtl ? 2 : 0,
                    offsetY: 5,
                    style: {
                        fontSize: '12px',
                        cssClass: 'apexcharts-xaxis-title',
                    },
                },
            },
            yaxis: [
                {
                    title: {
                        text: 'Amount ($000s)',
                        style: {
                            fontSize: '12px',
                        },
                    },
                    labels: {
                        formatter: (value: number) => {
                            return value.toString();
                        },
                        offsetX: isRtl ? -10 : 0,
                        style: {
                            fontSize: '12px',
                        },
                    },
                },
                {
                    opposite: true,
                    title: {
                        text: 'Number of Approvals',
                        style: {
                            fontSize: '12px',
                        },
                    },
                    labels: {
                        formatter: (value: number) => {
                            return value.toString();
                        },
                        offsetX: isRtl ? 10 : 0,
                        style: {
                            fontSize: '12px',
                        },
                    },
                },
            ],
            grid: {
                borderColor: isDark ? '#191E3A' : '#E0E6ED',
                strokeDashArray: 5,
                xaxis: {
                    lines: {
                        show: true,
                    },
                },
                yaxis: {
                    lines: {
                        show: false,
                    },
                },
                padding: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                },
            },
            legend: {
                position: 'top' as const,
                horizontalAlign: 'right' as const,
                fontSize: '16px',
                markers: {
                    width: 10,
                    height: 10,
                    offsetX: -2,
                },
                itemMargin: {
                    horizontal: 10,
                    vertical: 5,
                },
            },
            tooltip: {
                marker: {
                    show: true,
                },
                y: [
                    {
                        title: {
                            formatter: () => 'Amount: $',
                        },
                        formatter: (value: number) => `${value}K`,
                    },
                    {
                        title: {
                            formatter: () => 'Count: ',
                        },
                    },
                ],
            },
        },
    };

    const statusPill = (status: EDForm['status']) => {
        switch (status) {
            case 'ASSIGNED_TO_ED':
                return 'badge-outline-warning';
            case 'APPROVED':
                return 'badge-outline-success';
            case 'REJECTED':
                return 'badge-outline-danger';
            default:
                return 'badge-outline-primary';
        }
    };

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="#" className="text-primary hover:underline">
                        Procurement
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Executive Director Dashboard</span>
                </li>
            </ul>

            <div className="pt-5">
                <div className="mb-6 grid gap-6 xl:grid-cols-3">
                    <div className="panel h-full xl:col-span-2">
                        <div className="mb-5 flex items-center justify-between">
                            <h5 className="text-lg font-semibold dark:text-white-light">Executive Approval Trends</h5>
                        </div>
                        <ReactApexChart options={approvalTrendsChart.options} series={approvalTrendsChart.series} type="line" height={300} />
                    </div>

                    <div className="panel h-full">
                        <div className="mb-5 flex items-center">
                            <h5 className="text-lg font-semibold dark:text-white-light">Executive Metrics</h5>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg bg-warning-light p-4 dark:bg-warning-dark-light">
                                <div>
                                    <h4 className="text-2xl font-bold text-warning">{stats.pendingSignOffs}</h4>
                                    <p className="text-warning">Pending Sign-offs</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning text-white">
                                    <IconPencil />
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-success-light p-4 dark:bg-success-dark-light">
                                <div>
                                    <h4 className="text-2xl font-bold text-success">{stats.completedApprovals}</h4>
                                    <p className="text-success">Completed This Quarter</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success text-white">
                                    <IconChecks />
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-primary-light p-4 dark:bg-primary-dark-light">
                                <div>
                                    <h4 className="text-2xl font-bold text-primary">${(stats.totalBudgetValue / 1000000).toFixed(1)}M</h4>
                                    <p className="text-primary">Total Budget Value</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
                                    <IconDollarSignCircle />
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-info-light p-4 dark:bg-info-dark-light">
                                <div>
                                    <h4 className="text-2xl font-bold text-info">{stats.avgProcessingTime} days</h4>
                                    <p className="text-info">Avg. Processing Time</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info text-white">
                                    <IconClock />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6 grid gap-6 xl:grid-cols-2">
                    {/* Pending Executive Approvals */}
                    <div className="panel">
                        <div className="mb-5 flex items-center justify-between">
                            <h5 className="text-lg font-semibold dark:text-white-light">Pending Executive Sign-offs</h5>
                            <Link to="/procurement/forms" className="font-semibold text-primary hover:underline">
                                View All
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {loading && <div className="text-sm text-gray-500">Loading approvals...</div>}
                            {!loading && derived.pendingApprovals.length === 0 && <div className="text-sm text-gray-500">No pending sign-offs.</div>}
                            {!loading &&
                                derived.pendingApprovals.map((approval) => (
                                    <div key={approval.id} className="rounded-lg border border-[#e0e6ed] p-4 dark:border-[#253b5c]">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <h6 className="font-semibold">{approval.formNumber}</h6>
                                                <span className={`badge ${statusPill(approval.status)}`}>{approval.status.replace(/_/g, ' ')}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link to={`/procurement/forms/ed-approval/${approval.id}`} className="btn btn-outline-info btn-sm" title="Open Form">
                                                    <IconEye className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </div>
                                        <p className="mb-2 font-medium">Request: {approval.requestRef}</p>
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="text-lg font-bold text-primary">{formatCurrency(approval.amount)}</span>
                                            <span className="text-sm text-white-dark">Created: {formatDate(approval.createdAt)}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-xs text-white-dark">
                                            <div>
                                                <p>
                                                    <strong>Evaluation:</strong> {approval.evaluationRef}
                                                </p>
                                                <p>
                                                    <strong>Form #:</strong> {approval.formNumber}
                                                </p>
                                            </div>
                                            <div>
                                                <p>
                                                    <strong>Status:</strong> {approval.status.replace(/_/g, ' ')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Recent Executive Sign-offs */}
                    <div className="panel">
                        <div className="mb-5 flex items-center justify-between">
                            <h5 className="text-lg font-semibold dark:text-white-light">Recent Executive Sign-offs</h5>
                        </div>
                        <PerfectScrollbar className="relative h-[400px] pr-3 -mr-3">
                            <div className="space-y-4">
                                {loading && <div className="text-sm text-gray-500">Loading sign-offs...</div>}
                                {!loading && derived.recentSignOffs.length === 0 && <div className="text-sm text-gray-500">No recent sign-offs.</div>}
                                {!loading &&
                                    derived.recentSignOffs.map((signOff) => (
                                    <div key={signOff.id} className="flex items-start gap-3">
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                                signOff.action === 'Approved'
                                                    ? 'bg-success-light text-success'
                                                    : signOff.action === 'Conditionally Approved'
                                                    ? 'bg-warning-light text-warning'
                                                    : 'bg-danger-light text-danger'
                                            }`}
                                        >
                                            {signOff.action === 'Approved' || signOff.action === 'Conditionally Approved' ? <IconThumbUp className="h-4 w-4" /> : <IconX className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`font-semibold ${
                                                        signOff.action === 'Approved' ? 'text-success' : signOff.action === 'Conditionally Approved' ? 'text-warning' : 'text-danger'
                                                    }`}
                                                >
                                                    {signOff.action}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-white-dark">
                                                    <IconLock className="h-3 w-3" />
                                                    {signOff.processing}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium">{signOff.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-white-dark">
                                                <span>Amount: {formatCurrency(signOff.amount)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-white-dark">Signed: {signOff.signedDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </PerfectScrollbar>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutiveDirectorDashboard;
