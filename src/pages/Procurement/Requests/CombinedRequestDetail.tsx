import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconArrowLeft from '../../../components/Icon/IconArrowLeft';
import IconPlus from '../../../components/Icon/IconPlus';
import IconChecks from '../../../components/Icon/IconChecks';
import IconX from '../../../components/Icon/IconX';
import { getApiUrl } from '../../../config/api';
import { getStatusBadge } from '../../../utils/statusBadges';

interface CombinedRequestLot {
    id: number;
    reference: string;
    title: string;
    description?: string;
    lotNumber: number;
    status: string;
    priority: string;
    totalEstimated: number;
    currency: string;
    department: { name: string; id: number };
    requester: { name: string; email: string };
    items: Array<{
        id: number;
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        accountCode?: string;
        unitOfMeasure?: string;
    }>;
    createdAt: string;
}

interface CombinedRequestDetail {
    id: number;
    reference: string;
    title: string;
    description?: string;
    lots: CombinedRequestLot[];
    evaluations: Array<{
        id: number;
        evalNumber: string;
        status: string;
        createdAt: string;
    }>;
    totalValue: number;
    totalItems: number;
    lotsCount: number;
    createdAt: string;
}

interface EligibleRequest {
    id: number;
    reference: string;
    title: string;
    department?: { name: string } | string;
    totalEstimated?: number;
    currency?: string;
    status: string;
    combinedRequestId?: number | null;
}

const CombinedRequestDetail = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [combinedRequest, setCombinedRequest] = useState<CombinedRequestDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [eligibleRequests, setEligibleRequests] = useState<EligibleRequest[]>([]);
    const [selectedToAdd, setSelectedToAdd] = useState<number[]>([]);
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [renameTitle, setRenameTitle] = useState('');
    const [renameDescription, setRenameDescription] = useState('');
    const [renameLoading, setRenameLoading] = useState(false);
    const [renameError, setRenameError] = useState<string | null>(null);
    const [renameSuccess, setRenameSuccess] = useState<string | null>(null);

    useEffect(() => {
        dispatch(setPageTitle('Combined Request Details'));
    }, [dispatch]);

    const fetchCombinedRequest = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(getApiUrl(`/api/requests/combinable/${id}`), {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch combined request');
            }

            const data = await response.json();
            setCombinedRequest(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load combined request');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchCombinedRequest();
    }, [id]);

    useEffect(() => {
        if (combinedRequest) {
            setRenameTitle(combinedRequest.title || '');
            setRenameDescription(combinedRequest.description || '');
        }
    }, [combinedRequest]);

    const fetchEligibleRequests = async () => {
        try {
            setAddError(null);
            const response = await fetch(getApiUrl('/api/requests/combinable?combinable=true'), {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to fetch eligible requests');

            const data = (await response.json()) as EligibleRequest[];

            const existingIds = new Set(combinedRequest?.lots.map((l) => l.id) || []);
            const combinableStatuses = ['DRAFT', 'SUBMITTED', 'DEPARTMENT_REVIEW', 'PROCUREMENT_REVIEW'];
            const filtered = data.filter((r) => combinableStatuses.includes(r.status) && !r.combinedRequestId && !existingIds.has(r.id));
            setEligibleRequests(filtered);
        } catch (err) {
            setAddError(err instanceof Error ? err.message : 'Failed to load eligible requests');
        }
    };

    const openAddModal = async () => {
        setSelectedToAdd([]);
        setShowAddModal(true);
        await fetchEligibleRequests();
    };

    const toggleSelectToAdd = (idToToggle: number) => {
        setSelectedToAdd((prev) => (prev.includes(idToToggle) ? prev.filter((i) => i !== idToToggle) : [...prev, idToToggle]));
    };

    const submitAddRequests = async () => {
        if (!combinedRequest) return;
        if (selectedToAdd.length === 0) return setAddError('Select at least one request to add');
        try {
            setAddLoading(true);
            const response = await fetch(getApiUrl(`/api/requests/combinable/${combinedRequest.id}/add`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ originalRequestIds: selectedToAdd }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || 'Failed to add requests');
            }

            const res = (await response.json()) as { message?: string };
            // Refresh combined request
            await fetchCombinedRequest();
            setShowAddModal(false);
            setSelectedToAdd([]);
            // Optionally notify user
            alert(res.message || 'Requests added to combined request');
        } catch (err) {
            setAddError(err instanceof Error ? err.message : 'Failed to add requests');
        } finally {
            setAddLoading(false);
        }
    };

    const submitRename = async () => {
        if (!combinedRequest) return;
        try {
            setRenameLoading(true);
            setRenameError(null);
            setRenameSuccess(null);
            const response = await fetch(getApiUrl(`/api/requests/combinable/${combinedRequest.id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ title: renameTitle.trim(), description: renameDescription.trim() }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || 'Failed to rename combined request');
            }

            await response.json();
            await fetchCombinedRequest();
            setRenameSuccess('Combined request updated successfully');
        } catch (err) {
            setRenameError(err instanceof Error ? err.message : 'Failed to rename combined request');
        } finally {
            setRenameLoading(false);
        }
    };

    const handleCreateEvaluation = () => {
        if (combinedRequest) {
            // Navigate to evaluation creation with combined request context
            navigate(`/procurement/evaluation/new?combinedRequestId=${combinedRequest.id}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !combinedRequest) {
        return (
            <div className="panel">
                <div className="alert alert-danger">
                    <strong>Error:</strong> {error || 'Combined request not found'}
                </div>
                <Link to="/apps/requests/combine" className="btn btn-outline-secondary mt-4">
                    <IconArrowLeft className="w-4 h-4 mr-2" />
                    Back to Combine Requests
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">{combinedRequest.title}</h2>
                    <p className="text-white-dark mt-1">
                        Combined Request: <span className="font-semibold text-primary">{combinedRequest.reference}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link to="/apps/requests/combine" className="btn btn-outline-secondary gap-2">
                        <IconArrowLeft />
                        Back
                    </Link>
                    <button type="button" onClick={openAddModal} className="btn btn-outline-secondary gap-2">
                        <IconPlus className="w-4 h-4" />
                        Add Request
                    </button>
                    {combinedRequest.evaluations.length === 0 && (
                        <button type="button" onClick={handleCreateEvaluation} className="btn btn-primary gap-2">
                            <IconChecks className="w-5 h-5" />
                            Create Evaluation for All Lots
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="panel">
                    <div className="text-lg font-semibold text-primary mb-1">{combinedRequest.lotsCount}</div>
                    <div className="text-sm text-white-dark">Total Lots</div>
                </div>
                <div className="panel">
                    <div className="text-lg font-semibold text-success mb-1">{combinedRequest.totalItems}</div>
                    <div className="text-sm text-white-dark">Total Items</div>
                </div>
                <div className="panel">
                    <div className="text-lg font-semibold text-warning mb-1">
                        {combinedRequest.lots[0]?.currency || 'JMD'} {combinedRequest.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-white-dark">Total Value</div>
                </div>
                <div className="panel">
                    <div className="text-lg font-semibold text-info mb-1">{combinedRequest.evaluations.length}</div>
                    <div className="text-sm text-white-dark">Evaluations</div>
                </div>
            </div>

            {/* Description */}
            {combinedRequest.description && (
                <div className="panel mb-6">
                    <h5 className="font-semibold text-lg mb-3">Description</h5>
                    <p className="text-white-dark whitespace-pre-wrap">{combinedRequest.description}</p>
                </div>
            )}

            {/* Rename Section */}
            <div className="panel mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-lg">Rename Combined Request</h5>
                    <span className="text-xs text-gray-500">Update the title or description for this combined request.</span>
                </div>
                <div className="space-y-4">
                    {renameError && <div className="alert alert-danger">{renameError}</div>}
                    {renameSuccess && <div className="alert alert-success">{renameSuccess}</div>}
                    <div>
                        <label className="form-label">Title</label>
                        <input type="text" className="form-input" value={renameTitle} onChange={(e) => setRenameTitle(e.target.value)} placeholder="Enter a new title" />
                    </div>
                    <div>
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" rows={3} value={renameDescription} onChange={(e) => setRenameDescription(e.target.value)} placeholder="Enter a new description" />
                    </div>
                    <div className="flex justify-end">
                        <button type="button" className="btn btn-primary" onClick={submitRename} disabled={renameLoading}>
                            {renameLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Existing Evaluations */}
            {combinedRequest.evaluations.length > 0 && (
                <div className="panel mb-6">
                    <h5 className="font-semibold text-lg mb-3">Linked Evaluations</h5>
                    <div className="space-y-2">
                        {combinedRequest.evaluations.map((evaluation) => (
                            <Link
                                key={evaluation.id}
                                to={`/procurement/evaluation/${evaluation.id}`}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <div>
                                    <div className="font-semibold text-primary">{evaluation.evalNumber}</div>
                                    <div className="text-sm text-white-dark">Created: {new Date(evaluation.createdAt).toLocaleDateString()}</div>
                                </div>
                                <span className={`badge ${evaluation.status === 'COMPLETED' ? 'bg-success' : 'bg-info'}`}>{evaluation.status}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Lots Table */}
            <div className="panel">
                <h5 className="font-semibold text-lg mb-4">Numbered Lots ({combinedRequest.lotsCount})</h5>

                {combinedRequest.lots.map((lot) => {
                    const statusBadge = getStatusBadge(lot.status);
                    return (
                        <div key={lot.id} className="mb-6 border-l-4 border-primary pl-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h6 className="text-lg font-bold text-primary">LOT-{lot.lotNumber}</h6>
                                    <div className="text-md font-semibold mt-1">{lot.title}</div>
                                    <div className="text-sm text-white-dark mt-1">
                                        Original Reference:{' '}
                                        <Link to={`/apps/requests/edit/${lot.id}`} className="text-primary hover:underline">
                                            {lot.reference}
                                        </Link>
                                    </div>
                                    {lot.description && <p className="text-sm text-white-dark mt-2">{lot.description}</p>}
                                </div>
                                <div className="text-right ml-4">
                                    <span className={`badge px-2 py-1 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}>{statusBadge.label}</span>
                                    <div className="text-sm text-white-dark mt-2">
                                        {lot.currency} {Number(lot.totalEstimated || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                                <div>
                                    <span className="text-white-dark">Department:</span>
                                    <div className="font-semibold">{lot.department.name}</div>
                                </div>
                                <div>
                                    <span className="text-white-dark">Requester:</span>
                                    <div className="font-semibold">{lot.requester.name}</div>
                                </div>
                                <div>
                                    <span className="text-white-dark">Priority:</span>
                                    <div>
                                        <span
                                            className={`badge ${
                                                lot.priority === 'URGENT' ? 'badge-danger' : lot.priority === 'HIGH' ? 'badge-warning' : lot.priority === 'MEDIUM' ? 'badge-info' : 'badge-secondary'
                                            }`}
                                        >
                                            {lot.priority}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-white-dark">Items:</span>
                                    <div className="font-semibold">{lot.items.length}</div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="overflow-x-auto">
                                <table className="table-hover text-sm">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Quantity</th>
                                            <th>Unit Price</th>
                                            <th>Total</th>
                                            <th>Account Code</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lot.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.description}</td>
                                                <td>
                                                    {item.quantity} {item.unitOfMeasure || ''}
                                                </td>
                                                <td>
                                                    {lot.currency} {Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td>
                                                    {lot.currency} {Number(item.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td>{item.accountCode || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info Box */}
            <div className="panel bg-info/5 border-2 border-info mt-6">
                <div className="flex items-start gap-3">
                    <div className="mt-1">
                        <svg className="h-6 w-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h6 className="mb-2 font-semibold text-info">Combined Request Workflow</h6>
                        <ul className="ml-4 list-disc space-y-1 text-sm text-white-dark">
                            <li>All lots are displayed on this single page for easier review</li>
                            <li>Create one evaluation that covers all lots simultaneously</li>
                            <li>Each lot maintains its original items and department information</li>
                            <li>The evaluation form will show sections for each lot (LOT-1, LOT-2, etc.)</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Add Request Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">Add Requests to {combinedRequest?.reference}</h3>
                            <button type="button" className="text-gray-400 hover:text-gray-600" onClick={() => setShowAddModal(false)}>
                                <IconX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {addError && <div className="alert alert-danger">{addError}</div>}

                            <div className="text-sm text-gray-600">Select one or more eligible requests to add to this combined request.</div>

                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Reference</th>
                                            <th>Title</th>
                                            <th>Department</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {eligibleRequests.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-6 text-sm text-gray-500">
                                                    No eligible requests available
                                                </td>
                                            </tr>
                                        )}
                                        {eligibleRequests.map((r) => (
                                            <tr key={r.id} className={selectedToAdd.includes(r.id) ? 'bg-primary/10' : ''}>
                                                <td>
                                                    <input type="checkbox" checked={selectedToAdd.includes(r.id)} onChange={() => toggleSelectToAdd(r.id)} />
                                                </td>
                                                <td className="font-semibold text-primary">{r.reference}</td>
                                                <td>{r.title}</td>
                                                <td>{typeof r.department === 'string' ? r.department : r.department?.name || 'Unknown'}</td>
                                                <td>
                                                    {r.currency} {(r.totalEstimated || 0).toLocaleString()}
                                                </td>
                                                <td>{r.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
                            <button type="button" className="btn btn-outline-danger" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-primary" onClick={submitAddRequests} disabled={addLoading || selectedToAdd.length === 0}>
                                {addLoading ? 'Adding...' : `Add Selected (${selectedToAdd.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CombinedRequestDetail;
