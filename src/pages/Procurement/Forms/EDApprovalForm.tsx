import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconArrowLeft from '../../../components/Icon/IconArrowLeft';
import IconCircleCheck from '../../../components/Icon/IconCircleCheck';
import IconX from '../../../components/Icon/IconX';
import { evaluationService } from '../../../services/evaluationService';
import { getUser } from '../../../utils/auth';
import Swal from 'sweetalert2';
import { HOE_FORM_DETAIL, FormField, FormSection } from '../../../lib/hoeApprovalFormDefinition';

interface EDApprovalFormData {
    id: number;
    formNumber: string;
    requestId: number;
    evaluationId: number;
    procurementType: string;
    totalAmount: number;
    formData?: {
        templateId: string;
        templateName: string;
        templateCode?: string;
        sectionA?: Record<string, any>;
        sectionB?: Record<string, any>;
        sectionC?: Record<string, any>;
        evaluationReference?: string;
        requestReference?: string;
    };
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
    approvedBy?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

const EDApprovalForm = () => {
    const dispatch = useDispatch();
    const { id } = useParams<{ id: string }>();
    const [form, setForm] = useState<EDApprovalFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
    const [comments, setComments] = useState('');
    const isExecutiveUser = (() => {
        try {
            const user = getUser();
            const roles = (user?.roles || (user?.role ? [user.role] : [])).map((r) => String(r).toUpperCase());
            return roles.some((r) => r.includes('EXECUTIVE'));
        } catch {
            return false;
        }
    })();

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
            setFormValues(buildInitialValues(data.formData, data.approvedBy?.name));
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

    const handleFieldChange = (fieldId: string, value: string | boolean) => {
        setFormValues((prev) => ({
            ...prev,
            [fieldId]: value,
        }));
    };

    const validateRequiredFields = (values: Record<string, string | boolean>) => {
        const missing: string[] = [];
        HOE_FORM_DETAIL.sections.forEach((section) => {
            section.fields?.forEach((field) => {
                if (!field.required) return;
                const value = values[field.id];
                const isEmpty = field.type === 'checkbox' ? value !== true : value === undefined || value === null || String(value).trim() === '';
                if (isEmpty) {
                    missing.push(field.label);
                }
            });
        });
        return missing;
    };

    const handleSave = async () => {
        if (!form) return;
        try {
            setSaving(true);
            const missing = validateRequiredFields(formValues);
            if (missing.length > 0) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Missing Required Fields',
                    html: `<div style="text-align:left"><p>You can save a draft, but some required fields are still missing:</p><ul>${missing
                        .slice(0, 8)
                        .map((m) => `<li>${m}</li>`)
                        .join('')}</ul>${missing.length > 8 ? `<p>+ ${missing.length - 8} more</p>` : ''}</div>`,
                });
            }
            const nextFormData = buildFormData(form.formData, formValues);
            await evaluationService.updateEdForm(form.id, {
                formData: nextFormData,
                comments: formValues.hoe_comments ? String(formValues.hoe_comments) : comments,
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
            const submittedAction = approved ? 'Approved' : 'Rejected';
            const valuesWithAction: Record<string, string | boolean> = {
                ...formValues,
                action_taken: submittedAction,
            };
            const missing = validateRequiredFields(valuesWithAction);
            if (missing.length > 0) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Missing Required Fields',
                    html: `<div style="text-align:left"><p>Please complete the required fields:</p><ul>${missing
                        .slice(0, 8)
                        .map((m) => `<li>${m}</li>`)
                        .join('')}</ul>${missing.length > 8 ? `<p>+ ${missing.length - 8} more</p>` : ''}</div>`,
                });
                return;
            }

            const nextFormData = buildFormData(form.formData, valuesWithAction);
            const hoeCommentsValue = valuesWithAction['hoe_comments'];
            const resolvedComments = typeof hoeCommentsValue === 'string' ? hoeCommentsValue : comments;
            await evaluationService.updateEdForm(form.id, {
                formData: nextFormData,
                comments: resolvedComments,
            });
            const submitComments = resolvedComments;
            await evaluationService.submitEdForm(form.id, approved, submitComments);
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

    // Fallback to simple form if no formData
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">{HOE_FORM_DETAIL.name}</h2>
                    <p className="text-white-dark">Form #{form.formNumber}</p>
                </div>
                <Link to="/procurement/forms" className="btn btn-outline-secondary gap-2">
                    <IconArrowLeft />
                    Back to Forms
                </Link>
            </div>

            {isFinal && <div className={`alert ${form.status === 'APPROVED' ? 'alert-success' : 'alert-danger'}`}>This form has been {form.status.toLowerCase()} and can no longer be edited.</div>}

            {/* BSJ Form Header */}
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-800 dark:border-gray-400 rounded-lg p-8 text-center">
                <div className="flex justify-center mb-6">
                    <img src="/assets/images/bsj-logo.png" alt="Bureau of Standards Jamaica Logo" className="h-16 drop-shadow-sm" />
                </div>
                <h1 className="text-lg font-bold text-gray-800 dark:text-white mb-2 uppercase">BUREAU OF STANDARDS JAMAICA</h1>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{HOE_FORM_DETAIL.name}</h2>
                <p className="text-gray-600 dark:text-gray-400">{HOE_FORM_DETAIL.description}</p>
            </div>

            {/* Form Sections */}
            <div className="space-y-6">
                {HOE_FORM_DETAIL.sections.map((section, idx) => (
                    <div key={idx} className="p-6 border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">{section.title}</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">{section.content}</p>
                        {section.fields && section.fields.length > 0 && (
                            <div className="space-y-4">
                                {section.fields.map((field) => (
                                    <div key={field.id}>
                                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                            {field.label}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        {renderField(field, formValues[field.id], (value) => handleFieldChange(field.id, value), isFinal)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!isFinal && (
                <div className="flex flex-wrap gap-2 justify-end">
                    <button type="button" className="btn btn-outline-primary" onClick={handleSave} disabled={saving || submitting}>
                        {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                    {isExecutiveUser && form.status === 'ASSIGNED_TO_ED' && (
                        <>
                            <button type="button" className="btn btn-danger gap-2" onClick={() => handleSubmit(false)} disabled={saving || submitting}>
                                <IconX className="w-4 h-4" />
                                Reject
                            </button>
                            <button type="button" className="btn btn-success gap-2" onClick={() => handleSubmit(true)} disabled={saving || submitting}>
                                <IconCircleCheck className="w-4 h-4" />
                                Approve
                            </button>
                        </>
                    )}
                </div>
            )}

            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">Instructions</h3>
                <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                    <li className="flex gap-2">
                        <span className="font-semibold">1.</span>
                        <span>Download the form to complete and submit</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-semibold">2.</span>
                        <span>Complete all required fields in each section</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-semibold">3.</span>
                        <span>Ensure all signatories provide required signatures and dates</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-semibold">4.</span>
                        <span>Submit the completed form through the procurement portal</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default EDApprovalForm;

function buildInitialValues(formData?: EDApprovalFormData['formData'], executiveDirectorName?: string | null) {
    const values: Record<string, string | boolean> = {};
    const sectionMap = getSectionMap(HOE_FORM_DETAIL.sections);
    HOE_FORM_DETAIL.sections.forEach((section, idx) => {
        section.fields?.forEach((field) => {
            const sectionKey = sectionMap[idx];
            const rawValue = sectionKey ? (formData as any)?.[sectionKey]?.[field.id] : undefined;
            if (field.type === 'checkbox') {
                values[field.id] = rawValue === true || rawValue === 'true';
            } else if (field.type === 'date') {
                values[field.id] = normalizeDateValue(rawValue);
            } else {
                values[field.id] = rawValue ?? '';
            }
        });
    });

    if (executiveDirectorName) {
        if (!values.executive_director_name) {
            values.executive_director_name = executiveDirectorName;
        }
        if (!values.executive_director_signature) {
            values.executive_director_signature = executiveDirectorName;
        }
    }
    return values;
}

function buildFormData(existing: EDApprovalFormData['formData'], values: Record<string, string | boolean>) {
    const sectionMap = getSectionMap(HOE_FORM_DETAIL.sections);
    const next = {
        ...(existing || {}),
        templateId: existing?.templateId || HOE_FORM_DETAIL.id,
        templateName: existing?.templateName || HOE_FORM_DETAIL.name,
        templateCode: existing?.templateCode || HOE_FORM_DETAIL.code,
        sectionA: { ...(existing as any)?.sectionA },
        sectionB: { ...(existing as any)?.sectionB },
        sectionC: { ...(existing as any)?.sectionC },
    } as any;

    HOE_FORM_DETAIL.sections.forEach((section, idx) => {
        const sectionKey = sectionMap[idx];
        if (!sectionKey) return;
        if (!next[sectionKey]) next[sectionKey] = {};
        section.fields?.forEach((field) => {
            const value = values[field.id];
            if (field.type === 'checkbox') {
                next[sectionKey][field.id] = value === true;
            } else {
                next[sectionKey][field.id] = value ?? '';
            }
        });
    });
    return next;
}

function getSectionMap(sections: FormSection[]) {
    const map: Record<number, 'sectionA' | 'sectionB' | 'sectionC'> = {};
    sections.forEach((_, idx) => {
        if (idx === 0) map[idx] = 'sectionA';
        if (idx === 1) map[idx] = 'sectionB';
        if (idx === 2) map[idx] = 'sectionC';
    });
    return map;
}

function renderField(field: FormField, value: string | boolean | undefined, onChange: (value: string | boolean) => void, disabled: boolean) {
    const commonProps = {
        disabled,
        className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary',
    };

    if (field.type === 'textarea') {
        return <textarea rows={3} placeholder={field.placeholder} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} {...commonProps} />;
    }

    if (field.type === 'select') {
        return (
            <select value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} {...commonProps}>
                <option value="">-- Select --</option>
                {field.options?.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        );
    }

    if (field.type === 'date') {
        return <input type="date" value={typeof value === 'string' ? normalizeDateValue(value) : ''} onChange={(e) => onChange(e.target.value)} {...commonProps} />;
    }

    if (field.type === 'checkbox') {
        return (
            <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                disabled={disabled}
            />
        );
    }

    return (
        <input
            type={field.type === 'number' ? 'number' : 'text'}
            placeholder={field.placeholder}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            {...commonProps}
        />
    );
}

function normalizeDateValue(value: unknown) {
    if (!value) return '';
    const raw = String(value).trim();
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slash) {
        const a = parseInt(slash[1], 10);
        const b = parseInt(slash[2], 10);
        const year = slash[3];
        const day = a > 12 ? a : b > 12 ? b : a; // default to DD/MM
        const month = a > 12 ? b : b > 12 ? a : b;
        const dd = String(day).padStart(2, '0');
        const mm = String(month).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
    }
    return raw;
}
