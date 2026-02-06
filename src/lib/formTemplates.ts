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
export function createEDFormInstance(evaluationData: any, requestData: any, totalAmount: number, procurementType: string) {
    const mapProcurementMethod = (value: any) => {
        if (!value) return '';
        const v = String(value).toUpperCase();
        if (v.includes('INTERNATIONAL')) return 'International Competitive Bidding';
        if (v.includes('NATIONAL')) return 'National Competitive Bidding';
        if (v.includes('RESTRICTED')) return 'Restricted Bidding';
        if (v.includes('EMERGENCY')) return 'Emergency Single Source';
        if (v.includes('SINGLE')) return 'Single Source';
        return String(value);
    };

    const mapContractType = (value: any) => {
        if (!value) return '';
        const v = String(value).toUpperCase();
        if (v.includes('GOODS')) return 'Goods';
        if (v.includes('CONSULTING')) return 'Consulting Services';
        if (v.includes('NON')) return 'Non-Consulting Services';
        if (v.includes('WORK')) return 'Works';
        return String(value);
    };

    const mapAwardCriteria = (value: any) => {
        if (!value) return '';
        const v = String(value).toUpperCase();
        if (v.includes('LOWEST')) return 'Lowest Cost';
        if (v.includes('MOST')) return 'Most Advantageous Bid';
        return String(value);
    };

    const retenderReasonLabels: Record<string, string> = {
        a: 'All bids non-responsive',
        b: 'Awarded supplier refused to enter into contract',
        c: 'Bid price exceeding comparable estimate',
        d: 'Cancelled due to procedural irregularity',
        e: 'Change in bill of quantities',
        f: 'Incorrect specification',
        g: 'Material irregularities in tender documents issued by Procuring Entity',
        h: 'No bid received',
        i: 'Re-scoping of requirements',
        j: 'VFM cannot be achieved',
        k: 'Other',
    };

    const mapRetenderReason = (reasons: any) => {
        if (!reasons) return '';
        const list = Array.isArray(reasons) ? reasons : [reasons];
        const mapped = list.map((r: any) => retenderReasonLabels[String(r).toLowerCase()] || String(r)).filter(Boolean);
        return mapped[0] || '';
    };

    const yesNoValue = (value: any) => {
        if (value === true) return 'Yes';
        if (value === false) return 'No';
        if (value === 'Yes' || value === 'No' || value === 'N/A') return value;
        return '';
    };

    return {
        templateId: 'hoe-approval-form',
        templateName: "Head of Entity's Approval Form",
        templateCode: 'PRO_70_F_12/00',

        // Section A: Procurement & Tendering Data
        sectionA: {
            procurement_activity_name: `${requestData?.reference || ''} - ${evaluationData?.rfqTitle || ''}`,
            unit: requestData?.department?.name || '',
            description_goods: evaluationData?.description || '',
            contract_type: mapContractType(evaluationData?.sectionA?.contractType) || (procurementType === 'GOODS' ? 'Goods' : procurementType === 'WORKS' ? 'Works' : 'Services'),
            comparable_estimate: evaluationData?.sectionA?.comparableEstimate ? `JMD $${Number(evaluationData.sectionA.comparableEstimate || 0).toLocaleString()}` : `JMD $${(totalAmount || 0).toLocaleString()}`,
            approved_supplier: '',
            ppc_registration_category: '',
            procurement_case_number: requestData?.procurementCaseNumber || '',
            date_case_received: requestData?.dateReceived || '',
            procurement_method: mapProcurementMethod(evaluationData?.sectionA?.procurementMethod),
            justification_procurement_method: evaluationData?.sectionA?.justification || '',
            method_advertisement: Array.isArray(evaluationData?.sectionA?.advertisementMethods) ? evaluationData.sectionA.advertisementMethods[0] || '' : evaluationData?.sectionA?.advertisementMethods || '',
            tender_period_from: evaluationData?.sectionA?.tenderPeriodStartDate || '',
            tender_period_days: evaluationData?.sectionA?.tenderPeriodDays || '',
            bid_validity_date: evaluationData?.sectionA?.bidValidityExpiration || '',
            bids_requested: evaluationData?.sectionA?.numberOfBidsRequested || '',
            bids_received: evaluationData?.sectionA?.numberOfBidsReceived || '',
            re_tendered: yesNoValue(evaluationData?.sectionA?.retender),
            reason_re_tender: mapRetenderReason(evaluationData?.sectionA?.retenderReasons),
            other_reason: evaluationData?.sectionA?.retenderOtherReason || '',
            contract_award_criteria: mapAwardCriteria(evaluationData?.sectionA?.awardCriteria),
            contractor_recommended: evaluationData?.sectionC?.recommendedSupplier || '',
            reason_selection: evaluationData?.sectionC?.comments || evaluationData?.sectionC?.criticalIssues || '',
            amount_awarded_without_gct: '',
            gct_amount: '',
            amount_inclusive_gct: evaluationData?.sectionC?.recommendedAmountInclusiveGCT ? `JMD $${Number(evaluationData.sectionC.recommendedAmountInclusiveGCT || 0).toLocaleString()}` : '',
            variance: '',
        },

        // Section B: Procurement Method & Evaluation
        sectionB: {
            shortlist_criteria: evaluationData?.sectionB?.criteria || '',
            number_bidders: evaluationData?.sectionA?.numberOfBidsReceived || evaluationData?.sectionC?.bids?.length || 0,
            evaluation_criteria: evaluationData?.sectionC?.evaluationCriteria || '',
            evaluation_method: evaluationData?.sectionC?.evaluationMethod || '',
            preferred_bidder: evaluationData?.sectionC?.recommendedSupplier || evaluationData?.sectionE?.recommendedSupplier || '',
            contract_value: evaluationData?.sectionC?.recommendedAmountInclusiveGCT ? `JMD $${Number(evaluationData.sectionC.recommendedAmountInclusiveGCT || 0).toLocaleString()}` : `JMD $${(totalAmount || 0).toLocaleString()}`,
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
