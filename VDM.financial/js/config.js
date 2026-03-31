// config.js — Pure data constants (ENTITY_CONFIG, accountingPolicies, letterheads)
// Depends on: (none)

// ── Letterhead images (base64) ──
const CA_LETTERHEAD = "images/letterhead-header.png";
const AUDIT_LETTERHEAD = "images/Audit-letterhead-header.png";
const LETTERHEAD_FOOTER_IMG = "images/letterhead-footer.png";
const AUDIT_FOOTER_IMG = "images/Audit-letterhead-footer.png";


// ── ACCOUNTING POLICIES ──
const accountingPolicies = [
  {
    id: 'pol_framework',
    label: '1. Accounting Policy — General Framework',
    originalNum: '1',
    text: 'The annual financial statements are presented in accordance with International Financial Reporting Standards for Small and Medium-sized Entities and are prepared on the historical cost basis. The principal policies are consistent with those applied in the previous year, except where indicated otherwise.'
  },
  {
    id: 'pol_ppe',
    label: '1.1 Property, Plant and Equipment',
    originalNum: '1.1',
    text: 'Property, plant and equipment are stated at cost, including the cost to prepare the assets for their intended use, less accumulated depreciation. Property, plant and equipment, with the exception of land and buildings and personal assets, are depreciated in equal annual amounts to write off each asset over its estimated useful economic life. Investment properties are not depreciated. Other assets are depreciated at the following rates:',
    subItems: [
      { id: 'pol_ppe_farming', label: 'Farming Equipment', rateOptions: ['50% / 30% / 20%', '20%', '33%', '10%', 'Other'] },
      { id: 'pol_ppe_vehicles', label: 'Vehicles', rateOptions: ['50% / 30% / 20%', '20%', '33%', '10%', 'Other'] },
      { id: 'pol_ppe_medical', label: 'Medical Equipment', rateOptions: ['50% / 30% / 20%', '20%', '33%', '10%', 'Other'] },
      { id: 'pol_ppe_furniture', label: 'Furniture and Fittings', rateOptions: ['50% / 30% / 20%', '20%', '33%', '10%', 'Other'] },
      { id: 'pol_ppe_office', label: 'Office Equipment', rateOptions: ['50% / 30% / 20%', '20%', '33%', '10%', 'Other'] },
      { id: 'pol_ppe_computer', label: 'Computer Equipment', rateOptions: ['50% / 30% / 20%', '20%', '33%', '10%', 'Other'] },
      { id: 'pol_ppe_land', label: 'Land and Buildings', isLandAndBuildings: true },
    ],
    textSuffix: 'Land and buildings are valuated from time to time to ensure that the net realisable value of these assets still exceeds the original cost of the property. Should the realisable value be less than the original cost the assets will be revalued to the realisable value.'
  },
  {
    id: 'pol_investments',
    label: '1.2 Investments',
    originalNum: '1.2',
    text: 'Investments are stated at cost to the entity, less amounts written off as permanent diminution in the value of investments.'
  },
  {
    id: 'pol_crypto',
    label: '1.3 Intangible Assets — Crypto Assets',
    originalNum: '1.3',
    text: 'A crypto asset is a digital representation of value that is not issued by a central bank, but is traded, transferred and stored electronically by natural and legal persons for the purpose of payment, investment and other forms of utility, and applies cryptography techniques in the underlying technology. The crypto assets are measured at cost on initial recognition and are subsequently measured at cost less accumulated amortisation and impairment losses.'
  },
  {
    id: 'pol_goodwill',
    label: '1.3 Goodwill',
    originalNum: '1.3',
    text: 'Goodwill is carried at cost to the entity, less amounts written off as permanent diminution in the value of Goodwill.'
  },
  {
    id: 'pol_subsidiaries',
    label: '1.4 Associated Companies and Subsidiaries',
    originalNum: '1.4',
    text: 'Investments in subsidiaries and associated companies are carried at cost, less amounts written off as permanent diminution in the value of these investments. The results of the Subsidiaries are not consolidated in the financial statements of the holding company as per the decision of the directors.'
  },
  {
    id: 'pol_ltloans_granted',
    label: '1.5 Long Term Loans Granted',
    originalNum: '1.5',
    text: 'Long term loans are carried at nominal value. Loans to related parties are carried at nominal value and no short term portion is recognised as there is no fixed repayment schedule determined on these loans.'
  },
  {
    id: 'pol_biological',
    label: '1.6 Biological Assets',
    originalNum: '1.6',
    text: 'Biological assets which consists of different components are accounted for as follows:',
    subItems: [
      { id: 'pol_bio_harvest', label: '1.6.1 Harvest on Land', bodyText: "Harvest on land is shown at director's/trustee's/member's valuation." },
      { id: 'pol_bio_livestock', label: '1.6.2 Livestock on Hand', bodyText: 'Livestock on hand is shown at the net realisable value at year end, which is determined by the owners/directors/trustees/members.' },
    ],
    isBio: true
  },
  {
    id: 'pol_inventory',
    label: '1.7 Inventory',
    originalNum: '1.7',
    text: 'Inventory is stated at the lower of cost or net realisable value. The cost of inventory is generally determined by means of the first-in-first-out method, with production costs, which includes direct labour, an appropriate portion of overheads and other direct costs, but excludes interest. Net realisable value is the estimate of the selling price, less the costs of completion and selling expenses. Write-offs are made in the valuation for obsolete, unusable and unsalable inventory and for latent damage first revealed when stock items are taken into use or offered for sale.'
  },
  {
    id: 'pol_receivables',
    label: '1.8 Trade and Other Receivables',
    originalNum: '1.8',
    text: 'Trade and other receivables are carried at nominal value. An estimate is made for doubtful receivables based on a review of all outstanding amounts at the year-end. Bad debts are written off during the year in which they are identified.'
  },
  {
    id: 'pol_cash',
    label: '1.9 Cash and Cash Equivalents',
    originalNum: '1.9',
    text: 'For purposes of the statement of cash flow, cash and cash equivalents comprise cash on hand, deposits held at call with banks and investments in money market instruments, and net of bank overdrafts.'
  },
  {
    id: 'pol_provisions',
    label: '1.10 Provisions',
    originalNum: '1.10',
    text: 'Provisions are recognised when the entity has a present legal or constructive obligation as a result of past events, it is probable that an outflow of resources embodying economic benefits will be required to settle the obligation and a reliable estimate of the amount of the obligation can be made.'
  },
  {
    id: 'pol_ltloans',
    label: '1.11 Long Term Loans',
    originalNum: '1.11',
    text: 'Long term loans are carried at nominal value less the short term portion of the loan. Loans from related parties are carried at nominal value and no short term portion is recognised as there is no fixed repayment schedule determined on these loans.'
  },
  {
    id: 'pol_deftax',
    label: '1.12 Deferred Taxation',
    originalNum: '1.12',
    text: 'Deferred taxation is provided, using the liability method, for all temporary differences arising between the tax basis of assets and liabilities and their carrying values for financial reporting purposes. Currently enacted tax rates are used to determine deferred taxation. No deferred taxation asset is recognised.'
  },
  {
    id: 'pol_payables',
    label: '1.13 Trade and Other Payables',
    originalNum: '1.13',
    text: 'Trade and other payables are carried at nominal value.'
  },
  {
    id: 'pol_dividends_received',
    label: '1.14 Dividends Received',
    originalNum: '1.14',
    text: 'Dividends are recognised when the right to receive payment is established.'
  },
  {
    id: 'pol_interest',
    label: '1.15 Interest Received',
    originalNum: '1.15',
    text: 'Interest is accrued on a time-proportion basis, recognising the effective yield on the underlying assets.'
  },
  {
    id: 'pol_product_sales',
    label: '1.16 Product Sales',
    originalNum: '1.16',
    text: 'Sales are recognized upon delivery of products and customer acceptance and stated as net income after value added tax and discount.'
  },
  {
    id: 'pol_revenue',
    label: '1.17 Revenue Recognition',
    originalNum: '1.17',
    text: 'Revenue is recognized upon delivery and represents amounts received or receivable for operations in the normal course of business and is stated as net income after value added tax and discount.'
  },
  {
    id: 'pol_revenue_bc',
    label: '1.17 Revenue Recognition (Body Corporate)',
    originalNum: '1.17',
    text: 'The ordinary levies are accounted for on a straight-line basis over the financial year and decided amongst the section owners on a participation quota basis. The annual ordinary levies are agreed and approved by the members, directors, trustees of the body corporate\'s, close corporation\'s, company\'s annual general meeting.'
  },
  {
    id: 'pol_expenses_bc',
    label: '1.18 Expenses (Body Corporate)',
    originalNum: '1.18',
    text: 'Expenses are acknowledged on the accrual basis as they occur.'
  },
  {
    id: 'pol_leases',
    label: '1.18 Leased Assets',
    originalNum: '1.18',
    text: 'Leases are classified as finance leases where substantially all risks and rewards associated with ownership of an asset are transferred from the lessor to the entity as lessee. Assets classified as finance leases are capitalised at their cash cost equivalent, with the related lease obligation recognised at the same value. Capitalised leased assets are depreciated over their estimated useful lives, limited to the duration of the lease agreement. Finance lease payments are allocated, using the effective interest rate method, between finance costs and the capital repayment which reduces the liability to the lessor.<br><br>Operating leases are all leases not classified as finance leases. Operating lease rentals are charged against operating profits as they become due.'
  },
  {
    id: 'pol_comparative',
    label: '10. Comparative Figures',
    originalNum: '10',
    text: 'No comparative figures are available as the company only started trading in the current year.'
  }
];

// ── IMPORTER CELL CONFIGS ──
// Three SecInfo export layouts mapped by entity type.
// Layout A = Trust, Layout B = Company/Club/NPO/etc, Layout C = CC

const IMPORTER_LAYOUT_B = {
  entityNameCell: 'I8', regNoCell: 'AB12', yearEndCell: 'AB25',
  partnerCell: 'AB9', natureCell: 'E26',
  postalCell: 'E20', regAddrCell: 'I20', businessCell: 'X20',
  headerCol: 'F', nameCol: 'F', idCol: 'S',
  headerSearchStart: 40, headerSearchEnd: 70,
};

const IMPORTER_LAYOUT_C = {
  entityNameCell: 'G8', regNoCell: 'R12', yearEndCell: 'R25',
  partnerCell: 'R9', natureCell: 'D26',
  postalCell: 'D20', regAddrCell: 'G20', businessCell: 'O20',
  headerCol: 'B', nameCol: 'B', idCol: 'K',
  headerSearchStart: 35, headerSearchEnd: 55,
};

const IMPORTER_CONFIGS = {
  trust: {
    layout: {
      entityNameCell: 'H8', regNoCell: 'AA13', yearEndCell: 'AA26',
      partnerCell: 'AA10', natureCell: null,
      postalCell: 'C21', regAddrCell: 'H21', businessCell: 'W21',
      headerCol: 'D', nameCol: 'D', idCol: 'L',
      headerSearchStart: 40, headerSearchEnd: 70,
    },
    ecId: 'ec-trust',
    headerPattern: /^TRUSTEES$/i,
    stopPattern: /^BENEFICIARIES$/i,
    labels: { name: 'trust name', reg: 'trust number', people: 'trustee(s)' },
  },
  company: {
    layout: IMPORTER_LAYOUT_B,
    ecId: 'ec-company',
    headerPattern: /^DIRECTORS$/i,
    stopPattern: /^SHAREHOLDERS$/i,
    importNature: true,
    importShareholders: true,
    labels: { name: 'company name', reg: 'reg number', people: 'director(s)' },
  },
  cc: {
    layout: IMPORTER_LAYOUT_C,
    ecId: 'ec-cc',
    headerPattern: /^MEMBERS$/i,
    importNature: true,
    labels: { name: 'CC name', reg: 'CK number', people: 'member(s)' },
  },
  npo: {
    layout: IMPORTER_LAYOUT_B,
    ecId: 'ec-npo',
    headerPattern: /^DIRECTORS$/i,
    importNature: true,
    labels: { name: 'organisation name', reg: 'NPO number', people: 'director(s)' },
  },
  attorneys: {
    layout: IMPORTER_LAYOUT_B,
    ecId: 'ec-attorneys',
    headerPattern: /^(DIRECTORS|PARTNERS)$/i,
    labels: { name: 'firm name', reg: 'reg number', people: 'director(s)/partner(s)' },
  },
  school: {
    layout: IMPORTER_LAYOUT_B,
    ecId: 'ec-school',
    headerPattern: /^(SGB|GOVERNING\s*BODY|DIRECTORS)$/i,
    labels: { name: 'school name', reg: 'EMIS number', people: 'SGB member(s)' },
  },
  church: {
    layout: IMPORTER_LAYOUT_B,
    ecId: 'ec-church',
    headerPattern: /^(COUNCIL\s*MEMBERS?|DIRECTORS|TRUSTEES|KERKRAAD)$/i,
    regOptional: true,
    labels: { name: 'church name', reg: 'reg number', people: 'council member(s)' },
  },
  club: {
    layout: IMPORTER_LAYOUT_B,
    ecId: 'ec-club',
    headerPattern: /^(COMMITTEE\s*MEMBERS?|DIRECTORS|TRUSTEES)$/i,
    regOptional: true,
    labels: { name: 'club name', reg: 'reg number', people: 'committee member(s)' },
  },
  bc: {
    layout: IMPORTER_LAYOUT_B,
    ecId: 'ec-bc',
    headerPattern: /^TRUSTEES$/i,
    labels: { name: 'body corporate name', reg: 'scheme number', people: 'trustee(s)' },
  },
};

// ── ENTITY CONFIG ──
const ENTITY_CONFIG = {
  attorneys: {
    nameLabel: 'Firm Name (as it appears on documents)',
    regLabel: 'Registration Number',
    namePlaceholder: 'e.g. Cronje, de Waal - Skhosana Incorporated',
    regPlaceholder: 'e.g. 2005/012345/21',
    bodyTitle: 'Directors / Partners',
    pluralTerm: 'Directors',
    singularTerm: 'Director',
    reportTo: 'Directors',
    addBtnLabel: '+ Add Director / Partner',
    allowedReports: ['audit']
  },
  company: {
    nameLabel: 'Company Name (as it appears on documents)',
    regLabel: 'Registration Number',
    namePlaceholder: 'e.g. Aruba 33 (Proprietary) Limited',
    regPlaceholder: 'e.g. 2002/002880/07',
    bodyTitle: 'Directors',
    pluralTerm: 'Directors',
    singularTerm: 'Director',
    reportTo: 'Shareholders',
    addBtnLabel: '+ Add Director',
    allowedReports: ['compilation', 'review', 'audit']
  },
  cc: {
    nameLabel: 'CC Name (as it appears on documents)',
    regLabel: 'CK Number',
    namePlaceholder: 'e.g. Aruba Trading 99 CC',
    regPlaceholder: 'e.g. CK1999/012345/23',
    bodyTitle: 'Members',
    pluralTerm: 'Members',
    singularTerm: 'Member',
    reportTo: 'Members',
    addBtnLabel: '+ Add Member',
    allowedReports: ['compilation', 'review', 'audit']
  },
  npo: {
    nameLabel: 'Organisation Name (as it appears on documents)',
    regLabel: 'NPO Number',
    namePlaceholder: 'e.g. Helping Hands NPO',
    regPlaceholder: 'e.g. 123-456 NPO',
    bodyTitle: 'Directors',
    pluralTerm: 'Directors',
    singularTerm: 'Director',
    reportTo: 'Members',
    addBtnLabel: '+ Add Director',
    allowedReports: ['review', 'audit']
  },
  trust: {
    nameLabel: 'Trust Name (as it appears on documents)',
    regLabel: 'Trust Number',
    namePlaceholder: 'e.g. The Smith Family Trust',
    regPlaceholder: 'e.g. IT1234/2010',
    bodyTitle: 'Trustees',
    pluralTerm: 'Trustees',
    singularTerm: 'Trustee',
    reportTo: 'Beneficiaries',
    addBtnLabel: '+ Add Trustee',
    allowedReports: ['compilation']
  },
  church: {
    nameLabel: 'Church Name (as it appears on documents)',
    regLabel: 'Registration Number',
    namePlaceholder: 'e.g. Grace Community Church',
    regPlaceholder: 'e.g. 2005/008765/08',
    bodyTitle: 'Church Council Members',
    pluralTerm: 'Church Council Members',
    singularTerm: 'Member',
    reportTo: 'Members',
    addBtnLabel: '+ Add Council Member',
    allowedReports: ['audit']
  },
  school: {
    nameLabel: 'School Name (as it appears on documents)',
    regLabel: 'EMIS Number',
    namePlaceholder: 'e.g. Standerton Primary School',
    regPlaceholder: 'e.g. 700112345',
    bodyTitle: 'School Governing Body Members',
    pluralTerm: 'School Governing Body Members',
    singularTerm: 'Member',
    reportTo: 'Parents and Community',
    addBtnLabel: '+ Add SGB Member',
    allowedReports: ['audit']
  },
  club: {
    nameLabel: 'Club Name (as it appears on documents)',
    regLabel: 'Registration Number',
    namePlaceholder: 'e.g. Standerton Sports Club',
    regPlaceholder: 'e.g. 1985/003456/08',
    bodyTitle: 'Committee Members',
    pluralTerm: 'Committee Members',
    singularTerm: 'Member',
    reportTo: 'Members',
    addBtnLabel: '+ Add Committee Member',
    allowedReports: ['audit']
  },
  bc: {
    nameLabel: 'Body Corporate Name (as it appears on documents)',
    regLabel: 'Scheme Number',
    namePlaceholder: 'e.g. Sectional Title Scheme No. 123',
    regPlaceholder: 'e.g. SS123/2005',
    bodyTitle: 'Trustees',
    pluralTerm: 'Trustees',
    singularTerm: 'Trustee',
    reportTo: 'Owners',
    addBtnLabel: '+ Add Trustee',
    allowedReports: ['audit']
  }
};
