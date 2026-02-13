import { getApiUrl } from '../config/api';

export type BugReportSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BugReportStatus = 'NEW' | 'TRIAGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type BugReportModule = 'PMS' | 'IH' | 'OTHER';

export interface BugReport {
    id: number;
    title: string;
    description: string;
    stepsToReproduce?: string | null;
    expectedBehavior?: string | null;
    actualBehavior?: string | null;
    severity: BugReportSeverity;
    status: BugReportStatus;
    module: BugReportModule;
    pageUrl?: string | null;
    userAgent?: string | null;
    screenshotUrl?: string | null;
    reportedById: number;
    resolvedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

function authHeadersForMultipart(): Record<string, string> {
    return {};
}

export async function createBugReport(formData: FormData): Promise<BugReport> {
    const response = await fetch(getApiUrl('/api/bug-reports'), {
        method: 'POST',
        headers: authHeadersForMultipart(),
        body: formData,
        credentials: 'include',
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.success) {
        const message = payload?.message || 'Failed to submit bug report';
        throw new Error(message);
    }

    return payload.data as BugReport;
}
