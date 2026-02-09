export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date';
    placeholder?: string;
    options?: string[];
    required?: boolean;
    value?: string;
}

export interface FormSection {
    title: string;
    content: string;
    fields?: FormField[];
}

export interface FormDetail {
    id: string;
    code: string;
    name: string;
    description: string;
    category: string;
    minValue?: string;
    maxValue?: string;
    createdDate: string;
    revisionDate?: string;
    sections: FormSection[];
}

export const HOE_FORM_DETAIL: FormDetail = {
    id: 'hoe-approval-form',
    code: 'PRO_70_F_12/00',
    name: "Head of Entity's Approval Form",
    description: 'Contracts valued at 1¢ up to $2,999k (Goods, Services & Works)',
    category: 'Approval Forms',
    minValue: '1¢',
    maxValue: '$2,999k',
    createdDate: 'Aug 01, 2025',
    revisionDate: 'N/A',
    sections: [
        {
            title: 'Section A: Procurement & Tendering Data',
            content: 'Enter all procurement activity and tendering information',
            fields: [
                {
                    id: 'procurement_activity_name',
                    label: '1. Name of Procurement Activity & Ref. Code',
                    type: 'text',
                    placeholder: 'insert name of activity',
                    required: true,
                },
                {
                    id: 'unit',
                    label: '2. Unit',
                    type: 'text',
                    placeholder: 'insert unit requesting item',
                    required: true,
                },
                {
                    id: 'description_goods',
                    label: '3. Description of Goods/Services/Works being procured',
                    type: 'textarea',
                    placeholder: 'Describe the goods, services or works',
                    required: true,
                },
                {
                    id: 'contract_type',
                    label: '4. Contract Type',
                    type: 'select',
                    options: ['Goods', 'Consulting Services', 'Non-Consulting Services', 'Works'],
                    required: true,
                },
                {
                    id: 'comparable_estimate',
                    label: '5. Comparable Estimate',
                    type: 'text',
                    placeholder: 'insert estimated cost',
                    required: true,
                },
                {
                    id: 'approved_supplier',
                    label: '6. Is the Supplier on the Government of Jamaica List of Approved Suppliers?',
                    type: 'select',
                    options: ['Yes', 'No', 'N/A'],
                    required: true,
                },
                {
                    id: 'ppc_registration_category',
                    label: '7. Contractor/Supplier PPC Registration Category',
                    type: 'text',
                    placeholder: 'e.g., Electrical Equipment, Parts and Supplies',
                },
                {
                    id: 'contractor_grade',
                    label: "Contractor's Grade",
                    type: 'text',
                    placeholder: 'N/A',
                },
                {
                    id: 'ppc_registration_number',
                    label: '7a. Public Procurement Commission (PPC) Registration #',
                    type: 'text',
                    placeholder: 'insert PPC registration number',
                },
                {
                    id: 'ppc_expiration_date',
                    label: '7b. PPC Expiration Date',
                    type: 'date',
                    placeholder: 'date PPC expires',
                },
                {
                    id: 'tcc_number',
                    label: '8. Tax Compliance Certificate (TCC) #',
                    type: 'text',
                    placeholder: 'insert TCC no.',
                },
                {
                    id: 'tcc_expiration_date',
                    label: '8a. TCC Expiration Date',
                    type: 'date',
                    placeholder: 'date TCC expires',
                },
                {
                    id: 'procurement_method',
                    label: '9. Procurement Method',
                    type: 'select',
                    options: ['International Competitive Bidding', 'National Competitive Bidding', 'Restricted Bidding', 'Single Source', 'Emergency Single Source'],
                    required: true,
                },
                {
                    id: 'method_advertisement',
                    label: '10. Method of Advertisement',
                    type: 'select',
                    options: ['GOJEP', 'Email'],
                    required: true,
                },
                {
                    id: 'tender_period_from',
                    label: '11. Tender Period From',
                    type: 'date',
                    placeholder: 'insert tender period',
                },
                {
                    id: 'tender_period_days',
                    label: '11a. Number of Days for Tender',
                    type: 'number',
                    placeholder: 'insert no. of days',
                },
                {
                    id: 'bid_validity_date',
                    label: '12. Bid Validity Expiration Date',
                    type: 'date',
                    placeholder: 'insert bid validity expiration',
                },
                {
                    id: 'bids_requested',
                    label: '13. Number of Bids Requested',
                    type: 'number',
                    placeholder: '0',
                },
                {
                    id: 'bids_received',
                    label: '13a. Number of Bids Received',
                    type: 'number',
                    placeholder: '0',
                },
                {
                    id: 're_tendered',
                    label: '14. Re-tendered',
                    type: 'select',
                    options: ['Yes', 'No'],
                    required: true,
                },
                {
                    id: 'reason_re_tender',
                    label: '15. Reason for Re-tender',
                    type: 'select',
                    options: [
                        'All bids non-responsive',
                        'Awarded supplier refused to enter into contract',
                        'Bid price exceeding comparable estimate',
                        'Cancelled due to procedural irregularity',
                        'Change in bill of quantities',
                        'Incorrect specification',
                        'Material irregularities in tender documents',
                        'No bid received',
                        'Re-scoping of requirements',
                        'VFM cannot be achieved',
                        'Other',
                    ],
                },
                {
                    id: 'other_reason',
                    label: '15k. If other, please state reason',
                    type: 'textarea',
                    placeholder: 'Please specify the reason',
                },
                {
                    id: 'contract_award_criteria',
                    label: '16. Contract Award Criteria',
                    type: 'select',
                    options: ['Lowest Cost', 'Most Advantageous Bid'],
                    required: true,
                },
                {
                    id: 'contractor_recommended',
                    label: '17. Contractor/Supplier Recommended for a Contract Award',
                    type: 'text',
                    placeholder: 'e.g., Appliance Traders Limited',
                    required: true,
                },
                {
                    id: 'reason_selection',
                    label: '18. Reason for Selection',
                    type: 'textarea',
                    placeholder: 'Explain the reason for selecting this contractor/supplier',
                    required: true,
                },
                {
                    id: 'amount_awarded_without_gct',
                    label: '19. Amount Awarded (without GCT)',
                    type: 'text',
                    placeholder: 'Enter amount',
                    required: true,
                },
                {
                    id: 'gct_amount',
                    label: '19a. GCT',
                    type: 'text',
                    placeholder: 'Enter GCT amount',
                },
                {
                    id: 'amount_inclusive_gct',
                    label: '19b. Inclusive of GCT',
                    type: 'text',
                    placeholder: 'Total amount including GCT',
                },
                {
                    id: 'variance',
                    label: '20. Variance: 0% (+/-)',
                    type: 'text',
                    placeholder: 'Enter variance percentage',
                },
            ],
        },
        {
            title: 'Section B: Review by Head of Public Procurement',
            content: 'Comments, observations, and review by procurement authority',
            fields: [
                {
                    id: 'hpp_comments',
                    label: '21. Comments/Observations (if any)',
                    type: 'textarea',
                    placeholder: 'Enter any comments or observations',
                    required: false,
                },
                {
                    id: 'hpp_name',
                    label: '22. Reviewed by: Name of HPP',
                    type: 'text',
                    placeholder: 'Full name of Head of Public Procurement',
                    required: true,
                },
                {
                    id: 'hpp_signature',
                    label: '22a. Signature',
                    type: 'text',
                    placeholder: 'Signature',
                    required: true,
                },
                {
                    id: 'hpp_date',
                    label: '22b. Date',
                    type: 'date',
                    placeholder: 'Date of review',
                    required: true,
                },
            ],
        },
        {
            title: 'Section C: Head of Entity Decision',
            content: 'Final approval decision (Approved, Rejected, or Deferred) with justification by Executive Director',
            fields: [
                {
                    id: 'hoe_comments',
                    label: '23. Comments/Observations (if any)',
                    type: 'textarea',
                    placeholder: 'Enter any comments or observations',
                    required: false,
                },
                {
                    id: 'action_taken',
                    label: 'Action Taken',
                    type: 'select',
                    options: ['Approved', 'Rejected', 'Deferred'],
                    required: true,
                },
                {
                    id: 'rejection_deferral_details',
                    label: '24. If rejected or deferred, please give details below',
                    type: 'textarea',
                    placeholder: 'Provide details for rejection or deferral',
                    required: false,
                },
                {
                    id: 'executive_director_name',
                    label: '25. Signed by: Name of Executive Director',
                    type: 'text',
                    placeholder: 'Full name of Executive Director',
                    required: true,
                },
                {
                    id: 'executive_director_signature',
                    label: '25a. Signature',
                    type: 'text',
                    placeholder: 'Signature',
                    required: true,
                },
                {
                    id: 'executive_director_date',
                    label: '25b. Date',
                    type: 'date',
                    placeholder: 'Date of approval/rejection',
                    required: true,
                },
            ],
        },
    ],
};
