import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconEye from '../../../components/Icon/IconEye';
import IconX from '../../../components/Icon/IconX';
import IconPlus from '../../../components/Icon/IconPlus';
import IconChecks from '../../../components/Icon/IconChecks';
import { evaluationService } from '../../../services/evaluationService';
import { getAuthHeaders } from '../../../utils/api';

type EDForm = {
    id: number;
    formNumber: string;
    requestId: number;
    evaluationId: number;
    procurementType: string;
    totalAmount: number;
    justification?: string;
    riskAssessment?: string;
    alternatives?: string;
    status: 'PENDING' | 'ASSIGNED_TO_ED' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    approvedAt?: string;
    comments?: string;
    request?: {
        id: number;
        reference: string;
        totalEstimated: number;
        procurementType: string;
    };
    evaluation?: {
        id: number;
        evalNumber: string;
        rfqNumber: string;
        rfqTitle: string;
    };
    submittedBy?: {
        id: number;
        name: string;
        email: string;
    };
    approvedBy?: {
        id: number;
        name: string;
        email: string;
    };
};

type ExecutiveDirector = {
    id: number;
    name: string;
    email: string;
};

const EDFormsManager = () => {
    const dispatch = useDispatch();
    const [forms, setForms] = useState<EDForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedForm, setSelectedForm] = useState<EDForm | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [executives, setExecutives] = useState<ExecutiveDirector[]>([]);
    const [selectedED, setSelectedED] = useState<number | null>(null);
    const [assignLoading, setAssignLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        dispatch(setPageTitle('ED Approval Forms Manager'));
        loadForms();
        loadExecutives();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadForms = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await evaluationService.getEdForms();
            setForms(data);
        } catch (err) {
            console.error('Failed to load ED forms:', err);
            setError('Failed to load ED approval forms. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadExecutives = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch('/api/users/by-role/EXECUTIVE_DIRECTOR', {
                headers,
            });
            if (response.ok) {
                const data = await response.json();
                setExecutives(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load executives:', err);
        }
    };

    const handleViewDetails = async (form: EDForm) => {
        try {
            const fullForm = await evaluationService.getEdFormById(form.id);
            setSelectedForm(fullForm);
            setShowDetailModal(true);
        } catch (err) {
            console.error('Failed to load form details:', err);
            alert('Failed to load form details');
        }
    };

    const handleAssignClick = (form: EDForm) => {
        if (form.status !== 'PENDING') {
            alert(`Can only assign forms with PENDING status. This form is ${form.status}.`);
            return;
        }
        setSelectedForm(form);
        setSelectedED(null);
        setShowAssignModal(true);
    };

    const handleAssignSubmit = async () => {
        if (!selectedForm || !selectedED) {
            alert('Please select an Executive Director');
            return;
        }

        try {
            setAssignLoading(true);
            const updated = await evaluationService.assignEdForm(selectedForm.id, selectedED);
            setForms((prev) =>
                prev.map((f) =>
                    f.id === selectedForm.id
                        ? {
                              ...f,
                              status: 'ASSIGNED_TO_ED',
                              approvedBy: updated.approvedBy,
                          }
                        : f,
                ),
            );
            setShowAssignModal(false);
            setSelectedForm(null);
            alert('Form assigned successfully. ED will receive a notification.');
        } catch (err) {
            console.error('Failed to assign form:', err);
            alert('Failed to assign form. Please try again.');
        } finally {
            setAssignLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
            PENDING: {
                bg: 'bg-yellow-100',
                text: 'text-yellow-800',
                label: 'Pending Assignment',
            },
            ASSIGNED_TO_ED: {
                bg: 'bg-blue-100',
                text: 'text-blue-800',
                label: 'Assigned to ED',
            },
            APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
            REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
        };

        const style = statusStyles[status] || statusStyles.PENDING;
        return (
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
                {style.label}
            </span>
        );
    };

    const filteredForms = forms.filter((form) => {
        const matchesStatus = filterStatus === 'all' || form.status === filterStatus;
        const matchesSearch =
            searchTerm === '' ||
            form.formNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            form.request?.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
            form.evaluation?.rfqTitle?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-JM', {
            style: 'currency',
            currency: 'JMD',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const statusCounts = {
        pending: forms.filter((f) => f.status === 'PENDING').length,
        assigned: forms.filter((f) => f.status === 'ASSIGNED_TO_ED').length,
        approved: forms.filter((f) => f.status === 'APPROVED').length,
        rejected: forms.filter((f) => f.status === 'REJECTED').length,
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Pending Assignment</p>
                            <p className="text-3xl font-bold text-yellow-600">{statusCounts.pending}</p>
                        </div>
                        <IconPlus className="w-10 h-10 text-yellow-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Assigned to ED</p>
                            <p className="text-3xl font-bold text-blue-600">{statusCounts.assigned}</p>
                        </div>
                        <IconEye className="w-10 h-10 text-blue-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Approved</p>
                            <p className="text-3xl font-bold text-green-600">{statusCounts.approved}</p>
                        </div>
                        <IconChecks className="w-10 h-10 text-green-200" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Rejected</p>
                            <p className="text-3xl font-bold text-red-600">{statusCounts.rejected}</p>
                        </div>
                        <IconX className="w-10 h-10 text-red-200" />
                    </div>
                </div>
            </div>

            {/* Filter and Search */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Form #, Request Ref, or Title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Statuses</option>
                            <option value="PENDING">Pending Assignment</option>
                            <option value="ASSIGNED_TO_ED">Assigned to ED</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Forms Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-6 text-center">
                        <p className="text-gray-500">Loading ED approval forms...</p>
                    </div>
                ) : error ? (
                    <div className="p-6 text-center">
                        <p className="text-red-500">{error}</p>
                        <button
                            onClick={loadForms}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </div>
                ) : filteredForms.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-gray-500">No ED approval forms found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Form #</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Request</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
                                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Amount</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Created</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredForms.map((form) => (
                                    <tr key={form.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-blue-600">{form.formNumber}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium">{form.request?.reference}</p>
                                                <p className="text-gray-500 text-xs">{form.evaluation?.rfqNumber}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                                {form.procurementType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">
                                            {formatCurrency(form.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(form.status)}</td>
                                        <td className="px-6 py-4 text-gray-500">{formatDate(form.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(form)}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
                                                >
                                                    View
                                                </button>
                                                {form.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleAssignClick(form)}
                                                        className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-medium"
                                                    >
                                                        Assign
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gray-50 border-b p-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">ED Approval Form</h2>
                                <p className="text-gray-600">{selectedForm.formNumber}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedForm(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <IconX className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Request Info */}
                            <div className="border-b pb-6">
                                <h3 className="font-semibold text-lg mb-4">Request Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-600 text-sm">Reference</p>
                                        <p className="font-medium">{selectedForm.request?.reference}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-sm">Type</p>
                                        <p className="font-medium">{selectedForm.procurementType}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-sm">Total Amount</p>
                                        <p className="font-medium">{formatCurrency(selectedForm.totalAmount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-sm">Evaluation #</p>
                                        <p className="font-medium">{selectedForm.evaluation?.evalNumber}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Dates */}
                            <div className="border-b pb-6">
                                <h3 className="font-semibold text-lg mb-4">Status</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-600 text-sm">Current Status</p>
                                        {getStatusBadge(selectedForm.status)}
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-sm">Created</p>
                                        <p className="font-medium">{formatDate(selectedForm.createdAt)}</p>
                                    </div>
                                    {selectedForm.approvedAt && (
                                        <div>
                                            <p className="text-gray-600 text-sm">Approved At</p>
                                            <p className="font-medium">{formatDate(selectedForm.approvedAt)}</p>
                                        </div>
                                    )}
                                    {selectedForm.approvedBy && (
                                        <div>
                                            <p className="text-gray-600 text-sm">Approved By</p>
                                            <p className="font-medium">{selectedForm.approvedBy.name}</p>
                                            <p className="text-gray-500 text-xs">{selectedForm.approvedBy.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form Content */}
                            {selectedForm.justification && (
                                <div className="border-b pb-6">
                                    <h3 className="font-semibold text-lg mb-2">Justification</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedForm.justification}</p>
                                </div>
                            )}

                            {selectedForm.riskAssessment && (
                                <div className="border-b pb-6">
                                    <h3 className="font-semibold text-lg mb-2">Risk Assessment</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedForm.riskAssessment}</p>
                                </div>
                            )}

                            {selectedForm.alternatives && (
                                <div className="border-b pb-6">
                                    <h3 className="font-semibold text-lg mb-2">Alternatives</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedForm.alternatives}</p>
                                </div>
                            )}

                            {selectedForm.comments && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">ED Comments</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedForm.comments}</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 border-t p-6 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedForm(null);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                            >
                                Close
                            </button>
                            {selectedForm.status === 'PENDING' && (
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        handleAssignClick(selectedForm);
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Assign to ED
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && selectedForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
                        <div className="bg-gray-50 border-b p-6 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Assign to Executive Director</h2>
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedForm(null);
                                    setSelectedED(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <IconX className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-gray-600 text-sm mb-2">Form:</p>
                                <p className="font-medium">{selectedForm.formNumber}</p>
                                <p className="text-gray-600 text-sm">{selectedForm.request?.reference}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Executive Director
                                </label>
                                <select
                                    value={selectedED || ''}
                                    onChange={(e) => setSelectedED(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">-- Select an Executive Director --</option>
                                    {executives.map((ed) => (
                                        <option key={ed.id} value={ed.id}>
                                            {ed.name} ({ed.email})
                                        </option>
                                    ))}
                                </select>
                                {executives.length === 0 && (
                                    <p className="text-red-500 text-sm mt-2">No Executive Directors found in the system</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 border-t p-6 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedForm(null);
                                    setSelectedED(null);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignSubmit}
                                disabled={!selectedED || assignLoading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {assignLoading ? 'Assigning...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EDFormsManager;
