import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function regenerateEDForm() {
  try {
    // Delete the incomplete form
    await prisma.eDApprovalForm.delete({
      where: { id: 1 },
    });
    console.log('✅ Deleted incomplete form');

    // Get the evaluation with its related data
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: 7 },
      include: {
        request: {
          select: {
            id: true,
            reference: true,
            totalEstimated: true,
            procurementType: true,
            procurementCaseNumber: true,
            dateReceived: true,
          },
        },
      },
    });

    if (!evaluation || !evaluation.request) {
      console.error('❌ Evaluation or request not found');
      return;
    }

    const totalAmount = evaluation.request.totalEstimated
      ? parseFloat(String(evaluation.request.totalEstimated))
      : 0;

    // Extract procurement types
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

    const triggeringType =
      procurementTypes.includes('GOODS') && totalAmount >= 3000000
        ? 'GOODS'
        : 'WORKS';

    // Extract evaluation data
    let justification = evaluation.description || '';
    let riskAssessment = '';

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

    // Create form data
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
    const formNumber = `PRO_70_F_12/00-${year}${month}-${randomSuffix}`;

    const formData = {
      templateId: 'hoe-approval-form',
      templateName: "Head of Entity's Approval Form",
      templateCode: 'PRO_70_F_12/00',
      
      sectionA: {
        procurement_activity_name: `${evaluation.request.reference} - ${evaluation.rfqTitle || ''}`,
        unit: '',
        description_goods: evaluation.description || '',
        contract_type: triggeringType,
        comparable_estimate: `JMD $${totalAmount.toLocaleString()}`,
        approved_supplier: '',
        ppc_registration_category: '',
        procurement_case_number: evaluation.request.procurementCaseNumber || '',
        date_case_received: evaluation.request.dateReceived || '',
        procurement_method: '',
        justification_procurement_method: '',
      },
      
      sectionB: {
        shortlist_criteria: '',
        number_bidders: 0,
        evaluation_criteria: '',
        evaluation_method: '',
        preferred_bidder: '',
        contract_value: `JMD $${totalAmount.toLocaleString()}`,
        evaluation_summary: riskAssessment,
      },
      
      sectionC: {
        head_entity_review: '',
        risk_assessment: riskAssessment,
        alternatives_considered: '',
        recommendation: justification,
        approval_decision: '',
        head_entity_signature: '',
        head_entity_name: '',
        date_approved: new Date().toISOString().split('T')[0],
      },
      
      evaluationReference: evaluation.evalNumber,
      requestReference: evaluation.request.reference,
      rfqNumber: evaluation.rfqNumber,
    };

    // Create new form
    const edForm = await prisma.eDApprovalForm.create({
      data: {
        formNumber,
        evaluationId: evaluation.id,
        requestId: evaluation.request.id,
        procurementType: triggeringType,
        totalAmount,
        justification,
        riskAssessment,
        formData,
        status: 'PENDING',
        submittedById: 1,
      },
    });

    console.log('✅ Created new ED form with complete template data');
    console.log(`   Form ID: ${edForm.id}`);
    console.log(`   Form Number: ${edForm.formNumber}`);
    console.log(`   Evaluation: ${evaluation.evalNumber}`);
    console.log(`   Amount: JMD $${totalAmount.toLocaleString()}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateEDForm();
