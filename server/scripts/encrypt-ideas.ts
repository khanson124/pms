import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

import { prisma } from '../prismaClient.js';
import { logger } from '../config/logger.js';
import { encryptText, isIdeaEncryptionEnabled } from '../utils/ideaEncryption.js';

const PAGE_SIZE = 200;

type IdeaRow = {
    id: number;
    title: string;
    description: string;
    descriptionHtml: string | null;
    reviewNotes: string | null;
};

async function encryptIdeas(): Promise<void> {
    if (!isIdeaEncryptionEnabled()) {
        logger.error('[IdeaEncryption] IDEA_ENCRYPTION_KEY is not set. Aborting backfill.');
        process.exit(1);
    }

    let lastId = 0;
    let scanned = 0;
    let updated = 0;

    while (true) {
        const ideas = await prisma.idea.findMany({
            where: { id: { gt: lastId } },
            orderBy: { id: 'asc' },
            take: PAGE_SIZE,
            select: {
                id: true,
                title: true,
                description: true,
                descriptionHtml: true,
                reviewNotes: true,
            },
        });

        if (ideas.length === 0) {
            break;
        }

        for (const idea of ideas as IdeaRow[]) {
            scanned += 1;
            const nextTitle = encryptText(idea.title) || idea.title;
            const nextDescription = encryptText(idea.description) || idea.description;
            const nextDescriptionHtml = encryptText(idea.descriptionHtml);
            const nextReviewNotes = encryptText(idea.reviewNotes);

            const changed = nextTitle !== idea.title || nextDescription !== idea.description || nextDescriptionHtml !== idea.descriptionHtml || nextReviewNotes !== idea.reviewNotes;

            if (changed) {
                await prisma.idea.update({
                    where: { id: idea.id },
                    data: {
                        title: nextTitle,
                        description: nextDescription,
                        descriptionHtml: nextDescriptionHtml,
                        reviewNotes: nextReviewNotes,
                    },
                });
                updated += 1;
            }
        }

        lastId = ideas[ideas.length - 1].id;
    }

    logger.info('[IdeaEncryption] Backfill complete', { scanned, updated });
}

encryptIdeas()
    .catch((error) => {
        logger.error('[IdeaEncryption] Backfill failed', { error });
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
