import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createEDFormForEvaluation(evaluationId: number) {
  try {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        request: {
          select: {
            id: true,
            reference: true,
            totalEstimated: true,
            procurementType: true,
          },
        },
      },
    });

    if (!evaluation) {
      console.error('Evaluation not found');
      return;
    }

    if (!evaluation.request) {
      console.error('Evaluation has no associated request');
      return;
    }

    const totalAmount = evaluation.request.totalEstimated
      ? parseFloat(String(evaluation.request.totalEstimated))
      : 0;

    let procurementTypes: string[] = [];
    if (evaluation.request.procurementType) {
      if (Array.isArray(evaluation.request.procurementType)) {
        procurementTypes = evaluation.request.procurementType.map((t: string) =>
          t.toUpperCase()
        );
      } else if (typeof evaluation.request.procurementType === 'string') {
        try {
          const parsed = JSON.parse(evaluation.request.procurementType);
          procurementTypes = Array.isArray(parsed)
            ? parsed.map((t: string) => t.toUpperCase())
            : [String(parsed).toUpperCase()];
        } catch {
          procurementTypes = [evaluation.request.procurementType.toUpperCase()];
        }
      }
    }

    console.log('Evaluation details:');
    console.log('  ID:', evaluation.id);
    console.log('  Eval Number:', evaluation.evalNumber);
    console.log('  Amount:', `$${totalAmount.toLocaleString()}`);
    console.log('  Procurement Types:', procurementTypes);
    console.log('  Status:', evaluation.status);

    const shouldCreateEDForm =
      (procurementTypes.includes('GOODS') && totalAmount >= 3000000) ||
      (procurementTypes.includes('WORKS') && totalAmount >= 5000000);

    console.log('\nShould create ED form:', shouldCreateEDForm);

    if (!shouldCreateEDForm) {
      console.log('Threshold not met - exiting');
      return;
    }

    // Check if form already exists
    const existingForm = await prisma.eDApprovalForm.findFirst({
      where: { evaluationId: evaluation.id },
    });

    if (existingForm) {
      console.log('ED Form already exists:', existingForm.formNumber);
      return;
    }

    // Create ED Approval Form
    const triggeringType =
      procurementTypes.includes('GOODS') && totalAmount >= 3000000
        ? 'GOODS'
        : 'WORKS';

    let justification = evaluation.description || '';
    let riskAssessment = '';

    // Extract from Section E
    if (evaluation.sectionE) {
      try {
        const sectionE =
          typeof evaluation.sectionE === 'string'
            ? JSON.parse(evaluation.sectionE)
            : evaluation.sectionE;
        if (sectionE.finalRecommendation) {
          justification = sectionE.finalRecommendation;
        }
      } catch (e) {
        console.warn('Failed to parse sectionE:', e);
      }
    }

    // Extract from Section D
    if (evaluation.sectionD) {
      try {
        const sectionD =
          typeof evaluation.sectionD === 'string'
            ? JSON.parse(evaluation.sectionD)
            : evaluation.sectionD;
        if (sectionD.summary) {
          riskAssessment = sectionD.summary;
        }
      } catch (e) {
        console.warn('Failed to parse sectionD:', e);
      }
    }

    // Generate form number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
    const formNumber = `ED_${year}${month}_${randomSuffix}`;

    console.log('\nCreating ED form:', formNumber);
    console.log('  Justification:', justification.substring(0, 100) + '...');
    console.log('  Risk Assessment:', riskAssessment.substring(0, 100) + '...');

    const edForm = await prisma.eDApprovalForm.create({
      data: {
        formNumber,
        evaluationId: evaluation.id,
        requestId: evaluation.request.id,
        procurementType: triggeringType,
        totalAmount,
        justification,
        riskAssessment,
        status: 'PENDING',
        submittedById: evaluation.createdBy || 1, // Use evaluation creator or default to admin
      },
    });

    console.log('\n✅ ED Form created successfully!');
    console.log('  Form ID:', edForm.id);
    console.log('  Form Number:', edForm.formNumber);

    // Create notifications for procurement managers
    const procurementManagers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'PROCUREMENT_MANAGER' },
          { role: 'EXECUTIVE_DIRECTOR' },
        ],
      },
    });

    for (const manager of procurementManagers) {
      await prisma.notification.create({
        data: {
          userId: manager.id,
          type: 'ED_FORM_CREATED',
          title: 'New ED Approval Form',
          message: `ED Approval Form ${formNumber} has been created for evaluation ${evaluation.evalNumber} (${triggeringType}, $${totalAmount.toLocaleString()})`,
          link: `/procurement/forms/ed-approval/${edForm.id}`,
        },
      });
      console.log(`  Notification sent to ${manager.name} (${manager.role})`);
    }
  } catch (error) {
    console.error('Error creating ED form:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Create ED form for evaluation ID 7
createEDFormForEvaluation(7);
