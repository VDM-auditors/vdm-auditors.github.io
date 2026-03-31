// utils.js — Shared utility functions
/* globals: getVal, getRadio, formatNumber, toggleVisible, toProperCase, formatIdNumber, toTitleCase */

function getVal(id) {
  return (document.getElementById(id)?.value || '').trim();
}

function getRadio(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || '';
}

// Format a number string with thousand separators, preserving decimals
function formatNumber(val) {
  if (!val) return val;
  // Remove existing commas/spaces to normalise
  const cleaned = val.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return val; // not a number, return as-is
  // Format with thousand separators and up to 2 decimal places
  return num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toggleVisible(id, show) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('visible', show);
}

function toProperCase(str) {
  if (!str) return str;
  return str.toLowerCase().replace(/(?:^|\s|,\s*)\S/g, c => c.toUpperCase())
            .replace(/\bPo\b/gi, 'PO').replace(/\bP\.o\./gi, 'P.O.');
}

// ── ID NUMBER FORMATTING (SA: 000000 0000 00 0) ──
function formatIdNumber(el) {
  const raw = el.value.replace(/\s/g, '');
  if (!/^\d*$/.test(raw)) { el.value = raw.replace(/\D/g, ''); return; }
  let formatted = '';
  for (let i = 0; i < raw.length && i < 13; i++) {
    if (i === 6 || i === 10 || i === 12) formatted += ' ';
    formatted += raw[i];
  }
  const cursor = el.selectionStart;
  el.value = formatted;
}

function toTitleCase(str) {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}

// ── Shared importer helpers ──

// Map VDM partner name to signer value
const SIGNER_MAP = {
  'LEON VAN DER MERWE': 'L VAN DER MERWE',
  'L VAN DER MERWE': 'L VAN DER MERWE',
  'HENDRIK LEON VAN DER MERWE': 'HL VAN DER MERWE',
  'HL VAN DER MERWE': 'HL VAN DER MERWE',
  'REINETTE DE BEER': 'R DE BEER',
  'R DE BEER': 'R DE BEER',
  'RIEKIE WOLMARANS': 'R WOLMARANS',
  'R WOLMARANS': 'R WOLMARANS',
};

function mapSigner(partnerRaw) {
  if (!partnerRaw) return null;
  const pName = partnerRaw.replace(/\s*\[.*\]/, '').trim().toUpperCase();
  return SIGNER_MAP[pName] || null;
}

// Parse "MR LEON VAN DER MERWE" → { initials, surname }
function parseName(raw) {
  const cleaned = raw
    .replace(/\s*\(Appointed.*?\)/i, '')
    .replace(/^(MR|MRS|MS|MISS|DR|PROF|ADV|ME|MNR)\s+/i, '')
    .trim();
  const parts = cleaned.split(/\s+/);
  const surname = parts.pop() || '';
  const initials = parts.map(p => p.charAt(0).toUpperCase()).join('');
  return { initials, surname };
}

// "28 February 2024" → "28 February 2023"
function calcPrevYearEnd(yearEndStr) {
  if (!yearEndStr) return '';
  const m = yearEndStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  return m ? `${m[1]} ${m[2]} ${parseInt(m[3]) - 1}` : '';
}
