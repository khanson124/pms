import crypto from 'crypto';
import { logger } from '../config/logger.js';

const IDEA_ENCRYPTION_KEY = process.env.IDEA_ENCRYPTION_KEY || '';
const ENCRYPTION_PREFIX = 'enc:v1:';

let warnedMissingKey = false;
let warnedDecryptFailure = false;

export function isIdeaEncryptionEnabled(): boolean {
    return IDEA_ENCRYPTION_KEY.trim().length > 0;
}

function getKey(): Buffer {
    return crypto.createHash('sha256').update(IDEA_ENCRYPTION_KEY).digest();
}

function warnMissingKey(): void {
    if (warnedMissingKey) return;
    warnedMissingKey = true;
    logger.warn('[IdeaEncryption] IDEA_ENCRYPTION_KEY is not set; encrypted values will remain encrypted.');
}

function warnDecryptFailure(error: unknown): void {
    if (warnedDecryptFailure) return;
    warnedDecryptFailure = true;
    logger.warn('[IdeaEncryption] Failed to decrypt idea fields.', { error });
}

export function encryptText(value?: string | null): string | null | undefined {
    if (value === null || value === undefined || value === '') return value;
    if (!isIdeaEncryptionEnabled()) return value;
    if (value.startsWith(ENCRYPTION_PREFIX)) return value;

    const iv = crypto.randomBytes(12);
    const key = getKey();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${ENCRYPTION_PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${ciphertext.toString('hex')}`;
}

export function decryptText(value?: string | null): string | null | undefined {
    if (value === null || value === undefined || value === '') return value;
    if (!value.startsWith(ENCRYPTION_PREFIX)) return value;
    if (!isIdeaEncryptionEnabled()) {
        warnMissingKey();
        return value;
    }

    try {
        const payload = value.substring(ENCRYPTION_PREFIX.length);
        const parts = payload.split(':');
        if (parts.length !== 3) return value;
        const [ivHex, tagHex, dataHex] = parts;

        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const data = Buffer.from(dataHex, 'hex');
        const key = getKey();

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
        return decrypted;
    } catch (error) {
        warnDecryptFailure(error);
        return value;
    }
}

type IdeaTextFields = {
    title?: string | null;
    description?: string | null;
    descriptionHtml?: string | null;
    reviewNotes?: string | null;
};

export function encryptIdeaFields<T extends IdeaTextFields>(idea: T): T {
    if (!idea) return idea;
    return {
        ...idea,
        title: encryptText(idea.title),
        description: encryptText(idea.description),
        descriptionHtml: encryptText(idea.descriptionHtml),
        reviewNotes: encryptText(idea.reviewNotes),
    };
}

export function decryptIdeaFields<T extends IdeaTextFields>(idea: T): T {
    if (!idea) return idea;
    return {
        ...idea,
        title: decryptText(idea.title),
        description: decryptText(idea.description),
        descriptionHtml: decryptText(idea.descriptionHtml),
        reviewNotes: decryptText(idea.reviewNotes),
    };
}
