import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

try {
  // Check the most recent completed evaluation (ID 7)
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: 7 },
    select: {
      id: true,
      status: true,
      evalNumber: true,
      rfqNumber: true,
      requestId: true,
      combinedRequestId: true,
      sectionE: true,
      sectionD: true,
      request: {
        select: {
          id: true,
          reference: true,
          totalEstimated: true,
          procurementType: true
        }
      },
      combinedRequest: {
        select: {
          id: true,
          title: true,
          reference: true
        }
      }
    }
  });
  
  console.log('Evaluation:', JSON.stringify(evaluation, null, 2));
  
  if (evaluation) {
    const edForms = await prisma.eDApprovalForm.findMany({
      where: { evaluationId: evaluation.id },
      select: {
        id: true,
        formNumber: true,
        status: true,
        justification: true,
        riskAssessment: true,
        createdAt: true
      }
    });
    
    console.log('\nED Forms for this evaluation:', JSON.stringify(edForms, null, 2));
    
    if (edForms.length === 0 && evaluation.request) {
      const amount = evaluation.request.totalEstimated ? parseFloat(String(evaluation.request.totalEstimated)) : 0;
      console.log(`\n❌ NO ED FORM CREATED - Analysis:`);
      console.log(`  - Amount: $${amount.toLocaleString()}`);
      console.log(`  - Procurement Type: ${JSON.stringify(evaluation.request.procurementType)}`);
      console.log(`  - Evaluation Status: ${evaluation.status}`);
      console.log(`  - Should create for GOODS if amount >= $3,000,000`);
      console.log(`  - Should create for WORKS if amount >= $5,000,000`);
      
      // Check the threshold
      let procTypes = [];
      if (evaluation.request.procurementType) {
        if (Array.isArray(evaluation.request.procurementType)) {
          procTypes = evaluation.request.procurementType;
        } else if (typeof evaluation.request.procurementType === 'string') {
          try {
            procTypes = JSON.parse(evaluation.request.procurementType);
          } catch {
            procTypes = [evaluation.request.procurementType];
          }
        }
      }
      
      const shouldCreate = (procTypes.includes('GOODS') && amount >= 3000000) || (procTypes.includes('WORKS') && amount >= 5000000);
      console.log(`  - Should create ED form: ${shouldCreate}`);
    } else if (edForms.length > 0) {
      console.log(`\n✅ ED Form(s) exist for this evaluation`);
    }
  }
} catch (err) {
  console.error('Error:', err);
} finally {
  await prisma.$disconnect();
}
