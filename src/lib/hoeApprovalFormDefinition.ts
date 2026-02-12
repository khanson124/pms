export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date' | 'searchable-select';
    placeholder?: string;
    options?: string[];
    required?: boolean | ((values: Record<string, string | boolean>) => boolean);
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

export const PPC_GOODS_SERVICES_CATEGORIES: readonly string[] = [
    'Advertising, Public Relations and Marketing Services',
    'Aggregates and Pre-mix concrete',
    'Agricultural Services',
    'Agricultural Tools, Equipment Parts & Supplies',
    'Analytical Laboratory Equipment, Parts & Supplies',
    'Animals and Animal Products',
    'Appraisal & Valuation Services',
    'Auctioneer',
    'Audio Visual Equipment Rental',
    'Audio Visual Goods',
    'Audio Visual Services',
    'Awnings and Tents',
    'Banking Equipment Parts & Supplies',
    'Books',
    'Books - Approved Textbooks',
    'Building & Construction Extrusions, Aluminium Windows, Doors and Hurricane Shutters',
    'Call Center Services',
    'Canteen Concessionaire services',
    'Car Rental Services',
    'Carpentry & Joinery Supplies',
    'Carpets, Blinds, Drapery, Soft Furnishings and related items',
    'Catering',
    'Cesspool Services',
    'Chemicals (including Janitorial Chemicals)',
    'Computers and Related Services',
    'Computers, Computer Equipment, Parts & Supplies',
    'Consulting Services - General',
    'Courier Services',
    'Customs Brokerage Services',
    'Debt Collection & Recovery Services',
    'Document Destruction, Incineration & Recycling Services',
    'Educational - Toys and Equipment',
    'Electrical & Energy Saving Products & Supplies',
    'Electrical Appliances & Tools',
    'Electrical Equipment, Parts & Supplies',
    'Electronic Bill Payment & Settlement Services',
    'Electronic Equipment, Parts & Supplies',
    'Environmental & Occupational Health & Safety Services',
    'Equipment Maintenance: Other',
    'Equipment Maintenance: Repair & Maintenance of Computer & Electronic Equipment',
    'Equipment Maintenance: Repair & Maintenance of Construction & Industrial Equipment & Tools',
    'Equipment Rental: Other',
    'Equipment Rental: Rental of Computer & Electronic Equipment',
    'Equipment Rental: Rental of Construction & Industrial Equipment & Tools',
    'Equipment Rental: Rental of Party & Event Supplies',
    'Event Planning',
    'Food & Grocery Items',
    'Funeral Services',
    'Furniture manufacture, repairs & supplies',
    'Garage Services',
    'General Services',
    'General Supplies',
    'Graphic Design',
    'Hardware and Haberdashery',
    'Heating, ventilation and air conditioning, equipment parts and supplies',
    'Hotel Restaurant & Hospitality Equipment & Supplies',
    'Hotel, Restaurant & Hospital Equipment & Supplies',
    'Industrial Concrete Products',
    'Industrial Pipes & Fittings',
    'Industrial Plastic Products',
    'Industrial Steel Products',
    'Industrial, Construction Equipment, Machinery, Parts & Supplies',
    'Information Technology Services',
    'Insurance Services',
    'Intrusion Detection Equipment, Parts and Supplies',
    'Janitorial, Sanitation Services',
    'Janitorial, Sanitation Services - Street sweeping, drain cleaning and bushing',
    'Janitorial, Sanitation Supplies',
    'Laundry & Dry Cleaning Services',
    'Lithographic and Printing Services',
    'Locksmith Services',
    'Manufacture and Supply of Textile and Garment Products',
    'Marine Services',
    'Marine Services - other',
    'Marine Services - Petroleum Cargo Inspection',
    'Marine Services - Port Management Services',
    'Marine Services - Repair and Maintenance of Marine Equipment',
    'Marine Services - Repair and Maintenance of Marine Vessels',
    'Marine Services - Tug Boat Rental',
    'Marine Supplies',
    'Medical, Equipment and Supplies',
    'Merchandise',
    'Motor Vehicle and Spares - New Car',
    'Motor Vehicle and Spares - Used Car',
    'Motor Vehicle Spares and Accessories',
    'Motor Vehicle Valuation & Assessment Services',
    'Musical Instrument',
    'Office Equipment Supplies, Parts & Supplies',
    'Packaging Products & Supplies',
    'Pesticide Control Services',
    'Pesticides',
    'Petroleum Products',
    'Pharmaceutical & Prescription Drugs',
    'Photographic Equipment and Supplies',
    'Photography Services',
    'Photovoltaic and Wind Powered Systems - Installation, Maintenance and Repairs',
    'Photovoltaic and Wind Powered Systems Design',
    'Promotional Items',
    'Real Estate Services',
    'Renewable Energy Systems',
    'Safes and Vaults',
    'Safety & Security Services - Fire Safety Products and Equipment - Installation & Service',
    'Safety & Security Services - Guard Services',
    'Safety & Security Services - Other',
    'Safety & Security Services - Private Investigation',
    'Safety & Security Services - Safety Equipment Installation and Service',
    'Safety Products',
    'School Furniture',
    'Security Access and ID Cards and related supplies',
    'Signs & Banners (not including billboards & large outdoor signs)',
    'Solar Water Heater Installation',
    'Stationery Supplies',
    'Telecommunication Services',
    'Telecommunication Supplies',
    'Towing and Wrecking',
    'Transportation and Haulage - Aggregate and Construction Material',
    'Transportation and Haulage - Delivery of School Furniture',
    'Transportation and Haulage - Garbage Collection and Disposal',
    'Transportation and Haulage - Liquid Caustic Soda',
    'Transportation and Haulage - Mail Transportation',
    'Transportation and Haulage - Nutrition Products',
    'Transportation and Haulage - Other',
    'Transportation and Haulage - Passenger Transport Services',
    'Transportation and Haulage - Petroleum Products',
    'Transportation and Haulage - Potable Water',
    'Transportation and Haulage - Tour Operation Service',
    'Transportation and Haulage - Water',
    'Trophies, Medals & Insignias',
];

export const PPC_WORKS_CATEGORIES: readonly string[] = [
    'Building Construction',
    'Road Works & Civil Engineering',
    'Electrical Works',
    'Mechanical Works',
    'Plumbing & Drainage Works',
    'HVAC Installation & Maintenance',
    'Carpentry & Joinery',
    'Roofing & Waterproofing',
    'Painting & Finishing',
    'Masonry & Concrete Works',
    'Landscaping & External Works',
    'Structural Repairs & Rehabilitation',
];

const GOODS_SERVICES_CONTRACT_TYPES = new Set([
    'goods',
    'service',
    'services',
    'goods and services',
    'goods/services',
    'consulting service',
    'consulting services',
    'non consulting service',
    'non consulting services',
    'non-consulting service',
    'non-consulting services',
]);

export const getPpcCategoriesForContractType = (contractType?: string | null): string[] => {
    const normalized = String(contractType || '')
        .trim()
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ');
    if (!normalized) return [];
    if (normalized === 'works') return [...PPC_WORKS_CATEGORIES];
    if (GOODS_SERVICES_CONTRACT_TYPES.has(normalized)) return [...PPC_GOODS_SERVICES_CATEGORIES];
    return [];
};

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
                    type: 'searchable-select',
                    placeholder: 'Select PPC category',
                    required: (values) => {
                        const contractType = values.contract_type;
                        return typeof contractType === 'string' && contractType.trim().length > 0;
                    },
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
