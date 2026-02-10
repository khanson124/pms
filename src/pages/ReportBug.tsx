import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { type FieldErrors, type Resolver, useForm } from 'react-hook-form';
import { ZodError, z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Swal from 'sweetalert2';
import { setPageTitle } from '../store/themeConfigSlice';
import { createBugReport } from '../services/bugReportService';
import IconAlertCircle from '../components/Icon/IconAlertCircle';
import IconSquareCheck from '../components/Icon/IconSquareCheck';
import IconInfoCircle from '../components/Icon/IconInfoCircle';

const bugReportSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'),
    description: z.string().max(4000, 'Description is too long'),
    stepsToReproduce: z.string().max(4000, 'Steps are too long').optional().or(z.literal('')),
    expectedBehavior: z.string().max(2000, 'Expected behavior is too long').optional().or(z.literal('')),
    actualBehavior: z.string().max(2000, 'Actual behavior is too long').optional().or(z.literal('')),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    screenshot: z
        .union([z.instanceof(FileList), z.undefined(), z.null()])
        .optional()
        .refine(
            (files) => {
                if (!files || !(files instanceof FileList) || files.length === 0) return true;
                return files[0].size <= 5 * 1024 * 1024; // 5MB
            },
            {
                message: 'Screenshot must be less than 5MB',
            },
        ),
});

type BugReportFormValues = z.infer<typeof bugReportSchema>;

const ReportBug = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(setPageTitle('Report a Bug'));
    }, [dispatch]);

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const module = useMemo(() => {
        const stateModule = (location.state as { module?: string } | null)?.module;
        if (stateModule && ['IH', 'PMS', 'OTHER'].includes(stateModule)) {
            return stateModule as 'IH' | 'PMS' | 'OTHER';
        }
        if (location.pathname.startsWith('/innovation')) return 'IH';
        if (typeof document !== 'undefined' && document.referrer.includes('/innovation')) return 'IH';
        return 'PMS';
    }, [location.pathname, location.state]);

    const resolver: Resolver<BugReportFormValues> = async (values, context, options) => {
        try {
            return await zodResolver(bugReportSchema, undefined, { mode: 'sync' })(values, context, options);
        } catch (err) {
            if (err instanceof ZodError) {
                const fieldErrors = err.flatten().fieldErrors as Record<string, string[] | undefined>;
                const errors: FieldErrors<BugReportFormValues> = {};

                const setFieldError = <K extends keyof BugReportFormValues>(key: K, message?: string) => {
                    if (!message) return;
                    errors[key] = { type: 'manual', message } as FieldErrors<BugReportFormValues>[K];
                };

                setFieldError('title', fieldErrors['title']?.[0]);
                setFieldError('description', fieldErrors['description']?.[0]);
                setFieldError('stepsToReproduce', fieldErrors['stepsToReproduce']?.[0]);
                setFieldError('expectedBehavior', fieldErrors['expectedBehavior']?.[0]);
                setFieldError('actualBehavior', fieldErrors['actualBehavior']?.[0]);
                setFieldError('severity', fieldErrors['severity']?.[0]);
                setFieldError('screenshot', fieldErrors['screenshot']?.[0]);

                return { values: {}, errors };
            }

            return { values: {}, errors: {} };
        }
    };

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<BugReportFormValues>({
        resolver,
        mode: 'onSubmit',
        reValidateMode: 'onChange',
        defaultValues: {
            title: '',
            description: '',
            stepsToReproduce: '',
            expectedBehavior: '',
            actualBehavior: '',
            severity: 'MEDIUM',
        },
    });

    const onSubmit = async (values: BugReportFormValues) => {
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const formData = new FormData();
            formData.append('title', values.title.trim());
            formData.append('description', values.description.trim());
            if (values.stepsToReproduce?.trim()) formData.append('stepsToReproduce', values.stepsToReproduce.trim());
            if (values.expectedBehavior?.trim()) formData.append('expectedBehavior', values.expectedBehavior.trim());
            if (values.actualBehavior?.trim()) formData.append('actualBehavior', values.actualBehavior.trim());
            formData.append('severity', values.severity);
            formData.append('module', module);
            const referrer = document.referrer || window.location.href;
            formData.append('pageUrl', referrer);
            formData.append('userAgent', navigator.userAgent);

            const fileList = values.screenshot as FileList | undefined;
            if (fileList && fileList.length > 0) {
                formData.append('screenshot', fileList[0]);
            }

            await createBugReport(formData);

            setSuccessMessage('Thanks! Your bug report has been sent to the admin team.');
            void Swal.fire({
                icon: 'success',
                title: 'Bug Submitted',
                text: 'Thanks! Your bug report has been sent to the admin team.',
                confirmButtonText: 'OK',
            });
            reset();
        } catch (err: any) {
            setErrorMessage(err?.message || 'Failed to submit bug report. Please try again.');
        }
    };

    const onInvalid = (formErrors: typeof errors) => {
        const errorMessages: string[] = [];
        if (formErrors.title) errorMessages.push(formErrors.title.message || 'Invalid title');
        if (formErrors.description) errorMessages.push(formErrors.description.message || 'Invalid description');
        if (formErrors.stepsToReproduce) errorMessages.push(formErrors.stepsToReproduce.message || 'Invalid steps');
        if (formErrors.expectedBehavior) errorMessages.push(formErrors.expectedBehavior.message || 'Invalid expected behavior');
        if (formErrors.actualBehavior) errorMessages.push(formErrors.actualBehavior.message || 'Invalid actual behavior');
        if (formErrors.severity) errorMessages.push(formErrors.severity.message || 'Invalid severity');
        if (formErrors.screenshot) errorMessages.push(formErrors.screenshot.message || 'Invalid screenshot');

        const items = errorMessages.length ? errorMessages.map((msg) => `<li>${msg}</li>`).join('') : '<li>Please review the form fields.</li>';

        void Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            html: `<div style="text-align: left;">
                <p>Please fix the following errors:</p>
                <ul style="margin-top: 10px;">
                    ${items}
                </ul>
            </div>`,
            confirmButtonText: 'OK',
            didOpen: () => {
                const active = document.activeElement as HTMLElement | null;
                active?.blur();
            },
        });
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-500/10" />
            <div className="pointer-events-none absolute bottom-0 left-10 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-500/10" />

            <div className="relative container mx-auto px-6 py-10 max-w-6xl">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                            <span className="rounded-full bg-primary/10 px-3 py-1">Support intake</span>
                            <span className="rounded-full bg-white/70 px-3 py-1 text-gray-700 shadow-sm dark:bg-gray-800/70 dark:text-gray-200">Module: {module}</span>
                        </div>
                        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Report a Bug</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">
                            Capture the issue with enough detail for engineering to reproduce and prioritize. Reports go directly to administrators.
                        </p>
                    </div>
                    <button type="button" className="btn btn-outline-primary" onClick={() => navigate(-1)}>
                        Back
                    </button>
                </div>

                {successMessage && (
                    <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 text-green-800 dark:text-green-200 flex items-center gap-2">
                        <IconSquareCheck className="w-5 h-5" />
                        {successMessage}
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 text-red-800 dark:text-red-200 flex items-center gap-2">
                        <IconAlertCircle className="w-5 h-5" />
                        {errorMessage}
                    </div>
                )}

                {Object.keys(errors).length > 0 && !errorMessage && (
                    <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-amber-800 dark:text-amber-200">
                        <div className="flex items-start gap-2">
                            <IconAlertCircle className="w-5 h-5 mt-0.5" />
                            <div>
                                <p className="font-semibold mb-2">Please fix the following errors:</p>
                                <ul className="text-sm space-y-1">
                                    {errors.title && <li>• {errors.title.message}</li>}
                                    {errors.description && <li>• {errors.description.message}</li>}
                                    {errors.stepsToReproduce && <li>• {errors.stepsToReproduce.message}</li>}
                                    {errors.expectedBehavior && <li>• {errors.expectedBehavior.message}</li>}
                                    {errors.actualBehavior && <li>• {errors.actualBehavior.message}</li>}
                                    {errors.severity && <li>• {errors.severity.message}</li>}
                                    {errors.screenshot && <li>• {errors.screenshot.message}</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="panel p-6 lg:p-8 space-y-8 shadow-sm border border-white/60 dark:border-gray-800/60">
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Issue Details</h2>
                            <p className="text-sm text-gray-500">Provide a clear summary and full description of the issue.</p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Title</label>
                                <input type="text" className="form-input w-full" placeholder="Short summary" {...register('title')} />
                                {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Description</label>
                                <textarea className="form-textarea w-full min-h-[150px]" placeholder="What happened?" {...register('description')} />
                                {errors.description && <p className="text-xs text-danger mt-1">{errors.description.message}</p>}
                            </div>
                        </div>

                        <div className="border-t border-gray-200/70 dark:border-gray-800/70 pt-6 space-y-4">
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reproduction</h2>
                                <p className="text-sm text-gray-500">If possible, list steps and expected behavior.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Steps to Reproduce</label>
                                    <textarea className="form-textarea w-full min-h-[130px]" placeholder="1) ... 2) ..." {...register('stepsToReproduce')} />
                                    {errors.stepsToReproduce && <p className="text-xs text-danger mt-1">{errors.stepsToReproduce.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Expected Behavior</label>
                                    <textarea className="form-textarea w-full min-h-[130px]" placeholder="What you expected to happen" {...register('expectedBehavior')} />
                                    {errors.expectedBehavior && <p className="text-xs text-danger mt-1">{errors.expectedBehavior.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200/70 dark:border-gray-800/70 pt-6 space-y-4">
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Impact & Evidence</h2>
                                <p className="text-sm text-gray-500">Help us assess urgency and attach evidence if available.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Actual Behavior (optional)</label>
                                    <textarea className="form-textarea w-full min-h-[120px]" placeholder="What actually happened" {...register('actualBehavior')} />
                                    {errors.actualBehavior && <p className="text-xs text-danger mt-1">{errors.actualBehavior.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Severity</label>
                                    <select className="form-select w-full" {...register('severity')}>
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="CRITICAL">Critical</option>
                                    </select>
                                    {errors.severity && <p className="text-xs text-danger mt-1">{errors.severity.message}</p>}
                                    <p className="text-xs text-gray-500 mt-2">Critical = major outage or data loss.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Screenshot (optional)</label>
                                <input type="file" accept="image/*" className="form-input w-full" {...register('screenshot')} />
                                {errors.screenshot && <p className="text-xs text-danger mt-1">{errors.screenshot.message}</p>}
                                <p className="text-xs text-gray-500 mt-2">PNG, JPG, or GIF up to 5MB.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
                            </button>
                            <span className="text-xs text-gray-500">You will receive an in-app notification once triaged.</span>
                        </div>
                    </form>

                    <div className="space-y-6">
                        <div className="panel p-5 border border-white/60 dark:border-gray-800/60">
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-primary/10 p-2 text-primary">
                                    <IconInfoCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">What gets captured automatically</h3>
                                    <ul className="mt-2 text-xs text-gray-500 space-y-2">
                                        <li>Current page URL or referrer</li>
                                        <li>Browser and device details</li>
                                        <li>Module context (PMS or IH)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="panel p-5 border border-white/60 dark:border-gray-800/60">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">How we triage</h3>
                            <div className="mt-3 space-y-3 text-xs text-gray-500">
                                <div className="flex items-center justify-between">
                                    <span>Critical issues</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">Same-day review</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>High / Medium</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">48-hour review</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Low</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">Next sprint</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-dashed border-gray-300/70 dark:border-gray-700 p-5 text-xs text-gray-500">
                            <p className="font-semibold text-gray-900 dark:text-white mb-2">Data privacy</p>
                            <p>Do not include passwords, tokens, or personal data. Screenshots should avoid sensitive information.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportBug;
