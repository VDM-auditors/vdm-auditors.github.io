// DocumentGenerator.js — Document generation and all page-building helpers
// Depends on: config.js (CA_LETTERHEAD, AUDIT_LETTERHEAD, ENTITY_CONFIG),
//             utils.js (getVal, getRadio, formatNumber, toTitleCase),
//             EntityManager instance (for getDirectors, etc.)

class DocumentGenerator {
  constructor(entityManager) {
    this.em = entityManager;
  }

  generate() {
    // Alias entityManager methods to local scope (as the original code expected)
    const em = this.em;
    const getDirectors = () => em.getDirectors();
    const formatDirectorList = (dirs) => em.formatDirectorList(dirs);
    const getPronoun = (dirs, terms) => em.getPronoun(dirs, terms);
    const getEntityTerms = () => em.getEntityTerms();
    const getTermsForCount = (base, count) => em.getTermsForCount(base, count);
    const getReportSubState = () => em.getReportSubState();
    const getLoanCerts = () => em.getLoanCerts();
    const getShareholders = () => em.getShareholders();
    const currentEntityType = em.currentEntityType;

  const co = getVal('companyName') || '[COMPANY NAME]';
  const yearEnd = getVal('yearEnd') || '[YEAR END]';
  const prevYearEnd = getVal('prevYearEnd') || '[PREVIOUS YEAR END]';
  const nature = getVal('natureBusiness') || '[NATURE OF BUSINESS]';
  const income = getVal('mainIncome') || '[MAIN INCOME SOURCE]';
  const postal = toProperCase(getVal('postalAddress')) || '[POSTAL ADDRESS]';
  const regAddr = toProperCase(getVal('regAddress')) || '[REGISTERED ADDRESS]';
  const businessAddr = toProperCase(getVal('businessAddress')) || '';
  const bankName = getVal('bankName') || '[BANK]';
  const dateApproved = getVal('dateApproved') || '[DATE APPROVED]';
  const dateSigned = getVal('dateSigned') || '[DATE SIGNED]';
  const dateOfIssue = getVal('dateOfIssue') || '[DATE OF ISSUE]';
  const pageStart = getVal('pageStart') || '5';
  const pageEnd = getVal('pageEnd') || '12';
  const parentName = getVal('parentName') || '[PARENT COMPANY]';

  // Number formatting
  const profitLoss = formatNumber(getVal('profitLoss')) || '[PROFIT/LOSS]';
  const prevProfitLoss = formatNumber(getVal('prevProfitLoss')) || '[PREV PROFIT/LOSS]';
  const plType = getRadio('plType') || 'profit';
  const prevPlType = getRadio('prevPlType') || 'profit';
  const dividendAmount = formatNumber(getVal('dividendAmount')) || '[AMOUNT]';

  // Compiler/signer — normalise from select value (already uppercase)
  const compilerSigner = document.getElementById('compilerSigner').value || 'L VAN DER MERWE';

  const baseTerms = getEntityTerms();
  const dirs = getDirectors();
  const dirCount = dirs.length;

  // Choose singular or plural terms based on actual director count
  const terms = getTermsForCount(baseTerms, dirCount);
  const dirList = formatDirectorList(dirs);
  const pronoun = getPronoun(dirs, baseTerms);

  const coUpper = co.toUpperCase();
  const shareCapital = getRadio('shareCapital');
  const dividends = getRadio('dividends');
  const fixedAssets = getRadio('fixedAssets');
  const outlook = getRadio('outlook');
  const parentCo = getRadio('parentCo');

  // Plural / singular helpers
  const pluralTerm = terms.plural;   // e.g. "Director" (1) or "Directors" (2+)
  // Possessive helper: "Director's" (singular) vs "Directors'" (plural)
  const possessiveTerm = dirCount === 1 ? pluralTerm + "'s" : pluralTerm + "'";
  const possessiveTermLower = possessiveTerm.toLowerCase();
  const bodyTerm = terms.body;     // e.g. "The director" (1) or "The directors" (2+)

  // For sentences that differ purely on count:
  const dirSingularPlural = dirCount === 1
    ? { isAre: 'is', hasHave: 'has', theirIts: 'their', directorS: pluralTerm }
    : { isAre: 'are', hasHave: 'have', theirIts: 'their', directorS: pluralTerm };

  const entityType = currentEntityType || 'company';
  const reportType = getRadio('reportType') || 'compilation';

  // Registration number — optional for attorneys and clubs
  const hasReg = entityType === 'attorneys' ? getRadio('attHasReg') === 'yes'
               : entityType === 'club' ? !!getVal('regNumber')
               : true;
  const reg = hasReg ? (getVal('regNumber') || '') : '';
  const regLine = reg ? `<div class="co-reg">(Registration Number ${reg})</div>` : '';
  const regLineItalic = reg ? `<p><em>(Registration Number ${reg})</em></p>` : '';

  // Derived firm name — Audit reports use VDM Audit Inc, all others use VDM Chartered Accountants
  const isAuditReport = (reportType === 'audit');
  const vdmFirmName = isAuditReport ? 'VDM Audit Inc.' : 'VDM Chartered Accountants';
  const vdmFirmFooter = isAuditReport ? 'VDM Audit Inc.' : 'VDM Chartered Accountants &nbsp;·&nbsp; Standerton';

  // Share capital sentence (not applicable for CC)
  let shareCapitalSentence = '';
  if (entityType !== 'cc') {
    if (shareCapital === 'nochange') shareCapitalSentence = `There were no changes in the authorised or issued share capital of the company during the year under review.`;
    else if (shareCapital === 'issued') shareCapitalSentence = `Shares and share capital were issued since the company was incorporated during the year under review.`;
    else shareCapitalSentence = `Shares were authorised and issued for no consideration to the company during the year under review.`;
  }

  // Dividend sentence (CC uses "capital distribution")
  let dividendSentence = '';
  if (entityType === 'cc') {
    if (dividends === 'none') dividendSentence = `No capital distribution was declared or paid during the year.`;
    else dividendSentence = `A capital distribution of R&nbsp;${dividendAmount} was declared/paid during the year.`;
  } else {
    if (dividends === 'none') dividendSentence = `No dividend was declared or paid during the year.`;
    else dividendSentence = `A dividend of R&nbsp;${dividendAmount} was declared/paid during the year.`;
  }

  // Fixed assets sentence
  let fixedAssetsSentence = '';
  if (fixedAssets === 'nochange') fixedAssetsSentence = `No major change in the nature of the company's fixed assets or in the policy relating to the use thereof, took place during the accounting period.`;
  else fixedAssetsSentence = `There was a change to the accounting policy on fixed assets such as described in note 1.1 and 1.2 of the financial statements.`;

  // Outlook sentence
  const outlookText = outlook === 'continue' ? 'continue to be profitable' : 'be profitable in future';

  // Parent sentence (not applicable for CC)
  let parentSentence = '';
  if (entityType !== 'cc') {
    if (parentCo === 'none') parentSentence = `The company has no parent company in or outside the Republic.`;
    else parentSentence = `The company's parent company is ${parentName}.`;
  }

  // Report section heading numbers (cover = 0, then 1–4, policies from 5)
  const pg1 = 1, pg2 = 2, pg3 = 3, pg4 = 4;

  // Signature blocks for directors
  function sigBlock(dirs) {
    if (!dirs.length) {
      return `<div style="min-height:60px;"></div><div class="sig-line"></div><br><div class="sig-name">&nbsp;</div>`;
    }
    let html = '<div style="display:flex;flex-wrap:wrap;gap:8px 48px;margin-top:16px;">';
    dirs.forEach(d => {
      html += `<div style="min-width:180px;margin-bottom:24px;">
    <div style="min-height:50px;"></div>
    <div style="border-bottom:1px solid #333;width:220px;margin-bottom:6px;">&nbsp;</div>
    <div class="sig-name">${d.full}</div>
  </div>`;
    });
    html += '</div>';
    return html;
  }

  // Letterhead helpers
  function caLetterhead() { return `<img class="letterhead-img" src="${CA_LETTERHEAD}"    alt="VDM Chartered Accountants">`; }
  function auditLetterhead() { return `<img class="letterhead-img" src="${AUDIT_LETTERHEAD}" alt="VDM Audit">`; }
  function letterheadFooter() { return `<div class="letterhead-footer">
    <img class="letterhead-footer-img" src="${LETTERHEAD_FOOTER_IMG}" alt="VDM Footer">
  </div>`; }
  function auditFooter() { return `<div class="letterhead-footer">
    <img class="letterhead-footer-img" src="${AUDIT_FOOTER_IMG}" alt="VDM Audit Footer">
  </div>`; }

  // Compiler block helper
  function compilerBlock(signer, date) {
    return `<div class="compiler-block">
  <p>${signer}</p>
  <p>CHARTERED ACCOUNTANT (SA)</p>
  <p>${date}</p>
</div>`;
  }

  // Auditor block helper (for school and registered auditor reports)
  function auditorBlock(signer, date) {
    return `<div class="compiler-block">
  <p>${signer}</p>
  <p>REGISTERED AUDITOR (SA)</p>
  <p>${date}</p>
</div>`;
  }

  // ── School-specific auditor + preparer ──
  const schoolAuditorSigner = getRadio('schoolAuditor') || 'R DE BEER';
  const schoolPreparerName = getVal('schoolPreparerName') || '[PREPARER NAME]';
  const schoolCapRaw = document.getElementById('schoolPreparerCapacity')?.value || 'financial officer';
  const schoolCapOther = getVal('schoolPreparerCapacityOther');
  const schoolCapacity = schoolCapRaw === 'other' ? (schoolCapOther || '[CAPACITY]') : schoolCapRaw;
  const schoolPreparerSentence = `The financial statements were prepared under the supervision of ${schoolPreparerName} in their capacity as ${schoolCapacity}.`;

  // ── Preparer sentence ──
  // For compilation: use the VDM CA's credentials
  // For review/audit (non-school): use the client-side preparer fields
  const reportTypeForPreparer = getRadio('reportType');
  let preparerSentence = '';
  if (entityType === 'school') {
    // School uses its own preparer fields (handled separately via schoolPreparerSentence)
    preparerSentence = '';
  } else if (reportTypeForPreparer === 'compilation') {
    const preparerMap = {
      'L VAN DER MERWE': 'The financial statements were prepared under the supervision of Leon van der Merwe BComm. Honns. CA (SA) in his capacity as an independent professional accountant.',
      'HL VAN DER MERWE': 'The financial statements were prepared under the supervision of Hendrik Leon van der Merwe BAcc PG DIP AAS CA (SA) in his capacity as an independent professional accountant.',
      'R DE BEER': 'The financial statements were prepared under the supervision of Reinette de Beer BCompt PGDIP AAS CA (SA) in her capacity as an independent professional accountant.',
      'R WOLMARANS': 'The financial statements were prepared under the supervision of Riekie Wolmarans BCompt FAC (Cum Laude) PGDA CA (SA) in her capacity as an independent professional accountant.',
    };
    preparerSentence = preparerMap[compilerSigner] || '';
  } else {
    // Review or Audit — use the client-side preparer fields
    const pName = getVal('preparerName');
    const pCapRaw = document.getElementById('preparerCapacity')?.value || 'financial officer';
    const pCapOther = getVal('preparerCapacityOther');
    const pCap = pCapRaw === 'other' ? (pCapOther || '[capacity]') : pCapRaw;
    if (pName) {
      preparerSentence = `The financial statements were prepared under the supervision of ${pName} in their capacity as ${pCap}.`;
    }
  }

  // Director rows for cover page (Initials Surname – ID if provided)
  // For clubs, hide the members row entirely if none were added
  const directorCoverRows = dirs.length
    ? dirs.map(d => d.idNo ? `${d.full} – ${d.idNo}` : d.full).join('<br>')
    : ((entityType === 'club' || entityType === 'church') ? '' : '[DIRECTOR NAMES]');

  // ── PAGE 0: COVER PAGE ──
  const coverPage = `
  <div class="cover-page">
<div class="cover-title-block">
  <div class="co-name">${coUpper}</div>
  ${regLine}
  <div class="cover-year">ANNUAL FINANCIAL STATEMENTS</div>
  <div class="cover-subtitle">For the year ended ${yearEnd}</div>
</div>

<div class="cover-info-section">
<h2 class="cover-section-heading">General Information</h2>

<table class="cover-info-table">
  <tr>
    <td>Country of Incorporation and Domicile</td>
    <td>South Africa</td>
  </tr>
  ${reg ? `<tr>
    <td>Registration Number</td>
    <td>${reg}</td>
  </tr>` : ''}
  <tr>
    <td>Nature of Business and Principal Activities</td>
    <td>${nature}</td>
  </tr>
  ${directorCoverRows ? `<tr>
    <td>${pluralTerm}</td>
    <td>${directorCoverRows}</td>
  </tr>` : ''}
  <tr>
    <td>Registered Office</td>
    <td>${regAddr}</td>
  </tr>
  ${businessAddr ? `<tr><td>Business Address</td><td>${businessAddr}</td></tr>` : ''}
  <tr>
    <td>Postal Address</td>
    <td>${postal}</td>
  </tr>
  <tr>
    <td>Bank</td>
    <td>${bankName}</td>
  </tr>
  <tr>
    <td>Reporting Currency</td>
    <td>South African Rand</td>
  </tr>
  <tr>
    <td>${entityType === 'school' || isAuditReport ? 'Auditor' : 'Compiler'}</td>
    <td>${entityType === 'school' ? 'VDM Audit Inc.' : vdmFirmName}</td>
  </tr>
  ${entityType === 'school'
      ? `<tr><td>Preparer</td><td>${schoolPreparerSentence}</td></tr>`
      : preparerSentence ? `<tr><td>Preparer</td><td>${preparerSentence}</td></tr>` : ''}
  <tr>
    <td>Issued</td>
    <td>${dateOfIssue}</td>
  </tr>
</table>
</div>
  </div>`;

  // ── PAGE 1: CA DECLARATION ──
  const page1 = `
  <div class="doc-page">
${caLetterhead()}
<h2>The Chartered Accountant's (South Africa) Declaration</h2>
<p>The following annual financial statements of ${co}, as presented on pages ${pageStart} to ${pageEnd}, have been independently compiled by a Chartered Accountant (South Africa) [CA(SA)]. Refer to compilation report on page ${pg3}.</p>
<p>Use of the CA(SA) designation is governed by the <em>Chartered Accountants Designation (Private) Act</em>, 1993 (Act 67 of 1993), which regulates and permits the use of the CA(SA) designation exclusively by members of The South African Institute of Chartered Accountants (SAICA). Use of the designation without SAICA membership is consequently a criminal offence, and misuse is subject to legal action.</p>
<p>SAICA is the premier accountancy body in South Africa and one of the leading chartered accountancy institutes in the world and all members must comply with the Code of Professional Conduct which conforms to the code released by the International Ethics Standards Board for Accountants (IESBA). The SAICA code and definitions contained therein are consistent in all material aspects with the International Federation of Accountants' (IFAC) code as well as the Independent Regulatory Board for Auditors (IRBA) code.</p>
<p>The following fundamental principles are embodied in the SAICA Code of Professional Conduct and are to be upheld by all CA's(SA) at all times.</p>
<ul>
  <li><strong>Integrity</strong> — a duty to be straightforward and honest in all professional and business relationships.</li>
  <li><strong>Objectivity</strong> — a duty to not allow bias, conflict of interest or undue influence of others to override professional or business judgments.</li>
  <li><strong>Professional competence and due care</strong> — a duty to maintain professional knowledge and skill at the level required to ensure that a client receives competent professional services based on current developments in practice, legislation and techniques and act diligently and in accordance with applicable technical and professional standards.</li>
  <li><strong>Confidentiality</strong> — a duty to respect the confidentiality of information acquired as a result of professional and business relationships and, therefore, not disclose any such information to third parties without proper and specific authority, unless there is a legal or professional right or duty to disclose, nor use the information for the personal advantage of the chartered accountant or third parties.</li>
  <li><strong>Professional behaviour</strong> — a duty to comply with relevant laws and regulations and avoid any action that discredits the accountancy profession.</li>
</ul>
<p>A distinguishing characteristic of CA's(SA) are their responsibilities and duties which extend beyond the needs of individual clients and also includes the public as a whole.</p>
<p>Accordingly, this declaration serves to confirm that the above mentioned financial statements have been prepared by a CA(SA) who has observed and complied with the SAICA Code.</p>
${compilerBlock(compilerSigner, dateSigned)}
${letterheadFooter()}
<div class="page-number">${pg1}</div>
  </div>`;

  // ── PAGE 2: DIRECTORS' RESPONSIBILITIES ──
  const page2 = `
  <div class="doc-page">
<div class="page-header">
  ${regLine}
</div>
<h2>${possessiveTerm} Responsibilities and Approval</h2>
<p>${bodyTerm} ${dirSingularPlural.isAre} required in terms of the ${terms.act}, to maintain adequate accounting records and ${dirSingularPlural.isAre} responsible for the content and integrity of the financial statements and related financial information included in this report. It is ${pronoun} responsibility to ensure that the financial statements fairly present the state of affairs of the entity as at the end of the financial year and the results of its operations and cash flows for the period then ended, in conformity with International Financial Reporting Standards for Small and Medium-sized Entities and the requirements of the Companies Act of South Africa.</p>
<p>The financial statements are prepared in accordance with International Financial Reporting Standards for Small and Medium-sized Entities and the requirements of the Companies Act of South Africa and are based upon appropriate accounting policies consistently applied and supported by reasonable and prudent judgments and estimates.</p>
<p>${bodyTerm} acknowledge that ${dirSingularPlural.theirIts} are ultimately responsible for the system of internal financial control established by the entity and place considerable emphasis on maintaining a strong control environment. To enable the ${pluralTerm.toLowerCase()} to meet these responsibilities, the board sets standards for internal control aimed at reducing the risk of error or loss in a cost-effective manner. The standards include the proper delegation of responsibilities within a clearly defined framework, effective accounting procedures and adequate segregation of duties to ensure an acceptable level of risk. These controls are monitored throughout the entity and all employees are required to maintain the highest ethical standards in ensuring the entity's business is conducted in a manner that in all reasonable circumstances is above reproach. The focus of risk management in the entity is on identifying, assessing, managing and monitoring all known forms of risk. While operating risk cannot be fully eliminated, the entity endeavours to minimise it by ensuring that appropriate infrastructure, controls, systems and ethical behaviour are applied and managed within predetermined procedures and constraints.</p>
<p>${bodyTerm} ${dirSingularPlural.isAre} of the opinion, based on the information and explanations given by management that the system of internal control provides reasonable assurance that the financial records may be relied on for the preparation of the financial statements. However, any system of internal financial control can provide only reasonable, and not absolute, assurance against material misstatement or loss.</p>
<p>${bodyTerm} ${dirSingularPlural.hasHave} reviewed the cash flow forecast for the year and, in the light of this review and the current financial position, ${dirCount === 1 ? 'is' : 'they are'} satisfied that the entity has access to adequate resources to continue in operational existence for the foreseeable future.</p>
<p>The financial statements set out on pages ${pageStart} to ${pageEnd}, which have been prepared on the going concern basis, were approved by the board on ${dateApproved} and are signed on its behalf:</p>
<div class="signature-block">
  ${sigBlock(dirs)}
</div>
<div class="page-number">${pg2}</div>
  </div>`;

  // ── PAGE 3: COMPILATION REPORT ──
  const reportSubState = getReportSubState();

  // Build the Alert to Reader section for insolvent compilation
  let compilationAlertSection = '';
  if (reportSubState.reportType === 'compilation' && reportSubState.subType === 'insolvent') {
    const accLoss = formatNumber(getVal('insolventAccLoss')) || '[ACCUMULATED LOSS]';
    const excessLiab = formatNumber(getVal('insolventExcessLiab')) || '[EXCESS LIABILITIES]';
    const additionalNote = reportSubState.insolventText || '';
    compilationAlertSection = `
<h3>Alert to Reader</h3>
<p>We draw attention to the accounting policy in the financial statement that describes the financial reporting framework used in the preparation and presentation of these financial statements. The financial statements was compiled on an accounting basis with a policy applicable on the matter of going concern. It is based on the fact that funds will be available to finance future operations and that the realisation of assets and the settling of debts, unsecure responsibilities and secure responsibilities will take place in the normal circumstances of business.</p>
<p>Please note that on ${yearEnd}, the company had an accumulated loss of R&nbsp;${accLoss} and that its total liabilities exceeded its assets with R&nbsp;${excessLiab}. Due to the accounting policy recorded in the financial statements, the entity will therefore be classified as factually insolvent.</p>
${additionalNote ? `<p>${additionalNote}</p>` : ''}`;
  }

  // Build the Other Matter section for compilation
  let compilationOtherSection = '';
  if (reportSubState.reportType === 'compilation' && reportSubState.subType === 'other') {
    const otherNote = reportSubState.otherText || '[Describe the other matter to include]';
    compilationOtherSection = `
<h3>Other Matter</h3>
<p>${otherNote}</p>`;
  }

  const page3 = `
  <div class="doc-page">
${caLetterhead()}
<h2>Independent Compiler's Report</h2>
<p><em>To the ${terms.report_to} of ${co}</em></p>
${regLineItalic}
<h3>Report on the Financial Statements</h3>
<p>We have compiled the annual financial statements of ${co} based on information the entity provided. These financial statements are presented in accordance with the financial framework described in the accounting policy in these financial statements. The financial statements comprise of the statement of financial position as at ${yearEnd} and the statement of profit or loss and other comprehensive income, statement of changes in equity and statement of cash flows for the year then ended, and a summary of significant accounting policies and other explanatory information, and the ${possessiveTermLower} report, as set out on pages ${pageStart} to ${pageEnd}.</p>
<h3>${possessiveTerm} Responsibility for the Financial Statements</h3>
<p>The company's ${pluralTerm.toLowerCase()} ${dirSingularPlural.isAre} responsible for the preparation and fair presentation of these financial statements in accordance with International Financial Reporting Standards for Small and Medium-sized Entities and the requirements of the Companies Act of South Africa, and for such internal control as the ${pluralTerm.toLowerCase()} determine necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error.</p>
<h3>Independent Compiler's Responsibility</h3>
<p>We performed this compilation engagement in accordance with <em>International Standard on Related Services 4410 (Revised), Compilation Engagements.</em> This Standard requires that we comply with quality control standards and relevant ethical requirements, including ethical principles of integrity, objectivity, professional competence and due care.</p>
<p>A compilation engagement involves applying expertise in accounting and financial reporting to assist management in preparing and presenting financial information. A compilation engagement does not involve gathering evidence for the purpose of expressing an opinion or a review conclusion. Accordingly, we do not express an audit opinion or a review conclusion on these financial statements.</p>
${compilationAlertSection}
${compilationOtherSection}
${compilerBlock(compilerSigner, dateSigned)}
${letterheadFooter()}
<div class="page-number">${pg3}</div>
  </div>`;

  // ── PAGE 4: DIRECTORS' / MEMBERS' REPORT ──
  const entityLabel = entityType === 'cc' ? 'close corporation' : 'company';
  const page4 = `
  <div class="doc-page">
<div class="page-header">
  ${regLine}
</div>
<h2>${possessiveTerm} Report</h2>
<p>${bodyTerm} ${dirCount === 1 ? 'has' : 'have'} pleasure in presenting ${pronoun} report for the year ended ${yearEnd}.</p>
<p class="underline-heading">Business Activities and General Review of Operations</p>
<p>The main business of the ${entityLabel} is ${nature} and income of the ${entityLabel} is generated mainly from ${income}.</p>
<p>No material fact or circumstance has occurred since the financial position and the date of this report.</p>
<p class="underline-heading">Specific Matters</p>
<p>No major change in the nature of the ${entityLabel}'s business took place during the accounting period.</p>
${shareCapitalSentence ? `<p>${shareCapitalSentence}</p>` : ''}
<p>${dividendSentence}</p>
<p>${fixedAssetsSentence}</p>
<p>The ${entityLabel} realised a ${plType} after tax of R&nbsp;${profitLoss} for the year ended ${yearEnd} (${prevYearEnd} — ${prevPlType} of R&nbsp;${prevProfitLoss}). ${bodyTerm} expect that the ${entityLabel} will ${outlookText}. Accordingly the annual financial statements of the ${entityLabel} are prepared on the basis of accounting policies applicable to a going concern.</p>
<p>The ${pluralTerm.toLowerCase()} of the ${entityLabel} ${dirSingularPlural.isAre}: ${dirList}</p>
<p>The postal address is: ${postal}</p>
<p>The registered address is: ${regAddr}</p>
${parentSentence ? `<p>${parentSentence}</p>` : ''}
<p>The financial statements were approved and signed by the ${pluralTerm.toLowerCase()}.</p>
<p class="underline-heading">${pluralTerm}:</p>
<div class="signature-block">
  ${sigBlock(dirs)}
</div>
<p>${dateApproved}</p>
<div class="page-number">${pg4}</div>
  </div>`;

  // ── PAGE 5+: ACCOUNTING POLICIES ──
  // Collect selected policies
  const selectedPolicies = accountingPolicies.filter(p => {
    const cb = document.getElementById(p.id);
    return cb && cb.checked;
  });

  // Assign sequential display numbers to selected policies
  // Top-level numbers reset per section; sub-numbers increment within 1.x
  // Logic: walk selected list, assign 1, 1.1, 1.2 ... based on position
  let mainCounter = 0;
  let subCounter = 0;
  let lastWasMain = false;
  const numberedPolicies = selectedPolicies.map(p => {
    const origNum = p.originalNum || '';
    let displayNum = '';
    // "10" and other non-1.x are treated as standalone
    if (origNum === '1') {
      mainCounter = 1; subCounter = 0; lastWasMain = true;
      displayNum = '1';
    } else if (origNum.startsWith('1.') || origNum.match(/^1\.\d/)) {
      subCounter++;
      displayNum = `1.${subCounter}`;
    } else {
      // standalone like "10"
      displayNum = origNum;
    }
    return { ...p, displayNum };
  });

  // Page header helper for notes pages
  function notesPageHeader(isContinued) {
    return `
<div class="page-header">
  ${regLine}
</div>
<h2>NOTES FOR THE YEAR ENDED ${yearEnd.toUpperCase()}${isContinued ? ' — CONTINUED' : ''}</h2>`;
  }

  // Build text for a policy entry
  function buildPolicyText(p) {
    if (p.id === 'pol_ppe' && p.subItems) {
      const checkedSubs = p.subItems.filter(s => {
        const cb = document.getElementById(s.id);
        return cb && cb.checked && !s.isLandAndBuildings;
      });
      let rateLines = '';
      if (checkedSubs.length > 0) {
        rateLines = '<br>' + checkedSubs.map(s => {
          const sel = document.getElementById('sel-' + s.id);
          const custom = document.getElementById('custom-' + s.id);
          let rate = sel ? sel.value : '';
          if (rate === 'Other') rate = (custom && custom.value.trim()) ? custom.value.trim() : 'Other';
          return `${s.label} — ${rate}`;
        }).join('<br>') + '<br><br>';
      } else {
        rateLines = '<br>';
      }
      // Only show Land and Buildings text if that checkbox is ticked
      const landCb = document.getElementById('pol_ppe_land');
      const landText = (landCb && landCb.checked) ? (p.textSuffix || '') : '';
      return (p.text || '') + rateLines + landText;
    }
    if (p.id === 'pol_biological' && p.subItems) {
      const checkedBio = p.subItems.filter(s => {
        const cb = document.getElementById(s.id);
        return cb && cb.checked;
      });
      if (!checkedBio.length) return p.text || '';
      return (p.text || '') + '<br><br>' + checkedBio.map(s =>
        `<strong>${s.label}</strong><br>${s.bodyText}`
      ).join('<br><br>');
    }
    return p.text || '';
  }

  // Build policy pages — paginate by estimated content weight
  let policyPages = '';
  let currentPageItems = [];
  let pgNum = 5;
  let firstPolicyPage = true;

  function flushPolicyPage(items, pageNum) {
    if (!items.length) return '';
    let content = items.map(p => `
  <div class="policy-entry">
    <p class="underline-heading">${p.displayNum}. ${p.label.replace(/^[\d.]+\s*/, '')}</p>
    <p>${buildPolicyText(p)}</p>
  </div>`).join('');
    const header = notesPageHeader(!firstPolicyPage);
    firstPolicyPage = false;
    return `
  <div class="doc-page">
${header}
${content}
<div class="page-number">${pageNum}</div>
  </div>`;
  }

  if (numberedPolicies.length > 0) {
    let weight = 0;
    for (const p of numberedPolicies) {
      const pWeight = (buildPolicyText(p).match(/<br>/g) || []).length > 3 ? 3 : (buildPolicyText(p).match(/<br>/g) || []).length > 0 ? 2 : 1;
      if (weight + pWeight > 8 && currentPageItems.length > 0) {
        policyPages += flushPolicyPage(currentPageItems, pgNum++);
        currentPageItems = [];
        weight = 0;
      }
      currentPageItems.push(p);
      weight += pWeight;
    }
    if (currentPageItems.length > 0) {
      policyPages += flushPolicyPage(currentPageItems, pgNum++);
    }
  }

  // ── PAGE 3a: INDEPENDENT REVIEWER'S REPORT ──
  const reviewSubState = getReportSubState();
  const isReviewQualified = reviewSubState.reportType === 'review' && reviewSubState.subType === 'qualified';

  // Build Basis for Qualified Conclusion section
  let reviewBasisSection = '';
  if (isReviewQualified) {
    if (reviewSubState.qualifiedBasis === 'insolvent') {
      const rAccLoss = formatNumber(reviewSubState.reviewAccLoss) || '[ACCUMULATED LOSS]';
      const rExcessLiab = formatNumber(reviewSubState.reviewExcessLiab) || '[EXCESS LIABILITIES]';
      reviewBasisSection = `
<h3>Basis for Qualified Conclusion</h3>
<p>Please note that on ${yearEnd}, the company had an accumulated loss of R&nbsp;${rAccLoss} and that its total liabilities exceeded its assets with R&nbsp;${rExcessLiab}. Due to the accounting policy recorded in the financial statements, the entity will therefore be classified as factually insolvent. The financial statements were compiled on an accounting basis with a policy applicable on the matter of going concern. It is based on the fact that funds will be available to finance future operations and that the realisation of assets and the settling of debts, unsecure responsibilities and secure responsibilities will take place in the normal circumstances of business.</p>`;
    } else {
      reviewBasisSection = `
<h3>Basis for Qualified Conclusion</h3>
<p>${reviewSubState.qualifiedText || '[Describe the basis for the qualified conclusion]'}</p>`;
    }
  }

  // Build Conclusion section — different wording for qualified vs unqualified
  let reviewConclusionSection = '';
  if (isReviewQualified) {
    reviewConclusionSection = `
<h3>Qualified Conclusion</h3>
<p>Based on our review, except for the effect of the matter described in the Basis of the Qualified Conclusion paragraph nothing has come to our attention that causes us to believe that these financial statements of ${co} are not prepared, in all material respects, in accordance with <em>'International Financial Reporting Standards for Small and Medium-sized Entities'</em> and the requirements of the Companies Act of South Africa.</p>`;
  } else {
    reviewConclusionSection = `
<h3>Conclusion</h3>
<p>Based on our review, nothing has come to our attention that causes us to believe that these financial statements do not present fairly, in all material respects, (or do not give a true and fair view of) the financial position of ${co} as at ${yearEnd}, and (of) its financial performance and cash flows for the year then ended, in accordance with the <em>'International Financial Reporting Standards for Small and Medium-sized Entities'</em> and the requirements of the Companies Act of South Africa.</p>`;
  }

  const pageReview = `
  <div class="doc-page">
${caLetterhead()}
<h2>Independent Reviewer's Report</h2>
<p><em>To the ${terms.report_to} of ${co}</em></p>
${regLineItalic}
<p>We have reviewed the financial statements of ${co} set out on pages ${pageStart} to ${pageEnd}, which comprise the statement of financial position as at ${yearEnd} and the statement of profit or loss and other comprehensive income and statement of cash flows for the year then ended, and notes to the financial statements, including a summary of significant accounting policies.</p>
<h3>${possessiveTerm} Responsibility for the Financial Statements</h3>
<p>The ${pluralTerm.toLowerCase()} ${dirSingularPlural.isAre} responsible for the preparation and fair representation of these financial statements in accordance with the <em>'International Financial Reporting Standards for Small and Medium-sized Entities'</em> and the requirements of the Companies Act of South Africa, for determining that the basis of preparation is acceptable in the circumstances and for such internal control as the ${pluralTerm.toLowerCase()} determine ${dirSingularPlural.isAre} necessary to enable the preparation of financial statements that are free from material misstatements, whether due to fraud or error.</p>
<h3>Independent Reviewer's Responsibility</h3>
<p>Our responsibility is to express a conclusion on these financial statements. We conducted our review in accordance with the <em>'International Standard on Review Engagements (ISRE) 2400 (Revised), Engagements to Review Historical Financial Statements (ISRE 2400 (Revised)). ISRE 2400 (Revised)'</em> requires us to conclude whether anything has come to our attention that causes us to believe that the financial statements, taken as a whole, are not prepared in all material respects in accordance with the applicable financial reporting framework. This Standard also requires us to comply with relevant ethical requirements.</p>
<p>A review of financial statements in accordance with <em>ISRE 2400 (Revised)</em> is a limited assurance engagement. The independent reviewer performs procedures, primarily consisting of making inquiries of management and others within the entity, as appropriate, and applying analytical procedures, and evaluates the evidence obtained.</p>
<p>The procedures performed in a review are substantially less than those performed in an audit conducted in accordance with International Standards on Auditing. Accordingly, we do not express an audit opinion on these financial statements.</p>
${reviewBasisSection}
${reviewConclusionSection}
<h3>Other Reports Required by the Companies Act</h3>
<p>The annual financial statements include the ${possessiveTerm} Report as required by the Companies Act of South Africa. The ${pluralTerm.toLowerCase()} ${dirSingularPlural.isAre} responsible for ${possessiveTerm} Report. Our conclusion on the financial statements does not cover the ${possessiveTerm} Report and we do not express any form of assurance conclusion thereon.</p>
<p>In connection with our independent review of the financial statements, we have read the ${possessiveTerm} Report and, in doing so, considered whether the ${possessiveTerm} Report is materially inconsistent with the financial statements or our knowledge obtained in the independent review, or otherwise appears to be materially misstated. If, based on the work we have performed, we conclude that there is a material misstatement of the ${possessiveTerm} Report, we will report that fact. We have nothing to report in this regard.</p>
${compilerBlock(compilerSigner, dateSigned)}
${letterheadFooter()}
<div class="page-number">${pg3}</div>
  </div>`;

  // ── PAGE 3b: INDEPENDENT AUDITOR'S REPORT ──
  const auditSubState = getReportSubState();
  let auditQualifiedSection = '';
  if (auditSubState.reportType === 'audit' && auditSubState.subType === 'qualified') {
    auditQualifiedSection = `
<h3>Basis for Qualified Opinion</h3>
<p>${auditSubState.qualifiedText || '[Describe the basis for the qualified opinion]'}</p>`;
  }
  let auditEmphasisSection = '';
  if (auditSubState.reportType === 'audit' && auditSubState.subType === 'emphasis') {
    auditEmphasisSection = `
<h3>Emphasis of Matter</h3>
<p>${auditSubState.emphasisText || '[Describe the emphasis of matter]'}</p>`;
  }
  let auditDisclaimerSection = '';
  if (auditSubState.reportType === 'audit' && auditSubState.subType === 'disclaimer') {
    auditDisclaimerSection = `
<h3>Basis for Disclaimer of Opinion</h3>
<p>${auditSubState.disclaimerText || '[Describe the basis for the disclaimer of opinion]'}</p>`;
  }
  let auditOtherSection = '';
  if (auditSubState.reportType === 'audit' && auditSubState.subType === 'other') {
    auditOtherSection = `
<h3>Other Matter</h3>
<p>${auditSubState.otherText || '[Describe the other matter]'}</p>`;
  }

  const pageAudit = `
  <div class="doc-page">
${auditLetterhead()}
<h2>Independent Auditor's Report</h2>
<p><em>To the ${terms.report_to} of ${co}</em></p>
${regLineItalic}
<h3>Opinion</h3>
<p>We have audited the financial statements of ${co} set out on pages ${pageStart} to ${pageEnd}, which comprise the statement of financial position as at ${yearEnd}, and the statement of profit or loss and other comprehensive income, statement of changes in equity and statement of cash flows for the year then ended, and notes to the financial statements, including a summary of significant accounting policies.</p>
<p>In our opinion, the financial statements present fairly, in all material respects, the financial position of ${co} as at ${yearEnd}, and its financial performance and cash flows for the year then ended in accordance with the <em>'International Financial Reporting Standard for Small and Medium-sized Entities'</em> and the requirements of the Companies Act of South Africa.</p>
${auditQualifiedSection}
${auditEmphasisSection}
${auditDisclaimerSection}
${auditOtherSection}
<h3>Basis for Opinion</h3>
<p>We conducted our audit in accordance with <em>'International Standards on Auditing (ISAs)'</em>. Our responsibilities under those standards are further described in the <em>'Auditor's Responsibilities for the Audit of the Financial Statements'</em> section of our report. We are independent of the company in accordance with the <em>'Independent Regulatory Board for Auditors Code of Professional Conduct for Registered Auditors (IRBA Code)'</em> and other independence requirements applicable to performing audits of financial statements in South Africa. We have fulfilled our other ethical responsibilities in accordance with the <em>'IRBA Code'</em> and in accordance with other ethical requirements applicable to performing audits in South Africa. The <em>'IRBA Code'</em> is consistent with the <em>'International Ethics Standards Board for Accountants Code of Ethics for Professional Accountants (Parts A and B)'</em>. We believe that the audit evidence we have obtained is sufficient and appropriate to provide a basis for our opinion.</p>
<h3>Other Information</h3>
<p>The ${pluralTerm.toLowerCase()} ${dirSingularPlural.isAre} responsible for the other information. The other information comprises the ${possessiveTerm} Report as required by the Companies Act of South Africa. The other information does not include the financial statements and our auditor's report thereon.</p>
<p>Our opinion on the financial statements does not cover the other information and we do not express an audit opinion or any form of assurance conclusion thereon.</p>
<p>In connection with our audit of the financial statements, our responsibility is to read the other information and, in doing so, consider whether the other information is materially inconsistent with the financial statements or our knowledge obtained in the audit, or otherwise appears to be materially misstated. If, based on the work we have performed, we conclude that there is a material misstatement of this other information; we are required to report that fact. We have nothing to report in this regard.</p>
<h3>Responsibilities of the ${pluralTerm} for the Financial Statements</h3>
<p>The ${pluralTerm.toLowerCase()} ${dirSingularPlural.isAre} responsible for the preparation and fair presentation of the financial statements in accordance with the <em>'International Financial Reporting Standard for Small and Medium-sized Entities'</em> and the requirements of the Companies Act of South Africa, and for such internal control as the ${pluralTerm.toLowerCase()} determine is necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error.</p>
<p>In preparing the financial statements, the ${pluralTerm.toLowerCase()} ${dirSingularPlural.isAre} responsible for assessing the company's ability to continue as a going concern, disclosing, as applicable, matters related to going concern and using the going concern basis of accounting unless the ${pluralTerm.toLowerCase()} either intend to liquidate the company or to cease operations, or have no realistic alternative but to do so.</p>
<h3>Auditor's Responsibilities for the Audit of the Financial Statements</h3>
<p>Our objectives are to obtain reasonable assurance about whether the financial statements as a whole are free from material misstatement, whether due to fraud or error, and to issue an auditor's report that includes our opinion. Reasonable assurance is a high level of assurance, but is not a guarantee that an audit conducted in accordance with <em>'International Standards on Auditing (ISAs)'</em> will always detect a material misstatement when it exists. Misstatements can arise from fraud or error and are considered material if, individually or in the aggregate, they could reasonably be expected to influence the economic decisions of users taken on the basis of these financial statements.</p>
${compilerBlock(compilerSigner, dateSigned)}
${auditFooter()}
<div class="page-number">${pg3}</div>
  </div>`;


  // ── PAGE: TRUSTEES' RESPONSIBILITIES AND APPROVAL (Body Corporate) ──
  const schoolSubState = (entityType === 'school') ? getReportSubState() : {};
  const schoolSub = schoolSubState.subType || 'unqualified';

  const schoolGBResponsibilities = `
<h3>Responsibilities of the Governing Body for the Financial Statements</h3>
<p>The school's governing body is responsible for the preparation and fair presentation of the financial statements in accordance with the <em>'Financial Reporting Guidelines for Schools'</em> and the requirements of the South African Schools Act, and for such internal control as the governing body determines is necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error.</p>`;

  const schoolAuditorResponsibilities = `
<h3>Auditor's Responsibilities for the Audit of the Financial Statements</h3>
<p>Our objectives are to obtain reasonable assurance about whether the financial statements as a whole are free from material misstatement, whether due to fraud or error, and to issue an auditor's report that includes our opinion. Reasonable assurance is a high level of assurance, but is not a guarantee that an audit conducted in accordance with <em>'International Standards on Auditing (ISAs)'</em> will always detect a material misstatement when it exists. Misstatements can arise from fraud or error and are considered material if, individually or in the aggregate, they could reasonably be expected to influence the economic decisions of users taken on the basis of these financial statements.</p>
<p>As part of an audit in accordance with <em>'International Standards on Auditing (ISAs)'</em>, we exercise professional judgement and maintain professional scepticism throughout the audit. We also:</p>
<ul>
  <li>Identify and assess the risks of material misstatement of the financial statements, whether due to fraud or error, design and perform audit procedures responsive to those risks, and obtain audit evidence that is sufficient and appropriate to provide a basis for our opinion. The risk of not detecting a material misstatement resulting from fraud is higher than for one resulting from error, as fraud may involve collusion, forgery, intentional omissions, misrepresentations, or the override of internal control.</li>
  <li>Obtain an understanding of internal control relevant to the audit in order to design audit procedures that are appropriate in the circumstances, but not for the purpose of expressing an opinion on the effectiveness of the school's internal control.</li>
  <li>Evaluate the appropriateness of accounting policies used and the reasonableness of accounting estimates and related disclosures made by the governing body.</li>
  <li>Evaluate the overall presentation, structure and content of the financial statements, including the disclosures, and whether the financial statements represent the underlying transactions and events in a manner that achieves fair presentation.</li>
</ul>
<p>We communicate with the governing body regarding, among other matters, the planned scope and timing of the audit and significant audit findings, including any significant deficiencies in internal control that we identify during our audit.</p>`;

  const schoolBasisForOpinion = `
<h3>Basis for Opinion</h3>
<p>We conducted our audit in accordance with <em>'International Standards on Auditing (ISAs)'</em>. Our responsibilities under those standards are further described in the <em>'Auditor's Responsibilities for the Audit of the Financial Statements'</em> section of our report. We are independent of the school in accordance with the <em>'Independent Regulatory Board for Auditors Code of Professional Conduct for Registered Auditors (IRBA Code)'</em> and other independence requirements applicable to performing audits of financial statements in South Africa. We have fulfilled our other ethical responsibilities in accordance with the <em>'IRBA Code'</em> and in accordance with other ethical requirements applicable to performing audits in South Africa. The <em>'IRBA Code'</em> is consistent with the <em>'International Ethics Standards Board for Accountants Code of Ethics for Professional Accountants (Parts A and B)'</em>. We believe that the audit evidence we have obtained is sufficient and appropriate to provide a basis for our opinion.</p>`;

  let pageSchoolAudit = '';
  if (schoolSub === 'unqualified') {
    const otherMatter = schoolSubState.otherText
      ? `<h3>Other Matter</h3><p>${schoolSubState.otherText}</p>` : '';
    pageSchoolAudit = `
  <div class="doc-page">
${auditLetterhead()}
<div class="page-header"></div>
<h2>Independent Auditor's Report</h2>
<p><em>To the Governing Body of ${co}</em></p>
<h3>Opinion</h3>
<p>We have audited the financial statements of ${co}, which comprise the statement of financial position as at ${yearEnd}, and the statement of financial performance, including a summary of significant accounting policies and other explanatory notes, as set out on pages ${pageStart} to ${pageEnd}.</p>
<p>In our opinion, the financial statements present fairly, in all material respects, the financial position of ${co} as at ${yearEnd}, and its financial performance and cash flows for the year then ended in accordance with the <em>'Financial Reporting Frameworks for Schools (FRFFS)'</em> and the requirements of the South African Schools Act.</p>
${otherMatter}
${schoolBasisForOpinion}
${schoolGBResponsibilities}
${schoolAuditorResponsibilities}
${auditorBlock(schoolAuditorSigner, dateSigned)}
${auditFooter()}
<div class="page-number">${pg2}</div>
  </div>`;
  } else if (schoolSub === 'qualified') {
    const qualBasis = schoolSubState.qualifiedText || '[Describe the basis for the qualified opinion]';
    const otherMatter = schoolSubState.otherText
      ? `<h3>Other Matter</h3><p>${schoolSubState.otherText}</p>` : '';
    pageSchoolAudit = `
  <div class="doc-page">
${auditLetterhead()}
<div class="page-header"></div>
<h2>Independent Auditor's Report</h2>
<p><em>To the Governing Body of ${co}</em></p>
<h3>Qualified Opinion</h3>
<p>We have audited the financial statements of ${co}, which comprise the statement of financial position as at ${yearEnd}, and the statement of financial performance, including a summary of significant accounting policies and other explanatory notes, as set out on pages ${pageStart} to ${pageEnd}.</p>
<p>In our opinion, except for the matter described in the Basis for Qualified Opinion paragraph, the financial statements present fairly, in all material respects, the financial position of ${co} as at ${yearEnd}, and its financial performance and cash flows for the year then ended in accordance with the <em>'Financial Reporting Frameworks for Schools (FRFFS)'</em> and the requirements of the South African Schools Act.</p>
<h3>Basis for Qualified Opinion</h3>
<p>${qualBasis}</p>
${otherMatter}
${schoolBasisForOpinion}
${schoolGBResponsibilities}
${schoolAuditorResponsibilities}
${auditorBlock(schoolAuditorSigner, dateSigned)}
${auditFooter()}
<div class="page-number">${pg2}</div>
  </div>`;
  } else if (schoolSub === 'disclaimer') {
    const disBasis = schoolSubState.disclaimerText || '[Describe the basis for the disclaimer of opinion]';
    pageSchoolAudit = `
  <div class="doc-page">
${auditLetterhead()}
<div class="page-header"></div>
<h2>Independent Auditor's Report</h2>
<p><em>To the Governing Body of ${co}</em></p>
<h3>Disclaimer of Opinion</h3>
<p>We have audited the financial statements of ${co}, which comprise the statement of financial position as at ${yearEnd}, and the statement of financial performance, including a summary of significant accounting policies and other explanatory notes, as set out on pages ${pageStart} to ${pageEnd}.</p>
<p>We do not express an opinion on the financial statements of ${co}. Because of the significance of the matter described in the Basis for Disclaimer of Opinion section of our report, we have not been able to obtain sufficient appropriate audit evidence to provide a basis for an audit opinion on these financial statements.</p>
<h3>Basis for Disclaimer of Opinion</h3>
<p>We conducted our audit in accordance with <em>'International Standards on Auditing (ISAs)'</em>. Our responsibilities under those standards are further described in the <em>'Auditor's Responsibilities for the Audit of the Financial Statements'</em> section of our report. We are independent of the school in accordance with the <em>'Independent Regulatory Board for Auditors Code of Professional Conduct for Registered Auditors (IRBA Code)'</em> and other independence requirements applicable to performing audits of financial statements in South Africa. We have fulfilled our other ethical responsibilities in accordance with the <em>'IRBA Code'</em> and in accordance with other ethical requirements applicable to performing audits in South Africa. The <em>'IRBA Code'</em> is consistent with the <em>'International Ethics Standards Board for Accountants Code of Ethics for Professional Accountants (Parts A and B)'</em>.</p>
<p>Please note that for the year ending ${yearEnd}, the following came to our attention:</p>
<p style="white-space:pre-line;">${disBasis}</p>
${schoolGBResponsibilities}
${schoolAuditorResponsibilities}
${auditorBlock(schoolAuditorSigner, dateSigned)}
${auditFooter()}
<div class="page-number">${pg2}</div>
  </div>`;
  }

  // ── PAGE: ATTORNEYS TRUST ACCOUNT ASSURANCE REPORT ──
  let pageAttorneysAudit = '';
  if (entityType === 'attorneys') {
    const attGov = getRadio('attGovType') || 'directors';
    const govLabel = attGov === 'partners' ? 'Partner(s)' : 'Director(s)';
    const govLabelLC = attGov === 'partners' ? 'partner(s)' : 'director(s)';
    const govIsAre = attGov === 'partners' ? 'are' : 'are';
    const govDetermines = attGov === 'partners' ? 'determine' : 'determine';

    const attOpinion = getRadio('attOpinionType') || 'unmodified';
    const attInvestment = getRadio('attInvestment') || 'no';
    const attOtherReport = getRadio('attOtherReport') || 'none';
    const attOtherText = getVal('attOtherReportText') || '';
    const attModText = getVal('attModifiedText') || '[BASIS FOR MODIFIED OPINION]';
    const attDisText = getVal('attDisclaimerText') || '[BASIS FOR DISCLAIMER OF OPINION]';

    const attAuditorVal = getRadio('attAuditor') || 'rdb';
    const attAuditorMap = {
      rdb: { name: 'Reinette De Beer', irba: '217890' },
      lvm: { name: 'Leon van der Merwe', irba: '419052' }
    };
    const attAud = attAuditorMap[attAuditorVal];

    // Period
    const yeParts2 = yearEnd.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    let attPeriodStart = '1 March [YEAR]';
    if (yeParts2) attPeriodStart = `1 March ${parseInt(yeParts2[3]) - 1}`;
    const attPeriod = `the period from ${attPeriodStart} to the year ended ${yearEnd}`;

    // Investment practice paragraph
    const attInvestPara = attInvestment === 'yes'
      ? `In accordance with our responsibilities in terms of Rule 54.24.3, we report that to the best of our knowledge, the legal practitioner has for ${attPeriod} carried on the business of an investment practice and has complied with the relevant Rules.`
      : `In accordance with our responsibilities in terms of Rule 54.24.3, we report that to the best of our knowledge, the legal practitioner has not for ${attPeriod} carried on the business of an investment practice.`;

    // Other reporting responsibilities
    const attOtherReportPara = attOtherReport === 'custom' && attOtherText
      ? `<p><strong><em>Other Reporting Responsibilities</em></strong></p><p><em>${attOtherText}</em></p>`
      : '';

    // Shared sections used across all opinion types
    const attResponsibilitySection = `
<p><strong><em>${govLabel} responsibility for the trust accounts</em></strong></p>
<p>The ${govLabelLC} ${govIsAre} responsible for ensuring that legal practitioners' trust accounts are maintained in compliance with the Act and the Rules, and for such internal control as the ${govLabelLC} ${govDetermines} is necessary to maintain the integrity of the trust accounts in accordance with the relevant client mandates, including such controls as the ${govLabelLC} ${govDetermines} are also necessary to prevent and detect fraud and theft. The ${govLabelLC} ${govIsAre} also responsible for preparing the attached Legal Practitioner's Annual Statement on Trust Accounts and for the financial information and declarations contained therein.</p>`;

    const attAuditorSection = `
<p><strong><em>Auditor's Independence and Quality Control</em></strong></p>
<p><em>VDM Audit applies the International Standard on Quality Control 1, Quality Control for Firms that Perform Audits and Reviews of Financial Statements and Other Assurance and Related Services Engagements and accordingly maintains a comprehensive system of quality control, including documented policies and procedures regarding compliance with ethical requirements, professional standards and applicable legal and regulatory requirements.</em></p>
<p><strong><em>Auditor's Responsibility</em></strong></p>
<p>Our responsibility is to express a reasonable assurance opinion on whether the legal practitioners' trust accounts were maintained in compliance with the Act and the Rules, based on our assurance procedures performed; and to report, as required, on the accompanying Legal Practitioner's Annual Statement on Trust Accounts and investment practice.</p>
<p><em>We conducted our reasonable assurance engagement in accordance with the International Standard on Assurance Engagements 3000 (Revised), Assurance Engagements Other than Audits or Reviews of Historical Financial Information (ISAE 3000 (Revised)), issued by the International Auditing and Assurance Standards Board. That standard requires that we plan and perform the engagement to obtain reasonable assurance about whether the legal practitioners' trust accounts were maintained, in all material respects, in compliance with the Act and the Rules.</em></p>
<p>A reasonable assurance engagement in accordance with ISAE 3000 (Revised) involves performing procedures to obtain evidence about whether the legal practitioners' trust accounts were maintained in compliance with the Act and the Rules. The nature, timing and extent of procedures selected depend on the auditor's professional judgement, including the assessment of the risks of non-compliance with the Act and the Rules, whether due to fraud, theft and error. In making those risk assessments, we considered internal control that is relevant to the engagement in order to design procedures that are appropriate in the circumstances, but not for the purpose of expressing an opinion on the effectiveness of internal control.</p>
<p>Our reasonable assurance engagement included the following summary of procedures performed:</p>
<ul>
  <li><em>Considering, and applying when considered applicable in the engagement circumstances, the guidance in the Guide for Registered Auditors: Engagements on Legal Practitioners' Trust Accounts (Revised March 2020) issued by the IRBA.</em></li>
  <li>Making inquiries of the legal practitioner and persons within the practice.</li>
  <li>Testing transactions for all significant service activities, with the objective of evaluating whether:
    <ul>
      <li>Transactions were appropriately identified as trust account transactions;</li>
      <li>Trust account transactions were made in accordance with mandates and supported by adequate documentation and narrative to identify from whom funds were received, and for whose credit;</li>
      <li>Deposits and withdrawals from the trust bank accounts were to, or for, a trust creditor; and</li>
      <li>Transfers to the legal practitioner's business bank accounts were only in respect of monies to be due to the legal practitioner.</li>
    </ul>
  </li>
  <li>Testing and/or scrutinising bank reconciliations, as considered appropriate in the engagement circumstances, and evaluating the records made available to us against the external confirmations from financial institutions.</li>
  <li>Obtaining written representations from management regarding matters that are relevant to this engagement.</li>
</ul>
<p>We believe that the evidence we have obtained is sufficient and appropriate to provide a basis for our opinion.</p>`;

    const attLPCReportSection = `
<p><strong><em>Report on Other Legal and Regulatory Requirements</em></strong></p>
<p><strong><em>Report on the Legal Practitioner's Annual Statement on Trust Accounts</em></strong></p>
<p>In accordance with our responsibilities in terms of the Advisory issued by the Legal Practice Council dated 17 April 2020, we report that we have agreed the information extracted from the trust accounting records included in the accompanying Legal Practitioner's Annual Statement on Trust Accounts for ${attPeriod} to the underlying records that were the subject of our engagement. We have also read the Legal Practitioner's Annual Statement on Trust Accounts for the purpose of identifying whether the information contained therein is inconsistent with our knowledge obtained in the course of our engagement. The Legal Practitioner's Annual Statement on Trust Accounts is the responsibility of the legal practitioner.</p>
<p>Based on our reading of the legal practitioner's representations, the disclosures and other information contained in the Legal Practitioner's Annual Statement on Trust Accounts, we have not identified any information that is inconsistent with our knowledge obtained in the course of our engagement. Our opinion on the legal practitioner's trust accounts does not cover the Legal Practitioner's Annual Statement on Trust Accounts and, accordingly, we do not express an opinion thereon.</p>
<p><strong><em>Report on the Legal Practitioner's Investment Practice</em></strong></p>
<p><strong>${attInvestPara}</strong></p>
${attOtherReportPara}`;

    const attRestrictionSection = `
<p><strong><em>Restriction on distribution and use</em></strong></p>
<p><em>This report is for the purpose of meeting the auditor reporting requirements of the Act and the Rules and, regarding the accompanying Legal Practitioner's Annual Statement on Trust Accounts, the additional auditor reporting requirements of the Legal Practice Council and the Legal Practitioners Fidelity Fund. Consequently, it is not suitable for any other purpose. It is intended solely for the use of the ${govLabelLC} of the firm, the Legal Practice Council and the Legal Practitioners Fidelity Fund, and should not be distributed to other parties.</em></p>`;

    const attSignatureSection = `
<br>
<p><strong><em>Auditor's Signature</em></strong></p>
<br><br>
<p>_____________________________</p>
<p>${attAud.name}</p>
<p>IRBA Registration Number ${attAud.irba}</p>
<p>VDM Audit</p>
<p>${dateSigned}</p>`;

    // ── OPINION VARIANTS ──
    if (attOpinion === 'unmodified') {
      pageAttorneysAudit = `
  <div class="doc-page" style="font-size:9.5pt;">
${auditLetterhead()}
<div class="page-header">
  <p style="text-align:center;font-weight:bold;margin:0;">Independent Auditor's Reasonable Assurance Report on Legal Practitioners'</p>
  <p style="text-align:center;font-weight:bold;margin:0 0 8px;">Trust Accounts</p>
</div>
<p><strong><em>To the ${govLabel} of ${co}</em></strong></p>
<p><strong><em>Report on Compliance of the Legal Practitioners' Trust Accounts with the Act and the Rules</em></strong></p>
<p>We have undertaken a reasonable assurance engagement on whether the legal practitioners' trust accounts of ${co} were maintained, in all material respects, in compliance with Section 86, read with Section 63(1)(g), and Sections 87(1), 87(3) and 87(4) of the Legal Practice Act, No. 28 of 2014 (the Act), and Rules 54.6–54.13, 54.14.1–54.14.6, 54.14.7.2, 54.14.7.3, 54.14.8–54.14.16, 54.15, 54.16, 54.17, 54.18, 54.19, 54.31, 54.32, 54.33, 54.34, 54.35 and 55.1–55.11 of the South African Legal Practice Council Rules (the Rules), made under the authority of Sections 95(1), 95(3) and 109(2) of the Act, for ${attPeriod}.</p>
<p>We clarify that we are not required to perform any procedures on records or documents relating to accounting for deceased estates, insolvent estates and trusts other than those dealt with via the legal practitioner's trust banking account(s).</p>
${attResponsibilitySection}
${attAuditorSection}
<p><strong><em>Opinion</em></strong></p>
<p>In our opinion, the legal practitioners' trust accounts of ${co} for ${attPeriod} were maintained, in all material respects, in compliance with the Act and the Rules.</p>
${attLPCReportSection}
${attRestrictionSection}
${attSignatureSection}
${auditFooter()}
  </div>`;
    } else if (attOpinion === 'modified') {
      pageAttorneysAudit = `
  <div class="doc-page" style="font-size:9.5pt;">
${auditLetterhead()}
<div class="page-header">
  <p style="text-align:center;font-weight:bold;margin:0;">Independent Auditor's Reasonable Assurance Report on Legal Practitioners'</p>
  <p style="text-align:center;font-weight:bold;margin:0 0 8px;">Trust Accounts</p>
</div>
<p><strong><em>To the ${govLabel} of ${co}</em></strong></p>
<p><strong><em>Report on Compliance of the Legal Practitioners' Trust Accounts with the Act and the Rules</em></strong></p>
<p>We have undertaken a reasonable assurance engagement on whether the legal practitioners' trust accounts of ${co} were maintained, in all material respects, in compliance with Section 86, read with Section 63(1)(g), and Sections 87(1), 87(3) and 87(4) of the Legal Practice Act, No. 28 of 2014 (the Act), and Rules 54.6–54.13, 54.14.1–54.14.6, 54.14.7.2, 54.14.7.3, 54.14.8–54.14.16, 54.15, 54.16, 54.17, 54.18, 54.19, 54.31, 54.32, 54.33, 54.34, 54.35 and 55.1–55.11 of the South African Legal Practice Council Rules (the Rules), made under the authority of Sections 95(1), 95(3) and 109(2) of the Act, for ${attPeriod}.</p>
<p>We clarify that we are not required to perform any procedures on records or documents relating to accounting for deceased estates, insolvent estates and trusts other than those dealt with via the legal practitioner's trust banking account(s).</p>
${attResponsibilitySection}
${attAuditorSection}
<p><strong><em>Basis for Modified Opinion</em></strong></p>
<p>${attModText}</p>
<p><strong><em>Modified Opinion</em></strong></p>
<p>In our opinion, except for the effects of the matter described in the Basis for Modified Opinion paragraph, the legal practitioners' trust accounts of ${co} for ${attPeriod} were maintained, in all material respects, in compliance with the Act and the Rules.</p>
${attLPCReportSection}
${attRestrictionSection}
${attSignatureSection}
${auditFooter()}
  </div>`;
    } else {
      // Disclaimer
      pageAttorneysAudit = `
  <div class="doc-page" style="font-size:9.5pt;">
${auditLetterhead()}
<div class="page-header">
  <p style="text-align:center;font-weight:bold;margin:0;">Independent Auditor's Reasonable Assurance Report on Legal Practitioners'</p>
  <p style="text-align:center;font-weight:bold;margin:0 0 8px;">Trust Accounts</p>
</div>
<p><strong><em>To the ${govLabel} of ${co}</em></strong></p>
<p><strong><em>Report on Compliance of the Legal Practitioners' Trust Accounts with the Act and the Rules</em></strong></p>
<p>We were engaged to undertake a reasonable assurance engagement on whether the legal practitioners' trust accounts of ${co} were maintained, in all material respects, in compliance with Section 86, read with Section 63(1)(g), and Sections 87(1), 87(3) and 87(4) of the Legal Practice Act, No. 28 of 2014 (the Act), and Rules 54.6–54.13, 54.14.1–54.14.6, 54.14.7.2, 54.14.7.3, 54.14.8–54.14.16, 54.15, 54.16, 54.17, 54.18, 54.19, 54.31, 54.32, 54.33, 54.34, 54.35 and 55.1–55.11 of the South African Legal Practice Council Rules (the Rules), made under the authority of Sections 95(1), 95(3) and 109(2) of the Act, for ${attPeriod}.</p>
<p>We clarify that we are not required to perform any procedures on records or documents relating to accounting for deceased estates, insolvent estates and trusts other than those dealt with via the legal practitioner's trust banking account(s).</p>
${attResponsibilitySection}
${attAuditorSection}
<p><strong><em>Basis for Disclaimer of Opinion</em></strong></p>
<p>${attDisText}</p>
<p><strong><em>Disclaimer of Opinion</em></strong></p>
<p>Because of the significance of the matter described in the Basis for Disclaimer of Opinion paragraph, we have not been able to obtain sufficient appropriate evidence to provide a basis for an opinion. Accordingly, we do not express an opinion on the compliance of the legal practitioners' trust accounts of ${co} with the Act and the Rules.</p>
${attLPCReportSection}
${attRestrictionSection}
${attSignatureSection}
${auditFooter()}
  </div>`;
    }
  }

  // ── PAGE: TRUSTEES' RESPONSIBILITIES AND APPROVAL (Body Corporate) ──
  const pageTrusteesResponsibilities = `
  <div class="doc-page">
${auditLetterhead()}
<div class="page-header">
  ${reg ? `<div class="co-reg">(Sectional Title Scheme Number — ${reg})</div>` : ''}
</div>
<h2>Trustees' Responsibilities and Approval</h2>
<p>The trustees are required in terms of the <em>Sectional Titles Schemes Management Act, 2011</em>, <em>the Sectional Titles Schemes Management Regulations, 2016 and the Management Rules of the body corporate</em> established in terms thereof, to maintain adequate accounting records and are responsible for the content and integrity of the financial statements and related financial information included in this report. It is their responsibility to ensure that the financial statements fairly present the state of affairs of the entity as at the end of the financial year and the results of its operations and cash flows for the period then ended, in conformity with International Financial Reporting Standards for Small and Medium-sized Entities and the requirements of the <em>Sectional Titles Schemes Management Act, 2011</em>, <em>the Sectional Titles Schemes Management Regulations, 2016 and the Management Rules of the body corporate</em> established in terms thereof.</p>
<p>The financial statements are prepared in accordance with International Financial Reporting Standards for Small and Medium-sized Entities and the requirements of the <em>Sectional Titles Schemes Management Act, 2011</em>, <em>the Sectional Titles Schemes Management Regulations, 2016 and the Management Rules of the body corporate</em> established in terms thereof and are based upon appropriate accounting policies consistently applied and supported by reasonable and prudent judgments and estimates.</p>
<p>The trustees acknowledge that they are ultimately responsible for the system of internal financial control established by the entity and place considerable emphasis on maintaining a strong control environment. To enable the trustees to meet these responsibilities, the board sets standards for internal control aimed at reducing the risk of error or loss in a cost-effective manner. The standards include the proper delegation of responsibilities within a clearly defined framework, effective accounting procedures and adequate segregation of duties to ensure an acceptable level of risk. These controls are monitored throughout the entity and all employees are required to maintain the highest ethical standards in ensuring the body corporate's business is conducted in a manner that in all reasonable circumstances is above reproach. The focus of risk management in the body corporate is on identifying, assessing, managing and monitoring all known forms of risk across the body corporate. While operating risk cannot be fully eliminated, the entity endeavours to minimise it by ensuring that appropriate infrastructure, controls, systems and ethical behaviour are applied and managed within predetermined procedures and constraints.</p>
<p>The trustees are of the opinion, based on the information and explanations given by management that the system of internal control provides reasonable assurance that the financial records may be relied on for the preparation of the financial statements. However, any system of internal financial control can provide only reasonable, and not absolute, assurance against material misstatement or loss.</p>
<p>The trustees have reviewed the cash flow forecast for the year and, in the light of this review and the current financial position, they are satisfied that the body corporate has access to adequate resources to continue in operational existence for the foreseeable future.</p>
<p>The external auditors are responsible for independently auditing and reporting on the body corporate's financial statements. The financial statements have been examined by the body corporate's external auditors and their report is presented on page 2.</p>
<p>The financial statements set out on pages ${pageStart} to ${pageEnd}, which have been prepared on the going concern basis, were approved by the board on ${dateApproved} and are signed on its behalf:</p>
<div class="signature-block">
  ${sigBlock(dirs)}
</div>
${auditFooter()}
<div class="page-number">${pg1}</div>
  </div>`;

  // ── PAGE: TRUSTEES' REPORT (Body Corporate) ──
  const bcSchemeAddress = getVal('bcSchemeAddress') || '[SCHEME NAME AND ADDRESS]';
  const bcContribType = getRadio('bcContribType') || 'surplus';
  const bcContribAmt = formatNumber(getVal('bcContribAmount')) || '[AMOUNT]';
  const bcPrevYear = getVal('bcPrevYear') || '[PREV YEAR]';
  const bcPrevContribType = getRadio('bcPrevContribType') || 'surplus';
  const bcPrevContribAmt = formatNumber(getVal('bcPrevContribAmount')) || '[AMOUNT]';
  const bcMgmtRules = getRadio('bcMgmtRules') || 'nochange';
  const bcMgmtRulesText = getVal('bcMgmtRulesText') || '';
  const bcEvents = getRadio('bcEvents') || 'none';
  const bcEventsText = getVal('bcEventsText') || '';

  const bcContribWord = bcContribType === 'surplus' ? 'surplus' : 'deficit';
  const bcPrevContribWord = bcPrevContribType === 'surplus' ? 'surplus' : 'deficit';

  const bcEventsParagraph = bcEvents === 'custom' && bcEventsText
    ? `<p>${bcEventsText}</p>`
    : `<p>The trustees are not aware of any matter or circumstance that has occurred between the accounting date and the date of this report that has a material impact on the annual financial statements.</p>`;

  const bcMgmtRulesParagraph = bcMgmtRules === 'custom' && bcMgmtRulesText
    ? `<p>${bcMgmtRulesText}</p>`
    : `<p>There were no amendments or additions to the management and conduct rules.</p>`;

  // Derive next financial year from yearEnd
  const bcNextYear = (() => {
    const m = yearEnd.match(/\d{4}/);
    return m ? String(parseInt(m[0]) + 1) : '[NEXT YEAR]';
  })();

  const pageTrusteesReport = `
  <div class="doc-page">
<div class="page-header">
  ${reg ? `<div class="co-reg">(Sectional Title Scheme Number — ${reg})</div>` : ''}
</div>
<h2>Trustees' Report</h2>
<p>The trustees have pleasure in presenting their report for the year ended ${yearEnd}.</p>
<p class="underline-heading">Business Activities and General Review of Operations</p>
<p>The body corporate is engaged in governing the property and operates principally in South Africa.</p>
<p>The controlling body was established to administer the common property of the Sectional Title Scheme known as ${bcSchemeAddress}, for which a Sectional Title Register was opened.</p>
<p>All expenses applicable to the common property and administration are recovered from the various section owners by means of a monthly levy in terms of the rules of the body corporate and are in accordance with the participation quota applicable to each section.</p>
<p>The operating results and state of affairs of the body corporate are fully set out in the attached annual financial statements and do not in our opinion require any further comment.</p>
<p class="underline-heading">Events After the Reporting Period</p>
${bcEventsParagraph}
<p class="underline-heading">Contributions</p>
<p>Contributions paid by section owners and interest earned during the year were ${bcContribType === 'surplus' ? 'sufficient' : 'insufficient'} to meet expenditure, resulting in a levy ${bcContribWord} of R&nbsp;${bcContribAmt} (${bcPrevYear}: R&nbsp;${bcPrevContribAmt}).</p>
<p class="underline-heading">Trustees</p>
<p>The trustees of the body corporate are: ${dirList}</p>
<p class="underline-heading">Management and Conduct Rules</p>
${bcMgmtRulesParagraph}
<p class="underline-heading">Estimates of Income and Expenditure for the ${bcNextYear} Financial Year</p>
<p>A budget for the next year will be presented for approval at the forthcoming annual general meeting.</p>
<p class="underline-heading">Insured Replacement Values</p>
<p>A schedule of the present replacement values of all the units will be tabled for approval at the forthcoming annual general meeting.</p>
<p class="underline-heading">Auditors</p>
<p>VDM Auditors was the auditor for the year under review and their re-appointment is dependent on a resolution taken to that effect by the section owners at the forthcoming annual general meeting.</p>
<p>The financial statements were approved and signed by the trustees.</p>
<p class="underline-heading">Trustees:</p>
<div class="signature-block">
  ${sigBlock(dirs)}
</div>
<p>${dateApproved}</p>
<div class="page-number">${pg3}</div>
  </div>`;

  // ── ENGAGEMENT LETTER BUILDERS ──
  // Accounting & Review use CA letterhead; Audit uses Audit letterhead.
  // Entity-aware addressing: directors/members/trustees/committee etc.

  const engSignerNameMap = {
    'L VAN DER MERWE': 'L van der Merwe',
    'HL VAN DER MERWE': 'HL van der Merwe',
    'R DE BEER': 'R de Beer',
    'R WOLMARANS': 'R Wolmarans'
  };
  const engPractitioner = engSignerNameMap[compilerSigner] || compilerSigner;
  const postalLines = postal.split(',').map(s => s.trim()).filter(Boolean);
  const postalHtml = postalLines.map(l => `<p style="margin:0;line-height:1.6;">${l}</p>`).join('');

  // Addressee label based on entity type
  const engAddressee = entityType === 'cc' ? 'The Members'
    : entityType === 'trust' ? 'The Trustees'
      : entityType === 'bc' ? 'The Trustees'
        : entityType === 'npo' ? 'The Committee'
          : entityType === 'church' ? 'The Church Council'
            : entityType === 'club' ? 'The Committee'
              : 'The Directors';

  // Director labels for signature block
  const engSigLabels = dirs.map(d => d.full);
  const engSigBlock = engSigLabels.length > 0
    ? `<div style="display:grid;grid-template-columns:${engSigLabels.length > 1 ? '1fr 1fr' : '1fr'};gap:32px;margin-top:24px;">
    ${engSigLabels.map(n => `<div><div style="border-top:1px solid #333;padding-top:6px;font-weight:bold;">${n}</div></div>`).join('')}
   </div>`
    : `<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:24px;">
    <div><div style="border-top:1px solid #333;padding-top:6px;font-weight:bold;">&nbsp;</div></div>
    <div><div style="border-top:1px solid #333;padding-top:6px;font-weight:bold;">&nbsp;</div></div>
   </div>`;

  // ── ACCOUNTING ENGAGEMENT LETTER (CA Letterhead) ──
  function buildAccountingEngagementLetter() {
    return `
  <div class="doc-page">
${caLetterhead()}
<br>
<p style="margin:0;line-height:1.6;">${engAddressee}</p>
<p style="margin:0;line-height:1.6;font-weight:bold;">${co}</p>
${postalHtml}
<br>
<p><strong>APPOINTMENT TO PROVIDE SERVICES</strong></p>
<p>Following our recent discussion with you, we are pleased to confirm acceptance of our engagement to provide accounting, taxation and secretarial services to you. This letter sets forth our understanding of the terms and objectives of our engagement, and the nature and scope of the services we will provide. This letter is effective as from ${dateSigned || '[DATE]'} and does not need to be completed annually, but only when amendments are to be made.</p>
<p><em><strong>Accounting records; preparing of financial statements; taxation and secretarial services:</strong></em></p>
<p>All the above duties are the responsibility of the ${entityType === 'cc' ? 'members' : entityType === 'trust' || entityType === 'bc' ? 'trustees' : 'directors'} of ${co} as set out in various different acts and laws including but not limited to the Companies Act, Income Tax Act, Labour Act, etc. We will assist you in various ways to fulfill your responsibilities.</p>
<p>We will prepare accounting records, financial statements and cash-flow projections as per your request. We will also prepare and submit various returns on your behalf including income tax, dividend tax, PAYE, IRP5 reconciliations, VAT, UIF, workmen's compensation, etc. as per your request. We will assist you with the secretarial services of your entity as prescribed by the various acts applicable on your request.</p>
<p>All the above services will be based on the information supplied by you. Any enquiries and investigations that we may undertake in respect of supporting evidence are for the purpose of enabling us to adequately provide you with the services alone, and therefore do not fall outside the description of our appointment.</p>
<p>We may also be obliged to take certain action if, during the performance of our duties as accountants and tax practitioners, we become aware of contraventions of the Prevention of Organized Crime Act 121 of 1998 and the Financial Intelligence Centre Act 38 of 2001.</p>
<p><em><strong>Deadlines:</strong></em></p>
<p>As all or most of our services have to be completed at a certain date, we request that information is supplied to us in advance, taking the time that we need to complete the work into consideration. We will as far as possible send reminders of deadlines, but the responsibility to supply the relevant documentation before the deadline, lies with you.</p>
<p><em><strong>Excluded services:</strong></em></p>
<p>This letter only relates to services as described and does not extend to services such as audits and reviews of financial statements.</p>
<p><em><strong>Liability and limitations:</strong></em></p>
<p>We will provide the professional services outlined in this letter with reasonable care and skill as our reputation over decades speaks for itself. Our advice to you will be based on our interpretation of the law and our experience with SARS and other role players. Therefore the conclusions reached and views expressed will often be matters of opinion rather than certainty and we cannot warrant that SARS and others will necessarily reach the same conclusions. We will not be responsible for any losses, penalties, interest or additional tax liabilities arising for whichever reason as the responsibility at all times lies with the ${entityType === 'cc' ? 'members' : entityType === 'trust' || entityType === 'bc' ? 'trustees' : 'directors'}.</p>
<p>Our maximum liability for any claims that might arise out of services provided by us shall be limited to the total amount of fees charged by us for our services over the 12 months preceding our claim. The maximum liability shall be the aggregate liability for all claims arising from whatsoever source.</p>
<p><em><strong>Fees:</strong></em></p>
<p>Our fees will be calculated on the basis of time spent on your affairs by partners and personnel. Rates charged are based on experience and qualification of various personnel. Accounts will be sent to you at appropriate intervals during the course of the year. Our account is payable on presentation on which interest will be charged on any outstanding balance older than 60 days. The ${entityType === 'cc' ? 'members' : entityType === 'trust' || entityType === 'bc' ? 'trustees' : 'directors'} accept full responsibility in their personal capacity for the payment of any outstanding balance should the entity prove not to be able to pay the outstanding balance. We have the right to retention over all documents prepared by us and have the right to suspend all services rendered by us until such time as our account is settled in full.</p>
<p>This letter will be effective for future years unless it is terminated or suspended.</p>
<p>Kindly acknowledge receipt of this letter. Should the content not correspond with your view of our terms of engagement, we will gladly discuss this matter further with you.</p>
<p>Yours Faithfully</p>
<br>
<p><strong>${compilerSigner}</strong></p>
<br>
<p>We, the undersigned, agree to the terms of this letter.</p>
${engSigBlock}
<p style="margin-top:18px;">${dateSigned}</p>
${letterheadFooter()}
  </div>`;
  }

  // ── REVIEW ENGAGEMENT LETTER (CA Letterhead) ──
  function buildReviewEngagementLetter() {
    return `
  <div class="doc-page">
${caLetterhead()}
<br>
<p style="margin:0;line-height:1.6;">${engAddressee}</p>
<p style="margin:0;line-height:1.6;font-weight:bold;">${co}</p>
${postalHtml}
<br>
<p><strong>ENGAGEMENT LETTER TO REVIEW FINANCIAL STATEMENTS</strong></p>
<p><em><strong>The objective and scope of the review and our responsibilities</strong></em></p>
<p>You have requested that we review the financial statements of ${co} for the year ended ${yearEnd}, comprising the statement of financial position, the statement of comprehensive income, statement of changes in equity and statement of cash flows for the year then ended, and a summary of significant accounting policies and other explanatory information, and the ${entityType === 'cc' ? "members'" : entityType === 'trust' || entityType === 'bc' ? "trustees'" : "directors'"} report. We are pleased to confirm our acceptance and our understanding of this review engagement by means of this letter. We will conduct our review in accordance with International Standard on Review Engagements (ISRE) 2400 — Engagements to Review Financial Statements. ISRE 2400 requires us to conclude whether anything has come to our attention that causes us to believe that the financial statements, taken as a whole, are not prepared in all material respects in accordance with the applicable financial reporting framework or stated accounting policies. ISRE 2400 also requires us to comply with relevant ethical requirements. A review of financial statements in accordance with ISRE 2400 consists primarily of making inquiries of management and others within the entity that are involved in financial and accounting matters, applying analytical procedures and evaluating the sufficiency and appropriateness of their view evidence obtained. A review may also include any other procedures we consider necessary in the circumstances of the engagement to obtain sufficient and appropriate evidence as the basis for our conclusion on the financial statements as a whole. The procedures selected will depend on what we consider necessary, applying our professional judgment, based on our understanding of the entity and its environment, and our understanding of the applicable financial reporting framework or stated accounting policies and its application in the circumstances. We will not perform an audit of the financial statements. As we are engaged to review the financial statements:</p>
<p>There is a commensurate higher risk that any material misstatements that exist in the financial statements reviewed may not be revealed by the review, even though the review is properly performed in accordance with ISRE 2400. The procedures performed in a review engagement do not provide all the evidence that would be required in an audit.</p>
<p>In expressing our review conclusion, our report on the financial statements will state that an audit has not been performed and that we do not express an audit opinion on the financial statements.</p>
<p><em><strong>Responsibilities of the ${entityType === 'cc' ? 'members' : entityType === 'trust' || entityType === 'bc' ? 'trustees' : 'directors'}</strong></em></p>
<p>The ${entityType === 'cc' ? 'members are' : entityType === 'trust' || entityType === 'bc' ? 'trustees are' : 'directors are'} responsible for the calculation of the public interest score in accordance with Regulation 26 of the Companies Regulations, 2011. The entity's public interest score should be calculated by the ${entityType === 'cc' ? 'members' : entityType === 'trust' || entityType === 'bc' ? 'trustees' : 'directors'} at year-end for the current financial year. It is the sole responsibility of the ${entityType === 'cc' ? 'members' : entityType === 'trust' || entityType === 'bc' ? 'trustees' : 'directors'} to determine the appropriateness of a review engagement in the circumstances of the ${entityType === 'cc' ? 'close corporation' : 'company'}, in compliance with the requirements of the Companies Act, 2008, and taking cognizance of any other requirements or agreements that may be applicable to the ${entityType === 'cc' ? 'close corporation' : 'company'}.</p>
<p>Our review will be conducted on the basis that you acknowledge and understand that you have responsibility:</p>
<ul>
  <li>For the preparation and fair presentation of the financial statements in accordance with the International Financial Reporting Standard for Small and Medium-sized Entities (IFRS for SMEs) and the requirements of the Companies Act of South Africa;</li>
  <li>For such internal control as you determine is necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error; and</li>
  <li>To provide us with access to all information of which you are aware that is relevant to the preparation of the financial statements, such as records, documentation and other matters, additional information that we may request from you for the purpose of the review, and unrestricted access to persons within the entity from whom we determine it necessary to obtain evidence.</li>
</ul>
<p>As part of our review, we will request from management and, where appropriate, from those charged with governance, written confirmation concerning representations made to us in connection with the review.</p>
<p><em><strong>Reporting</strong></em></p>
<p>As stated above, our review will be conducted with the objective of expressing a review conclusion on the financial statements as a whole. Our review conclusion will be communicated in a written report. If the review conclusion on the financial statements of the ${entityType === 'cc' ? 'close corporation' : 'company'} is unmodified, it is currently expected to read as follows:</p>
<p>"Based on our review, nothing has come to our attention that causes us to believe that the financial statements do not present fairly, in all material respects, the financial position of the ${entityType === 'cc' ? 'close corporation' : 'company'} at the reporting date, and its financial performance and its cash flows for the year then ended, in accordance with the International Financial Reporting Standard for Small and Medium-sized Entities (IFRS for SMEs) and the requirements of the Companies Act of South Africa." However, the form and contents of our report may need to be amended in the light of our findings obtained from the review.</p>
<p><em><strong>Reportable irregularities in terms of Regulation 29 of the Companies Regulations, 2011</strong></em></p>
<p>It is our responsibility to inform you regarding our obligation, in terms of Regulation 29 of the Companies Regulations, 2011, to report reportable irregularities to the Companies and Intellectual Property Commission (the Commission).</p>
<p>A "reportable irregularity" refers to any act or omission committed by any person responsible for the management of a ${entityType === 'cc' ? 'close corporation' : 'company'}, which:</p>
<ul>
  <li>Unlawfully has caused or is likely to cause material financial loss to the ${entityType === 'cc' ? 'close corporation' : 'company'} or to any member, shareholder, creditor or investor of the ${entityType === 'cc' ? 'close corporation' : 'company'} in respect of his, her or its dealings with that entity; or</li>
  <li>Is fraudulent or amounts to theft; or</li>
  <li>Causes or has caused the ${entityType === 'cc' ? 'close corporation' : 'company'} to trade under insolvent circumstances.</li>
</ul>
<p>We are not required to design procedures for the specific purpose of identifying reportable irregularities. However, we will consider all information that comes to our attention from any source in order to determine whether a reporting obligation arises. In instances where we are satisfied or have reason to believe that a reportable irregularity has taken place or is taking place, the practitioner responsible and accountable for the review engagement is required, without delay, to send a written report to the Commission. Such a report initiates a series of activities in accordance with Regulation 29 of the Companies Regulations, 2011, pertaining to discussing the report with the members of the Board of the ${entityType === 'cc' ? 'close corporation' : 'company'}, obtaining representations from the Board and sending a final report to the Commission concluding on the existence and status of a reportable irregularity, including information relating to steps that have been taken for the prevention or recovery of any loss as a result thereof (if relevant). Please do not hesitate to contact us if you require further clarification regarding our obligation to report reportable irregularities to the Commission.</p>
<p><em><strong>Fees</strong></em></p>
<p>Our fees are based on the time required by the resources assigned to the engagement. The fees billed are based on the degree of responsibility involved, as well as the level of experience, knowledge and skill required. Our fees, together with disbursements, will be billed as work progresses, and settlement is due on presentation of our invoices.</p>
<p><em><strong>Agreement of terms</strong></em></p>
<p>We look forward to full cooperation with your staff during our review. We are available to discuss this letter with you at any time. Once it has been agreed to, this letter will remain effective for future years unless it is terminated, amended or superseded. The individual practitioner responsible and accountable for the review engagement is:</p>
<p><strong>${engPractitioner}</strong></p>
<p>Please sign and return the attached copy of this letter, including our standard terms and conditions, to indicate that it is in accordance with your understanding of, and agreement with, the arrangements for our review of the financial statements, including our respective responsibilities.</p>
<p>Yours faithfully</p>
<br>
<p><strong>VDM CHARTERED ACCOUNTANTS (SA)</strong></p>
<br>
<p>We, the undersigned, being duly authorized to sign for or on behalf of the entity, herewith accept the above terms of the engagement.</p>
${engSigBlock}
<p style="margin-top:18px;">${dateSigned}</p>
  </div>`;
  }

  // ── CLUB / CHURCH AUDIT ENGAGEMENT LETTER (Audit Letterhead) ──
  function buildClubChurchAuditEngagementLetter() {
    const bodyLabel = entityType === 'church' ? 'church council' : 'committee';
    const entityLabel = entityType === 'church' ? 'church' : 'club';
    return `
  <div class="doc-page">
${auditLetterhead()}
<br>
<p style="margin:0;line-height:1.6;">${engAddressee}</p>
<p style="margin:0;line-height:1.6;font-weight:bold;">${co}</p>
${postalHtml}
<br>
<p><strong>ENGAGEMENT LETTER TO AUDIT FINANCIAL STATEMENTS</strong></p>
<p><em><strong>The objective and scope of the audit and our responsibilities</strong></em></p>
<p>You have requested that we audit the financial statements of ${co} for the year ended ${yearEnd}, comprising the statement of financial position, the statement of profit or loss, statement of changes in funds and statement of cash flows for the year then ended, and a summary of significant accounting policies and other explanatory information. Our audit will be made with the objective of our expressing an opinion on the financial statements. We will conduct our audit in accordance with International Standards on Auditing (or refer to relevant national standards or practices). Those Standards require that we plan and perform the audit to obtain reasonable assurance about whether the financial statements are free of material misstatements. An audit includes examining, on a test basis, evidence supporting the amounts and disclosures in the financial statements. An audit also includes assessing the accounting principles used and significant estimates made by management, as well as evaluating the overall financial statement presentation. Because of the test nature and other inherent limitations of an audit, together with the inherent limitations of any accounting and internal control system, there is an unavoidable risk that even some material misstatements may remain undiscovered. In addition to our report on the financial statements, we expect to provide you with a separate letter concerning any material weaknesses in accounting and internal control systems which come to our notice.</p>
<p><em><strong>Responsibilities of the ${bodyLabel}</strong></em></p>
<p>It is the sole responsibility of the ${bodyLabel} to determine the appropriateness of an audit engagement in the circumstances of the ${entityLabel}, and taking cognizance of any other requirements or agreements that may be applicable to the ${entityLabel}.</p>
<p>Our audit will be conducted on the basis that you acknowledge and understand that you have responsibility:</p>
<ul>
  <li>For the preparation and fair presentation of the financial statements in accordance with the International Financial Reporting Standard for Small and Medium-sized Entities (IFRS for SMEs)</li>
  <li>For such internal control as you determine is necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error; and</li>
  <li>To provide us with access to all information of which you are aware that is relevant to the preparation of the financial statements, such as records, documentation and other matters, additional information that we may request from you for the purpose of the review, and unrestricted access to persons within the entity from whom we determine it necessary to obtain evidence.</li>
</ul>
<p>As part of our audit, we will request from management and, where appropriate, from those charged with governance, written confirmation concerning representations made to us in connection with the audit.</p>
<p><em><strong>Reporting</strong></em></p>
<p>As stated above, our audit will be conducted with the objective of expressing an audit conclusion on the financial statements as a whole. Our audit conclusion will be communicated in a written report. If the audit conclusion on the financial statements of the ${entityLabel} is unmodified, it is currently expected to read as follows:</p>
<p>"In our opinion, the financial statements present fairly, in all material respects, the financial position as at ${yearEnd}, and its financial performance and cash flows for the year then ended in accordance with International Financial Reporting Standards for Small and Medium-sized Entities."</p>
<p>However, the form and contents of our report may need to be amended in the light of our findings obtained from the audit.</p>
<p><em><strong>Fees</strong></em></p>
<p>Our fees are based on the time required by the resources assigned to the engagement. The fees billed are based on the degree of responsibility involved, as well as the level of experience, knowledge and skill required. Our fees, together with disbursements, will be billed as work progresses, and settlement is due on presentation of our invoices.</p>
<p><em><strong>Agreement of terms</strong></em></p>
<p>We look forward to full cooperation with your staff during our audit. We are available to discuss this letter with you at any time. Once it has been agreed to, this letter will remain effective for future years unless it is terminated, amended or superseded. The individual practitioner responsible and accountable for the audit engagement is:</p>
<p><strong>${engPractitioner}</strong></p>
<p>Please sign and return the attached copy of this letter, including our standard terms and conditions, to indicate that it is in accordance with your understanding of, and agreement with, the arrangements for our audit of the financial statements, including our respective responsibilities.</p>
<p>Yours faithfully</p>
<br>
<p><strong>VDM AUDIT</strong></p>
<br>
<p>We, the undersigned, being duly authorized to sign for or on behalf of the entity, herewith accept the above terms of the engagement.</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:24px;">
  <div><div style="border-top:1px solid #333;padding-top:6px;font-weight:bold;">CHAIRMAN</div></div>
  <div><div style="border-top:1px solid #333;padding-top:6px;font-weight:bold;">TREASURER</div></div>
</div>
<p style="margin-top:18px;">${dateSigned}</p>
${auditFooter()}
  </div>`;
  }

  // ── AUDIT ENGAGEMENT LETTER (Audit Letterhead) ──
  function buildAuditEngagementLetter() {
    return `
  <div class="doc-page">
${auditLetterhead()}
<br>
<p style="margin:0;line-height:1.6;">${engAddressee}</p>
<p style="margin:0;line-height:1.6;font-weight:bold;">${co}</p>
${postalHtml}
<br>
<p><strong>ENGAGEMENT LETTER TO AUDIT FINANCIAL STATEMENTS</strong></p>
<p><em><strong>The objective and scope of the audit and our responsibilities</strong></em></p>
<p>You have requested that we audit the financial statements of ${co} for the year ended ${yearEnd}, comprising the statement of financial position, the statement of comprehensive income, statement of changes in equity and statement of cash flows for the year then ended, and a summary of significant accounting policies and other explanatory information, and the ${entityType === 'cc' ? "members'" : entityType === 'trust' || entityType === 'bc' ? "trustees'" : "directors'"} report. Our audit will be made with the objective of our expressing an opinion on the financial statements. We will conduct our audit in accordance with International Standards on Auditing (or refer to relevant national standards or practices). Those Standards require that we plan and perform the audit to obtain reasonable assurance about whether the financial statements are free of material misstatements. An audit includes examining, on a test basis, evidence supporting the amounts and disclosures in the financial statements. An audit also includes assessing the accounting principles used and significant estimates made by management, as well as evaluating the overall financial statement presentation. Because of the test nature and other inherent limitations of an audit, together with the inherent limitations of any accounting and internal control system, there is an unavoidable risk that even some material misstatements may remain undiscovered. In addition to our report on the financial statements, we expect to provide you with a separate letter concerning any material weaknesses in accounting and internal control systems which come to our notice.</p>
<p><em><strong>Responsibilities of the ${entityType === 'cc' ? 'members' : entityType === 'trust' || entityType === 'bc' ? 'trustees' : 'directors'}</strong></em></p>
<p>The ${entityType === 'cc' ? 'members are' : entityType === 'trust' || entityType === 'bc' ? 'trustees are' : 'directors are'} responsible for the calculation of the public interest score in accordance with Regulation 26 of the Companies Regulations, 2011. The entity's public interest score should be calculated by the ${entityType === 'cc' ? 'members' : entityType === 'trust' || entityType === 'bc' ? 'trustees' : 'directors'} at year-end for the current financial year. It is the sole responsibility of the ${entityType === 'cc' ? 'members' : entityType === 'trust' || entityType === 'bc' ? 'trustees' : 'directors'} to determine the appropriateness of an audit engagement in the circumstances of the ${entityType === 'cc' ? 'close corporation' : 'company'}, in compliance with the requirements of the Companies Act, 2008, and taking cognizance of any other requirements or agreements that may be applicable to the ${entityType === 'cc' ? 'close corporation' : 'company'}.</p>
<p>Our audit will be conducted on the basis that you acknowledge and understand that you have responsibility:</p>
<ul>
  <li>For the preparation and fair presentation of the financial statements in accordance with the International Financial Reporting Standard for Small and Medium-sized Entities (IFRS for SMEs) and the requirements of the Companies Act of South Africa;</li>
  <li>For such internal control as you determine is necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error; and</li>
  <li>To provide us with access to all information of which you are aware that is relevant to the preparation of the financial statements, such as records, documentation and other matters, additional information that we may request from you for the purpose of the review, and unrestricted access to persons within the entity from whom we determine it necessary to obtain evidence.</li>
</ul>
<p>As part of our audit, we will request from management and, where appropriate, from those charged with governance, written confirmation concerning representations made to us in connection with the audit.</p>
<p><em><strong>Reporting</strong></em></p>
<p>As stated above, our audit will be conducted with the objective of expressing an audit conclusion on the financial statements as a whole. Our audit conclusion will be communicated in a written report. If the audit conclusion on the financial statements of the ${entityType === 'cc' ? 'close corporation' : 'company'} is unmodified, it is currently expected to read as follows:</p>
<p>"In our opinion, the financial statements present fairly, in all material respects, the financial position as at ${yearEnd}, and its financial performance and cash flows for the year then ended in accordance with International Financial Reporting Standards for Small and Medium-sized Entities and the requirements of the Companies Act of South Africa."</p>
<p>However, the form and contents of our report may need to be amended in the light of our findings obtained from the audit.</p>
<p><em><strong>Reportable irregularities in terms of Regulation 29 of the Companies Regulations, 2011</strong></em></p>
<p>It is our responsibility to inform you regarding our obligation, in terms of Regulation 29 of the Companies Regulations, 2011, to report reportable irregularities to the Companies and Intellectual Property Commission (the Commission).</p>
<p>A "reportable irregularity" refers to any act or omission committed by any person responsible for the management of a ${entityType === 'cc' ? 'close corporation' : 'company'}, which:</p>
<ul>
  <li>Unlawfully has caused or is likely to cause material financial loss to the ${entityType === 'cc' ? 'close corporation' : 'company'} or to any member, shareholder, creditor or investor of the ${entityType === 'cc' ? 'close corporation' : 'company'} in respect of his, her or its dealings with that entity; or</li>
  <li>Is fraudulent or amounts to theft; or</li>
  <li>Causes or has caused the ${entityType === 'cc' ? 'close corporation' : 'company'} to trade under insolvent circumstances.</li>
</ul>
<p>We are not required to design procedures for the specific purpose of identifying reportable irregularities. However, we will consider all information that comes to our attention from any source in order to determine whether a reporting obligation arises. In instances where we are satisfied or have reason to believe that a reportable irregularity has taken place or is taking place, the practitioner responsible and accountable for the audit engagement is required, without delay, to send a written report to the Commission. Such a report initiates a series of activities in accordance with Regulation 29 of the Companies Regulations, 2011, pertaining to discussing the report with the members of the Board of the ${entityType === 'cc' ? 'close corporation' : 'company'}, obtaining representations from the Board and sending a final report to the Commission concluding on the existence and status of a reportable irregularity, including information relating to steps that have been taken for the prevention or recovery of any loss as a result thereof (if relevant). Please do not hesitate to contact us if you require further clarification regarding our obligation to report reportable irregularities to the Commission.</p>
<p><em><strong>Fees</strong></em></p>
<p>Our fees are based on the time required by the resources assigned to the engagement. The fees billed are based on the degree of responsibility involved, as well as the level of experience, knowledge and skill required. Our fees, together with disbursements, will be billed as work progresses, and settlement is due on presentation of our invoices.</p>
<p><em><strong>Agreement of terms</strong></em></p>
<p>We look forward to full cooperation with your staff during our audit. We are available to discuss this letter with you at any time. Once it has been agreed to, this letter will remain effective for future years unless it is terminated, amended or superseded. The individual practitioner responsible and accountable for the audit engagement is:</p>
<p><strong>${engPractitioner}</strong></p>
<p>Please sign and return the attached copy of this letter, including our standard terms and conditions, to indicate that it is in accordance with your understanding of, and agreement with, the arrangements for our audit of the financial statements, including our respective responsibilities.</p>
<p>Yours faithfully</p>
<br>
<p><strong>VDM AUDIT INC.</strong></p>
<br>
<p>We, the undersigned, being duly authorized to sign for or on behalf of the entity, herewith accept the above terms of the engagement.</p>
${engSigBlock}
<p style="margin-top:18px;">${dateSigned}</p>
${auditFooter()}
  </div>`;
  }

  // ── ATTORNEYS TRUST ACCOUNT ENGAGEMENT LETTER (Audit Letterhead) ──
  function buildAttorneysEngagementLetter() {
    const attSignerMap = {
      'R DE BEER': { name: 'Reinette De Beer', irba: '217890' },
      'L VAN DER MERWE': { name: 'L van der Merwe', irba: '______' }
    };
    const attSignerVal = getRadio('attEngSigner') || 'R DE BEER';
    const attSigner = attSignerMap[attSignerVal] || attSignerMap['R DE BEER'];

    // Compute period: "1 March [prevYear] to the year ended [yearEnd]"
    const yeParts = yearEnd.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    let periodStart = '1 March [YEAR]';
    if (yeParts) {
      const yeYear = parseInt(yeParts[3]);
      periodStart = `1 March ${yeYear - 1}`;
    }
    const periodStr = `the period from ${periodStart} to the year ended ${yearEnd}`;

    return `
  <div class="doc-page" style="font-size:9.5pt;">
${auditLetterhead()}
<br>
<p style="margin:0;line-height:1.6;">To the Directors</p>
<p style="margin:0;line-height:1.6;font-weight:bold;">${co}</p>
<p style="margin:0;line-height:1.6;">${dateSigned || '[DATE]'}</p>
<br>
<p>Dear Directors</p>
<p><strong>Engagement Letter</strong></p>
<p><strong>Independent Auditor's Reasonable Assurance Engagement on Legal Practitioners' Trust Accounts</strong></p>
<p>You have requested that we undertake:</p>
<p><em>A reasonable assurance engagement on whether the legal practitioners' trust accounts of ${co} were maintained, in all material respects, in compliance with Section 86, read with Section 63(1)(g), and Sections 87(1), 87(3) and 87(4) of the Legal Practice Act, No. 28 of 2014 (the Act), and Rules 54.6–54.13, 54.14.1–54.14.6, 54.14.7.2, 54.14.7.3, 54.14.8–54.14.16, 54.15, 54.16, 54.17, 54.18, 54.19, 54.31, 54.32, 54.33, 54.34, 54.35 and 55.1–55.11 of the South African Legal Practice Council Rules (the Rules), made under the authority of Sections 95(1), 95(3) and 109(2) of the Act, for ${periodStr}.</em></p>
<p>We clarify that we are not required to perform any procedures on records or documents relating to accounting for deceased estates, insolvent estates and trusts other than those dealt with via the legal practitioner's trust banking account(s).</p>
<p>In terms of the Advisory issued by the Legal Practice Council dated 17 April 2020, to agree the information extracted from the accounting records and included in the Legal Practitioner's Annual Statement on Trust Accounts for ${periodStr}, to the underlying records that were the subject of our engagement on whether the legal practitioners' trust accounts were maintained in compliance with the Act and the Rules that will accompany our assurance report to be submitted to the Legal Practice Council and report thereon.</p>
<p>In terms of the Advisory issued by the Legal Practice Council dated 17 April 2020, to also read your representations, the disclosures and other information in your Legal Practitioner's Annual Statement on Trust Accounts for the purpose of identifying any information that is inconsistent, based on our knowledge obtained in our engagement on the compliance of your legal practitioners' trust accounts with the Act and the Rules and report thereon.</p>
<p>Further, in terms of Rule 54.24.3, to report on whether or not, to the best of our knowledge, you have for ${periodStr}, carried on the business of an investment practice and complied with the related investment practice Rules, as required.</p>
<p><strong><em>Directors' responsibility for the trust accounts</em></strong></p>
<p>You are responsible for ensuring that your legal practitioners' trust accounts are maintained in compliance with the Act and the Rules; and for such internal control as you determine is necessary to maintain the integrity of those trust accounts in accordance with the relevant client mandates, including such controls as you determine are necessary to prevent and detect fraud and theft. You are also responsible for preparing the Legal Practitioner's Annual Statement on Trust Accounts and for the financial information and declarations contained therein and to provide us with:</p>
<ul>
  <li>Access to all information that the directors are aware of that is relevant to our engagement, including such business account records as we consider necessary;</li>
  <li><em>Additional information that we may request from the directors for the purpose of our engagement; and</em></li>
  <li>Unrestricted access to persons within the practice from whom we determine it necessary to obtain audit evidence.</li>
</ul>
<p>You are responsible for ensuring that the practice complies with relevant legislation.</p>
<p>As part of our engagement, we will request from you written confirmation concerning representations made to us in connection with our engagement. We will also ask you to confirm in that letter that all important and relevant information has been brought to our attention.</p>
<p><strong><em>Auditor's independence and quality control</em></strong></p>
<p>VDM Audit applies the International Standard on Quality Control 1, Quality Control for Firms that Perform Audits and Reviews of Financial Statements and Other Assurance and Related Services Engagements and accordingly maintains a comprehensive system of quality control, including documented policies and procedures regarding compliance with ethical requirements, professional standards and applicable legal and regulatory requirements.</p>
<p><strong><em>Auditor's responsibility</em></strong></p>
<p>Our responsibility is to express a reasonable assurance opinion on whether your legal practitioners' trust accounts were maintained in compliance with the Act and the Rules, based on our assurance procedures performed; and to report, as required, on the Legal Practitioner's Annual Statement on Trust Accounts and investment practice.</p>
<p><em>We will conduct our engagement in accordance with the International Standard on Assurance Engagements 3000 (Revised), Assurance Engagements Other than Audits or Reviews of Historical Financial Information (ISAE 3000 (Revised)), issued by the International Auditing and Assurance Standards Board. That standard requires that we plan and perform the engagement to obtain reasonable assurance about whether your legal practitioners' trust accounts were maintained, in all material respects, in compliance with the Act and the Rules, based on our assurance procedures to be performed; and to report, as required, on your Legal Practitioner's Annual Statement on Trust Accounts and investment practice.</em></p>
<p>A reasonable assurance engagement in accordance with ISAE 3000 (Revised) involves performing procedures to obtain evidence about whether the legal practitioners' trust accounts were maintained in compliance with the Act and the Rules. The nature, timing and extent of the procedures selected depend on our professional judgement, including the assessment of the risks of non-compliance with the Act and Rules, whether due to fraud, theft and error. In making those risk assessments, we will consider internal control that is relevant to the engagement in order to design procedures that are appropriate in the circumstances, but not for the purpose of expressing an opinion on the effectiveness of internal control. Our engagement will include the following procedures:</p>
<ul>
  <li><em>Considering, and applying when applicable in the engagement circumstances, the guidance in the Guide for Registered Auditors: Engagements on Legal Practitioners' Trust Accounts (Revised March 2020) issued by the IRBA.</em></li>
  <li>Making inquiries of the legal practitioner and persons within the practice.</li>
  <li>Testing of transactions for all significant service activities, with the objective of evaluating whether:
    <ul>
      <li>Transactions were appropriately identified as trust account transactions;</li>
      <li>Trust account transactions were made in accordance with mandates and supported by adequate documentation and narrative to identify from whom funds were received, and for whose credit;</li>
      <li>Deposits and withdrawals from the trust bank accounts were to, or for, a trust creditor; and</li>
      <li>Transfers to the legal practitioner's business bank accounts were only in respect of monies to be due to the legal practitioner.</li>
    </ul>
  </li>
  <li>Testing and/or scrutinising bank reconciliations, as we consider appropriate in the engagement circumstances, and evaluating the records made available to us against the external confirmations requested from financial institutions.</li>
</ul>
<p>Reasonable assurance is a high level of assurance, but is not a guarantee that an assurance engagement conducted in accordance with ISAE 3000 (Revised) will always detect a material misstatement when it exists. Misstatements can arise from actions or omissions to act due to fraud, theft or error and are considered material if they, individually or in aggregate, could reasonably be expected to influence relevant decisions of users taken on the basis of the subject matter information.</p>
<p>Due to the inherent limitations of an assurance engagement together with the inherent limitations of internal control, there is an unavoidable risk that some material misstatements may not be detected, even though the engagement is properly planned and performed in accordance with ISAE 3000 (Revised).</p>
<p>We shall not be responsible for reporting on any relevant events or transactions beyond the period covered by our reasonable assurance engagement. As part of an assurance engagement in accordance with ISAE 3000 (Revised), we exercise professional judgement and maintain professional scepticism throughout the engagement.</p>
<p><strong><em>Other matters</em></strong></p>
<p>None</p>
<p><strong><em>Our Report on the Compliance of the Legal Practitioner's Trust Accounts with the Act and the Rules</em></strong></p>
<p><em>We expect to issue a report containing an opinion that the legal practitioners' trust accounts of ${co} for ${periodStr} were maintained, in all material respects, in compliance with the Act and the Rules. However, should our evidence obtained not support that opinion, we are required by ISAE 3000 (Revised) to modify our opinion, listing exceptions and instances of non-compliance identified, or giving an explanation for reporting non-compliance.</em></p>
<p><strong><em>Report on Other Legal and Regulatory Requirements</em></strong></p>
<p><strong><em>Our Report on the Legal Practitioner's Annual Statement on Trust Accounts</em></strong></p>
<p>In terms of the Advisory issued by the Legal Practice Council dated 17 April 2020, we expect to report that we have agreed the information included in the attached Legal Practitioner's Annual Statement on Trust Accounts for ${periodStr} to the underlying records that were the subject of our engagement on whether the legal practitioner's trust accounts were maintained in compliance with the Act and the Rules.</p>
<p>We also expect to report that based on our reading of the legal practitioner's representations, the disclosures and other information contained in the Legal Practitioner's Annual Statement on Trust Accounts, we have not identified any information that is inconsistent with our knowledge obtained in the course of our engagement. We will state in our report that our opinion on the legal practitioner's trust accounts does not cover the Legal Practitioner's Annual Statement on Trust Accounts and we do not express an opinion thereon.</p>
<p>However, should our evidence obtained not support a positive report, our report will be amended accordingly.</p>
<p>Should we not be able to report as expected, we will discuss matters with you before finalising our report.</p>
<p><strong><em>Our report on the Legal Practitioner's Investment Practice</em></strong></p>
<p>In terms of Rule 54.24.3, we expect to report on whether or not, to the best of our knowledge, you have for ${periodStr}, carried on a business of an investment practice and complied with the related investment practice Rules.</p>
<p><strong><em>Reportable irregularities</em></strong></p>
<p>Please note that this assurance engagement meets the definition of audit, as contained in the Auditing Profession Act, 2005 (APA). We are subject to the requirements of Section 45 of the APA, and have a duty to report to the IRBA on reportable irregularities, as defined in the APA, that may be identified in the course of our engagement.</p>
<p>Where a reportable irregularity has been reported to the IRBA, we are required to include a paragraph on "Report on Other Legal and Regulatory Requirements" in our report, disclosing information relating to the reportable irregularity.</p>
<p><strong><em>Non-compliance with Laws and Regulations</em></strong></p>
<p>We wish to draw your attention to the professional obligation of the directors and employees of the audit firm to respond to identified or suspected Non-compliance with Laws and Regulations, as required in terms of Section 360 of the IRBA Code; and this may include the reporting of the non-compliance or suspected non-compliance to an appropriate authority under the appropriate circumstances.</p>
<p><strong><em>Restriction on the use and distribution of our report</em></strong></p>
<p>Our report will state that it is provided for the purpose indicated in the report; and it is not suitable for any other purpose; and that it is intended solely for your use, that of the Legal Practice Council and the Legal Practitioners Fidelity Fund; and should not be distributed to other parties.</p>
<p>Please sign and return the attached copy of this letter to indicate your acknowledgement of, and agreement with, the arrangements for our reasonable assurance engagement on whether your legal practitioners' trust accounts were maintained in compliance with the Act and the Rules; and to report, as required, on the Legal Practitioner's Annual Statement on Trust Accounts and investment practice, including our respective responsibilities.</p>
<br>
<p><strong><em>Registered Auditor's Signature</em></strong></p>
<br><br>
<p>________________________</p>
<p>${attSigner.name}</p>
<p>IRBA Registration Number ${attSigner.irba}</p>
<p>VDM Audit</p>
<br>
<p>Acknowledged and agreed by the directors</p>
<p>Yours faithfully</p>
<br>
${engSigBlock}
${auditFooter()}
  </div>`;
  }

  // ── CONDITIONAL ENGAGEMENT LETTER ASSEMBLY ──
  const wantsEngagement = getRadio('engagementLetter') === 'yes';
  let engagementLetterPages = '';
  if (wantsEngagement) {
    if (entityType === 'attorneys') {
      engagementLetterPages = buildAttorneysEngagementLetter();
    } else {
      if (document.getElementById('engTypeAccounting').checked) engagementLetterPages += buildAccountingEngagementLetter();
      if (document.getElementById('engTypeReview').checked) engagementLetterPages += buildReviewEngagementLetter();
      if (document.getElementById('engTypeAudit').checked) {
        if (entityType === 'club' || entityType === 'church') {
          engagementLetterPages += buildClubChurchAuditEngagementLetter();
        } else {
          engagementLetterPages += buildAuditEngagementLetter();
        }
      }
    }
  }

  // ── TRUST MINUTES PAGE ──
  let pageTrustMinutes = '';
  if (entityType === 'trust') {
    const agmVenue = getVal('trustAGMVenue') || '[VENUE]';
    const agmDate = getVal('trustAGMDate') || '[DATE]';
    const bankAcct = getRadio('trustBankAcct');
    const taxReg = getRadio('trustTax');
    const distrib = getRadio('trustDistributions');
    const donations = getRadio('trustDonations');
    const remun = getRadio('trustRemuneration');
    const deedChg = getRadio('trustDeedChanges');
    const deedText = getVal('trustDeedText') || '[DESCRIBE CHANGES]';
    const loaText = getVal('trustLoaText') || '[DESCRIBE CHANGES]';

    const bankPara = bankAcct === 'none'
      ? `<p class="underline-heading">BANK ACCOUNT</p>
     <p>A Bank account was opened at the establishment of the trust. The trustees, on behalf of the trust, decided that the bank account was unnecessary and stated that there is no bank account at this moment, due to the unnecessary costs.</p>`
      : '';

    const taxPara = taxReg === 'none'
      ? `<p>The trust had no taxable income after distributions to beneficiaries and was therefore never registered for tax.</p>`
      : '';

    const distribPara = distrib === 'yes'
      ? `<p>All income and/or capital distributions made to beneficiaries during the financial year were approved by the trustees. It is explicitly confirmed that the distributions to beneficiaries will not be compensated for by the physical cash flow, but rather by way of their loan accounts.</p>`
      : '';

    const donationsPara = donations === 'yes'
      ? `<p class="underline-heading">DONATIONS RECEIVED</p>
     <p>The trustees are grateful to all the donors for donations that were received during the financial year.</p>`
      : '';

    const remunPara = remun === 'approved'
      ? `<p>All trustees' remuneration, as shown in the Statement of Profit or Loss and Other Comprehensive Income, were approved.</p>`
      : `<p>It was decided that there will be no trustees' remuneration for this financial year.</p>`;

    const deedPara = deedChg === 'none'
      ? `<p>No major changes were made in the structure of the Trust Deed. No amendments were made to the Letter of Authority.</p>`
      : `<p>The following changes were made in the structure of the Trust Deed:</p>
     <p>${deedText}</p>
     <p>These amendments were made to the Letter of Authority:</p>
     <p>${loaText}</p>`;

    pageTrustMinutes = `
  <div class="doc-page">
<div class="page-header">
  ${reg ? `<div class="co-reg">(${reg})</div>` : ''}
</div>
<h2>Minutes of the Annual General Meeting of Trustees</h2>
<p style="text-align:center;font-style:italic;">held at ${agmVenue} on ${agmDate}.</p>
<br>
<p class="underline-heading">PRESENT</p>
<p>${dirList}</p>
<p class="underline-heading">NOTICE</p>
<p>The notice of the meeting was hereby regarded as read and, as a quorum, is present, the chairman declared the meeting as properly constituted.</p>
<p class="underline-heading">PREVIOUS MEETING</p>
<p>The minutes of the last meeting of the trustees were read, approved and signed.</p>
${bankPara}
<p class="underline-heading">FINANCIAL STATEMENTS</p>
<p>The annual financial statements for the year ended ${yearEnd}, together with the accounting officer's report, was presented. The trustees hereby condone all the transactions and consolidation of loan accounts reflected on the financial statements for the past year.</p>
${taxPara}
${distribPara}
<p class="underline-heading">ACCOUNTANTS</p>
<p>The accountant's remuneration for the past financial year, if applicable was determined as the amount set out in the financial statements. It was resolved that the present accountants of the trust, are hereby re-appointed as accountants for the ensuing year.</p>
${donationsPara}
<p class="underline-heading">TRUSTEES' REMUNERATION</p>
${remunPara}
<p class="underline-heading">SPECIFIC MATTERS</p>
${deedPara}
<p>It was hereby resolved that the present trustees of the trust are hereby re-appointed as trustees for the ensuing year.</p>
<p>We, the undersigned trustees, attended the above meeting and confirm that the minutes, as stated above, is a correct version of the proceedings.</p>
<div class="signature-block">
  ${sigBlock(dirs)}
</div>
  </div>`;
  }

  // ── CC MINUTES PAGE (CC only — single page: Members AGM) ──
  let ccMinutesPages = '';
  if (entityType === 'cc') {
    const ccVenue = (getVal('cc-minutes-venue') || '[VENUE]').toUpperCase();
    const ccDate = (getVal('cc-minutes-date') || '[DATE]').toUpperCase();
    const auditSentenceCC = (reportType === 'audit')
      ? `<p class="underline-heading">AUDITOR</p>
     <p>The auditor's remuneration for the past financial year is determined as the amount set out in the financial statements. It is resolved that the present auditors of the entity be hereby re-appointed as auditors for the ensuing year.</p>`
      : '';

    ccMinutesPages = `
  <div class="doc-page">
<div class="page-header">
  ${regLine}
</div>
<h2 style="letter-spacing:0.06em;">MINUTES OF THE ANNUAL GENERAL MEETING OF MEMBERS OF THE ENTITY<br>HELD AT ${ccVenue} ON ${ccDate}.</h2>
<br>
<p style="margin-bottom:12px;"><strong>PRESENT:</strong>&nbsp;&nbsp;&nbsp;&nbsp;${dirs.map(d => d.full).join(', ') || '[MEMBER NAMES]'}</p>
<p class="underline-heading">QUORUM AND NOTICE</p>
<p>As the necessary quorum was present, the chairman declared the meeting properly constituted and the notice convening the meeting was with the consent of the members, taken as read.</p>
<p class="underline-heading">MINUTES</p>
<p>The minutes of the previous annual general meeting were taken as read and signed by the chairman as a correct record of the proceedings.</p>
<p class="underline-heading">ADOPTION OF REPORT AND FINANCIAL STATEMENTS</p>
<p>The chairman stated that he had nothing further to add to the report of the members for the year ended ${yearEnd} and moved that the members' report and financial statements for the year ended ${yearEnd} be and they are hereby approved and adopted, and that all matters and business undertaken and discharged by the members on behalf of the entity be and they are hereby confirmed. The chairman's motion was seconded, put to the meeting and carried unanimously. It was resolved that any two of the members of the entity are hereby authorized to sign the aforesaid annual financial statements and members' report, and copies thereof.</p>
<p>It was then recorded that, to the best knowledge of the members, all assets and liabilities and contingent liabilities have been recorded in the financial statements. The members are of the opinion that none of the assets had (at date of the balance sheet and on realization in the ordinary course of the entity's business), a value less than the amounts at which they are stated in the balance sheet.</p>
${auditSentenceCC}
<p class="underline-heading">MEMBERS</p>
<p>The members' remuneration as set out in the financial statements is approved.</p>
<p class="underline-heading">GENERAL</p>
<p>It was resolved that the forthcoming annual general meeting of the entity be held on&nbsp;<span style="display:inline-block;min-width:200px;border-bottom:1px solid #333;">&nbsp;</span>.</p>
<p>Since all business is concluded, the meeting is adjourned.</p>
<p>We, the undersigned members, attended the above meeting and confirm that the minutes, as stated above, is a correct version of the proceedings.</p>
<div class="signature-block">${sigBlock(dirs)}</div>
  </div>`;
  }

  // ── MINUTES PAGES (Company only) ──
  let minutesPages = '';
  if (entityType === 'company') {
    const mVenue = (getVal('minutes-venue') || '[VENUE]').toUpperCase();
    const mDate = (getVal('minutes-date') || '[DATE]').toUpperCase();

    // ── Directors Meeting ──
    const pageDirMinutes = `
  <div class="doc-page">
<div class="page-header">
  ${regLine}
</div>
<h2 style="letter-spacing:0.06em;">MINUTES OF THE ANNUAL GENERAL MEETING OF DIRECTORS OF THE COMPANY<br>HELD AT ${mVenue} ON ${mDate}.</h2>
<br>
<p style="margin-bottom:12px;"><strong>PRESENT:</strong>&nbsp;&nbsp;&nbsp;&nbsp;${dirs.map(d => `<span style="display:inline-block;margin-right:48px;">${d.full}</span>`).join('')}</p>
<p style="font-style:italic;font-size:9pt;color:#888;margin:-4px 0 16px;">(Directors present should cross out their own name above to confirm attendance.)</p>
<p>The directors hereby decide unanimously that:</p>
<p>It was resolved that the annual financial statements for the year ended ${yearEnd} (to be laid before the company at the forthcoming annual general meeting) and as now submitted for approval by the board of directors, be hereby approved both as to contents and as to form.</p>
<p>It was resolved that the form and content of the report by the directors, pursuant to the Companies Act and as now submitted for the approval of the board of directors, be hereby approved and adopted for the said purpose.</p>
<p>It was resolved that any two of the directors of the company are hereby authorized to sign the aforesaid annual financial statements and directors' report, and copies thereof, for and on behalf of the board.</p>
<p>It was then recorded that, to the best knowledge of the directors, all assets and liabilities and contingent liabilities have been recorded in the financial statements. The directors are of the opinion that none of the assets had (at date of the balance sheet and on realization in the ordinary course of the company's business), a value less than the amounts at which they are stated in the balance sheet.</p>
<p>It was resolved that the forthcoming annual general meeting of the company be held on&nbsp;<span style="display:inline-block;min-width:200px;border-bottom:1px solid #333;">&nbsp;</span>.</p>
<p>Since all business is concluded, the meeting is adjourned.</p>
<p>We, the undersigned directors, attended the above meeting and confirm that the minutes, as stated above, is a correct version of the proceedings.</p>
<div class="signature-block">${sigBlock(dirs)}</div>
  </div>`;

    // ── Shareholders AGM ──
    const shareholders = getShareholders();
    const shPresentList = shareholders.length
      ? shareholders.map(sh => sh.type === 'entity' && sh.proxy ? sh.proxy + ' (on behalf of ' + sh.name + ')' : sh.name).join(', ')
      : '[SHAREHOLDER NAMES]';

    function shSigBlock() {
      const list = shareholders.length ? shareholders : [{ name: '[SHAREHOLDER]', type: 'individual', proxy: '' }];
      let html = '<div style="display:flex;flex-wrap:wrap;gap:8px 48px;margin-top:20px;">';
      list.forEach(sh => {
        const label = (sh.type === 'entity' && sh.proxy)
          ? sh.proxy + '<br><span style="font-size:9pt;font-weight:400;">on behalf of ' + sh.name + '</span>'
          : sh.name;
        html += '<div style="min-width:190px;margin-bottom:28px;">'
          + '<div style="min-height:50px;"></div>'
          + '<div style="border-bottom:1px solid #333;width:220px;margin-bottom:6px;">&nbsp;</div>'
          + '<div class="sig-name" style="font-size:9.5pt;">' + label + '</div>'
          + '</div>';
      });
      html += '</div>';
      return html;
    }

    const auditSentence = (reportType === 'audit')
      ? `<p>The auditor's remuneration for the past financial year is determined as the amount set out in the financial statements. It is resolved that the present auditors of the company be hereby re-appointed as auditors for the ensuing year.</p>`
      : '';

    const pageShAGM = `
  <div class="doc-page">
<div class="page-header">
  ${regLine}
</div>
<h2 style="letter-spacing:0.06em;">MINUTES OF THE ANNUAL GENERAL MEETING OF SHAREHOLDERS OF THE COMPANY<br>HELD AT ${mVenue} ON ${mDate}.</h2>
<br>
<p style="margin-bottom:12px;"><strong>PRESENT:</strong>&nbsp;&nbsp;&nbsp;&nbsp;${shPresentList}</p>
<p class="underline-heading">Quorum and Notice</p>
<p>As the necessary quorum was present, the chairman declared the meeting properly constituted and the notice convening the meeting was with the consent of the shareholders, taken as read.</p>
<p>The minutes of the previous annual general meeting were taken as read and signed by the chairman as a correct record of the proceedings.</p>
<p class="underline-heading">Adoption of Report and Financial Statements</p>
<p>The chairman stated that he had nothing further to add to the report of the directors for the year ended ${yearEnd} and moved that the directors' report and financial statements for the year ended ${yearEnd} be and they are hereby approved and adopted, and that all matters and business undertaken and discharged by the directors on behalf of the company be and they are hereby confirmed. The chairman's motion was seconded, put to the meeting and carried unanimously.</p>
${auditSentence}
<p class="underline-heading">Directors</p>
<p>It was resolved that the present directors of the company are hereby re-appointed for the ensuing year. The directors' remuneration as set out in the financial statements is approved.</p>
<p>Since all business is concluded, the meeting is adjourned.</p>
<p>We, the undersigned shareholders, attended the above meeting and confirm that the minutes, as stated above, is a correct version of the proceedings.</p>
${shSigBlock()}
  </div>`;

    minutesPages = pageDirMinutes + pageShAGM;
  }

  // ── MANAGEMENT REPRESENTATION LETTER (all except school and attorneys) ──
  let reprLetter = '';
  if (entityType !== 'school' && entityType !== 'attorneys') {
    // Adapt terminology per entity type
    const reprEntityLabel = entityType === 'cc' ? 'close corporation'
      : entityType === 'trust' ? 'trust'
        : entityType === 'npo' ? 'organisation'
          : entityType === 'bc' ? 'body corporate'
            : entityType === 'church' ? 'church'
              : entityType === 'club' ? 'club'
                : 'company';
    const reprBodyTerm = dirCount === 1 ? terms.singular : terms.plural;
    const reprSignatories = dirCount === 1
      ? `the ${reprBodyTerm.toLowerCase()}`
      : `the ${reprBodyTerm.toLowerCase()}`;
    const reprAssets = entityType === 'trust'
      ? 'the trust'
      : `the ${reprEntityLabel}`;
    const reprShares = (entityType === 'company')
      ? `<p>15. All material share or other options granted by the ${reprEntityLabel} and material bonus or other profit sharing arrangements, have been adequately disclosed or provided for.</p>`
      : '';

    reprLetter = `
  <div class="doc-page">
<div style="margin-bottom:20px;">
  <p style="font-size:10pt;font-weight:700;margin:0 0 2px;">VDM Chartered Accountants</p>
  <p style="font-size:9.5pt;margin:0 0 2px;">PO Box 450</p>
  <p style="font-size:9.5pt;margin:0 0 2px;">Standerton</p>
  <p style="font-size:9.5pt;margin:0;">2430</p>
</div>
<p>Dear Sir</p>
<br>
<p><strong>${coUpper}</strong></p>
${reg ? `<p><strong>(Registration Number ${reg})</strong></p>` : ''}
<br>
<p>In connection with your examination of the financial statements for the year ended on <strong>${yearEnd ? yearEnd.toUpperCase() : '[YEAR END]'}</strong> we confirm to the best of our knowledge and belief that:</p>
<ol style="font-size:9.5pt;line-height:1.65;padding-left:22px;margin-top:10px;">
  <li>The financial statements fairly present the financial position and results of operations in conformity with International Financial Reporting Standards for Small and Medium-sized Entities.</li>
  <li>All minutes of the meetings of ${reprSignatories} and committees (or summaries of actions of recent meetings for which minutes have not yet been prepared) and all financial and accounting records and related data have been made available to you.</li>
  <li>We are not aware of any material accounts, transactions or agreement which are not fairly described and properly recorded in the accounting records, which could have any material effect on the financial statements.</li>
  <li>We are not aware of:
    <ul style="margin-top:4px;">
      <li>any irregularities involving management or employees who have significant roles in the system of internal accounting control or any irregularities involving other employees which could have a material effect on the financial statements; or</li>
      <li>any violations or possible violations of laws or regulations whose effect should be considered for disclosure in the financial statements or as a basis for recording a contingent loss.</li>
    </ul>
  </li>
  <li>Adequate provision not considered to be excessive, has been made for:
    <ul style="margin-top:4px;">
      <li>All known material liabilities, other than contingent liabilities in respect of which no actual liability is expected to arise, which existed at the balance sheet date;</li>
      <li>all material losses expected to arise from events which had occurred by the statement of financial position date.</li>
    </ul>
  </li>
  <li>At the statement of financial position date, except as provided for or as noted in the financial statements, there were no material contingent liabilities.</li>
  <li>Except as indicated in the financial statements:
    <ul style="margin-top:4px;">
      <li>none of the liabilities was secured, otherwise than by the operation of law, on any assets of ${reprAssets}</li>
      <li>the assets reflected in the statement of financial position were owned by ${reprAssets} at the statement of financial position date, free of any charges in favour of third parties.</li>
    </ul>
  </li>
  <li>At the statement of financial position date: there were no commitments under contracts placed for capital expenditure or capital expenditure authorised by ${reprSignatories} which had not been contracted for which were not disclosed in the financial statements.</li>
  <li>The method by which management proposes to finance commitments for any capital expenditure either contracted for or authorised is adequately disclosed in the financial statements.</li>
  <li>The net book amounts at which the premises, plant and equipment are stated in the statement of financial position were arrived at after:
    <ul style="margin-top:4px;">
      <li>taking into account as additions all expenditure during the year which represented capital outlay on these assets but no expenditure of a revenue nature;</li>
      <li>writing off all amounts relating to items which had been sold or scrapped by the statement of financial position date;</li>
      <li>providing for depreciation on a scale sufficient to cover obsolescence as well as wear and tear and thus to reduce the net book amounts of the assets to their residual value by the time they become no longer economically useful to ${reprAssets}.</li>
    </ul>
  </li>
  <li>Any decline in the value of long term investments not provided for is considered to be of a temporary nature.</li>
  <li>Current assets shown in the balance sheet are all expected to produce at least the amounts at which they are stated on realisation in the ordinary course of the business.</li>
  <li>Except as disclosed in the financial statements, the results of operations for the year were not materially affected by transactions of an extraordinary or abnormal nature, or items relative to a prior year.</li>
  <li>Material commitments for future purchases are for quantities not in excess of anticipated requirements, and are at prices which should not result in loss. Material losses are not expected to be sustained in the fulfilment of, or the inability to fulfil, any sales commitments.</li>
  ${reprShares}
  <li>The ${reprEntityLabel} has complied with all aspects of contractual agreements that could have a material effect on the financial statements in the event of non-compliance, except as disclosed in the financial statements.</li>
  <li>Known events subsequent to the statement of financial position date have been accounted for or appropriately disclosed in so far as they materially affect fair presentation in the financial statements.</li>
  <li>Stocks is valued at the lower of cost or net realisable value and represent the total value of all stock on hand at year end.</li>
  <li>The amount shown as trade debtors reflect the total debts owed to ${reprAssets} as per the books of account, after writing off bad debts. To the best of our knowledge all debtors at year end have been taken into account, as well as all other accounts receivable.</li>
  <li>All trade creditors and other liabilities have been brought to account and the figure shown in the statement of financial position represents to the best of our knowledge the total amount due for trade and other creditors.</li>
</ol>
<p style="margin-top:16px;"><strong>Yours Faithfully</strong></p>
<div class="signature-block">
  ${sigBlock(dirs)}
</div>
<p>${dateApproved}</p>
  </div>`;
  }

  // ── LOAN CERTIFICATE PAGES (Company, CC, Trust) ──
  // Built inline so caLetterhead() (a nested fn) is in scope
  let loanCertPages = '';
  if (entityType === 'company' || entityType === 'cc' || entityType === 'trust') {
    const certs = getLoanCerts();
    loanCertPages = certs.map(cert => {
      const lcName = cert.name || '[BORROWER / LENDER]';
      const lcAmtFmt = cert.amount ? formatNumber(cert.amount) : '[AMOUNT]';
      const lcDebitAmt = cert.balance === 'debit' ? lcAmtFmt : '';
      const lcCreditAmt = cert.balance === 'credit' ? lcAmtFmt : '';
      const lcSigned = cert.date
        ? `<p style="margin-top:36px;font-size:10pt;">SIGNED AT ${cert.date}.</p>`
        : `<p style="margin-top:36px;font-size:10pt;">SIGNED AT <span style="display:inline-block;min-width:200px;border-bottom:1px solid #333;">&nbsp;</span> ON <span style="display:inline-block;min-width:40px;border-bottom:1px solid #333;">&nbsp;</span> DAY OF <span style="display:inline-block;min-width:120px;border-bottom:1px solid #333;">&nbsp;</span> ${new Date().getFullYear()}.</p>`;
      return `
  <div class="doc-page">
<div style="text-align:center;margin:28px 0 20px;">
  <h2 style="font-size:13pt;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px;">LOAN CERTIFICATE</h2>
  <p style="font-size:11pt;font-weight:700;margin:0 0 4px;">${coUpper}</p>
  <p style="font-size:10.5pt;margin:0 0 4px;">LOAN AS AT ${yearEnd ? yearEnd.toUpperCase() : '[YEAR END]'}</p>
  <p style="font-size:10.5pt;margin:0 0 20px;">LOAN FROM/(TO):&nbsp;&nbsp;<strong>${lcName}</strong></p>
</div>
<table style="width:100%;border-collapse:collapse;font-family:'Poppins',sans-serif;font-size:10pt;margin-bottom:24px;">
  <thead>
    <tr>
      <td style="width:60%;padding:4px 0;"></td>
      <td style="width:20%;text-align:right;font-weight:700;padding:4px 8px;border-bottom:1.5px solid #333;">DEBIT</td>
      <td style="width:20%;text-align:right;font-weight:700;padding:4px 8px;border-bottom:1.5px solid #333;">CREDIT</td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:8px 0 4px;vertical-align:top;">Loan account balance at end of year</td>
      <td style="text-align:right;padding:8px 8px 4px;vertical-align:top;">${lcDebitAmt}</td>
      <td style="text-align:right;padding:8px 8px 4px;vertical-align:top;">${lcCreditAmt}</td>
    </tr>
    <tr><td colspan="3" style="border-top:1px solid #ccc;padding-top:2px;"></td></tr>
  </tbody>
</table>
<div style="font-size:10pt;line-height:1.7;margin-bottom:8px;">
  <p>I, the undersigned, hereby certify that I have scrutinised the entries in my loan account in the records of the entity and that I agree with the balance as set out above. The loan is unsecured.</p>
</div>
${lcSigned}
<div style="margin-top:50px;">
  <div style="border-bottom:1px solid #333;width:280px;margin-bottom:6px;">&nbsp;</div>
  <p style="font-size:10pt;font-weight:700;margin:0;">LENDER/(BORROWER)</p>
</div>
  </div>`;
    }).join('');
  }

  let assembledPages = '';

  if (entityType === 'attorneys') {
    // Attorneys: Cover + Attorneys Trust Account Report + Engagement Letter (no repr letter, no policies)
    assembledPages = coverPage + pageAttorneysAudit + engagementLetterPages;
  } else if (entityType === 'trust') {
    // Trust: Cover + CA Declaration + Compiler's Report + Minutes + Policies + Loan Certs + Engagement Letters + Repr Letter
    assembledPages = coverPage + page1 + page3 + pageTrustMinutes + policyPages + loanCertPages + engagementLetterPages + reprLetter;
  } else if (entityType === 'npo') {
    // NPO: Cover + Review or Audit Report + Policies + Engagement Letters + Repr Letter
    if (reportType === 'review') {
      assembledPages = coverPage + pageReview + policyPages + engagementLetterPages + reprLetter;
    } else {
      assembledPages = coverPage + pageAudit + policyPages + engagementLetterPages + reprLetter;
    }
  } else if (entityType === 'school') {
    // School: Cover + School Audit Report + Policies (no repr letter)
    assembledPages = coverPage + pageSchoolAudit + policyPages;
  } else if (entityType === 'church') {
    // Church: Cover + Audit Report + (optional) Policies + Repr Letter
    const includeChurchPolicies = getRadio('churchPolicies') !== 'no';
    assembledPages = coverPage + pageAudit + (includeChurchPolicies ? policyPages : '') + engagementLetterPages + reprLetter;
  } else if (entityType === 'club') {
    // Club: Cover + Audit Report + Policies + Repr Letter
    assembledPages = coverPage + pageAudit + policyPages + engagementLetterPages + reprLetter;
  } else if (entityType === 'bc') {
    // Body Corporate: Cover + Trustees' Responsibilities (pg1) + Audit Report (pg2) + Trustees' Report (pg3) + Policies + (optional) AGM Minutes
    const pageBcAudit = pageAudit.replace(`<div class="page-number">${pg3}</div>`, `<div class="page-number">${pg2}</div>`);

    // ── AGM MINUTES PAGE ──
    let pageBcAGM = '';
    if (getRadio('bcAGM') === 'yes') {
      const agmVenue = getVal('bcAGMVenue') || '[VENUE]';
      const agmDate = getVal('bcAGMDate') || '[DATE]';
      pageBcAGM = `
  <div class="doc-page">
${auditLetterhead()}
<div class="page-header">
  ${reg ? `<div class="co-reg">(Sectional Title Scheme Number — ${reg})</div>` : ''}
</div>
<h2 style="margin-top:8px;">Minutes of the Annual General Meeting of Trustees of the Body Corporate</h2>
<p style="text-align:center;font-style:italic;">held at ${agmVenue} on ${agmDate}.</p>
<br>
<p class="underline-heading">Present</p>
<p>${dirList}</p>
<p class="underline-heading">Quorum and Notice</p>
<p>As the necessary quorum was present, the chairman declared the meeting properly constituted and the notice convening it was, with the consent of the trustees, taken as read.</p>
<p class="underline-heading">Minutes</p>
<p>The minutes of the previous annual general meeting were taken as read and signed by the chairman as a correct record of the proceedings.</p>
<p class="underline-heading">Adoption of Report and Financial Statements</p>
<p>It was resolved that the annual financial statements for the year ending ${yearEnd} and as now submitted for approval by the board of trustees, be hereby approved both as to contents and as to form.</p>
<p>It was resolved that the form and content of the report by the trustees, pursuant to the Sectional Titles Act 2011 and as now submitted for the approval of the board of trustees, be hereby approved and adopted for the said purpose.</p>
<p>It was resolved that any two of the trustees of the body corporate are hereby authorized to sign the aforesaid annual financial statements and trustees' report, and copies thereof, for and on behalf of the board.</p>
<p>It was then recorded that, to the best knowledge of the trustees, all assets and liabilities and contingent liabilities have been recorded in the financial statements. The trustees are of the opinion that none of the assets had (at date of the balance sheet and on realization in the ordinary course of the body corporate's business), a value less than the amounts at which they are stated in the balance sheet.</p>
<p>The chairman stated that he had nothing further to add to the report of the trustees for the year ending ${yearEnd} and moved that the trustees' report and financial statements for the year ending ${yearEnd} be and they are hereby approved and adopted, and that all matters and business undertaken and discharged by the trustees on behalf of the body corporate be and they are hereby confirmed. The chairman's motion was seconded, put to the meeting and carried unanimously.</p>
<p class="underline-heading">Auditor</p>
<p>The chairman stated that as no proposals were received regarding the appointment of auditors, the present auditors are hereby re-appointed for the ensuing year.</p>
<p class="underline-heading">Trustees</p>
<p>It was resolved that the present trustees of the body corporate be and they are hereby re-appointed for the ensuing year. The trustees' remuneration as set out in the financial statements is approved.</p>
<p>There being no further business, the meeting terminated.</p>
<p>We, the undersigned trustees, were present and confirm the minutes to be correctly set out the proceedings of the meeting.</p>
<div class="signature-block">
  ${sigBlock(dirs)}
</div>
<p>${agmDate}</p>
${auditFooter()}
  </div>`;
    }

    assembledPages = coverPage + pageTrusteesResponsibilities + pageBcAudit + pageTrusteesReport + policyPages + pageBcAGM + engagementLetterPages + reprLetter;
  } else {
    // Company, CC: Cover + CA Declaration + Responsibilities + Report + Directors' Report + Policies + Loan Certs + Minutes + Repr Letter
    if (reportType === 'compilation') {
      assembledPages = coverPage + page1 + page2 + page3 + page4 + policyPages + engagementLetterPages + loanCertPages + (entityType === 'cc' ? ccMinutesPages : minutesPages) + reprLetter;
    } else if (reportType === 'review') {
      assembledPages = coverPage + page2 + pageReview + page4 + policyPages + engagementLetterPages + loanCertPages + (entityType === 'cc' ? ccMinutesPages : minutesPages) + reprLetter;
    } else {
      // Audit
      assembledPages = coverPage + page2 + pageAudit + page4 + policyPages + engagementLetterPages + loanCertPages + (entityType === 'cc' ? ccMinutesPages : minutesPages) + reprLetter;
    }
  }

  return assembledPages;

  }
}
