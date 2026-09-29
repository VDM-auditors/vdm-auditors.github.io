/* ── VDM Questionnaire — form mode ──────────────────────────────────────
   One link for every client. The first screen asks which of two forms this
   is, and everything that differs between them keys off VDMMode.isNew():

     existing  New / existing client — the entity is already registered.
               Registration / tax numbers, 6 steps incl. the CIPC mandate,
               owner-password-locked PDF with a fillable mandate page.
     new       Register a new entity — nothing is registered yet. Up to four
               proposed names, no registration / tax numbers, no mandate
               (5 steps), flat PDF, and a new trust goes through trust.js.

   Markup marked .existing-only / .new-only is shown by the body class alone.

   Links can skip the choice: ?mode=new or ?mode=existing, and ?type=<entity>
   preselects an entity card (e.g. ?mode=new&type=trust).

   Uses VDMUI.icon() from ui.js, and globals from index.html: state, goStep, currentStep, maxStepReached,
   selectEntity, updateEntityInfoLabels, updateProgress.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const TEXT = {
    existing: {
      icon: 'briefcase',
      label: '<strong>New / Existing Client</strong> — the entity is already registered',
      title: 'New / Current Client Questionnaire',
      subtitle: 'Please ensure that all fields are completed accurately and in full. This information is required for registration and compliance purposes',
      subject: 'VDM Questionnaire — ',
      fallbackName: 'New Client',
      filePrefix: 'VDM_Questionnaire_'
    },
    new: {
      icon: 'file-plus',
      label: '<strong>Register a New Entity</strong> — the entity does not exist yet',
      title: 'New Entity Registration Questionnaire',
      subtitle: 'Complete this form to register a new entity. Please ensure that all fields are completed accurately and in full — this information is required to register the entity and for compliance purposes',
      subject: 'VDM New Entity Registration — ',
      fallbackName: 'New Entity',
      filePrefix: 'VDM_Entity_Registration_'
    }
  };

  let mode = null;

  const isNew = () => mode === 'new';
  const text = key => TEXT[mode || 'existing'][key];
  // Step 5 is the mandate, which only an existing entity signs.
  const steps = () => isNew() ? [1, 2, 3, 4, 6] : [1, 2, 3, 4, 5, 6];

  function choose(m) {
    const changed = mode !== null && mode !== m;
    mode = m;
    document.body.classList.toggle('mode-new', m === 'new');
    ['existing', 'new'].forEach(k => document.getElementById('mode_' + k).classList.toggle('selected', k === m));
    document.getElementById('headerTitle').textContent = text('title');
    document.getElementById('headerSubtitle').textContent = text('subtitle');
    document.getElementById('modeLabel').innerHTML = VDMUI.icon(text('icon')) + text('label');
    document.title = 'VDM — ' + text('title');
    document.getElementById('stepNav').classList.remove('hidden');
    if (state.entityType) updateEntityInfoLabels(state.entityType);
    // The later steps are built differently per mode, so walk through them again.
    if (changed) maxStepReached = 1;
    goStep(1);
  }

  function showChoice() {
    ['step1', 'step2', 'step3', 'step4', 'step5', 'step6'].forEach(s => document.getElementById(s).classList.add('hidden'));
    document.getElementById('step0').classList.remove('hidden');
    document.getElementById('stepNav').classList.add('hidden');
    document.getElementById('progressBar').style.width = '0%';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    if (type && document.getElementById('ec_' + type)) selectEntity(type);
    const m = params.get('mode');
    if (m === 'new' || m === 'existing') choose(m);
    else document.getElementById('progressBar').style.width = '0%';
  });

  window.VDMMode = { choose, showChoice, isNew, text, steps };
})();
