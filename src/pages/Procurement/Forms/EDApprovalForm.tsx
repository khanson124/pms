import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconArrowLeft from '../../../components/Icon/IconArrowLeft';
import IconCircleCheck from '../../../components/Icon/IconCircleCheck';
import IconX from '../../../components/Icon/IconX';
import { evaluationService } from '../../../services/evaluationService';

interface EDApprovalFormData {
    id: number;
    formNumber: string;
    requestId: number;
    evaluationId: number;
    procurementType: string;
    totalAmount: number;
    justification?: string | null;
    riskAssessment?: string | null;
    alternatives?: string | null;
    comments?: string | null;
    status: 'PENDING' | 'ASSIGNED_TO_ED' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    approvedAt?: string | null;
    request?: {
        id: number;
        reference: string;
        totalEstimated: number;
        procurementType: string;
        description?: string | null;
    };
    evaluation?: {
        id: number;
        evalNumber: string;
        rfqNumber?: string | null;
        rfqTitle?: string | null;
        description?: string | null;
        sectionD?: unknown;
        sectionE?: unknown;
    };
}

const EDApprovalForm = () => {
    const dispatch = useDispatch();
    const { id } = useParams<{ id: string }>();
    const [form, setForm] = useState<EDApprovalFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [justification, setJustification] = useState('');
    const [riskAssessment, setRiskAssessment] = useState('');
    const [alternatives, setAlternatives] = useState('');
    const [comments, setComments] = useState('');

    useEffect(() => {
        dispatch(setPageTitle('ED Approval Form'));
    }, [dispatch]);

    const loadForm = async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);
            const data = (await evaluationService.getEdFormById(Number(id))) as EDApprovalFormData;
            setForm(data);
            setJustification(data.justification || '');
            setRiskAssessment(data.riskAssessment || '');
            setAlternatives(data.alternatives || '');
            setComments(data.comments || '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load ED Approval Form');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadForm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSave = async () => {
        if (!form) return;
        try {
            setSaving(true);
            await evaluationService.updateEdForm(form.id, {
                justification,
                riskAssessment,
                alternatives,
                comments,
            });
            await loadForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save form');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (approved: boolean) => {
        if (!form) return;
        try {
            setSubmitting(true);
            await evaluationService.submitEdForm(form.id, approved, comments);
            await loadForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit form');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !form) {
        return (
            <div className="panel">
                <div className="alert alert-danger">
                    <strong>Error:</strong> {error || 'Form not found'}
                </div>
                <Link to="/procurement/forms" className="btn btn-outline-secondary mt-4">
                    <IconArrowLeft className="w-4 h-4 mr-2" />
                    Back to Forms
                </Link>
            </div>
        );
    }

    const isFinal = form.status === 'APPROVED' || form.status === 'REJECTED';

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Head of Entity Approval Form</h2>
                    <p className="text-white-dark">Form #{form.formNumber}</p>
                </div>
                <Link to="/procurement/forms" className="btn btn-outline-secondary gap-2">
                    <IconArrowLeft />
                    Back to Forms
                </Link>
            </div>

            {isFinal && <div className={`alert ${form.status === 'APPROVED' ? 'alert-success' : 'alert-danger'}`}>This form has been {form.status.toLowerCase()} and can no longer be edited.</div>}

            <div className="panel">
                <h5 className="font-semibold text-lg mb-4">Request & Evaluation</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="text-white-dark">Request Reference</div>
                        <div className="font-semibold">{form.request?.reference}</div>
                    </div>
                    <div>
                        <div className="text-white-dark">Procurement Type</div>
                        <div className="font-semibold">{form.procurementType}</div>
                    </div>
                    <div>
                        <div className="text-white-dark">Total Amount</div>
                        <div className="font-semibold">{form.totalAmount.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-white-dark">Evaluation</div>
                        <div className="font-semibold">{form.evaluation?.evalNumber || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div className="panel">
                <h5 className="font-semibold text-lg mb-4">ED Form Details</h5>
                <div className="space-y-4">
                    <div>
                        <label className="form-label">Justification</label>
                        <textarea className="form-textarea" rows={4} value={justification} onChange={(e) => setJustification(e.target.value)} disabled={isFinal} />
                    </div>
                    <div>
                        <label className="form-label">Risk Assessment</label>
                        <textarea className="form-textarea" rows={3} value={riskAssessment} onChange={(e) => setRiskAssessment(e.target.value)} disabled={isFinal} />
                    </div>
                    <div>
                        <label className="form-label">Alternatives</label>
                        <textarea className="form-textarea" rows={3} value={alternatives} onChange={(e) => setAlternatives(e.target.value)} disabled={isFinal} />
                    </div>
                    <div>
                        <label className="form-label">Comments</label>
                        <textarea className="form-textarea" rows={3} value={comments} onChange={(e) => setComments(e.target.value)} disabled={isFinal} />
                    </div>
                </div>
            </div>

            {!isFinal && (
                <div className="flex flex-wrap gap-2 justify-end">
                    <button type="button" className="btn btn-outline-primary" onClick={handleSave} disabled={saving || submitting}>
                        {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button type="button" className="btn btn-danger gap-2" onClick={() => handleSubmit(false)} disabled={saving || submitting}>
                        <IconX className="w-4 h-4" />
                        Reject
                    </button>
                    <button type="button" className="btn btn-success gap-2" onClick={() => handleSubmit(true)} disabled={saving || submitting}>
                        <IconCircleCheck className="w-4 h-4" />
                        Approve
                    </button>
                </div>
            )}
        </div>
    );
};

export default EDApprovalForm;
