import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { prisma } from '../prismaClient.js';
import { config } from '../config/environment.js';
import { logger } from '../config/logger.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { validate, createBugReportSchema } from '../middleware/validation.js';
import { auditService } from '../services/auditService.js';

const router = Router();

const uploadDir = path.join(config.UPLOAD_DIR, 'bug-reports');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]+/gi, '_');
        const token = crypto.randomBytes(6).toString('hex');
        cb(null, `bug_${Date.now()}_${base}_${token}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: config.MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (/^image\//.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image uploads are allowed'));
        }
    },
});

function normalizeBugReportBody(req: AuthenticatedRequest, _res: any, next: any) {
    const body = req.body || {};
    const trim = (val: unknown) => (typeof val === 'string' ? val.trim() : val);
    const optional = (val: unknown) => {
        const t = trim(val);
        return t === '' ? undefined : t;
    };

    req.body = {
        title: trim(body.title),
        description: trim(body.description),
        stepsToReproduce: optional(body.stepsToReproduce),
        expectedBehavior: optional(body.expectedBehavior),
        actualBehavior: optional(body.actualBehavior),
        severity: String(trim(body.severity || 'MEDIUM')).toUpperCase(),
        module: String(trim(body.module || 'PMS')).toUpperCase(),
        pageUrl: optional(body.pageUrl),
        userAgent: optional(body.userAgent),
    } as any;

    next();
}

// POST /api/bug-reports - Submit a bug report
router.post('/', authMiddleware, upload.single('screenshot'), normalizeBugReportBody, validate(createBugReportSchema), async (req, res) => {
    try {
        const authReq = req as AuthenticatedRequest;
        const userId = authReq.user?.sub;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const screenshotUrl = req.file ? `/uploads/bug-reports/${req.file.filename}` : undefined;

        const bugReport = await prisma.bugReport.create({
            data: {
                title: req.body.title,
                description: req.body.description,
                stepsToReproduce: req.body.stepsToReproduce,
                expectedBehavior: req.body.expectedBehavior,
                actualBehavior: req.body.actualBehavior,
                severity: req.body.severity,
                module: req.body.module,
                pageUrl: req.body.pageUrl,
                userAgent: req.body.userAgent,
                screenshotUrl,
                reportedById: userId,
            },
            include: {
                reportedBy: { select: { id: true, name: true, email: true } },
            },
        });

        // Notify admins
        try {
            const admins = await prisma.user.findMany({
                where: {
                    roles: {
                        some: {
                            role: {
                                OR: [{ name: { in: ['ADMIN', 'ADMINISTRATOR', 'SUPER_ADMIN'] } }, { name: { contains: 'ADMIN' } }],
                            },
                        },
                    },
                },
                select: { id: true, email: true, name: true },
            });

            if (admins.length > 0) {
                const reporterName = bugReport.reportedBy?.name || bugReport.reportedBy?.email || 'User';
                const message = `New bug report: ${bugReport.title} (Severity: ${bugReport.severity}) from ${reporterName}`;

                const notifications = admins.map((admin) => ({
                    userId: admin.id,
                    type: 'BUG_REPORT' as const,
                    message,
                    data: {
                        bugReportId: bugReport.id,
                        severity: bugReport.severity,
                        reporterId: bugReport.reportedById,
                        reporterName,
                        url: '/procurement/admin/bug-reports',
                    },
                }));

                await prisma.notification.createMany({ data: notifications });
            }
        } catch (notifErr) {
            logger.warn('Failed to create admin notifications for bug report', { error: notifErr });
        }

        await auditService.createAuditLog({
            userId,
            action: 'REQUEST_STATUS_CHANGED',
            entity: 'BugReport',
            entityId: bugReport.id,
            message: `Bug report submitted: ${bugReport.title}`,
            metadata: {
                severity: bugReport.severity,
                status: bugReport.status,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Bug report submitted successfully',
            data: bugReport,
        });
    } catch (error: any) {
        logger.error('Failed to submit bug report', { error: error?.message || error });
        return res.status(500).json({ success: false, message: 'Failed to submit bug report' });
    }
});

export default router;
