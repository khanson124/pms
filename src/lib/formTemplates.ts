// Template definition for Head of Entity's Approval Form
export const HOE_APPROVAL_FORM_TEMPLATE = {
    id: 'hoe-approval-form',
    code: 'PRO_70_F_12/00',
    name: "Head of Entity's Approval Form",
    description: 'Contracts valued at 1¢ up to $2,999k (Goods, Services & Works)',
    category: 'Approval Forms',
    minValue: '1¢',
    maxValue: '$2,999k',
    createdDate: 'Aug 01, 2025',
    revisionDate: 'N/A',
};

// Function to create a complete form instance with evaluation data
export function createEDFormInstance(
    evaluationData: any,
    requestData: any,
    totalAmount: number,
    procurementType: string
) {
    return {
        templateId: 'hoe-approval-form',
        templateName: "Head of Entity's Approval Form",
        templateCode: 'PRO_70_F_12/00',
        
        // Section A: Procurement & Tendering Data
        sectionA: {
            procurement_activity_name: `${requestData?.reference || ''} - ${evaluationData?.rfqTitle || ''}`,
            unit: requestData?.department?.name || '',
            description_goods: evaluationData?.description || '',
            contract_type: procurementType === 'GOODS' ? 'Goods' : procurementType === 'WORKS' ? 'Works' : 'Services',
            comparable_estimate: `JMD $${(totalAmount || 0).toLocaleString()}`,
            approved_supplier: '',
            ppc_registration_category: '',
            procurement_case_number: requestData?.procurementCaseNumber || '',
            date_case_received: requestData?.dateReceived || '',
            procurement_method: evaluationData?.sectionA?.procurementMethod || '',
            justification_procurement_method: evaluationData?.sectionA?.justification || '',
        },
        
        // Section B: Procurement Method & Evaluation
        sectionB: {
            shortlist_criteria: evaluationData?.sectionB?.criteria || '',
            number_bidders: evaluationData?.sectionC?.bids?.length || 0,
            evaluation_criteria: evaluationData?.sectionC?.evaluationCriteria || '',
            evaluation_method: evaluationData?.sectionC?.evaluationMethod || '',
            preferred_bidder: evaluationData?.sectionE?.recommendedSupplier || '',
            contract_value: `JMD $${(totalAmount || 0).toLocaleString()}`,
            evaluation_summary: evaluationData?.sectionD?.summary || '',
        },
        
        // Section C: Head of Entity Decision
        sectionC: {
            head_entity_review: '',
            risk_assessment: evaluationData?.sectionD?.summary || '',
            alternatives_considered: evaluationData?.sectionC?.alternativesConsidered || '',
            recommendation: evaluationData?.sectionE?.finalRecommendation || '',
            approval_decision: '',
            head_entity_signature: '',
            head_entity_name: '',
            date_approved: new Date().toISOString().split('T')[0],
        },
        
        // Reference data
        evaluationReference: evaluationData?.evalNumber || '',
        requestReference: requestData?.reference || '',
        rfqNumber: evaluationData?.rfqNumber || '',
        
        // Metadata
        createdAt: new Date().toISOString(),
        formNumber: generateFormNumber(),
    };
}

function generateFormNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
    return `PRO_70_F_12/00-${year}${month}-${randomSuffix}`;
}
