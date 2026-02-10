import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconFile from '../../../components/Icon/IconFile';
import IconDownload from '../../../components/Icon/IconDownload';
import IconEye from '../../../components/Icon/IconEye';
import { SkeletonCard } from '../../../components/SkeletonLoading';
import { evaluationService } from '../../../services/evaluationService';
import { getUser } from '../../../utils/auth';
import { detectUserRoles } from '../../../utils/roleDetection';

interface ProcurementForm {
    id: string;
    code: string;
    name: string;
    description: string;
    category: string;
    minValue?: string;
    maxValue?: string;
    createdDate: string;
    fileUrl?: string;
}

interface EDFormListItem {
    id: number;
    formNumber: string;
    status: 'PENDING' | 'ASSIGNED_TO_ED' | 'APPROVED' | 'REJECTED';
    totalAmount: number;
    procurementType: string;
    createdAt: string;
    request?: {
        reference: string;
    };
    evaluation?: {
        evalNumber: string;
        rfqTitle?: string | null;
    };
}

const FORMS: ProcurementForm[] = [
    {
        id: 'hoe-approval-form',
        code: 'PRO_70_F_12/00',
        name: "Head of Entity's Approval Form",
        description: 'Contracts valued at 1¢ up to $2,999k (Goods, Services & Works)',
        category: 'Approval Forms',
        minValue: '1¢',
        maxValue: '$2,999k',
        createdDate: 'Aug 01, 2025',
    },
];

export default function FormSelection() {
    const dispatch = useDispatch();
    const [forms] = useState<ProcurementForm[]>(FORMS);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isLoading, setIsLoading] = useState(true);
    const [edForms, setEdForms] = useState<EDFormListItem[]>([]);
    const [edLoading, setEdLoading] = useState(false);
    const [edError, setEdError] = useState<string | null>(null);

    const currentUser = getUser();
    const userRoles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : []);
    const { isExecutiveDirector } = detectUserRoles(userRoles);

    useEffect(() => {
        dispatch(setPageTitle('Procurement Forms'));
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, [dispatch]);

    useEffect(() => {
        const loadEdForms = async () => {
            if (!isExecutiveDirector) return;
            try {
                setEdLoading(true);
                setEdError(null);
                const data = (await evaluationService.getEdForms()) as EDFormListItem[];
                setEdForms(data);
            } catch (err) {
                setEdError(err instanceof Error ? err.message : 'Failed to load ED approval forms');
            } finally {
                setEdLoading(false);
            }
        };

        loadEdForms();
    }, [isExecutiveDirector]);

    const categories = ['All', ...new Set(forms.map((f) => f.category))];
    const filteredForms = selectedCategory === 'All' ? forms : forms.filter((f) => f.category === selectedCategory);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-JM', {
            style: 'currency',
            currency: 'JMD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Procurement Forms</h1>
                <p className="text-gray-600 dark:text-gray-400">Select and download the required procurement forms for your transactions</p>
            </div>

            {isExecutiveDirector && (
                <div className="panel mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">My ED Approval Forms</h2>
                        <span className="text-xs text-gray-500">Assigned forms ready for completion</span>
                    </div>

                    {edLoading ? (
                        <div className="text-sm text-gray-500">Loading ED approval forms...</div>
                    ) : edError ? (
                        <div className="alert alert-danger">{edError}</div>
                    ) : edForms.length === 0 ? (
                        <div className="text-sm text-gray-500">No assigned ED approval forms.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table-hover text-sm">
                                <thead>
                                    <tr>
                                        <th>Form #</th>
                                        <th>Request</th>
                                        <th>Evaluation</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {edForms.map((form) => (
                                        <tr key={form.id}>
                                            <td className="font-semibold text-primary">{form.formNumber}</td>
                                            <td>{form.request?.reference || '-'}</td>
                                            <td>{form.evaluation?.evalNumber || '-'}</td>
                                            <td>{formatCurrency(form.totalAmount)}</td>
                                            <td>{form.status}</td>
                                            <td>
                                                <Link to={`/procurement/forms/ed-approval/${form.id}`} className="btn btn-sm btn-outline-primary gap-1">
                                                    <IconEye className="w-4 h-4" />
                                                    Open
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            selectedCategory === cat ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Forms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <>
                        <SkeletonCard className="h-64" />
                        <SkeletonCard className="h-64" />
                        <SkeletonCard className="h-64" />
                    </>
                ) : (
                    filteredForms.map((form) => (
                        <Link
                            key={form.id}
                            to={`/procurement/forms/${form.id}`}
                            className="group block p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg hover:border-primary dark:hover:border-primary transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <IconFile className="w-5 h-5 text-primary" />
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{form.category}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-primary transition-colors">{form.name}</h3>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{form.description}</p>

                            {form.minValue && form.maxValue && (
                                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        <span className="font-semibold">Value Range: </span>
                                        {form.minValue} to {form.maxValue}
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{form.code}</span>
                                <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
                                    <span className="text-sm font-semibold">View Form</span>
                                    <IconDownload className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {!isLoading && filteredForms.length === 0 && (
                <div className="text-center py-12">
                    <IconFile className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">No forms found in this category</p>
                </div>
            )}
        </div>
    );
}
