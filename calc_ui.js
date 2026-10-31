// 06_web_project/calc_ui.js
// Bilingual (RU + HE) Calculator Runner, Form Label Localization, Clear Controls & Printable/Copyable Calculation Cards

(function (root) {
  'use strict';

  const STORAGE_KEY_UNITS = 'eng_lib_v11_unit_system';
  const STORAGE_KEY_CURRENCY = 'eng_lib_v12_currency';
  let currentUnitSystem = 'si';
  let currentCurrency = '$';
  let domSiInitialized = false;

  function getLang() {
    return (root.AppState && root.AppState.lang) || document.documentElement.lang || 'ru';
  }

  function getUnitSystem() {
    return currentUnitSystem === 'us' ? 'us' : 'si';
  }
  root.getCalculatorUnitSystem = getUnitSystem;

  function getCurrency() {
    return currentCurrency === '₪' ? '₪' : '$';
  }
  root.getCalculatorCurrency = getCurrency;

  function valOf(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function isFieldConvertedNow(id, unitSys = getUnitSystem()) {
    const UC = root.UnitConverter;
    if (!UC || !UC.FIELD_UNIT_MAP) return false;
    const cfg = UC.FIELD_UNIT_MAP[id];
    if (!cfg || cfg.quantity === 'none' || cfg.quantity === 'si_only') return false;
    // Trap 4: Module 1A in doe_s21_imperial mode already operates in native DOE imperial units
    if (cfg.doeBypass && valOf('c1a_mode') === 'doe_s21_imperial') return false;
    // Trap 5: Module 5A input value converts between bar and psi according to #c5a_unit
    if (id === 'c5a_pval') {
      const u5a = valOf('c5a_unit');
      if (u5a === 'kpa') return false;
      return unitSys === 'us' || u5a === 'psi';
    }
    return unitSys === 'us';
  }

  function syncSingleInputFromDOM(el, activeSys = getUnitSystem()) {
    if (!el || !el.id) return;
    const UC = root.UnitConverter;
    const cfg = UC && UC.FIELD_UNIT_MAP && UC.FIELD_UNIT_MAP[el.id];
    if (!cfg) return;

    const raw = el.value;
    if (raw === '' || raw.trim() === '') {
      el.dataset.siValue = '';
      el.dataset.siDisplay = '';
      el.dataset.displayedValue = '';
      return;
    }
    // If displayed value hasn't changed since last sync, preserve exact data-si-value!
    if (
      el.dataset.siValue !== undefined &&
      el.dataset.siValue !== '' &&
      raw === el.dataset.displayedValue &&
      (el.id !== 'c5a_pval' || el.dataset.c5aUnit === valOf('c5a_unit'))
    ) {
      return;
    }

    const num = Number(raw.trim().replace(/\s+/g, '').replace(',', '.'));
    const qDef = UC && UC.QUANTITIES && UC.QUANTITIES[cfg.quantity];
    const decSi = cfg.decimalsSi !== undefined ? cfg.decimalsSi : (qDef && qDef.inputDecimalsSi !== undefined ? qDef.inputDecimalsSi : 2);

    if (el.id === 'c5a_pval') {
      const u5a = valOf('c5a_unit');
      if (Number.isFinite(num)) {
        if (u5a === 'psi') {
          const siNum = UC.toSI('pressure_g', num);
          el.dataset.siValue = String(siNum);
          el.dataset.siDisplay = UC.formatForInput(siNum, decSi);
        } else {
          el.dataset.siValue = raw;
          el.dataset.siDisplay = raw;
        }
      } else {
        el.dataset.siValue = raw;
        el.dataset.siDisplay = raw;
      }
      el.dataset.displayedValue = raw;
      el.dataset.c5aUnit = u5a;
      return;
    }

    if (isFieldConvertedNow(el.id, activeSys) && Number.isFinite(num)) {
      const siNum = UC.toSI(cfg.quantity, num);
      el.dataset.siValue = String(siNum);
      el.dataset.siDisplay = UC.formatForInput(siNum, decSi);
    } else {
      el.dataset.siValue = raw;
      el.dataset.siDisplay = raw;
    }
    el.dataset.displayedValue = raw;
  }

  function ensureAllSiValuesSynced(activeSys = getUnitSystem()) {
    const UC = root.UnitConverter;
    if (!UC || !UC.FIELD_UNIT_MAP) return;
    for (const id of Object.keys(UC.FIELD_UNIT_MAP)) {
      const el = document.getElementById(id);
      if (!el || el.tagName === 'SELECT') continue;
      syncSingleInputFromDOM(el, activeSys);
    }
  }

  /**
   * Returns the exact metric (SI) string for calculator engine consumption.
   */
  function siValOf(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    if (el.tagName === 'SELECT') return el.value;
    if (el.value === '' || el.value.trim() === '') {
      el.dataset.siValue = '';
      el.dataset.displayedValue = '';
      return '';
    }
    const UC = root.UnitConverter;
    const cfg = UC && UC.FIELD_UNIT_MAP && UC.FIELD_UNIT_MAP[id];
    if (cfg && cfg.doeBypass && valOf('c1a_mode') === 'doe_s21_imperial') {
      return el.value;
    }
    syncSingleInputFromDOM(el, getUnitSystem());
    return el.dataset.siValue !== undefined ? el.dataset.siValue : el.value;
  }

  /**
   * Called at the end of loadPreset* functions (where metric values were just written to .value).
   * Stores the exact metric value in data-si-value and, if currently in US mode, formats the
   * input display to Imperial units.
   */
  function syncModuleInputsFromPreset(moduleCode) {
    const UC = root.UnitConverter;
    if (!UC || !UC.FIELD_UNIT_MAP) return;
    const sys = getUnitSystem();

    if (moduleCode === '5A') {
      const unitSel = document.getElementById('c5a_unit');
      if (unitSel) unitSel.value = sys === 'us' ? 'psi' : 'bar';
    }

    for (const [id, cfg] of Object.entries(UC.FIELD_UNIT_MAP)) {
      if (cfg.module !== moduleCode) continue;
      const el = document.getElementById(id);
      if (!el || el.tagName === 'SELECT') continue;
      const metricStr = el.value;
      el.dataset.siValue = metricStr;
      el.dataset.siDisplay = metricStr;
      if (metricStr === '' || metricStr.trim() === '') {
        el.dataset.displayedValue = '';
        continue;
      }
      if (isFieldConvertedNow(id, sys)) {
        const siNum = Number(metricStr.trim().replace(',', '.'));
        if (Number.isFinite(siNum)) {
          const usNum = UC.toImperial(cfg.quantity, siNum);
          const usStr = UC.formatForInput(usNum, cfg.decimalsUs !== undefined ? cfg.decimalsUs : 2);
          el.value = usStr;
          el.dataset.displayedValue = usStr;
          if (id === 'c5a_pval') el.dataset.c5aUnit = valOf('c5a_unit');
          continue;
        }
      }
      el.dataset.displayedValue = metricStr;
      if (id === 'c5a_pval') el.dataset.c5aUnit = valOf('c5a_unit');
    }
  }

  function updateUnitSwitcherBarUI() {
    const lang = getLang();
    const isHe = lang === 'he';
    const sys = getUnitSystem();
    const curr = getCurrency();
    const lbl = document.getElementById('calc-unit-switch-label');
    const btnSi = document.getElementById('unit-btn-si');
    const btnUs = document.getElementById('unit-btn-us');
    if (lbl) lbl.textContent = isHe ? 'יחידות:' : 'Единицы:';
    if (btnSi) {
      btnSi.textContent = isHe ? 'מטריות (SI)' : 'Метрические (SI)';
      btnSi.classList.toggle('active', sys === 'si');
      btnSi.setAttribute('aria-pressed', sys === 'si' ? 'true' : 'false');
    }
    if (btnUs) {
      btnUs.textContent = isHe ? 'אימפריאליות (US)' : 'Имперские (US)';
      btnUs.classList.toggle('active', sys === 'us');
      btnUs.setAttribute('aria-pressed', sys === 'us' ? 'true' : 'false');
    }

    const currLbl = document.getElementById('calc-currency-switch-label');
    const btnUsd = document.getElementById('currency-btn-usd');
    const btnIls = document.getElementById('currency-btn-ils');
    if (currLbl) currLbl.textContent = isHe ? 'מטבע:' : 'Валюта:';
    if (btnUsd) {
      btnUsd.textContent = '$ (USD)';
      btnUsd.classList.toggle('active', curr === '$');
      btnUsd.setAttribute('aria-pressed', curr === '$' ? 'true' : 'false');
    }
    if (btnIls) {
      btnIls.textContent = '₪ (ILS)';
      btnIls.classList.toggle('active', curr === '₪');
      btnIls.setAttribute('aria-pressed', curr === '₪' ? 'true' : 'false');
    }
  }

  function setFieldFromSiValue(id, siStrInput) {
    const el = document.getElementById(id);
    if (!el) return;
    const siStr = siStrInput === null || siStrInput === undefined ? '' : String(siStrInput);
    const UC = root.UnitConverter;
    const sys = getUnitSystem();
    const cfg = UC && UC.FIELD_UNIT_MAP ? UC.FIELD_UNIT_MAP[id] : null;
    el.dataset.siValue = siStr;
    if (siStr === '' || siStr.trim() === '') {
      el.dataset.siDisplay = '';
      el.value = '';
      el.dataset.displayedValue = '';
      return;
    }
    const siNum = Number(siStr.trim().replace(',', '.'));
    if (cfg && cfg.quantity !== 'none' && cfg.quantity !== 'si_only' && Number.isFinite(siNum) && UC) {
      const qDef = UC.QUANTITIES && UC.QUANTITIES[cfg.quantity];
      const decSi = cfg.decimalsSi !== undefined ? cfg.decimalsSi : (qDef && qDef.inputDecimalsSi !== undefined ? qDef.inputDecimalsSi : 2);
      // Preserve integer strings like '1500' or '6' as-is if they match the exact float, otherwise format to decSi
      const roundedSiStr = UC.formatForInput(siNum, decSi);
      el.dataset.siDisplay = (Math.abs(Number(siStr) - Number(roundedSiStr)) > 1e-9) ? roundedSiStr : siStr;
    } else {
      el.dataset.siDisplay = siStr;
    }
    if (isFieldConvertedNow(id, sys) && cfg && Number.isFinite(siNum)) {
      const usStr = UC.formatForInput(UC.toImperial(cfg.quantity, siNum), cfg.decimalsUs !== undefined ? cfg.decimalsUs : 2);
      el.value = usStr;
      el.dataset.displayedValue = usStr;
      return;
    }
    el.value = el.dataset.siDisplay;
    el.dataset.displayedValue = el.dataset.siDisplay;
  }
  root.setFieldFromSiValue = setFieldFromSiValue;
  root.getFieldSiValue = siValOf;

  function bootstrapDomSiValuesOnce() {
    if (domSiInitialized || typeof document === 'undefined') return;
    const probe = document.getElementById('c1a_q_l_min');
    if (!probe) return;
    domSiInitialized = true;

    // 1. All initial HTML <input value="..."> attributes are in SI
    ensureAllSiValuesSynced('si');

    // 2. Attach delegated input/change listeners on #sec-calculators
    const calcSec = document.getElementById('sec-calculators');
    if (calcSec) {
      calcSec.addEventListener('input', (ev) => {
        const t = ev.target;
        if (t && t.id && root.UnitConverter && root.UnitConverter.FIELD_UNIT_MAP[t.id]) {
          t.dataset.displayedValue = '';
          syncSingleInputFromDOM(t, getUnitSystem());
        }
      });
      calcSec.addEventListener('change', (ev) => {
        const t = ev.target;
        if (!t || !t.id) return;
        if (t.id === 'c1a_mode') {
          root.applyCalculatorTranslations(getLang());
        } else if (t.id === 'c5a_unit') {
          const pvalEl = document.getElementById('c5a_pval');
          if (pvalEl) {
            pvalEl.dataset.siValue = '';
            pvalEl.dataset.displayedValue = '';
            pvalEl.dataset.c5aUnit = '';
            syncSingleInputFromDOM(pvalEl, getUnitSystem());
          }
          root.runCalc5A();
        } else if (root.UnitConverter && root.UnitConverter.FIELD_UNIT_MAP[t.id]) {
          syncSingleInputFromDOM(t, getUnitSystem());
        }
      });
      calcSec.addEventListener('click', (ev) => {
        const cmpBtn = ev.target && ev.target.closest && ev.target.closest('.compare-calc-card-btn');
        if (cmpBtn) {
          ev.preventDefault();
          const mod = cmpBtn.getAttribute('data-compare-module');
          if (typeof root.compareCurrentCardWithSaved === 'function') {
            root.compareCurrentCardWithSaved(mod, cmpBtn);
          }
        }
      });
      calcSec.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Enter') return;
        const t = ev.target;
        if (!t || (t.tagName !== 'INPUT' && t.tagName !== 'SELECT')) return;
        if (t.id && root.UnitConverter && root.UnitConverter.FIELD_UNIT_MAP[t.id]) {
          syncSingleInputFromDOM(t, getUnitSystem());
        }
        const mod = t.closest('form, .calc-submodule-block, .calc-panel');
        if (mod) {
          const runBtn = mod.querySelector('button[onclick^="runCalc"]');
          if (runBtn) {
            ev.preventDefault();
            runBtn.click();
          }
        }
      });
    }

    // 3. Check if user had 'us' or currency saved in localStorage; if so, restore
    let savedSys = 'si';
    let savedCurr = '$';
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_UNITS);
        if (saved === 'us' || saved === 'si') savedSys = saved;
        const sc = localStorage.getItem(STORAGE_KEY_CURRENCY);
        if (sc === '$' || sc === '₪') savedCurr = sc;
      }
    } catch (_) {
      if (typeof root.setStorageAvailabilityForTest === 'function') {
        root.setStorageAvailabilityForTest(false);
      }
    }
    currentCurrency = savedCurr;
    if (root.AppState) {
      root.AppState.currency = savedCurr;
    }
    if (savedSys === 'us' && currentUnitSystem !== 'us') {
      root.setCalculatorUnitSystem('us');
    }
  }

  root.setCalculatorCurrency = function (targetCurr) {
    bootstrapDomSiValuesOnce();
    const nextCurr = targetCurr === '₪' ? '₪' : '$';
    currentCurrency = nextCurr;
    if (root.AppState) {
      root.AppState.currency = nextCurr;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CURRENCY, nextCurr);
      }
    } catch (_) {
      if (typeof root.setStorageAvailabilityForTest === 'function') {
        root.setStorageAvailabilityForTest(false);
      }
    }
    updateUnitSwitcherBarUI();
    root.applyCalculatorTranslations(getLang());
    if (typeof root.renderHomeDashboard === 'function') root.renderHomeDashboard();
    if (typeof root.renderSurveySection === 'function') root.renderSurveySection();
    if (typeof root.renderSavedCalcsSection === 'function') root.renderSavedCalcsSection();
    if (typeof root.renderSteamTableSection === 'function') root.renderSteamTableSection();
  };

  root.setCalculatorUnitSystem = function (targetSystem) {
    bootstrapDomSiValuesOnce();
    const nextSys = targetSystem === 'us' ? 'us' : 'si';
    const prevSys = getUnitSystem();
    const UC = root.UnitConverter;

    // 1. Sync any un-synced edits made in the previous unit system
    ensureAllSiValuesSynced(prevSys);

    // 2. Update state and persist to localStorage
    currentUnitSystem = nextSys;
    if (root.AppState) {
      root.AppState.unitSystem = nextSys;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_UNITS, nextSys);
      }
    } catch (_) {
      if (typeof root.setStorageAvailabilityForTest === 'function') {
        root.setStorageAvailabilityForTest(false);
      }
    }

    // 3. Trap 5: Module 5A default unit selector (#c5a_unit)
    const c5aUnitEl = document.getElementById('c5a_unit');
    if (c5aUnitEl && c5aUnitEl.value !== 'kpa') {
      c5aUnitEl.value = nextSys === 'us' ? 'psi' : 'bar';
    }

    // 4. Re-compute all displayed input values strictly from exact data-si-value (zero drift!)
    if (UC && UC.FIELD_UNIT_MAP) {
      for (const [id, cfg] of Object.entries(UC.FIELD_UNIT_MAP)) {
        const el = document.getElementById(id);
        if (!el || el.tagName === 'SELECT') continue;
        const siStr = el.dataset.siValue !== undefined ? el.dataset.siValue : el.value;
        el.dataset.siValue = siStr;
        if (siStr === '' || siStr.trim() === '') {
          el.value = '';
          el.dataset.displayedValue = '';
          continue;
        }
        if (isFieldConvertedNow(id, nextSys)) {
          const siNum = Number(siStr.trim().replace(',', '.'));
          if (Number.isFinite(siNum)) {
            const usNum = UC.toImperial(cfg.quantity, siNum);
            const usStr = UC.formatForInput(usNum, cfg.decimalsUs !== undefined ? cfg.decimalsUs : 2);
            el.value = usStr;
            el.dataset.displayedValue = usStr;
            if (id === 'c5a_pval') el.dataset.c5aUnit = valOf('c5a_unit');
          }
        } else {
          const qDef = UC.QUANTITIES && UC.QUANTITIES[cfg.quantity];
          const decSi = cfg.decimalsSi !== undefined ? cfg.decimalsSi : (qDef && qDef.inputDecimalsSi !== undefined ? qDef.inputDecimalsSi : 2);
          let dispSi = el.dataset.siDisplay;
          if (!dispSi) {
            const siNum = Number(siStr.trim().replace(',', '.'));
            dispSi = (cfg.quantity !== 'none' && cfg.quantity !== 'si_only' && Number.isFinite(siNum))
              ? UC.formatForInput(siNum, decSi)
              : siStr;
            el.dataset.siDisplay = dispSi;
          }
          el.value = dispSi;
          el.dataset.displayedValue = dispSi;
          if (id === 'c5a_pval') el.dataset.c5aUnit = valOf('c5a_unit');
        }
      }
    }

    updateUnitSwitcherBarUI();
    root.applyCalculatorTranslations(getLang());
    if (typeof root.renderHomeDashboard === 'function') root.renderHomeDashboard();
    if (typeof root.renderSurveySection === 'function') root.renderSurveySection();
    if (typeof root.renderSavedCalcsSection === 'function') root.renderSavedCalcsSection();
    if (typeof root.renderSteamTableSection === 'function') root.renderSteamTableSection();
  };

  function getExpData() {
    return root.LEARNING_EXPERIMENTS || null;
  }

  function getExpUi(lang) {
    const expData = getExpData();
    if (!expData || !expData.UI) return null;
    return expData.UI[lang === 'he' ? 'he' : 'ru'] || expData.UI.ru;
  }

  function getFieldOriginLabel(id, lang) {
    const expData = getExpData();
    const ui = getExpUi(lang);
    if (!expData || !expData.FIELD_ORIGIN || !ui) return '';
    const origin = expData.FIELD_ORIGIN[id];
    if (origin === 'measured') return ui.originTagMeasured;
    if (origin === 'assumed') return ui.originTagAssumed;
    if (origin === 'reference') return ui.originTagReference;
    return '';
  }

  function getFieldOriginTooltip(id, lang) {
    const expData = getExpData();
    const ui = getExpUi(lang);
    if (!expData || !ui) return '';
    const meta = expData.FIELD_ORIGIN_META && expData.FIELD_ORIGIN_META[id];
    const origin = expData.FIELD_ORIGIN && expData.FIELD_ORIGIN[id];
    const baseTip = origin === 'measured'
      ? ui.originTooltipMeasured
      : origin === 'assumed'
      ? ui.originTooltipAssumed
      : origin === 'reference'
      ? ui.originTooltipReference
      : '';
    if (meta) {
      const reason = lang === 'he' ? (meta.he || meta.ru) : meta.ru;
      return reason ? `${baseTip} — ${reason}` : baseTip;
    }
    return baseTip;
  }

  function originParen(id) {
    const lbl = getFieldOriginLabel(id, getLang());
    return lbl ? ` (${lbl})` : '';
  }

  function fmtFieldSummary(id, fallbackUnitSiRu, fallbackUnitSiHe) {
    const raw = valOf(id);
    if (raw === '' || raw === null || raw === undefined) return '—';
    const UC = root.UnitConverter;
    const lang = getLang();
    const sys = getUnitSystem();
    const cfg = UC && UC.FIELD_UNIT_MAP && UC.FIELD_UNIT_MAP[id];
    const origSuffix = originParen(id);
    if (!cfg || cfg.quantity === 'none' || cfg.quantity === 'si_only' || !isFieldConvertedNow(id, sys)) {
      const u = (lang === 'he' ? fallbackUnitSiHe : fallbackUnitSiRu) || (UC ? UC.getUnitSymbol(cfg ? cfg.quantity : 'none', lang, 'si') : '');
      return (u ? `${raw} ${u}` : `${raw}`) + origSuffix;
    }
    const u = UC.getUnitSymbol(cfg.quantity, lang, sys);
    return (u ? `${raw} ${u}` : `${raw}`) + origSuffix;
  }

  function translateRuntimeText(text, lang) {
    if (lang !== 'he' || !text) return text;
    if (root.I18N_UI && typeof root.I18N_UI.translateCalcError === 'function') {
      return root.I18N_UI.translateCalcError(text, 'he');
    }
    return text;
  }

  /**
   * Построение динамической инженерной интерпретации нормализации RO (Модуль 4Б)
   * напрямую из структурированных числовых полей объекта результата r (без шаблонов строк).
   */
  function buildRONormalizationInterpretation(r, lang) {
    const isHe = lang === 'he';
    const fmtSigned = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
    const absNdp = Math.abs(r.ndpEffectPct);
    const absTcf = Math.abs(r.tcfEffectPct);

    if (!isHe) {
      return r.dynamicInterpretation;
    }

    const factorSummary =
      `במסגרת מודל החישוב Eq. 72, מקדם הכוח המניע הוא NDP_o/NDP_s = ${r.ndpFactorRatio.toFixed(4)} (${fmtSigned(r.ndpEffectPct)}), ` +
      `מקדם הטמפרטורה הוא TCF_o/TCF_s = ${r.tcfFactorRatio.toFixed(4)} (${fmtSigned(r.tcfEffectPct)}), ` +
      `והמקדם המשולב של תנאי הסביבה הוא ${r.combinedEnvFactorRatio.toFixed(4)} (${fmtSigned(r.combinedEnvEffectPct)}).`;

    let dominantFactorNote = '';
    if (absNdp < 0.05 && absTcf < 0.05) {
      dominantFactorNote = 'מקדמי ה-NDP וה-TCF שהוזנו כמעט לא השתנו ביחס למצב הייחוס בהרצה.';
    } else if (absNdp > absTcf * 1.15) {
      dominantFactorNote = `מבין גורמי המודל שהוזנו בולט השינוי בכוח המניע נטו NDP (${fmtSigned(r.ndpEffectPct)}), בעוד שמקדם הטמפרטורה TCF השתנה ב-${fmtSigned(r.tcfEffectPct)}.`;
    } else if (absTcf > absNdp * 1.15) {
      dominantFactorNote = `מבין גורמי המודל שהוזנו בולט השינוי במקדם הטמפרטורה TCF (${fmtSigned(r.tcfEffectPct)}), בעוד שמקדם ה-NDP השתנה ב-${fmtSigned(r.ndpEffectPct)}.`;
    } else {
      dominantFactorNote = `שני גורמי המודל שהוזנו — הכוח המניע NDP (${fmtSigned(r.ndpEffectPct)}) ומקדם הטמפרטורה TCF (${fmtSigned(r.tcfEffectPct)}) — תורמים במידה דומה לשינוי בספיקה הנצפית.`;
    }

    let statusHypothesis = '';
    if (r.normDevPct <= -10.0) {
      statusHypothesis =
        `ספיקת הפרמיאט המנורמלת ירדה ב-${r.normDevPct.toFixed(2)}% ביחס לספיקת הבסיס Q_ps (הגיעה לקריטריון הייחוס ‎−10% לירידת NPF לפי [S16, PDF p. 135]). ` +
        `השערת עבודה (לא אבחנה סופית מוכחת): ירידה בחדירות ההידראולית של הממברנות (אילוח/Fouling או אבנית/Scaling) או שגיאת מדידה ברגשי לחץ, טמפרטורה או ספיקה. ` +
        `כדי להבחין בין הסיבות לפני החלטה על שטיפה כימית (CIP), בדקו כיול מכשירים, מפלי לחץ בדרגות ΔP₁, ΔP₂ ומעבר מלחים מנורמל NSP.`;
    } else if (r.normDevPct >= 10.0) {
      statusHypothesis =
        `ספיקת הפרמיאט המנורמלת עלתה ב-+${r.normDevPct.toFixed(2)}% ביחס לספיקת הבסיס Q_ps (חריגה מסף ‎+10% ל-NPF לפי [S16, PDF p. 135]). ` +
        `שימו לב: עלייה בספיקה המנורמלת אינה מעידה על סתימת ממברנות ממשקעים ואינה מצריכה שטיפת CIP נגד אילוח! ` +
        `השערות עיקריות לבדיקה: פגיעה כימית (חמצון מכלור חופשי) בשכבת המחסום הפוליאמידית, פגיעה מכנית בממברנה / דליפת אטמים (O-ring) או קריאה שגויה של מדי הלחץ/טמפרטורה. בדקו מוליכות פרמיאט EC_p בכל בית ממברנה (Probing)!`;
    } else {
      statusHypothesis =
        `סטיית הספיקה המנורמלת NPF ממצב הבסיס היא ${fmtSigned(r.normDevPct)} (בתוך תחום הייחוס שבין ‎−10% ל-‎+10% לפי [S16, PDF p. 135]). ` +
        `השערה זהירה: תפוקת הממברנות בניכוי השפעת NDP ו-TCF קרובה למצב ההרצה, אך NPF תקין כשלעצמו אינו שולל אילוח מקומי או תחילת התגבשות אבנית — המשיכו לעקוב אחר מפלי הלחץ בדרגות ΔP₁, ΔP₂ ואחר דחיית המלחים.`;
    }

    return `${factorSummary} ${dominantFactorNote} ${statusHypothesis}`;
  }

  function renderWarningsBlockHtml(warningsList) {
    if (!warningsList || !warningsList.length) return '';
    const UC = root.UnitConverter;
    const lang = getLang();
    const sys = getUnitSystem();
    return `<div class="calc-warnings-stack" role="status">` +
      warningsList.map((w) => {
        const isObj = w && typeof w === 'object';
        const rawHtml = isObj ? w.html : String(w);
        const html = UC ? UC.annotateErrorThresholds(rawHtml, lang, sys) : rawHtml;
        const level = isObj ? w.level : (html.includes('🚨') || html.includes('❌') ? 'danger' : 'notice');
        const cls = level === 'danger' ? 'calc-warning-item is-danger' : 'calc-warning-item is-notice';
        return `<div class="${cls}">${html}</div>`;
      }).join('') +
      `</div>`;
  }

  function clearFormFieldErrors(containerId) {
    const outBox = document.getElementById(containerId);
    const panel = outBox ? outBox.closest('.calc-panel') : document;
    if (!panel) return;
    panel.querySelectorAll('.calc-field-inline-error').forEach((el) => el.remove());
    panel.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
      el.removeAttribute('aria-invalid');
      el.classList.remove('user-invalid-fallback');
    });
  }

  function handleCalcException(containerId, prefixRu, prefixHe, err) {
    const lang = getLang();
    const isHe = lang === 'he';
    const UC = root.UnitConverter;
    clearFormFieldErrors(containerId);

    const analyzed = (root.I18N_UI && typeof root.I18N_UI.analyzeCalcError === 'function')
      ? root.I18N_UI.analyzeCalcError(err.message, lang)
      : { code: 'GENERIC', fieldIds: [], message: translateRuntimeText(err.message, lang) };

    const msg = UC ? UC.annotateErrorThresholds(analyzed.message, lang, getUnitSystem()) : analyzed.message;
    if (analyzed.fieldIds && analyzed.fieldIds.length > 0) {
      analyzed.fieldIds.forEach((fid) => {
        const inputEl = document.getElementById(fid);
        if (inputEl) {
          inputEl.setAttribute('aria-invalid', 'true');
          inputEl.classList.add('user-invalid-fallback');
          const fieldWrap = inputEl.closest('.field') || inputEl.parentElement;
          if (fieldWrap && !fieldWrap.querySelector('.calc-field-inline-error')) {
            const inlineErr = document.createElement('div');
            inlineErr.className = 'calc-field-inline-error';
            inlineErr.setAttribute('role', 'alert');
            inlineErr.textContent = `⚠️ ${msg}`;
            fieldWrap.appendChild(inlineErr);
          }
        }
      });
    }

    renderCalcResult(
      containerId,
      true,
      isHe ? `❌ <strong>${prefixHe}:</strong> ${msg}` : `❌ <strong>${prefixRu}:</strong> ${msg}`
    );
  }

  function escapeTrustHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildTrustLabelRowHtml(opts, lang) {
    if (typeof root.renderTrustLabelRowHtml === 'function') {
      return root.renderTrustLabelRowHtml(opts, lang);
    }
    const tl = root.TRUST_LABELS;
    if (!tl || !tl.KINDS || !opts) return '';
    const l = lang === 'he' ? 'he' : 'ru';
    const kindKey = opts.kind || 'example';
    const kindObj = tl.KINDS[kindKey] || tl.KINDS.example;
    const ui = (tl.UI && tl.UI[l]) || (tl.UI && tl.UI.ru) || {};
    const symbol = kindObj.symbol || '●';
    const labelText = (kindObj.label && (kindObj.label[l] || kindObj.label.ru)) || kindKey;
    const explanation = (kindObj.explanation && (kindObj.explanation[l] || kindObj.explanation.ru)) || '';
    const formattedSource = typeof tl.formatSourceForLang === 'function'
      ? tl.formatSourceForLang(opts.source || '', l)
      : String(opts.source || '');
    const segments = formattedSource.split(/;\s*(?=S\d\d\b)/).map((s) => s.trim()).filter(Boolean);
    const sourceLinksHtml = segments.map((seg) => {
      const m = seg.match(/^(S\d\d)\b/);
      const code = m ? m[1] : 'S01';
      return `<a href="#source-${code}" class="trust-label-source"><span dir="ltr">${escapeTrustHtml(seg)}</span></a>`;
    }).join('<span dir="ltr">; </span>');
    const noteHtml = opts.note
      ? ` <span class="trust-label-note">[${escapeTrustHtml(ui.assumptionLabel || (l === 'he' ? 'הנחה' : 'Допущение'))}: ${escapeTrustHtml(opts.note)}]</span>`
      : '';
    const guideLinkHtml = opts.guideAnchor
      ? ` <a href="${escapeTrustHtml(opts.guideAnchor)}" class="trust-label-guide-link">${escapeTrustHtml(ui.whereInTextbook || (l === 'he' ? 'איפה בספר הלימוד' : 'Где в учебнике'))} →</a>`
      : '';
    const modAttr = opts.moduleId ? ` data-module="${escapeTrustHtml(opts.moduleId)}"` : '';
    const expAttr = opts.expId ? ` data-exp="${escapeTrustHtml(opts.expId)}"` : '';
    return `<div class="trust-label-row"${modAttr}${expAttr}><span class="trust-label trust-label--${escapeTrustHtml(kindKey)}" data-kind="${escapeTrustHtml(kindKey)}" data-source="${escapeTrustHtml(formattedSource)}" title="${escapeTrustHtml(explanation)}">${symbol}&nbsp;${escapeTrustHtml(labelText)}</span> ${sourceLinksHtml}${noteHtml}${guideLinkHtml}</div>`;
  }

  function buildCalcCardHtml(moduleCode, titleText, inputsSummary, resultsHtml, assumptionsText, warningsList = []) {
    const lang = getLang();
    const isHe = lang === 'he';
    const normMod = String(moduleCode || '').toUpperCase().replace(/-DOE$/i, '');
    const expData = getExpData();
    const expUi = getExpUi(lang);
    const meaningObj = expData && expData.MODULE_MEANING && expData.MODULE_MEANING[normMod];
    const meaningText = meaningObj ? (meaningObj[lang] || meaningObj.ru) : '';
    const lblMeaning = (expUi && expUi.whatItMeansTitle) || (isHe ? 'מה משמעות התוצאה' : 'Что это значит');
    const lblLimits = (expUi && expUi.applicabilityLimitsTitle) || (isHe ? 'גבולות גזרה ותחום תקפות' : 'Границы применимости');
    const btnCompare = (expUi && expUi.btnCompareWithSaved) || (isHe ? '⚖️ השוואה עם חישוב שמור ←' : '⚖️ Сравнить с сохранённым →');

    const tl = root.TRUST_LABELS;
    const modTrust = (tl && tl.MODULES && tl.MODULES[normMod]) || null;
    const modTrustRowHtml = modTrust
      ? buildTrustLabelRowHtml({
          kind: modTrust.kind,
          source: modTrust.source,
          guideAnchor: modTrust.guideAnchor,
          moduleId: normMod
        }, lang)
      : '';

    const lblDate = isHe ? 'תאריך וגרסה:' : 'Дата и редакция:';
    const lblInputs = isHe ? 'נתוני קלט שהוזנו:' : 'Введённые исходные данные:';
    const lblAssump = isHe ? 'הנחות יסוד ותחום תקפות:' : 'Допущения и область применимости:';
    const btnSave = isHe ? '💾 שמירת חישוב' : '💾 Сохранить расчёт';
    const btnCopy = isHe ? '📋 העתקת כרטיס חישוב' : '📋 Скопировать расчётную карточку';
    const btnPrint = isHe ? '🖨️ הדפסת כרטיס חישוב' : '🖨️ Печать карточки';
    const dateStr = '2026-10-29 · v10.0';
    const warningsHtml = renderWarningsBlockHtml(warningsList);

    const lblHow = isHe ? 'איך זה מחושב (הצבת נתונים והנחות יסוד)' : 'Как считается (введённые данные и допущения)';

    return `
      <div class="calc-card-wrapper" data-module="${moduleCode}">
        <div class="calc-card-header">
          <strong>${titleText}</strong>
          <span class="calc-card-meta">${lblDate} <code dir="ltr">${dateStr}</code></span>
        </div>
        <div class="calc-card-body">
          ${resultsHtml}
          ${warningsHtml}
          ${modTrustRowHtml}
          ${meaningText ? `<div class="calc-card-meaning"><strong>${lblMeaning}:</strong> ${meaningText}</div>` : ''}
          ${assumptionsText ? `<div class="calc-card-limits"><strong>${lblLimits}:</strong> ${assumptionsText}</div>` : ''}
        </div>
        <details class="calc-how-it-works-details calc-card-how-details">
          <summary>${lblHow}</summary>
          <div class="calc-card-footer-details">
            <div><strong>${lblInputs}</strong> <span dir="ltr">${inputsSummary}</span></div>
            <div><strong>${lblAssump}</strong> ${assumptionsText}</div>
          </div>
        </details>
        <div class="calc-card-actions no-print">
          <button type="button" class="btn btn-primary btn-sm save-calc-card-btn" data-save-module="${moduleCode}" onclick="window.saveCalculationFromCard('${moduleCode}', this)">${btnSave}</button>
          <button type="button" class="btn btn-outline btn-sm compare-calc-card-btn" data-compare-module="${normMod}">${btnCompare}</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.copyCalculationCard(this)">${btnCopy}</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.printCalculationCard(this)">${btnPrint}</button>
        </div>
      </div>
    `;
  }

  root.copyCalculationCard = function (btnEl) {
    const lang = getLang();
    const wrapper = btnEl && btnEl.closest('.calc-card-wrapper');
    if (!wrapper) return;
    const clone = wrapper.cloneNode(true);
    clone.querySelectorAll('details').forEach((d) => { d.open = true; });
    const actions = clone.querySelector('.calc-card-actions');
    if (actions) actions.remove();
    const text = clone.innerText.replace(/\n{3,}/g, '\n\n').trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        const orig = btnEl.textContent;
        btnEl.textContent = lang === 'he' ? '✓ הועתק ללוח!' : '✓ Скопировано в буфер!';
        setTimeout(() => { btnEl.textContent = orig; }, 1800);
      }).catch(() => {});
    }
  };

  root.printCalculationCard = function (btnEl) {
    const wrapper = btnEl && btnEl.closest('.calc-card-wrapper');
    if (!wrapper) return;
    document.querySelectorAll('.calc-card-wrapper').forEach((w) => w.classList.remove('active-print-card'));
    wrapper.classList.add('active-print-card');
    document.body.dataset.printMode = 'calc-card';
    window.print();
  };

  function renderCalcResult(containerId, isError, html) {
    const box = document.getElementById(containerId);
    if (!box) return;
    box.classList.toggle('has-error', isError);
    box.innerHTML = html;
  }

  function buildEconomicsBlockHtml(econRes, lang, sys) {
    if (!econRes || !econRes.hasCost) return '';
    const EE = root.EconomicsEngine;
    const UC = root.UnitConverter;
    const isHe = lang === 'he';
    const curr = econRes.currency || getCurrency();
    const fmtM = (val) => (EE && typeof EE.formatMoney === 'function')
      ? EE.formatMoney(val, curr, 2)
      : `${curr}${Number(val).toFixed(2)}`;
    const yrSuffix = isHe ? 'yr' : 'год';
    const dual = (val, q, opts) => UC ? UC.formatDual(val, q, lang, sys, opts) : `${val}`;

    const titleStr = isHe
      ? `💰 <strong>עלות כספית שנתית (<bdi dir="ltr">${curr}</bdi>):</strong>`
      : `💰 <strong>Деньги за год (<bdi dir="ltr">${curr}</bdi>):</strong>`;

    let detailLine = '';
    if (econRes.module === '1A' && econRes.mode === 'doe_s21_imperial') {
      const doeRoundedStr = `$${econRes.costEnergyYearRoundedDOE.toLocaleString('en-US')}/${yrSuffix}`;
      const doeExactStr = `${fmtM(econRes.costEnergyYearExact)}/${yrSuffix}`;
      detailLine = isHe
        ? `• סה"כ חיסכון/עלות שנתית בדלק: <code dir="ltr"><strong>${doeRoundedStr}</strong></code> (לפי עיגול DOE: <code dir="ltr">${econRes.annualFuelMMBtuRoundedDOE} MMBtu/yr</code>) | ללא עיגול ביניים: <code dir="ltr"><strong>${doeExactStr}</strong></code>`
        : `• Итоговая годовая стоимость/экономия топлива: <code dir="ltr"><strong>${doeRoundedStr}</strong></code> (по округлённому топливу DOE: <code dir="ltr">${econRes.annualFuelMMBtuRoundedDOE} MMBtu/год</code>) | без промеж. округления: <code dir="ltr"><strong>${doeExactStr}</strong></code>`;
    } else if (econRes.module === '1A') {
      const parts = [];
      if (econRes.costEnergyYear !== null) {
        parts.push(isHe
          ? `חום/דלק: <code dir="ltr"><strong>${fmtM(econRes.costEnergyYear)}/${yrSuffix}</strong></code>`
          : `тепло/топливо: <code dir="ltr"><strong>${fmtM(econRes.costEnergyYear)}/${yrSuffix}</strong></code>`);
      }
      if (econRes.costWaterYear !== null) {
        parts.push(isHe
          ? `מים וביוב: <code dir="ltr"><strong>${fmtM(econRes.costWaterYear)}/${yrSuffix}</strong></code>`
          : `вода и стоки: <code dir="ltr"><strong>${fmtM(econRes.costWaterYear)}/${yrSuffix}</strong></code>`);
      }
      detailLine = isHe
        ? `• סה"כ לשנה (${econRes.tYearH} שעות/שנה): <code dir="ltr"><strong>${fmtM(econRes.costTotalYear)}/${yrSuffix}</strong></code> (${parts.join(' + ')})`
        : `• Итого за год (${econRes.tYearH} ч/год): <code dir="ltr"><strong>${fmtM(econRes.costTotalYear)}/${yrSuffix}</strong></code> (${parts.join(' + ')})`;
    } else if (econRes.module === '1B') {
      const qFlashDual = dual(econRes.qFlashKw, 'power', { prefix: 'Q_flash = ', siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 0, usDecSecondary: 0 });
      const eFuelDual = dual(econRes.eFuelYearGJ, 'energy_gj', {
        siUnitOverride: isHe ? 'GJ/yr' : 'ГДж/год',
        usUnitOverride: isHe ? 'MMBtu/yr' : 'MMBtu/год',
        siDecPrimary: 2,
        siDecSecondary: 2,
        usDecPrimary: 2,
        usDecSecondary: 2
      });
      detailLine = isHe
        ? `• הספק קיטור משני: ${qFlashDual} | שווה-ערך דלק שנתי (${econRes.tYearH} שעות/שנה, <code dir="ltr">η_b = ${econRes.etaBoilerPct}%</code>): ${eFuelDual}<br>` +
          `• עלות שנתית של קיטור משני: <code dir="ltr"><strong>${fmtM(econRes.costTotalYear)}/${yrSuffix}</strong></code>`
        : `• Мощность вторичного пара: ${qFlashDual} | Годовой эквивалент топлива (${econRes.tYearH} ч/год, <code dir="ltr">η_b = ${econRes.etaBoilerPct}%</code>): ${eFuelDual}<br>` +
          `• Годовая стоимость вторичного пара: <code dir="ltr"><strong>${fmtM(econRes.costTotalYear)}/${yrSuffix}</strong></code>`;
    } else if (econRes.module === '2') {
      const kwhStr = UC ? UC.formatWithSpaces(econRes.eElecYearKwh, 1) : econRes.eElecYearKwh.toFixed(1);
      detailLine = isHe
        ? `• צריכת חשמל שנתית של הצ'ילר (${econRes.tYearH} שעות/שנה): <code dir="ltr">E_el = <strong>${kwhStr} kWh/yr</strong></code><br>` +
          `• עלות חשמל שנתית: <code dir="ltr"><strong>${fmtM(econRes.costTotalYear)}/${yrSuffix}</strong></code>`
        : `• Годовое электропотребление чиллера (${econRes.tYearH} ч/год): <code dir="ltr">E_эл = <strong>${kwhStr} кВт·ч/год</strong></code><br>` +
          `• Годовая стоимость электроэнергии: <code dir="ltr"><strong>${fmtM(econRes.costTotalYear)}/${yrSuffix}</strong></code>`;
    } else if (econRes.module === '3B') {
      const pLeakDual = dual(econRes.pLeakKw, 'power', { prefix: 'P_leak = ', siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 0, usDecSecondary: 0 });
      const kwhStr = UC ? UC.formatWithSpaces(econRes.eLeakYearKwh, 1) : econRes.eLeakYearKwh.toFixed(1);
      detailLine = isHe
        ? `• הספק מדחס המתבזבז על דליפות: ${pLeakDual} | אובדן חשמל שנתי (${econRes.tYearH} שעות/שנה): <code dir="ltr">E_leak = <strong>${kwhStr} kWh/yr</strong></code><br>` +
          `• עלות שנתית של דליפות אוויר דחוס: <code dir="ltr"><strong>${fmtM(econRes.costTotalYear)}/${yrSuffix}</strong></code>`
        : `• Мощность компрессора на утечки: ${pLeakDual} | Годовой перерасход электроэнергии (${econRes.tYearH} ч/год): <code dir="ltr">E_leak = <strong>${kwhStr} кВт·ч/год</strong></code><br>` +
          `• Годовая стоимость утечек сжатого воздуха: <code dir="ltr"><strong>${fmtM(econRes.costTotalYear)}/${yrSuffix}</strong></code>`;
    } else if (econRes.module === '5B') {
      const eLoadDual = dual(econRes.eLoadYearGJ, 'energy_gj', {
        siUnitOverride: isHe ? 'GJ/yr' : 'ГДж/год',
        usUnitOverride: isHe ? 'MMBtu/yr' : 'MMBtu/год',
        siDecPrimary: 2,
        siDecSecondary: 2,
        usDecPrimary: 2,
        usDecSecondary: 2
      });
      const eFuelDual = dual(econRes.eFuelYearGJ, 'energy_gj', {
        siUnitOverride: isHe ? 'GJ/yr' : 'ГДж/год',
        usUnitOverride: isHe ? 'MMBtu/yr' : 'MMBtu/год',
        siDecPrimary: 2,
        siDecSecondary: 2,
        usDecPrimary: 2,
        usDecSecondary: 2
      });
      detailLine = isHe
        ? `• חום שימושי שנתי (${econRes.tYearH} שעות/שנה): ${eLoadDual} | שווה-ערך דלק בדוד (<code dir="ltr">η_b = ${econRes.etaBoilerPct}%</code>): ${eFuelDual}<br>` +
          `• עלות שנתית של הקיטור למתקן: <code dir="ltr"><strong>${fmtM(econRes.costTotalYear)}/${yrSuffix}</strong></code>`
        : `• Годовое полезное тепло (${econRes.tYearH} ч/год): ${eLoadDual} | Эквивалент топлива котла (<code dir="ltr">η_b = ${econRes.etaBoilerPct}%</code>): ${eFuelDual}<br>` +
          `• Годовая стоимость пара для аппарата: <code dir="ltr"><strong>${fmtM(econRes.costTotalYear)}/${yrSuffix}</strong></code>`;
    }

    const formulaLbl = isHe ? '📐 נוסחה:' : '📐 Формула:';
    const sourceLbl = isHe ? '📚 מקור:' : '📚 Источник:';
    const formulaTxt = isHe ? econRes.formulaHe : econRes.formulaRu;
    const sourceTxt = isHe ? econRes.sourceHe : econRes.sourceRu;

    return `<div class="calc-economics-block" style="margin-block-top:0.65rem; padding:0.65rem 0.85rem; background:rgba(16,185,129,0.08); border-inline-start:4px solid #10b981; border-radius:6px;">` +
      `<div>${titleStr}</div>` +
      `<div style="margin-block-top:0.25rem;">${detailLine}</div>` +
      `<div style="margin-block-top:0.3rem; font-size:0.88em; opacity:0.92;">${formulaLbl} <code dir="ltr">${formulaTxt}</code></div>` +
      `<div style="margin-block-top:0.15rem; font-size:0.88em; opacity:0.92;">${sourceLbl} <span>${sourceTxt}</span></div>` +
      `</div>`;
  }

  // Clear inputs of a specific calculator module and immediately wipe stale results
  root.clearCalcModule = function (moduleId) {
    const lang = getLang();
    const isHe = lang === 'he';
    const map = {
      '1A': { ids: ['c1a_q_l_min', 'c1a_m_kg_h', 'c1a_ret_pct', 'c1a_t_cond', 'c1a_t_make', 'c1a_eta', 'c1a_lhv', 'c1a_tariff_gj', 'c1a_tariff_water'], out: 'out-calc-1a' },
      '1B': { ids: ['c1_mc', 'c1_p1', 'c1_p2', 'c1_hf1', 'c1_hf2', 'c1_hfg2', 'c1_dop', 'c1b_t_year', 'c1b_eta', 'c1b_tariff_gj'], out: 'out-calc-1b' },
      '2':  { ids: ['c2_vw', 'c2_tin', 'c2_tout', 'c2_pel', 'c2_tsat_ev', 'c2_tcond_out', 'c2_tsat_cd', 'c2_t_year', 'c2_tariff_kwh'], out: 'out-calc-2' },
      '3A': { ids: ['c3a_q1', 'c3a_p1', 'c3a_t1', 'c3a_rh1', 'c3a_psat1', 'c3a_p2', 'c3a_t2', 'c3a_rh2', 'c3a_psat2'], out: 'out-calc-3a' },
      '3B': { ids: ['c3b_vr', 'c3b_pstart', 'c3b_pend', 'c3b_tdecay', 'c3b_tload', 'c3b_tunload', 'c3b_qcomp', 'c3b_spec_power', 'c3b_t_year', 'c3b_tariff_kwh'], out: 'out-calc-3b' },
      '3C': { ids: ['c3_qc', 'c3_rh', 'c3_rho_in', 'c3_tamb', 'c3_pafter', 'c3_tafter', 'c3_rho_out'], out: 'out-calc-3' },
      '4A': { ids: ['c4a_qp', 'c4a_qc', 'c4a_qf_meas', 'c4a_ecf', 'c4a_ecp', 'c4a_ecc', 'c4a_tdsf', 'c4a_tdsp', 'c4a_tdsc'], out: 'out-calc-4a' },
      '4B': { ids: ['c4_qp', 'c4_qc', 'c4_qbase', 'c4_ndps', 'c4_ndpo', 'c4_tcfs', 'c4_tcfo', 'c4_pp'], out: 'out-calc-4' },
      '5A': { ids: ['c5a_pval'], out: 'out-calc-5a' },
      '5B': { ids: ['c5_qkw', 'c5_mp', 'c5_tin', 'c5_tout', 'c5_tdsfw', 'c5_tdsmax', 'c5_t_year', 'c5_eta', 'c5_tariff_gj'], out: 'out-calc-5' }
    };
    const cfg = map[moduleId];
    if (!cfg) return;
    clearFormFieldErrors(cfg.out);
    cfg.ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.value = '';
        el.dataset.siValue = '';
        el.dataset.displayedValue = '';
        el.removeAttribute('aria-invalid');
        el.classList.remove('user-invalid-fallback', 'user-valid-fallback');
      }
    });
    const clearedMsg = isHe
      ? 'ℹ️ השדות נוקו. הזינו ערכים חדשים או בחרו ערכת נתונים לימודית (Preset) לחישוב.'
      : 'ℹ️ Поля очищены. Введите новые значения или выберите учебный пресет для расчёта.';
    renderCalcResult(cfg.out, false, `<em>${clearedMsg}</em>`);
  };

  // =========================================================================
  // КАЛЬКУЛЯТОР 1А: Возврат и потери конденсата
  // =========================================================================
  root.runCalc1A = function () {
    const EC = root.EngineeringCalculators;
    const UC = root.UnitConverter;
    const lang = getLang();
    const isHe = lang === 'he';
    const sys = getUnitSystem();
    const dual = (val, q, opts) => UC.formatDual(val, q, lang, sys, opts);
    try {
      clearFormFieldErrors('out-calc-1a');
      const mode = valOf('c1a_mode');
      if (mode === 'doe_s21_imperial') {
        // Trap 4: DOE S21 mode already operates in native DOE imperial units (lb/hr, Btu/lb, $/MMBtu)
        const r = EC.calcCondensatePrimary({
          mode: 'doe_s21_imperial',
          m_lb_hr: valOf('c1a_m_kg_h'),
          hf_cond_btu_lb: valOf('c1a_t_cond'),
          hf_mk_btu_lb: valOf('c1a_t_make'),
          t_year_h: valOf('c1a_t_year'),
          eta_boiler_pct: valOf('c1a_eta'),
          tariff_per_mmbtu: valOf('c1a_tariff_gj')
        });
        const mKgH = r.mLbHr * UC.CONSTANTS.LB_TO_KG;
        const condGj = r.annualCondMMBtu * UC.CONSTANTS.MMBTU_TO_GJ;
        const heatDual = dual(r.heatRateKw, 'power', { siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 0, usDecSecondary: 0 });
        let html = isHe
          ? `1. ספיקת קונדנסט מוחזרת: <code dir="ltr"><strong>${r.mLbHr.toFixed(0)} lb/hr</strong> <span class="unit-secondary">(${mKgH.toFixed(1)} kg/h)</span></code> | הספק חום: ${heatDual}<br>` +
            `2. חום קונדנסט שנתי מוחזר: <code dir="ltr"><strong>${r.annualCondMMBtu.toFixed(0)} MMBtu/yr</strong> <span class="unit-secondary">(${condGj.toFixed(1)} GJ/yr)</span></code>`
          : `1. Возвращаемый поток конденсата: <code dir="ltr"><strong>${r.mLbHr.toFixed(0)} lb/hr</strong> <span class="unit-secondary">(${mKgH.toFixed(1)} кг/ч)</span></code> | Тепловой поток: ${heatDual}<br>` +
            `2. Годовое возвращённое тепло конденсата: <code dir="ltr"><strong>${r.annualCondMMBtu.toFixed(0)} MMBtu/год</strong> <span class="unit-secondary">(${condGj.toFixed(1)} ГДж/год)</span></code>`;
        if (r.annualFuelMMBtuExact !== null) {
          const fuelGj = r.annualFuelMMBtuExact * UC.CONSTANTS.MMBTU_TO_GJ;
          html += isHe
            ? `<br>3. חיסכון בדלק דוד: <code dir="ltr"><strong>${r.annualFuelMMBtuExact.toFixed(2)} ≈ ${r.annualFuelMMBtuRoundedDOE} MMBtu/yr</strong> <span class="unit-secondary">(${fuelGj.toFixed(2)} GJ/yr)</span></code>`
            : `<br>3. Экономия топлива котла: <code dir="ltr"><strong>${r.annualFuelMMBtuExact.toFixed(2)} ≈ ${r.annualFuelMMBtuRoundedDOE} MMBtu/год</strong> <span class="unit-secondary">(${fuelGj.toFixed(2)} ГДж/год)</span></code>`;
        }
        if (r.annualCostExact !== null) {
          const econDoe = root.EconomicsEngine
            ? root.EconomicsEngine.calcModule1AEconomics(r, {
                eta_boiler_pct: valOf('c1a_eta'),
                tariff_per_mmbtu: valOf('c1a_tariff_gj')
              })
            : null;
          html += isHe
            ? `<br>4. חיסכון כספי שנתי: <code dir="ltr"><strong>$${r.annualCostRoundedDOE.toLocaleString('en-US')}/yr</strong></code> (לפי עיגול DOE) או <code dir="ltr"><strong>$${r.annualCostExact.toFixed(2)}/yr</strong></code> ללא עיגול ביניים.`
            : `<br>4. Годовая финансовая экономия: <code dir="ltr"><strong>$${r.annualCostRoundedDOE.toLocaleString('en-US')}/год</strong></code> (по округлённому топливу DOE) или <code dir="ltr"><strong>$${r.annualCostExact.toFixed(2)}/год</strong></code> без промежуточного округления.`;
          if (econDoe && econDoe.hasCost) {
            html += buildEconomicsBlockHtml(econDoe, lang, sys);
          }
        }
        const warnings1ADoe = [];
        if (r.realismWarning) {
          warnings1ADoe.push({
            level: 'notice',
            html: isHe
              ? `⚠️ <strong>אזהרת סבירות הנדסית:</strong> החישוב בוצע מתמטית (<code dir="ltr">0% &lt; η_b ≤ 100%</code>), אך נצילות הדוד שהוזנה <code dir="ltr">η_b = ${valOf('c1a_eta')}%</code> חורגת מהתחום התעשייתי האופייני של דודי קיטור (70–95% לפי <code>[S01, S21]</code>) — בדקו את סבירות הנתונים.`
              : `⚠️ <strong>Предупреждение о реалистичности:</strong><br>${r.realismWarning}`
          });
        }
        const card = buildCalcCardHtml(
          '1A-DOE',
          isHe ? 'תוצאות חישוב ייחוס DOE S21 ([S21, Steam Tip Sheet #8, PDF p. 1])' : 'Результаты расчёта по эталону DOE S21 ([S21, Steam Tip Sheet #8, PDF p. 1])',
          `m=${r.mLbHr} lb/hr${originParen('c1a_m_kg_h')}, hf_cond=${valOf('c1a_t_cond')} Btu/lb${originParen('c1a_t_cond')}, hf_mk=${valOf('c1a_t_make')} Btu/lb${originParen('c1a_t_make')}, t_yr=${valOf('c1a_t_year')} h${originParen('c1a_t_year')}`,
          html,
          isHe ? 'חישוב אנתלפיית נוזל לפי DOE Tip Sheet #8 (S21).' : 'Расчёт по энтальпиям жидкого конденсата и подпитки согласно DOE Tip Sheet #8 (S21).',
          warnings1ADoe
        );
        renderCalcResult('out-calc-1a', false, card);
        return;
      }

      const r = EC.calcCondensatePrimary({
        mode,
        q_l_min: siValOf('c1a_q_l_min'),
        m_kg_h: siValOf('c1a_m_kg_h'),
        m_steam_kg_h: siValOf('c1a_m_kg_h'),
        return_pct: siValOf('c1a_ret_pct'),
        t_cond_c: siValOf('c1a_t_cond'),
        t_makeup_c: siValOf('c1a_t_make'),
        rho_kg_l: siValOf('c1a_rho'),
        cp_kj_kgc: siValOf('c1a_cp'),
        t_shift_h: siValOf('c1a_t_shift'),
        t_year_h: siValOf('c1a_t_year'),
        eta_boiler_pct: siValOf('c1a_eta'),
        fuel_lhv_kwh: siValOf('c1a_lhv'),
        tariff_per_gj: siValOf('c1a_tariff_gj'),
        tariff_water_m3: siValOf('c1a_tariff_water')
      });

      let balanceLine = '';
      if (r.mode === 'steam_return_pct' && r.mReturnKgH !== null) {
        const retMass = dual(r.mReturnKgH, 'mass_flow', { siDecPrimary: 1, siDecSecondary: 1, usDecPrimary: 1, usDecSecondary: 1 });
        const retVol = dual(r.vReturnM3H, 'water_flow_m3h', { siDecPrimary: 3, siDecSecondary: 3, usDecPrimary: 2, usDecSecondary: 2 });
        const retQ = dual(r.qReturnKw, 'power', { siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 0, usDecSecondary: 0 });
        balanceLine = isHe
          ? `• מאזן החזרה: מוחזרים לדוד ${retMass} (${retVol}) ו-${retQ} חום; אובדים לניקוז:<br>`
          : `• Баланс возврата: возвращено в котельную ${retMass} (${retVol}) и ${retQ} тепла; потеряно в дренаж:<br>`;
      }

      let yearLine = isHe
        ? `<em>חישוב שנתי: שעות עבודה בשנה לא הוזנו (הזינו שעות עבודה בשנה במפורש).</em>`
        : `<em>Годовой блок: часы работы в год не заданы (укажите часы работы в год явно).</em>`;
      if (r.tYearH !== null) {
        const vYearDual = dual(r.vYearM3, 'volume', {
          siUnitOverride: isHe ? 'm³/yr' : 'м³/год',
          usUnitOverride: isHe ? 'ft³/yr' : 'ft³/год',
          siDecPrimary: 2,
          siDecSecondary: 1,
          usDecPrimary: 1,
          usDecSecondary: 1
        });
        const eYearDual = dual(r.eYearGJ, 'energy_gj', {
          siUnitOverride: isHe ? 'GJ/yr' : 'ГДж/год',
          usUnitOverride: isHe ? 'MMBtu/yr' : 'MMBtu/год',
          siDecPrimary: 2,
          siDecSecondary: 2,
          usDecPrimary: 2,
          usDecSecondary: 2
        });
        yearLine = isHe
          ? `<strong>סיכום שנתי (${r.tYearH} שעות/שנה):</strong> מים = ${vYearDual} | חום מורגש = ${eYearDual} (<code dir="ltr">${r.eYearKwh.toFixed(1)} kWh/yr</code>)`
          : `<strong>Итоги за год (${r.tYearH} ч/год):</strong> вода = ${vYearDual} | чувствительное тепло = ${eYearDual} (<code dir="ltr">${r.eYearKwh.toFixed(1)} кВт·ч/год</code>)`;
        if (r.eFuelYearGJ !== null) {
          const eFuelDual = dual(r.eFuelYearGJ, 'energy_gj', {
            siUnitOverride: isHe ? 'GJ/yr' : 'ГДж/год',
            usUnitOverride: isHe ? 'MMBtu/yr' : 'MMBtu/год',
            siDecPrimary: 2,
            siDecSecondary: 2,
            usDecPrimary: 2,
            usDecSecondary: 2
          });
          yearLine += isHe
            ? `<br>• שווה-ערך דלק בדוד (בנצילות ${r.etaBoilerPct}%): ${eFuelDual} (<code dir="ltr">${r.eFuelYearKwh.toFixed(1)} kWh/yr</code>)`
            : `<br>• Эквивалент топлива котла (при КПД ${r.etaBoilerPct}%): ${eFuelDual} (<code dir="ltr">${r.eFuelYearKwh.toFixed(1)} кВт·ч/год</code>)`;
        }
        if (r.fuelUnitsYear !== null) {
          yearLine += isHe
            ? `<br>• צריכת דלק שנתית (עבור LHV = <code dir="ltr">${valOf('c1a_lhv')} kWh/unit</code>): <code dir="ltr"><strong>${r.fuelUnitsYear.toFixed(1)}</strong></code> יח' דלק/שנה`
            : `<br>• Годовой расход топлива в натуральных единицах (при LHV = <code dir="ltr">${valOf('c1a_lhv')} кВт·ч/ед.</code>): <code dir="ltr"><strong>${r.fuelUnitsYear.toFixed(1)}</strong></code> ед. топлива/год`;
        }
        if (r.costTotalYear !== null) {
          const currSym1A = getCurrency();
          const fmt1A = (root.EconomicsEngine && typeof root.EconomicsEngine.formatMoney === 'function')
            ? root.EconomicsEngine.formatMoney(r.costTotalYear, currSym1A, 2)
            : `${currSym1A}${r.costTotalYear.toFixed(2)}`;
          yearLine += isHe
            ? `<br>• <strong>עלות שנתית מחושבת (לפי התעריפים שהוזנו): <code dir="ltr">${fmt1A}/yr</code></strong>`
            : `<br>• <strong>Расчётная годовая стоимость (по явно введённым тарифам): <code dir="ltr">${fmt1A}/год</code></strong>`;
        } else {
          yearLine += isHe
            ? `<br>• <em>עלות כספית: לא הוזנו תעריפים — מוצגת תוצאה פיזיקלית מאומתת בלבד ללא מחיר משוער.</em>`
            : `<br>• <em>Финансовая стоимость: тарифы не введены — показан только проверенный физический результат без выдуманной цены.</em>`;
        }
      }

      const econ1A = root.EconomicsEngine
        ? root.EconomicsEngine.calcModule1AEconomics(r, {
            currency: getCurrency(),
            t_year_h: siValOf('c1a_t_year'),
            eta_boiler_pct: siValOf('c1a_eta'),
            tariff_per_gj: siValOf('c1a_tariff_gj'),
            tariff_water_m3: siValOf('c1a_tariff_water')
          })
        : null;
      const econHtml1A = buildEconomicsBlockHtml(econ1A, lang, sys);

      const vTargetDual = dual(r.vTargetM3H, 'water_flow_m3h', { siDecPrimary: 3, siDecSecondary: 3, usDecPrimary: 2, usDecSecondary: 2 });
      const mTargetDual = dual(r.mTargetKgH, 'mass_flow', { siDecPrimary: 1, siDecSecondary: 1, usDecPrimary: 1, usDecSecondary: 1 });
      const dTDual = dual(r.deltaTC, 'delta_temp', { prefix: 'ΔT = ', siDecPrimary: 1, siDecSecondary: 1, usDecPrimary: 1, usDecSecondary: 1 });
      const qThermDual = dual(r.qThermalKw, 'power', { prefix: 'Q = ', siDecPrimary: 3, siDecSecondary: 2, usDecPrimary: 0, usDecSecondary: 0 });
      const vShiftDual = dual(r.vShiftM3, 'volume', { siDecPrimary: 3, siDecSecondary: 2, usDecPrimary: 2, usDecSecondary: 2 });
      const eShiftDual = dual(r.eShiftGJ, 'energy_gj', { siDecPrimary: 4, siDecSecondary: 4, usDecPrimary: 4, usDecSecondary: 4 });

      const bodyHtml = isHe
        ? `${balanceLine}` +
          `1. ספיקת מים שעתית: ${vTargetDual} | ${mTargetDual} עבור ${dTDual}<br>` +
          `2. הספק חום מורגש שעתי: ${qThermDual}<br>` +
          `3. <strong>סיכום למשמרת (${r.tShiftH} שעות):</strong> מים = ${vShiftDual} | אנרגיית חום = ${eShiftDual} (<code dir="ltr">${r.eShiftKwh.toFixed(3)} kWh</code>)<br>` +
          `4. ${yearLine}${econHtml1A}`
        : `${balanceLine}` +
          `1. Часовой поток воды: ${vTargetDual} | ${mTargetDual} при ${dTDual}<br>` +
          `2. Часовой поток чувствительного тепла: ${qThermDual}<br>` +
          `3. <strong>Итоги за смену (${r.tShiftH} ч):</strong> вода = ${vShiftDual} | тепловая энергия = ${eShiftDual} (<code dir="ltr">${r.eShiftKwh.toFixed(3)} кВт·ч</code>)<br>` +
          `4. ${yearLine}${econHtml1A}`;

      const warnings1A = [];
      if (r.phaseWarning) {
        warnings1A.push({
          level: 'danger',
          html: isHe
            ? `⚠️ <strong>שימו לב (תחום תקפות לפי לחץ ופאזה נוזלית):</strong> הוזנה טמפרטורת מים מעל 100 °C (<code dir="ltr">T_cond = ${siValOf('c1a_t_cond')} °C</code>, <code dir="ltr">T_makeup = ${siValOf('c1a_t_make')} °C</code>). בלחץ אטמוספרי מים רותחים ב-100 °C; חישוב הפאזה הנוזלית ללא מעבר פאזה תקף רק למערכות סגורות בלחץ גבוה מלחץ הרוויה <code dir="ltr">P &gt; P_sat(T)</code>. בפריקת קונדנסט כזה למכל פתוח חלק מהמסה יהפוך לקיטור הבזקה משני (ראו מודול 1ב), ובטמפרטורות גבוהות מדויק יותר להשתמש בהפרש אנתלפיות נוזל <code dir="ltr">h_f(T)</code>.`
            : `⚠️ <strong>Область применимости (фазовое состояние воды):</strong> ${r.phaseWarning}`
        });
      }
      if (r.propertyWarning) {
        warnings1A.push({
          level: 'notice',
          html: isHe
            ? `ℹ️ <strong>הערה לגבי תכונות הנוזל:</strong> הערכים שהוזנו (<code dir="ltr">ρ = ${siValOf('c1a_rho')} kg/L</code>, <code dir="ltr">c_p = ${siValOf('c1a_cp')} kJ/(kg·°C)</code>) חורגים מהתחום האופייני של מים נוזליים (<code dir="ltr">ρ ≈ 0.88–1.00 kg/L</code>, <code dir="ltr">c_p ≈ 4.18–4.45 kJ/(kg·°C)</code>). ודאו שהתכונות מתאימות לנוזל העבודה.`
            : `ℹ️ ${r.propertyWarning}`
        });
      }
      if (r.realismWarning) {
        warnings1A.push({
          level: 'notice',
          html: isHe
            ? `⚠️ <strong>אזהרת סבירות הנדסית:</strong> החישוב בוצע מתמטית (<code dir="ltr">0% &lt; η_b ≤ 100%</code>), אך נצילות הדוד שהוזנה <code dir="ltr">η_b = ${r.etaBoilerPct}%</code> חורגת מהתחום התעשייתי האופייני של דודי קיטור (70–95% לפי <code>[S01, S21]</code>) — בדקו את סבירות הנתונים.`
            : `⚠️ ${r.realismWarning}`
        });
      }

      const card = buildCalcCardHtml(
        '1A',
        isHe ? 'תוצאות חישוב קונדנסט ראשי (מודול 1א, [S01, PDF p. 37])' : 'Результаты основного расчёта конденсата (Модуль 1А, [S01, PDF p. 37])',
        `T_cond=${fmtFieldSummary('c1a_t_cond')}, T_make=${fmtFieldSummary('c1a_t_make')}, ρ=${fmtFieldSummary('c1a_rho')}, cp=${fmtFieldSummary('c1a_cp')}, t_shift=${r.tShiftH} h${originParen('c1a_t_shift')}`,
        bodyHtml,
        isHe ? 'חום מורגש של מים נוזליים בלבד (Q = m·cp·ΔT / 3600). לקיטור משני ראו מודול 1ב.' : 'Учитывается только чувствительное тепло жидкой фазы (Q = m·cp·ΔT / 3600). Для вторичного пара см. Модуль 1Б.',
        warnings1A
      );
      renderCalcResult('out-calc-1a', false, card);
    } catch (err) {
      handleCalcException('out-calc-1a', 'Расчёт 1А остановлен', 'חישוב 1א נעצר', err);
    }
  };

  root.loadPreset1A = function (preset) {
    if (preset === 'benchmark' || preset === 'control6') {
      document.getElementById('c1a_mode').value = 'direct_l_min';
      document.getElementById('c1a_q_l_min').value = '6';
      document.getElementById('c1a_t_cond').value = '50';
      document.getElementById('c1a_t_make').value = '20';
      document.getElementById('c1a_rho').value = '1';
      document.getElementById('c1a_cp').value = '4.186';
      document.getElementById('c1a_t_shift').value = '8';
      document.getElementById('c1a_t_year').value = '8000';
      document.getElementById('c1a_eta').value = '';
      document.getElementById('c1a_lhv').value = '';
      document.getElementById('c1a_tariff_gj').value = '';
      document.getElementById('c1a_tariff_water').value = '';
    } else if (preset === 'balance60') {
      document.getElementById('c1a_mode').value = 'steam_return_pct';
      document.getElementById('c1a_m_kg_h').value = '2000';
      document.getElementById('c1a_ret_pct').value = '60';
      document.getElementById('c1a_t_cond').value = '90';
      document.getElementById('c1a_t_make').value = '15';
      document.getElementById('c1a_rho').value = '1';
      document.getElementById('c1a_cp').value = '4.186';
      document.getElementById('c1a_t_shift').value = '8';
      document.getElementById('c1a_t_year').value = '8000';
      document.getElementById('c1a_eta').value = '80';
      document.getElementById('c1a_lhv').value = '';
      document.getElementById('c1a_tariff_gj').value = '';
      document.getElementById('c1a_tariff_water').value = '';
    } else if (preset === 'doe') {
      document.getElementById('c1a_mode').value = 'doe_s21_imperial';
      document.getElementById('c1a_m_kg_h').value = '5000';
      document.getElementById('c1a_t_cond').value = '148';
      document.getElementById('c1a_t_make').value = '28';
      document.getElementById('c1a_t_shift').value = '8';
      document.getElementById('c1a_t_year').value = '8000';
      document.getElementById('c1a_eta').value = '82';
      document.getElementById('c1a_tariff_gj').value = '5.00';
    }
    syncModuleInputsFromPreset('1A');
    root.applyCalculatorTranslations(getLang());
  };

  // =========================================================================
  // КАЛЬКУЛЯТОР 1Б: Вторичный пар и ресивер TLV S07
  // =========================================================================
  root.runCalc1B = function () {
    const EC = root.EngineeringCalculators;
    const UC = root.UnitConverter;
    const lang = getLang();
    const isHe = lang === 'he';
    const sys = getUnitSystem();
    const dual = (val, q, opts) => UC.formatDual(val, q, lang, sys, opts);
    try {
      clearFormFieldErrors('out-calc-1b');
      const r = EC.calcCondensateFlashAndTLV({
        mc_kg_h: siValOf('c1_mc'),
        p1_barg: siValOf('c1_p1'),
        p2_barg: siValOf('c1_p2'),
        hf1_kj_kg: siValOf('c1_hf1'),
        hf2_kj_kg: siValOf('c1_hf2'),
        hfg2_kj_kg: siValOf('c1_hfg2'),
        dop_mm: siValOf('c1_dop')
      });

      let tlvHtml = '';
      if (r.tlvOutOfRange) {
        const localizedReasons = [];
        if (!r.table1Row) {
          localizedReasons.push(
            isHe
              ? `ספיקת הקיטור המשני <code dir="ltr">${r.mFlashKgH.toFixed(2)} kg/h</code> עולה על הגבול העליון של טבלה 1 ב-TLV (<code dir="ltr">1500 kg/h</code>)`
              : `расход вторичного пара <code dir="ltr">${r.mFlashKgH.toFixed(2)} кг/ч</code> превышает верхний предел Vented Receiver Table - 1 (<code dir="ltr">1500 кг/ч</code>)`
          );
        }
        if (!r.table2Row) {
          localizedReasons.push(
            isHe
              ? `ספיקת הקונדנסט <code dir="ltr">${r.mc.toFixed(0)} kg/h</code> עולה על הגבול העליון של טבלה 2 ב-TLV (<code dir="ltr">10,000 kg/h</code>)`
              : `расход конденсата <code dir="ltr">${r.mc.toFixed(0)} кг/ч</code> превышает верхний предел Vented Receiver Table - 2 (<code dir="ltr">10 000 кг/ч</code>)`
          );
        }
        if (Math.abs(r.p2) > 0.05) {
          localizedReasons.push(
            isHe
              ? `לחץ המכל <code dir="ltr">P₂ = ${r.p2} barg</code> שונה מלחץ אטמוספרי (טבלאות S07, עמ' PDF 15 מיועדות רק למכלים פתוחים לאטמוספירה <code dir="ltr">P₂ = 0 barg</code>)`
              : `давление в ресивере <code dir="ltr">P₂ = ${r.p2} бар изб.</code> отлично от атмосферного (таблицы S07, PDF p. 15 составлены только для открытых атмосферных ресиверов <code dir="ltr">P₂ = 0 бар изб.</code>)`
          );
        }
        const rawTlvWarn = isHe
          ? `<span style="color:#dc2626; font-weight:700;">⚠️ חריגה מגבולות טבלאות TLV [S07, PDF p. 15] (אין לבצע אקסטרפולציה!):</span><br>` +
            localizedReasons.map((w) => `• ${w}`).join('<br>')
          : `<span style="color:#dc2626; font-weight:700;">⚠️ Выход за пределы таблиц TLV [S07, PDF p. 15] (экстраполяция запрещена!):</span><br>` +
            localizedReasons.map((w) => `• ${w}`).join('<br>');
        tlvHtml = UC.annotateErrorThresholds(rawTlvWarn, lang, sys);
      } else if (!r.isPreliminary) {
        const dCr1 = dual(r.table1Row.receiverMm, 'diameter', { prefix: 'D_cr,1 = ', siDecPrimary: 0, siDecSecondary: 0, usDecPrimary: 2, usDecSecondary: 2 });
        const dVp = dual(r.table1Row.ventLineMm, 'diameter', { prefix: 'D_vp = ', siDecPrimary: 0, siDecSecondary: 0, usDecPrimary: 2, usDecSecondary: 2 });
        const dCr2 = dual(r.table2Row.receiverMm, 'diameter', { prefix: 'D_cr,2 = ', siDecPrimary: 0, siDecSecondary: 0, usDecPrimary: 2, usDecSecondary: 2 });
        const dCr3 = dual(r.dCond3Mm, 'diameter', { prefix: 'D_cr,3 = ', siDecPrimary: 0, siDecSecondary: 0, usDecPrimary: 2, usDecSecondary: 2 });
        const dFinal = dual(r.dReceiverMm, 'diameter', { prefix: 'D_cr = ', siDecPrimary: 0, siDecSecondary: 0, usDecPrimary: 2, usDecSecondary: 2 });
        tlvHtml = isHe
          ? `<strong>בחירה לפי טבלאות TLV המדויקות (<code>[S07, printed p. 14 / PDF p. 15]</code>):</strong><br>` +
            `• תנאי 1 (<code>Table 1</code>, ≤ ${r.table1Row.maxFlashKgH} kg/h קיטור): קוטר מכל ${dCr1}, צינור אוורור ${dVp}<br>` +
            `• תנאי 2 (<code>Table 2</code>, ≤ ${r.table2Row.maxCondKgH} kg/h קונדנסט): קוטר מכל ${dCr2}<br>` +
            `• תנאי 3 (<code dir="ltr">D_cr ≥ 3 · D_op</code>): ${dCr3}<br>` +
            `→ <strong>קוטר מכל סופי ${dFinal}</strong>, צינור אוורור ${dVp}.`
          : `<strong>Подбор по точным таблицам TLV (<code>[S07, printed p. 14 / PDF p. 15]</code>):</strong><br>` +
            `• Условие 1 (<code>Table 1</code>, строка ≤ ${r.table1Row.maxFlashKgH} кг/ч пара): диаметр ресивера ${dCr1}, выхлопная труба ${dVp}<br>` +
            `• Условие 2 (<code>Table 2</code>, строка ≤ ${r.table2Row.maxCondKgH} кг/ч конденсата): диаметр ресивера ${dCr2}<br>` +
            `• Условие 3 (<code>[S07, PDF p. 14]</code>, <code dir="ltr">D_cr ≥ 3 · D_op</code>): ${dCr3}<br>` +
            `→ <strong>Итоговый диаметр ресивера ${dFinal}</strong> (подтверждён по всем 3 условиям), выхлоп ${dVp}.`;
      } else {
        const dPrelim = dual(r.dReceiverMm, 'diameter', { siDecPrimary: 0, siDecSecondary: 0, usDecPrimary: 2, usDecSecondary: 2 });
        const dVp = dual(r.table1Row.ventLineMm, 'diameter', { siDecPrimary: 0, siDecSecondary: 0, usDecPrimary: 2, usDecSecondary: 2 });
        tlvHtml = isHe
          ? `<strong>בחירה ראשונית לפי טבלאות TLV (<code>[S07, printed p. 14 / PDF p. 15]</code>):</strong><br>` +
            `→ <strong>קוטר מכל ראשוני: ${dPrelim}</strong> (צינור אוורור ${dVp}).<br>` +
            `<span style="color:#92400e;">⚠️ <strong>סטטוס ראשוני:</strong> קוטר צינור הגלישה <code>D_op</code> לא הוזן. לפי <code>[S07, PDF p. 14]</code> יש לבדוק גם <code dir="ltr">D_cr ≥ 3 · D_op</code>!</span>`
          : `<strong>Предварительный подбор по таблицам TLV (<code>[S07, printed p. 14 / PDF p. 15]</code>):</strong><br>` +
            `→ <strong>Предварительный диаметр ресивера: ${dPrelim}</strong> (выхлоп ${dVp}).<br>` +
            `<span style="color:#92400e;">⚠️ <strong>Статус предварительный:</strong> диаметр переливной трубы <code>D_op</code> не задан. По <code>[S07, printed p. 13 / PDF p. 14]</code> необходимо дополнительно проверить третье условие <code dir="ltr">D_cr ≥ 3 · D_op</code>!</span>`;
      }

      const mFlashDual = dual(r.mFlashKgH, 'mass_flow', { prefix: 'm_flash = ', siDecPrimary: 2, siDecSecondary: 1, usDecPrimary: 1, usDecSecondary: 1 });
      const mLiqDual = dual(r.mLiqKgH, 'mass_flow', { siDecPrimary: 2, siDecSecondary: 1, usDecPrimary: 1, usDecSecondary: 1 });

      const econ1B = root.EconomicsEngine
        ? root.EconomicsEngine.calcModule1BEconomics(r, {
            currency: getCurrency(),
            t_year_h: siValOf('c1b_t_year'),
            eta_boiler_pct: siValOf('c1b_eta'),
            tariff_per_gj: siValOf('c1b_tariff_gj')
          })
        : null;
      const econHtml1B = buildEconomicsBlockHtml(econ1B, lang, sys);

      const bodyHtml = isHe
        ? `1. שבר קיטור הבזקה משני: <code dir="ltr">x_flash = <strong>${r.xFlashPct.toFixed(2)}%</strong></code><br>` +
          `2. ספיקת מסה של קיטור משני: ${mFlashDual} | שארית קונדנסט נוזלי: ${mLiqDual}<br>` +
          `3. ${tlvHtml}${econHtml1B}`
        : `1. Доля вторичного пара вскипания: <code dir="ltr">x_flash = <strong>${r.xFlashPct.toFixed(2)}%</strong></code><br>` +
          `2. Массовый расход вторичного пара: ${mFlashDual} | Остаток жидкого конденсата: ${mLiqDual}<br>` +
          `3. ${tlvHtml}${econHtml1B}`;

      const warnings1B = [];
      if (r.manualEnthalpyWarning) {
        warnings1B.push({
          level: 'notice',
          html: isHe
            ? `ℹ️ <strong>שימו לב:</strong> הלחצים והאנתלפיות הוזנו ידנית (מחוץ לנקודות הייחוס המובנות בטבלת הרוויה) — ודאו מול טבלאות הקיטור הרווי שהערכים <code dir="ltr">h_f1</code>, <code dir="ltr">h_f2</code> ו-<code dir="ltr">h_fg2</code> תואמים ל-<code dir="ltr">P₁</code> ו-<code dir="ltr">P₂</code>.`
            : `ℹ️ ${r.manualEnthalpyWarning}`
        });
      }
      if (econ1B && econ1B.realismWarning) {
        warnings1B.push({
          level: 'notice',
          html: isHe
            ? `⚠️ <strong>אזהרת סבירות הנדסית:</strong> החישוב בוצע מתמטית (<code dir="ltr">0% &lt; η_b ≤ 100%</code>), אך נצילות הדוד שהוזנה <code dir="ltr">η_b = ${econ1B.etaBoilerPct}%</code> חורגת מהתחום התעשייתי האופייני של דודי קיטור (70–95% לפי <code>[S01, S21]</code>) — בדקו את סבירות הנתונים.`
            : `⚠️ ${econ1B.realismWarning}`
        });
      }
      if (r.tlvOutOfRange) {
        warnings1B.push({
          level: 'danger',
          html: tlvHtml
        });
      }

      const card = buildCalcCardHtml(
        '1B',
        isHe ? 'חישוב קיטור הבזקה ומכל איסוף TLV (מודול 1ב, [S01, S07 PDF p. 15])' : 'Результаты расчёта вторичного пара и ресивера TLV (Модуль 1Б, [S01, S07 PDF p. 15])',
        `m_c=${fmtFieldSummary('c1_mc')}, P1=${fmtFieldSummary('c1_p1')}, P2=${fmtFieldSummary('c1_p2')}, hf1=${fmtFieldSummary('c1_hf1')}, hf2=${fmtFieldSummary('c1_hf2')}, hfg2=${fmtFieldSummary('c1_hfg2')}, D_op=${fmtFieldSummary('c1_dop')}`,
        bodyHtml,
        isHe ? 'תקף למערכות פתוחות לאטמוספירה עבור GP10/GP14 באורך מכל 1 מ\' לפי [S07, PDF p. 15].' : 'Таблицы TLV [S07, PDF p. 15] применимы для открытых атмосферных ресиверов длиной 1 м (GP10/GP14) без экстраполяции.',
        warnings1B
      );
      renderCalcResult('out-calc-1b', false, card);
    } catch (err) {
      handleCalcException('out-calc-1b', 'Расчёт 1Б остановлен', 'חישוב 1ב נעצר', err);
    }
  };

  root.loadPreset1B = function (mode) {
    document.getElementById('c1_mc').value = '1500';
    document.getElementById('c1_p1').value = '5.0';
    document.getElementById('c1_p2').value = '0.0';
    document.getElementById('c1_hf1').value = '670.7';
    document.getElementById('c1_hf2').value = '419.0';
    document.getElementById('c1_hfg2').value = '2256.5';
    document.getElementById('c1_dop').value = mode === 'dop50' ? '50' : (mode === 'dop100' ? '100' : '');
    if (document.getElementById('c1b_t_year')) document.getElementById('c1b_t_year').value = '';
    if (document.getElementById('c1b_eta')) document.getElementById('c1b_eta').value = '';
    if (document.getElementById('c1b_tariff_gj')) document.getElementById('c1b_tariff_gj').value = '';
    syncModuleInputsFromPreset('1B');
    root.runCalc1B();
  };

  root.runCalc1 = function () {
    root.runCalc1A();
    root.runCalc1B();
  };

  // =========================================================================
  // КАЛЬКУЛЯТОР 2: Чиллеры
  // =========================================================================
  root.onFluidChangeCalc2 = function () {
    const f = valOf('c2_fluid');
    const UC = root.UnitConverter;
    const sys = getUnitSystem();
    const setSiField = (id, siStr) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.dataset.siValue = siStr;
      if (sys === 'us' && UC && UC.FIELD_UNIT_MAP[id]) {
        const cfg = UC.FIELD_UNIT_MAP[id];
        const usStr = UC.formatForInput(UC.toImperial(cfg.quantity, Number(siStr)), cfg.decimalsUs);
        el.value = usStr;
        el.dataset.displayedValue = usStr;
      } else {
        el.value = siStr;
        el.dataset.displayedValue = siStr;
      }
    };
    if (f === 'glycol') {
      setSiField('c2_rho', '1032');
      setSiField('c2_cp', '3.85');
    } else {
      setSiField('c2_rho', '1000.0');
      setSiField('c2_cp', '4.186');
      const tOutNum = Number(siValOf('c2_tout'));
      const tSatEvNum = Number(siValOf('c2_tsat_ev'));
      if (siValOf('c2_tsat_ev') !== '' && !Number.isNaN(tOutNum) && !Number.isNaN(tSatEvNum) && tSatEvNum >= tOutNum) {
        const evEl = document.getElementById('c2_tsat_ev');
        if (evEl) {
          evEl.value = '';
          evEl.dataset.siValue = '';
          evEl.dataset.displayedValue = '';
        }
      }
    }
    root.runCalc2();
  };

  root.runCalc2 = function () {
    const EC = root.EngineeringCalculators;
    const UC = root.UnitConverter;
    const lang = getLang();
    const isHe = lang === 'he';
    const sys = getUnitSystem();
    const dual = (val, q, opts) => UC.formatDual(val, q, lang, sys, opts);
    try {
      clearFormFieldErrors('out-calc-2');
      const r = EC.calcChillerPerformance({
        fluid_type: valOf('c2_fluid'),
        vw_m3_h: siValOf('c2_vw'),
        rho_kg_m3: siValOf('c2_rho'),
        cp_kj_kgc: siValOf('c2_cp'),
        t_evap_in_c: siValOf('c2_tin'),
        t_evap_out_c: siValOf('c2_tout'),
        p_el_kw: siValOf('c2_pel'),
        t_sat_evap_c: siValOf('c2_tsat_ev'),
        t_cond_out_c: siValOf('c2_tcond_out'),
        t_sat_cond_c: siValOf('c2_tsat_cd')
      });

      const fluidLabel = r.fluidType === 'glycol'
        ? (isHe ? 'תמיסת מים-גליקול' : 'Водный раствор гликоля')
        : (isHe ? 'מים נקיים' : 'Чистая вода');
      const mKgH = r.vw * r.rho;
      // Trap 1: Evaporator and Condenser Approaches are temperature DIFFERENCES (delta_temp: * 1.8 only!)
      const appEvapStr = r.appEvapC !== null
        ? dual(r.appEvapC, 'delta_temp', { siDecPrimary: 1, siDecSecondary: 1, usDecPrimary: 1, usDecSecondary: 1 })
        : (isHe ? `<em>לא חושב (T_sat,evap לא הוזנה)</em>` : `<em>не рассчитывался (T_sat,evap не задана)</em>`);
      const appCondStr = r.appCondC !== null
        ? dual(r.appCondC, 'delta_temp', { siDecPrimary: 1, siDecSecondary: 1, usDecPrimary: 1, usDecSecondary: 1 })
        : (isHe ? `<em>לא חושב (זוג T_cond,out ו-T_sat,cond לא הוזן)</em>` : `<em>не рассчитывался (пара T_cond,out и T_sat,cond не задана)</em>`);
      const pElDual = r.pEl !== null
        ? dual(r.pEl, 'power', { prefix: 'W_elec = ', siDecPrimary: 1, siDecSecondary: 1, usDecPrimary: 0, usDecSecondary: 0 })
        : '';
      const copStr = r.cop !== null
        ? (isHe
            ? `<br>3. יעילות אנרגטית (עבור ${pElDual}): <code dir="ltr">COP = <strong>${r.cop.toFixed(2)}</strong></code> | הספק סגולי: <code dir="ltr"><strong>${r.kwPerTr.toFixed(3)} kW/TR</strong></code>`
            : `<br>3. Энергоэффективность (при ${pElDual}): <code dir="ltr">COP = <strong>${r.cop.toFixed(2)}</strong></code> | Удельная мощность: <code dir="ltr"><strong>${r.kwPerTr.toFixed(3)} кВт/TR</strong></code>`)
        : (isHe
            ? `<br>3. <em>יעילות אנרגטית (COP, kW/TR): שדה W_elec לא הוזן — מוצגת תפוקת המאייד בלבד.</em>`
            : `<br>3. <em>Энергоэффективность (COP, кВт/TR): поле W_elec не заполнено — показана только тепловая мощность испарителя.</em>`);

      const dTevapDual = dual(r.dTevapC, 'delta_temp', { prefix: 'ΔT_evap = ', siDecPrimary: 2, siDecSecondary: 1, usDecPrimary: 1, usDecSecondary: 1 });
      const mFlowDual = dual(mKgH, 'mass_flow', { siDecPrimary: 0, siDecSecondary: 0, usDecPrimary: 0, usDecSecondary: 0 });
      const qEvapBtuH = UC.formatWithSpaces(UC.toImperial('power', r.qEvapKw), 0);
      const qEvapDual = sys === 'us'
        ? `<code dir="ltr">Q_evap = <strong>${r.qEvapTr.toFixed(2)} TR · ${qEvapBtuH} Btu/h</strong> <span class="unit-secondary">(${r.qEvapKw.toFixed(2)} ${isHe ? 'kW' : 'кВт'})</span></code>`
        : `<code dir="ltr">Q_evap = <strong>${r.qEvapKw.toFixed(2)} ${isHe ? 'kW' : 'кВт'}</strong> <span class="unit-secondary">(${r.qEvapTr.toFixed(2)} TR · ${qEvapBtuH} Btu/h)</span></code>`;

      const econ2 = root.EconomicsEngine
        ? root.EconomicsEngine.calcModule2Economics(r, {
            currency: getCurrency(),
            t_year_h: siValOf('c2_t_year'),
            tariff_per_kwh: siValOf('c2_tariff_kwh')
          })
        : null;
      const econHtml2 = buildEconomicsBlockHtml(econ2, lang, sys);

      const bodyHtml = isHe
        ? `1. הפרש טמפרטורות: ${dTevapDual} | ספיקת מסה: ${mFlowDual} | תפוקת קירור: ${qEvapDual}<br>` +
          `2. גישת מאייד <code dir="ltr">ΔT_app,evap</code>: ${appEvapStr} | גישת מעבה <code dir="ltr">ΔT_app,cond</code>: ${appCondStr}${copStr}${econHtml2}`
        : `1. Перепад температур: ${dTevapDual} | Массовый расход: ${mFlowDual} | Холодопроизводительность: ${qEvapDual}<br>` +
          `2. Подход испарителя <code dir="ltr">ΔT_app,evap</code>: ${appEvapStr} | Подход конденсатора <code dir="ltr">ΔT_app,cond</code>: ${appCondStr}${copStr}${econHtml2}`;

      const warnings2 = [];
      if (r.freezeWarning) {
        // Фактическая причина срабатывания — те же условия, что в ядре (calculators.js, calcChillerPerformance):
        // чистая вода и T_evap,out < +4.0 °C и/или T_sat,evap ≤ 0.0 °C. Ядро не меняется; интерфейс показывает,
        // какое именно условие выполнилось (задание владельца 2026-10-30, п. 1.1).
        const tOutSiStr = siValOf('c2_tout');
        const tSatSiStr = siValOf('c2_tsat_ev');
        const tOutSiNum = parseFloat(tOutSiStr);
        const tSatSiNum = tSatSiStr === '' ? NaN : parseFloat(tSatSiStr);
        const fmtFreezeT = (n) => String(Math.round(n * 100) / 100);
        const freezeReasons = [];
        if (Number.isFinite(tOutSiNum) && tOutSiNum < 4.0) {
          freezeReasons.push(`<code dir="ltr">T_evap,out = ${fmtFreezeT(tOutSiNum)} °C &lt; +4.0 °C</code>`);
        }
        if (Number.isFinite(tSatSiNum) && tSatSiNum <= 0.0) {
          freezeReasons.push(`<code dir="ltr">T_sat,evap = ${fmtFreezeT(tSatSiNum)} °C ≤ 0.0 °C</code>`);
        }
        const freezeReasonHtml = freezeReasons.length > 0
          ? freezeReasons.join('; ')
          : (isHe
              ? '<code dir="ltr">T_evap,out &lt; +4.0 °C</code> או <code dir="ltr">T_sat,evap ≤ 0.0 °C</code>'
              : '<code dir="ltr">T_evap,out &lt; +4.0 °C</code> или <code dir="ltr">T_sat,evap ≤ 0.0 °C</code>');
        warnings2.push({
          level: 'danger',
          html: isHe
            ? `🚨 <strong>סיכון מוגבר לקפיאת המאייד (Freeze Risk):</strong> נבחר מצב "מים נקיים" כאשר ${freezeReasonHtml}. גבול טמפרטורת היציאה המינימלית למים תלוי במבנה המאייד ובהגנות המכונה: במדריך Daikin EWAD-TZ <code>[S11, pp. 16–17, 19, 40]</code> התחום המותר ללא גליקול הוא <code dir="ltr">+4.0…+15.5 °C</code> (הגנת Evaporator Water Freeze מוגדרת סביב <code dir="ltr">+2.2 °C / 36 °F</code>); במדריך Trane RTWD <code>[S08, Table 14 p. 41; Table 32 pp. 82–83]</code> למים נקיים (0% גליקול) סף הניתוק המינימלי למים הוא <code dir="ltr">LWTC = +1.7 °C (35.0 °F, 30 °F·s)</code>, ולקרר <code dir="ltr">LRTC = −1.9 °C (28.6 °F)</code> עם אינטגרל <code dir="ltr">1125 °F·s</code> לפי הגבוהה מבין טמפרטורת הקרר הנוזלי במאייד וטמפרטורת הרוויה הפעילה של המעגל. בדקו את דפי היצרן או עברו לתמיסת מים-גליקול!`
            : `🚨 <strong>Причина срабатывания:</strong> ${freezeReasonHtml}.<br>${r.freezeWarning}`
        });
      }
      if (r.glycolPropertyNotice) {
        warnings2.push({
          level: 'notice',
          html: isHe
            ? `⚠️ <strong>בדיקת תכונות נוזל הקירור:</strong> נבחרה "תמיסת גליקול", אך בשדות הצפיפות (<code dir="ltr">ρ = ${r.rho} kg/m³</code>) וקיבול החום (<code dir="ltr">c_p = ${r.cp} kJ/(kg·°C)</code>) נותרו ערכים של מים נקיים (<code dir="ltr">~1000 kg/m³</code> ו-<code dir="ltr">~4.186 kJ/(kg·°C)</code>). הזינו את הצפיפות וקיבול החום בפועל של תמיסת המים-גליקול בהתאם לריכוז (לדוגמה, עבור 30% פרופילן-גליקול: <code dir="ltr">ρ ≈ 1032 kg/m³</code>, <code dir="ltr">c_p ≈ 3.85 kJ/(kg·°C)</code>) <code>[S08, pp. 11, 33]</code>!`
            : `⚠️ ${r.glycolPropertyNotice}`
        });
      }
      if (r.phaseWarning) {
        warnings2.push({
          level: 'danger',
          html: isHe
            ? `⚠️ <strong>שימו לב (תחום תקפות פאזה נוזלית):</strong> <code dir="ltr">T_evap,in = ${siValOf('c2_tin')} °C &gt; 100 °C</code> — פאזה נוזלית של מים ללא רתיחה אפשרית רק במעגל סגור תחת לחץ עודף <code dir="ltr">P &gt; P_sat(T)</code>.`
            : `⚠️ ${r.phaseWarning}`
        });
      }

      const card = buildCalcCardHtml(
        '2',
        isHe ? `תוצאות חישוב צ'ילר (מחשבון 2 — ${fluidLabel})` : `Результаты расчёта чиллера (Калькулятор 2 — ${fluidLabel})`,
        `V_w=${fmtFieldSummary('c2_vw')}, ρ=${fmtFieldSummary('c2_rho')}, cp=${fmtFieldSummary('c2_cp')}, T_in=${fmtFieldSummary('c2_tin')} → T_out=${fmtFieldSummary('c2_tout')}, W_el=${fmtFieldSummary('c2_pel')}`,
        bodyHtml,
        isHe
          ? 'הערכת <bdi dir="ltr">ΔT_app</bdi> מבוצעת מול גיליון הבחירה של היצרן באותו עומס (ב-<bdi dir="ltr">Trane RTWD [S08, p. 66]</bdi> ניקוי מעבה מומלץ בעלייה מעל <code dir="ltr">~5.6 °C</code> לאחר שלילת גזים לא-מתעבים).'
          : 'Оценка ΔT_app выполняется путём сравнения с заводским листом подбора при сопоставимой нагрузке (в Trane RTWD [S08, p. 66] чистка рекомендована при росте подхода выше ~10 °F ≈ 5.6 °C).',
        warnings2
      );
      renderCalcResult('out-calc-2', false, card);
    } catch (err) {
      handleCalcException('out-calc-2', 'Расчёт чиллера остановлен', 'חישוב הצ\'ילר נעצר', err);
    }
  };

  root.loadPreset2 = function (mode) {
    if (mode === 'glycol') {
      document.getElementById('c2_fluid').value = 'glycol';
      document.getElementById('c2_vw').value = '120.0';
      document.getElementById('c2_rho').value = '1032';
      document.getElementById('c2_cp').value = '3.85';
      document.getElementById('c2_tin').value = '4.0';
      document.getElementById('c2_tout').value = '-1.0';
      document.getElementById('c2_pel').value = '105.0';
      document.getElementById('c2_tsat_ev').value = '-4.5';
      document.getElementById('c2_tcond_out').value = '33.0';
      document.getElementById('c2_tsat_cd').value = '35.5';
    } else if (mode === 'case31') {
      document.getElementById('c2_fluid').value = 'water';
      document.getElementById('c2_vw').value = '85.6';
      document.getElementById('c2_rho').value = '999.7';
      document.getElementById('c2_cp').value = '4.186';
      document.getElementById('c2_tin').value = '12.0';
      document.getElementById('c2_tout').value = '7.0';
      document.getElementById('c2_pel').value = '128.0';
      document.getElementById('c2_tsat_ev').value = '3.5';
      document.getElementById('c2_tcond_out').value = '34.5';
      document.getElementById('c2_tsat_cd').value = '44.5';
    } else {
      document.getElementById('c2_fluid').value = 'water';
      document.getElementById('c2_vw').value = '120.0';
      document.getElementById('c2_rho').value = '1000.0';
      document.getElementById('c2_cp').value = '4.186';
      document.getElementById('c2_tin').value = '12.0';
      document.getElementById('c2_tout').value = '7.0';
      document.getElementById('c2_pel').value = '96.0';
      document.getElementById('c2_tsat_ev').value = '';
      document.getElementById('c2_tcond_out').value = '32.8';
      document.getElementById('c2_tsat_cd').value = '35.0';
    }
    if (document.getElementById('c2_t_year')) document.getElementById('c2_t_year').value = '';
    if (document.getElementById('c2_tariff_kwh')) document.getElementById('c2_tariff_kwh').value = '';
    syncModuleInputsFromPreset('2');
    root.runCalc2();
  };

  // =========================================================================
  // КАЛЬКУЛЯТОР 3: Сжатый воздух (3А, 3Б, 3В)
  // =========================================================================
  root.runCalc3A = function () {
    const EC = root.EngineeringCalculators;
    const UC = root.UnitConverter;
    const lang = getLang();
    const isHe = lang === 'he';
    const sys = getUnitSystem();
    const dual = (val, q, opts) => UC.formatDual(val, q, lang, sys, opts);
    try {
      clearFormFieldErrors('out-calc-3a');
      const r = EC.calcAirFlowConversion({
        q1_l_s: siValOf('c3a_q1'),
        p1_abs_bar: siValOf('c3a_p1'),
        t1_c: siValOf('c3a_t1'),
        rh1_pct: siValOf('c3a_rh1'),
        psat1_bar: siValOf('c3a_psat1'),
        p2_abs_bar: siValOf('c3a_p2'),
        t2_c: siValOf('c3a_t2'),
        rh2_pct: siValOf('c3a_rh2'),
        psat2_bar: siValOf('c3a_psat2')
      });
      const pDry1Dual = dual(r.pDry1, 'pressure_a', { prefix: 'P_dry,1 = ', siDecPrimary: 5, siDecSecondary: 5, usDecPrimary: 3, usDecSecondary: 3 });
      const t1KDual = dual(r.t1K, 'abs_temp', { siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 1, usDecSecondary: 1 });
      const pDry2Dual = dual(r.pDry2, 'pressure_a', { prefix: 'P_dry,2 = ', siDecPrimary: 5, siDecSecondary: 5, usDecPrimary: 3, usDecSecondary: 3 });
      const t2KDual = dual(r.t2K, 'abs_temp', { siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 1, usDecSecondary: 1 });
      const q2LsDual = dual(r.q2LS, 'air_flow_ls', { prefix: 'Q₂ = ', siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 2, usDecSecondary: 2 });
      const q2M3MinDual = dual(r.q2M3Min, 'air_flow_m3min', { siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 2, usDecSecondary: 2 });

      const bodyHtml = isHe
        ? `1. לחץ חלקי של אוויר יבש: במצב 1 ${pDry1Dual} (${t1KDual}) → במצב 2 ${pDry2Dual} (${t2KDual})<br>` +
          `2. ספיקה נפחית במצב 2: ${q2LsDual} = ${q2M3MinDual} (<code dir="ltr">${r.q2M3H.toFixed(1)} m³/h</code>)`
        : `1. Парциальное давление сухого воздуха: в состоянии 1 ${pDry1Dual} (${t1KDual}) → в состоянии 2 ${pDry2Dual} (${t2KDual})<br>` +
          `2. Объёмный расход в состоянии 2: ${q2LsDual} = ${q2M3MinDual} (<code dir="ltr">${r.q2M3H.toFixed(1)} м³/ч</code>)`;
      const card = buildCalcCardHtml(
        '3A',
        isHe ? 'תוצאות המרת ספיקת אוויר (מודול 3א, [S13, PDF p. 16, 50])' : 'Результаты пересчёта объёмного расхода (Модуль 3А, [S13, PDF p. 16, 50])',
        `Q1=${valOf('c3a_q1')} NL/s (SI)${originParen('c3a_q1')}, P1=${fmtFieldSummary('c3a_p1')}, T1=${fmtFieldSummary('c3a_t1')} → P2=${fmtFieldSummary('c3a_p2')}, T2=${fmtFieldSummary('c3a_t2')}`,
        bodyHtml,
        isHe ? 'משוואת גז אידיאלי לאוויר יבש בקיזוז לחץ חלקי של אדי מים (P_dry = P_abs − φ·p_sat).' : 'Закон идеального газа для сухой части воздуха с вычетом парциального давления пара (P_dry = P_abs − φ·p_sat).'
      );
      renderCalcResult('out-calc-3a', false, card);
    } catch (err) {
      handleCalcException('out-calc-3a', 'Расчёт 3А остановлен', 'חישוב 3א נעצר', err);
    }
  };

  root.loadPreset3A = function (p2Val) {
    document.getElementById('c3a_q1').value = '400';
    document.getElementById('c3a_p1').value = '1.01325';
    document.getElementById('c3a_t1').value = '0';
    document.getElementById('c3a_rh1').value = '0';
    document.getElementById('c3a_psat1').value = '0';
    document.getElementById('c3a_p2').value = String(p2Val);
    document.getElementById('c3a_t2').value = '30';
    document.getElementById('c3a_rh2').value = '60';
    document.getElementById('c3a_psat2').value = '0.04246';
    syncModuleInputsFromPreset('3A');
    root.runCalc3A();
  };

  root.runCalc3B = function () {
    const EC = root.EngineeringCalculators;
    const UC = root.UnitConverter;
    const lang = getLang();
    const isHe = lang === 'he';
    const sys = getUnitSystem();
    const dual = (val, q, opts) => UC.formatDual(val, q, lang, sys, opts);
    try {
      clearFormFieldErrors('out-calc-3b');
      const method = valOf('c3b_method');
      const r = EC.calcAirLeaks({
        method,
        v_rec_m3: siValOf('c3b_vr'),
        p1_g_bar: siValOf('c3b_pstart'),
        p2_g_bar: siValOf('c3b_pend'),
        t_min: siValOf('c3b_tdecay'),
        p_atm_bar: siValOf('c3b_patm'),
        q_comp_m3_min: siValOf('c3b_qcomp'),
        t_load_min: siValOf('c3b_tload'),
        t_unload_min: siValOf('c3b_tunload')
      });
      let bodyHtml = '';
      if (r.method === 'receiver_drop') {
        const pctStr = r.leakPct !== null
          ? (isHe ? ` | שיעור מתפוקת המדחס: <code dir="ltr"><strong>${r.leakPct.toFixed(1)}%</strong></code>` : ` | Доля от подачи компрессора: <code dir="ltr"><strong>${r.leakPct.toFixed(1)}%</strong></code>`)
          : '';
        const qLeakM3MinDual = dual(r.qLeakM3Min, 'air_flow_m3min', { prefix: 'Q_leak = ', siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 2, usDecSecondary: 2 });
        const qLeakLsDual = dual(r.qLeakLS, 'air_flow_ls', { siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 2, usDecSecondary: 2 });
        bodyHtml = isHe
          ? `• ספיקת דליפות (מנורמלת ליניקה): ${qLeakM3MinDual} | ${qLeakLsDual}${pctStr}`
          : `• Расход утечек (приведённый к всасу): ${qLeakM3MinDual} | ${qLeakLsDual}${pctStr}`;
      } else {
        const qStr = r.qLeakM3Min !== null
          ? (isHe
              ? ` | ספיקת דליפות: ${dual(r.qLeakM3Min, 'air_flow_m3min', { siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 2, usDecSecondary: 2 })} (${dual(r.qLeakLS, 'air_flow_ls', { siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 2, usDecSecondary: 2 })})`
              : ` | Расход утечек: ${dual(r.qLeakM3Min, 'air_flow_m3min', { siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 2, usDecSecondary: 2 })} (${dual(r.qLeakLS, 'air_flow_ls', { siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 2, usDecSecondary: 2 })})`)
          : '';
        bodyHtml = isHe
          ? `• שיעור זמן עבודה בהעמסה על דליפות: <code dir="ltr">L_% = <strong>${r.leakPct.toFixed(2)}%</strong></code>${qStr}`
          : `• Доля времени работы под нагрузкой на утечки: <code dir="ltr">L_% = <strong>${r.leakPct.toFixed(2)}%</strong></code>${qStr}`;
      }
      const EE = root.EconomicsEngine;
      const econ3B = EE
        ? EE.calcModule3BEconomics(r, {
            currency: getCurrency(),
            spec_power_kw_m3min: siValOf('c3b_spec_power'),
            t_year_h: siValOf('c3b_t_year'),
            tariff_per_kwh: siValOf('c3b_tariff_kwh')
          })
        : null;
      const econ3BHtml = buildEconomicsBlockHtml(econ3B, lang, sys);
      if (econ3BHtml) {
        bodyHtml += econ3BHtml;
      }
      const card = buildCalcCardHtml(
        '3B',
        isHe ? 'תוצאות הערכת דליפות אוויר דחוס (מודול 3ב, [S12, PDF p. 53–54])' : 'Результаты оценки утечек сжатого воздуха (Модуль 3Б, [S12, PDF p. 53–54])',
        `method=${r.method}${originParen('c3b_method')}, V_rec=${fmtFieldSummary('c3b_vr')}, P1=${fmtFieldSummary('c3b_pstart')}→P2=${fmtFieldSummary('c3b_pend')}, t=${valOf('c3b_tdecay')} min${originParen('c3b_tdecay')}, Q_comp=${fmtFieldSummary('c3b_qcomp')}`,
        bodyHtml,
        isHe ? 'המדידה מתבצעת בזמן השבתת צרכני הייצור לפי נוהל US DOE [S12, PDF p. 53–54].' : 'Замер выполняется при остановленных технологических потребителях по методике US DOE [S12, PDF p. 53–54].'
      );
      renderCalcResult('out-calc-3b', false, card);
    } catch (err) {
      handleCalcException('out-calc-3b', 'Расчёт 3Б остановлен', 'חישוב 3ב נעצר', err);
    }
  };

  root.loadPreset3B = function (method) {
    document.getElementById('c3b_method').value = method;
    document.getElementById('c3b_vr').value = '10.0';
    document.getElementById('c3b_pstart').value = '7.0';
    document.getElementById('c3b_pend').value = '6.0';
    document.getElementById('c3b_tdecay').value = '5.0';
    document.getElementById('c3b_patm').value = '1.0';
    document.getElementById('c3b_tload').value = '3.0';
    document.getElementById('c3b_tunload').value = '7.0';
    document.getElementById('c3b_qcomp').value = '20.0';
    if (document.getElementById('c3b_spec_power')) document.getElementById('c3b_spec_power').value = '';
    if (document.getElementById('c3b_t_year')) document.getElementById('c3b_t_year').value = '';
    if (document.getElementById('c3b_tariff_kwh')) document.getElementById('c3b_tariff_kwh').value = '';
    syncModuleInputsFromPreset('3B');
    root.runCalc3B();
  };

  root.runCalc3 = function () {
    const EC = root.EngineeringCalculators;
    const UC = root.UnitConverter;
    const lang = getLang();
    const isHe = lang === 'he';
    const sys = getUnitSystem();
    const dual = (val, q, opts) => UC.formatDual(val, q, lang, sys, opts);
    try {
      clearFormFieldErrors('out-calc-3');
      // Trap 3: Module 3C fields stay in SI (L/s, K, bar(a), g/m³) per S13 table, while condensate outputs show both kg/h and lb/h
      const r = EC.calcAirMoistureCondensation({
        qc_l_s: siValOf('c3_qc'),
        rh_fraction: siValOf('c3_rh'),
        rho_in_g_m3: siValOf('c3_rho_in'),
        t_amb_k: siValOf('c3_tamb'),
        p_after_abs_bar: siValOf('c3_pafter'),
        t_after_k: siValOf('c3_tafter'),
        rho_out_g_m3: siValOf('c3_rho_out')
      });
      const mwInRoundedS13 = Math.round(r.mwInGs * 10) / 10;
      const mwOutRoundedS13 = Math.round(r.mwMaxIsoGs * 10) / 10;
      const mCondRoundedS13 = Math.max(0, (mwInRoundedS13 - mwOutRoundedS13) * 3.6);
      const mCondTempDual = dual(r.mCondTempKgH, 'mass_flow', { siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 2, usDecSecondary: 2 });
      const mCondIsoDual = dual(r.mCondIsoKgH, 'mass_flow', { siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 2, usDecSecondary: 2 });
      const mCondRoundDual = dual(mCondRoundedS13, 'mass_flow', { siDecPrimary: 1, siDecSecondary: 1, usDecPrimary: 1, usDecSecondary: 1 });
      const bodyHtml = isHe
        ? `1. שטף אדי מים ביניקה: <code dir="ltr">m_w,in = <strong>${r.mwInGs.toFixed(4)} g/s</strong></code> (עם עיגול ביניים של S13: <code dir="ltr">${mwInRoundedS13.toFixed(1)} g/s</code>)<br>` +
          `2. חישוב עם יחס טמפרטורות <code dir="ltr">T_after / T_amb</code>: <code dir="ltr">q_comp = ${r.qCompTempLS.toFixed(3)} L/s</code> ← לחות שארית <code dir="ltr">${r.mwMaxTempGs.toFixed(4)} g/s</code> ← עיבוי מים: ${mCondTempDual}<br>` +
          `3. חישוב לפי נוסחת S13 המקוצרת (<code dir="ltr">q_comp = q_c / p_after = ${r.qCompIsoLS.toFixed(3)} L/s</code>): עיבוי ללא עיגול ביניים: ${mCondIsoDual} (עם עיגול S13: ${mCondRoundDual})`
        : `1. Поток водяного пара на всасе: <code dir="ltr">m_w,in = <strong>${r.mwInGs.toFixed(4)} г/с</strong></code> (с промежуточным округлением S13 до десятых: <code dir="ltr">${mwInRoundedS13.toFixed(1)} г/с</code>)<br>` +
          `2. Расчёт с температурным отношением <code dir="ltr">T_after / T_amb</code>: <code dir="ltr">q_comp = ${r.qCompTempLS.toFixed(3)} л/с</code> → остаточная влага <code dir="ltr">${r.mwMaxTempGs.toFixed(4)} г/с</code> → конденсат: ${mCondTempDual}<br>` +
          `3. Расчёт по упрощённой формуле S13 (<code dir="ltr">q_comp = q_c / p_after = ${r.qCompIsoLS.toFixed(3)} л/с</code>): остаточная влага <code dir="ltr">${r.mwMaxIsoGs.toFixed(4)} г/с</code> → конденсат без промеж. округления: ${mCondIsoDual} (с промежуточным округлением S13: ${mCondRoundDual})`;
      const card = buildCalcCardHtml(
        '3C',
        isHe ? 'תוצאות מאזן התעבות לחות לפי Atlas Copco (מודול 3ג, [S13, PDF p. 122])' : 'Результаты балансового расчёта влаги по Atlas Copco (Модуль 3В, [S13, PDF p. 122])',
        `q_c=${valOf('c3_qc')} L/s${originParen('c3_qc')}, RH=${valOf('c3_rh')}${originParen('c3_rh')}, ρ_in=${valOf('c3_rho_in')} g/m³${originParen('c3_rho_in')}, p_after=${valOf('c3_pafter')} bar(a)${originParen('c3_pafter')}, ρ_out=${valOf('c3_rho_out')} g/m³${originParen('c3_rho_out')}`,
        bodyHtml,
        isHe ? 'מציג הן את החישוב המדויק והן את שיטת העיגול של Atlas Copco [S13, Section 5.4.1, PDF p. 122].' : 'Показаны как точный расчёт с температурной поправкой, так и упрощённая формула с округлением из примера Atlas Copco [S13, PDF p. 122].'
      );
      renderCalcResult('out-calc-3', false, card);
    } catch (err) {
      handleCalcException('out-calc-3', 'Расчёт 3В остановлен', 'חישוב 3ג נעצר', err);
    }
  };

  root.loadPreset3 = function (preset) {
    if (preset === 's13_exact') {
      document.getElementById('c3_qc').value = '445';
      document.getElementById('c3_rh').value = '0.60';
      document.getElementById('c3_rho_in').value = '30.078';
      document.getElementById('c3_tamb').value = '303.15';
      document.getElementById('c3_pafter').value = '8.0';
      document.getElementById('c3_tafter').value = '279.15';
      document.getElementById('c3_rho_out').value = '7.246';
    } else {
      const qc = preset === 'aftercooler_450' ? '450' : '445';
      document.getElementById('c3_qc').value = qc;
      document.getElementById('c3_rh').value = '0.50';
      document.getElementById('c3_rho_in').value = '17.148';
      document.getElementById('c3_tamb').value = '293';
      document.getElementById('c3_pafter').value = '8.0';
      document.getElementById('c3_tafter').value = '298';
      document.getElementById('c3_rho_out').value = '22.830';
    }
    syncModuleInputsFromPreset('3C');
    root.runCalc3();
  };

  // =========================================================================
  // КАЛЬКУЛЯТОР 4: Обратный осмос RO (4А Баланс + 4Б Нормализация)
  // =========================================================================
  root.runCalc4A = function () {
    const EC = root.EngineeringCalculators;
    const UC = root.UnitConverter;
    const lang = getLang();
    const isHe = lang === 'he';
    const sys = getUnitSystem();
    const dual = (val, q, opts) => UC.formatDual(val, q, lang, sys, opts);
    clearFormFieldErrors('out-calc-4a');
    try {
      const r = EC.calcROBalance({
        qp_m3_h: siValOf('c4a_qp'),
        qc_m3_h: siValOf('c4a_qc'),
        qf_meas_m3_h: siValOf('c4a_qf_meas'),
        ec_f_us_cm: siValOf('c4a_ecf'),
        ec_p_us_cm: siValOf('c4a_ecp'),
        ec_c_us_cm: siValOf('c4a_ecc'),
        tds_f_mg_l: siValOf('c4a_tdsf'),
        tds_p_mg_l: siValOf('c4a_tdsp'),
        tds_c_mg_l: siValOf('c4a_tdsc')
      });
      const flowStr = r.flowDiscrepancyPct !== null
        ? (isHe ? ` (סטיית מד ספיקת כניסה <code dir="ltr">Q_f,meas: ${r.flowDiscrepancyPct.toFixed(2)}%</code>)` : ` (отклонение входного расходомера <code dir="ltr">Q_f,meas: ${r.flowDiscrepancyPct.toFixed(2)}%</code>)`)
        : '';
      let bEcStatusText = '';
      if (r.bEc !== null) {
        if (r.bEc >= 0.95 && r.bEc <= 1.05) {
          bEcStatusText = isHe
            ? 'מאזן מוליכות נסגר בטווח הנורמה 0.95…1.05 [S16, Eq. 80, PDF p. 152].'
            : 'Баланс проводимости сходится в пределах нормы 0,95…1,05 [S16, Eq. 80, PDF p. 152].';
        } else {
          bEcStatusText = isHe
            ? '⚠️ מאזן מוליכות B_EC חורג מ-0.95…1.05 — בדקו כיול מדי ספיקה ומוליכות [S16, PDF p. 152]!'
            : '⚠️ Баланс проводимости B_EC выходит за пределы 0,95…1,05 — проверьте калибровку расходомеров и кондуктометров [S16, PDF p. 152]!';
        }
      }
      const becStr = r.bEc !== null
        ? (isHe
            ? `<br>4. בדיקת מאזן מוליכות לפי <code>Eq. 80 [S16, PDF p. 152]</code>: <code dir="ltr">B_EC = <strong>${r.bEc.toFixed(4)}</strong></code> — ${bEcStatusText}`
            : `<br>4. Проверка баланса проводимости по <code>Eq. 80 [S16, PDF p. 152]</code>: <code dir="ltr">B_EC = <strong>${r.bEc.toFixed(4)}</strong></code> — ${bEcStatusText}`)
        : '';
      let tdsStr = '';
      if (r.spTdsPct !== null && r.cfMassTds !== null) {
        const bTdsPart = r.bTds !== null ? ` | <code dir="ltr">B_TDS = <strong>${r.bTds.toFixed(4)}</strong></code>` : '';
        tdsStr = isHe
          ? `<br>5. <strong>מאזן מלחים מדויק לפי TDS (mg/L):</strong> <code dir="ltr">SP_TDS = <strong>${r.spTdsPct.toFixed(2)}%</strong></code>, <code dir="ltr">SR_TDS = <strong>${r.srTdsPct.toFixed(2)}%</strong></code>, <code dir="ltr">CF_TDS = <strong>${r.cfMassTds.toFixed(2)}</strong></code>${bTdsPart}`
          : `<br>5. <strong>Точный массовый баланс солей по измеренным TDS (мг/л):</strong> <code dir="ltr">SP_TDS = <strong>${r.spTdsPct.toFixed(2)}%</strong></code>, <code dir="ltr">SR_TDS = <strong>${r.srTdsPct.toFixed(2)}%</strong></code>, <code dir="ltr">CF_TDS = <strong>${r.cfMassTds.toFixed(2)}</strong></code>${bTdsPart}`;
      }

      const warningsList = [];
      if (r.flowDiscrepancyPct !== null && Math.abs(r.flowDiscrepancyPct) > 2.0) {
        warningsList.push(
          isHe
            ? `⚠️ אי-התאמה בין מד ספיקת הכניסה Q_f,meas לבין סכום Q_p + Q_c (${r.flowDiscrepancyPct.toFixed(2)}% > 2%): בדקו איפוס וכיול מדי הספיקה.`
            : `⚠️ Расхождение между входным расходомером Q_f,meas и суммой Q_p + Q_c (${r.flowDiscrepancyPct.toFixed(2)}% > 2%): проверьте калибровку расходомеров.`
        );
      }
      if (r.bEc !== null && (r.bEc < 0.95 || r.bEc > 1.05)) {
        warningsList.push(bEcStatusText);
      }
      if (r.ecAssumptionNote) {
        warningsList.push(
          isHe
            ? 'ℹ️ הערת מודל [S16, PDF p. 152]: מוליכות חשמלית EC (µS/cm) היא קירוב תפעולי נוח לריכוז מלחים, אך הקשר בין EC לבין TDS (mg/L) אינו ליניארי לחלוטין עקב שינוי הרכב היונים והפחתת ניידות יונים בריכוז גבוה.'
            : `ℹ️ ${r.ecAssumptionNote}`
        );
      }

      const qfDual = dual(r.qfCalc, 'water_flow_m3h', { prefix: 'Q_f = Q_p + Q_c = ', siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 1, usDecSecondary: 2 });
      const bodyHtml = isHe
        ? `1. ספיקת הזנה מחושבת: ${qfDual}${flowStr} | יחס השבה (Recovery): <code dir="ltr">Y = <strong>${r.recoveryPct.toFixed(2)}%</strong></code><br>` +
          `2. <strong>הערכה מקורבת לפי מוליכות (EC):</strong> מעבר מלחים <code dir="ltr">SP_EC = <strong>${r.spEcPct.toFixed(2)}%</strong></code> | דחיית מלחים נצפית <code dir="ltr">SR_EC = <strong>${r.srEcPct.toFixed(2)}%</strong></code><br>` +
          `3. פקטור ריכוז: נפחי אידיאלי (עבור SR=100%) <code dir="ltr">CF_ideal = <strong>${r.cfIdeal.toFixed(2)}</strong></code> | מקורב לפי מוליכות <code dir="ltr">CF_EC = <strong>${r.cfApproxEc.toFixed(2)}</strong></code>${becStr}${tdsStr}`
        : `1. Расчётный расход питания: ${qfDual}${flowStr} | Степень извлечения: <code dir="ltr">Y = <strong>${r.recoveryPct.toFixed(2)}%</strong></code><br>` +
          `2. <strong>Приближённая оценка по электропроводности (EC):</strong> проскок по проводимости <code dir="ltr">SP_EC = <strong>${r.spEcPct.toFixed(2)}%</strong></code> | наблюдаемая селективность <code dir="ltr">SR_EC = <strong>${r.srEcPct.toFixed(2)}%</strong></code><br>` +
          `3. Фактор концентрирования: объёмный (при SR=100%) <code dir="ltr">CF_ideal = <strong>${r.cfIdeal.toFixed(2)}</strong></code> | приближённая оценка по проводимости <code dir="ltr">CF_EC = <strong>${r.cfApproxEc.toFixed(2)}</strong></code>${becStr}${tdsStr}`;

      const card = buildCalcCardHtml(
        '4A',
        isHe ? 'תוצאות מאזן זרימה ומוליכות RO (מודול 4א, [S16, PDF p. 35, 102, 152])' : 'Результаты баланса потоков и проводимости RO (Модуль 4А, [S16, PDF p. 35, 102, 152])',
        `Qp=${fmtFieldSummary('c4a_qp')}, Qc=${fmtFieldSummary('c4a_qc')}, ECf=${valOf('c4a_ecf')} µS/cm${originParen('c4a_ecf')}, ECp=${valOf('c4a_ecp')} µS/cm${originParen('c4a_ecp')}, ECc=${valOf('c4a_ecc') || '—'} µS/cm${originParen('c4a_ecc')}`,
        bodyHtml,
        isHe ? 'מוליכות חשמלית EC (µS/cm) היא קירוב תפעולי לריכוז מלחים TDS (mg/L); הקשר אינו ליניארי לחלוטין [S16, PDF p. 152].' : 'Электропроводность EC (мкСм/см) — удобное эксплуатационное приближение; связь между EC и TDS (мг/л) не строго линейна [S16, PDF p. 152].',
        warningsList
      );
      renderCalcResult('out-calc-4a', false, card);
    } catch (err) {
      handleCalcException('out-calc-4a', 'Расчёт 4А остановлен', 'חישוב 4א נעצר', err);
    }
  };

  root.loadPreset4A = function () {
    document.getElementById('c4a_qp').value = '18.0';
    document.getElementById('c4a_qc').value = '6.0';
    document.getElementById('c4a_qf_meas').value = '24.2';
    document.getElementById('c4a_ecf').value = '1200';
    document.getElementById('c4a_ecp').value = '24';
    document.getElementById('c4a_ecc').value = '4720';
    document.getElementById('c4a_tdsf').value = '';
    document.getElementById('c4a_tdsp').value = '';
    document.getElementById('c4a_tdsc').value = '';
    syncModuleInputsFromPreset('4A');
    root.runCalc4A();
  };

  root.runCalc4 = function () {
    const EC = root.EngineeringCalculators;
    const UC = root.UnitConverter;
    const lang = getLang();
    const isHe = lang === 'he';
    const sys = getUnitSystem();
    const dual = (val, q, opts) => UC.formatDual(val, q, lang, sys, opts);
    clearFormFieldErrors('out-calc-4');
    try {
      const r = EC.calcRONormalization({
        qp_o_m3_h: siValOf('c4_qp'),
        qc_o_m3_h: siValOf('c4_qc'),
        qp_s_m3_h: siValOf('c4_qbase'),
        ndp_s_bar: siValOf('c4_ndps'),
        ndp_o_bar: siValOf('c4_ndpo'),
        tcf_s: siValOf('c4_tcfs'),
        tcf_o: siValOf('c4_tcfo'),
        dp_back_bar: siValOf('c4_pp')
      });

      const ndpSign = r.ndpEffectPct >= 0 ? '+' : '';
      const tcfSign = r.tcfEffectPct >= 0 ? '+' : '';
      const interp = buildRONormalizationInterpretation(r, lang);

      const warningsList = [];
      if (r.normDevPct <= -10.0) {
        warningsList.push(
          isHe
            ? `⚠️ התראת CIP [S16, PDF p. 131, 134]: ספיקת התוצר המנורמלת ירדה ב-${Math.abs(r.normDevPct).toFixed(2)}% (≥ 10% מההרצה) — נדרשת שטיפה כימית CIP לפני התקבעות משקעים.`
            : `⚠️ Сигнал к промывке CIP [S16, PDF p. 131, 134]: нормализованный поток пермеата снизился на ${Math.abs(r.normDevPct).toFixed(2)}% (≥ 10% от пуска) — требуется химическая промывка CIP.`
        );
      } else if (r.normDevPct >= 10.0) {
        warningsList.push(
          isHe
            ? `⚠️ התראת שלמות ממברנות [S16, PDF p. 161]: ספיקת התוצר המנורמלת עלתה ב-+${r.normDevPct.toFixed(2)}% (≥ +10% מההרצה) — בדקו פריצת אטמי O-ring או פגיעה חמצונית בשכבת הפוליאמיד.`
            : `⚠️ Предупреждение о целостности мембран [S16, PDF p. 161]: нормализованный поток вырос на +${r.normDevPct.toFixed(2)}% (≥ +10% от пуска) — проверьте уплотнения O-ring или окисление полиамидного слоя.`
        );
      }

      const qfDual = dual(r.qf, 'water_flow_m3h', { prefix: 'Q_fo = ', siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 1, usDecSecondary: 2 });
      const qsDual = dual(r.qsNorm, 'water_flow_m3h', { prefix: 'Q_s = ', siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 1, usDecSecondary: 2 });

      const bodyHtml = isHe
        ? `1. ספיקת הזנה נוכחית: ${qfDual} | יחס השבה נוכחי: <code dir="ltr">Y_o = <strong>${r.yPct.toFixed(2)}%</strong></code> | <code dir="ltr">CF_ideal = ${r.cfIdeal.toFixed(2)}</code><br>` +
          `2. סטיית ספיקת תוצר "גולמית" מההרצה: <code dir="ltr"><strong>${r.rawDevPct.toFixed(2)}%</strong></code> | השפעת גורמי <code>Eq. 72</code>: <code dir="ltr">NDP_o/NDP_s = ${r.ndpFactorRatio.toFixed(4)} (${ndpSign}${r.ndpEffectPct.toFixed(2)}%)</code>, <code dir="ltr">TCF_o/TCF_s = ${r.tcfFactorRatio.toFixed(4)} (${tcfSign}${r.tcfEffectPct.toFixed(2)}%)</code><br>` +
          `3. ספיקת תוצר מנורמלת: ${qsDual} (סטייה מההרצה: <code dir="ltr"><strong>${r.normDevPct.toFixed(2)}%</strong></code>)<br>` +
          `4. <strong>פרשנות הנדסית דינמית:</strong> ${interp}`
        : `1. Текущий расход питания: ${qfDual} | Текущее извлечение: <code dir="ltr">Y_o = <strong>${r.yPct.toFixed(2)}%</strong></code> | <code dir="ltr">CF_ideal = ${r.cfIdeal.toFixed(2)}</code><br>` +
          `2. Отклонение «сырого» расхода пермеата от пуска: <code dir="ltr"><strong>${r.rawDevPct.toFixed(2)}%</strong></code> | Вклад факторов модели <code>Eq. 72</code>: <code dir="ltr">NDP_o/NDP_s = ${r.ndpFactorRatio.toFixed(4)} (${ndpSign}${r.ndpEffectPct.toFixed(2)}%)</code>, <code dir="ltr">TCF_o/TCF_s = ${r.tcfFactorRatio.toFixed(4)} (${tcfSign}${r.tcfEffectPct.toFixed(2)}%)</code><br>` +
          `3. Нормализованный поток пермеата: ${qsDual} (отклонение от пуска: <code dir="ltr"><strong>${r.normDevPct.toFixed(2)}%</strong></code>)<br>` +
          `4. <strong>Динамическая инженерная интерпретация:</strong> ${interp}`;

      const card = buildCalcCardHtml(
        '4B',
        isHe ? 'תוצאות נרמול RO לפי נוסחת DuPont Eq. 72 (מודול 4ב, [S16, PDF p. 131–133])' : 'Результаты нормализации RO по формуле DuPont Eq. 72 (Модуль 4Б, [S16, PDF p. 131–133])',
        `Qp_o=${fmtFieldSummary('c4_qp')}, Qp_s=${fmtFieldSummary('c4_qbase')}, NDP_s=${fmtFieldSummary('c4_ndps')}→NDP_o=${fmtFieldSummary('c4_ndpo')}, TCF_s=${fmtFieldSummary('c4_tcfs')}→TCF_o=${fmtFieldSummary('c4_tcfo')}`,
        bodyHtml,
        isHe
          ? 'בדיקת לחץ נגדי בתוצר: P_p − P_c ≤ 0.3 bar (≈ 4.35 psi) / 5 psi (≈ 0.345 bar) למניעת סיכון היפרדות שכבות [S16, p. 106, 165; S17; S20, p. 51].'
          : 'Проверка обратного давления пермеата: P_p − P_c ≤ 0.3 бар (≈ 4.35 psi) / 5 psi (≈ 0.345 бар) для предотвращения риска расслоения мембран [S16, p. 106, 165; S17; S20, p. 51].',
        warningsList
      );
      renderCalcResult('out-calc-4', false, card);
    } catch (err) {
      handleCalcException('out-calc-4', 'Расчёт 4Б остановлен', 'חישוב 4ב נעצר', err);
    }
  };

  root.loadPreset4 = function (mode) {
    if (mode === 'counterexample_ndp') {
      document.getElementById('c4_qp').value = '90.0';
      document.getElementById('c4_qc').value = '30.0';
      document.getElementById('c4_qbase').value = '100.0';
      document.getElementById('c4_ndps').value = '10.0';
      document.getElementById('c4_ndpo').value = '9.1';
      document.getElementById('c4_tcfs').value = '1.00';
      document.getElementById('c4_tcfo').value = '0.99';
      document.getElementById('c4_pp').value = '-18.0';
    } else if (mode === 'high_npf') {
      document.getElementById('c4_qp').value = '172.5';
      document.getElementById('c4_qc').value = '57.5';
      document.getElementById('c4_qbase').value = '150.0';
      document.getElementById('c4_ndps').value = '20.0';
      document.getElementById('c4_ndpo').value = '20.0';
      document.getElementById('c4_tcfs').value = '1.00';
      document.getElementById('c4_tcfo').value = '1.00';
      document.getElementById('c4_pp').value = '-18.0';
    } else {
      document.getElementById('c4_qp').value = '127.0';
      document.getElementById('c4_qc').value = '49.39';
      document.getElementById('c4_qbase').value = '150.0';
      document.getElementById('c4_ndps').value = '20.0';
      if (mode === 'exact') {
        document.getElementById('c4_ndpo').value = '21.28';
        document.getElementById('c4_tcfs').value = '0.70336246';
        document.getElementById('c4_tcfo').value = '0.58441151';
        document.getElementById('c4_pp').value = '-18.0';
      } else if (mode === 'alarm') {
        document.getElementById('c4_ndpo').value = '21.3';
        document.getElementById('c4_tcfs').value = '0.70';
        document.getElementById('c4_tcfo').value = '0.58';
        document.getElementById('c4_pp').value = '0.60';
      } else {
        document.getElementById('c4_ndpo').value = '21.3';
        document.getElementById('c4_tcfs').value = '0.70';
        document.getElementById('c4_tcfo').value = '0.58';
        document.getElementById('c4_pp').value = '-18.0';
      }
    }
    syncModuleInputsFromPreset('4B');
    root.runCalc4();
  };

  // =========================================================================
  // КАЛЬКУЛЯТОР 5: Пар (5А Перевод давления + 5Б Расход пара по нагрузке)
  // =========================================================================
  root.syncSteamPresetSelect = function () {
    const EC = root.EngineeringCalculators;
    const UC = root.UnitConverter;
    const sel = document.getElementById('c5_steam_preset');
    if (!sel || !EC || !EC.VERIFIED_STEAM_TABLE) return;
    const isHe = getLang() === 'he';
    const sys = getUnitSystem();
    const currentVal = sel.value || '4';
    sel.innerHTML = '';
    EC.VERIFIED_STEAM_TABLE.forEach((row) => {
      const opt = document.createElement('option');
      // Trap 6: Keep <option value="..."> strictly in metric p_barg (0, 0.5, ..., 12)
      opt.value = String(row.p_barg);
      if (sys === 'us' && UC) {
        const pPsig = UC.toImperial('pressure_g', row.p_barg).toFixed(1);
        const pPsia = UC.toImperial('pressure_a', row.p_bara).toFixed(1);
        const tSatF = UC.toImperial('temp', row.t_sat_C).toFixed(1);
        const hgBtu = UC.formatWithSpaces(UC.toImperial('enthalpy', row.hg), 1);
        const hfBtu = UC.formatWithSpaces(UC.toImperial('enthalpy', row.hf), 1);
        const hfgBtu = UC.formatWithSpaces(UC.toImperial('enthalpy', row.hfg), 1);
        opt.textContent = `${pPsig} psig (${pPsia} psia, ${tSatF} °F): h_g = ${hgBtu}, h_f = ${hfBtu} → h_fg = ${hfgBtu} Btu/lb`;
      } else {
        opt.textContent = isHe
          ? `${row.p_barg.toFixed(1)} barg (${row.p_bara.toFixed(3)} bara, ${row.t_sat_C.toFixed(1)} °C): h_g=${row.hg.toFixed(1)}, h_f=${row.hf.toFixed(1)} → h_fg=${row.hfg.toFixed(1)} kJ/kg`
          : EC.formatSteamTableOptionLabel(row);
      }
      if (String(row.p_barg) === String(currentVal)) opt.selected = true;
      sel.appendChild(opt);
    });
  };

  root.runCalc5A = function () {
    const EC = root.EngineeringCalculators;
    const lang = getLang();
    const isHe = lang === 'he';
    clearFormFieldErrors('out-calc-5a');
    try {
      const pvalEl = document.getElementById('c5a_pval');
      if (pvalEl) {
        syncSingleInputFromDOM(pvalEl, getUnitSystem());
      }
      const selectedUnit = valOf('c5a_unit');
      let engineUnit = selectedUnit;
      let enginePval = valOf('c5a_pval');
      // If #c5a_unit is bar/psi and #c5a_pval holds a unit-switcher-converted value from data-si-value, pass exact SI bar to avoid rounding drift
      if (
        selectedUnit !== 'kpa' &&
        pvalEl &&
        pvalEl.dataset.siValue !== undefined &&
        pvalEl.dataset.siValue !== '' &&
        pvalEl.value === pvalEl.dataset.displayedValue
      ) {
        engineUnit = 'bar';
        enginePval = pvalEl.dataset.siValue;
      }
      const r = EC.calcSteamPressureConversion({
        mode: valOf('c5a_mode'),
        unit: engineUnit,
        p_val: enginePval,
        p_atm_bar: siValOf('c5a_patm')
      });
      const satNotice = isHe
        ? `ℹ️ כניסה לטבלאות קיטור רווי נעשית לפי לחץ מוחלט (${r.pAbsBar.toFixed(4)} bara = ${r.pAbsPsi.toFixed(2)} psia), או לפי עמודת לחץ מד שצוינה במפורש עבור P_atm = ${r.pAtmBar} bar [S01, PDF p. 25, 37].`
        : `ℹ️ ${r.saturationTableNotice}`;
      const warningsList = [satNotice];
      const bodyHtml = isHe
        ? `• <strong>לחץ מוחלט (לטבלאות קיטור רווי):</strong> <code dir="ltr"><strong>${r.pAbsBar.toFixed(5)} bara</strong> = ${r.pAbsPsi.toFixed(2)} psia = ${r.pAbsKpa.toFixed(2)} kPa(a)</code><br>` +
          `• <strong>לחץ אפקטיבי / מד לחץ (Gauge):</strong> <code dir="ltr"><strong>${r.pGaugeBar.toFixed(5)} barg</strong> = ${r.pGaugePsi.toFixed(2)} psig = ${r.pGaugeKpa.toFixed(2)} kPa(g)</code>`
        : `• <strong>Абсолютное давление (для таблиц насыщенного пара):</strong> <code dir="ltr"><strong>${r.pAbsBar.toFixed(5)} бар абс. (bara)</strong> = ${r.pAbsPsi.toFixed(2)} psia = ${r.pAbsKpa.toFixed(2)} кПа абс.</code><br>` +
          `• <strong>Избыточное (манометрическое) давление:</strong> <code dir="ltr"><strong>${r.pGaugeBar.toFixed(5)} бар изб. (barg)</strong> = ${r.pGaugePsi.toFixed(2)} psig = ${r.pGaugeKpa.toFixed(2)} кПа изб.</code>`;
      const card = buildCalcCardHtml(
        '5A',
        isHe ? `תוצאות המרת לחץ (מודול 5א, עבור P_atm = ${r.pAtmBar} bar)` : `Результаты перевода давления (Модуль 5А, при P_atm = ${r.pAtmBar} бар)`,
        `mode=${valOf('c5a_mode')}${originParen('c5a_mode')}, P_in=${valOf('c5a_pval')} ${selectedUnit}${originParen('c5a_pval')}, P_atm=${fmtFieldSummary('c5a_patm')}`,
        bodyHtml,
        satNotice,
        warningsList
      );
      renderCalcResult('out-calc-5a', false, card);
    } catch (err) {
      handleCalcException('out-calc-5a', 'Расчёт 5А остановлен', 'חישוב 5א נעצר', err);
    }
  };

  root.loadPreset5A = function () {
    document.getElementById('c5a_mode').value = 'gauge_to_abs';
    document.getElementById('c5a_unit').value = 'bar';
    document.getElementById('c5a_pval').value = '6.0';
    document.getElementById('c5a_patm').value = '1.01325';
    syncModuleInputsFromPreset('5A');
    root.runCalc5A();
  };

  root.onSteamPresetChangeCalc5 = function () {
    const EC = root.EngineeringCalculators;
    const pBarg = Number(valOf('c5_steam_preset'));
    const row = EC.VERIFIED_STEAM_TABLE.find((r) => r.p_barg === pBarg);
    if (row) {
      setFieldFromSiValue('c5_hg', String(row.hg));
      setFieldFromSiValue('c5_hf', String(row.hf));
      setFieldFromSiValue('c5_hfg', String(row.hfg));
    }
    root.runCalc5();
  };

  root.runCalc5 = function () {
    const EC = root.EngineeringCalculators;
    const UC = root.UnitConverter;
    const lang = getLang();
    const isHe = lang === 'he';
    const sys = getUnitSystem();
    const dual = (val, q, opts) => UC.formatDual(val, q, lang, sys, opts);
    clearFormFieldErrors('out-calc-5');
    try {
      const r = EC.calcSteamLoad({
        load_mode: valOf('c5_load_mode'),
        q_load_kw: siValOf('c5_qkw'),
        mp_kg_h: siValOf('c5_mp'),
        cp_kj_kgc: siValOf('c5_cp'),
        t_in_c: siValOf('c5_tin'),
        t_out_c: siValOf('c5_tout'),
        p_barg_preset: valOf('c5_steam_preset'),
        hg_kj_kg: siValOf('c5_hg'),
        hf_kj_kg: siValOf('c5_hf'),
        hfg_kj_kg: siValOf('c5_hfg'),
        x_dryness: siValOf('c5_x'),
        sf: siValOf('c5_sf'),
        tds_fw_ppm: siValOf('c5_tdsfw'),
        tds_max_ppm: siValOf('c5_tdsmax')
      });

      const qLoadGjH = r.qLoadKw * 0.0036;
      let trapLine = '';
      if (r.mTrapCalcKgH !== null) {
        const mTrapDual = dual(r.mTrapCalcKgH, 'mass_flow', { siDecPrimary: 2, siDecSecondary: 1, usDecPrimary: 1, usDecSecondary: 1 });
        trapLine = isHe
          ? `<br>3. ספיקת תכנון ראשונית למלכודת קיטור (עבור <code dir="ltr">SF = ${r.sf}</code>): ${mTrapDual}`
          : `<br>3. Предварительная расчётная нагрузка конденсатоотводчика (при <code dir="ltr">SF = ${r.sf}</code>): ${mTrapDual}`;
      }
      let bdLine = '';
      if (r.blowdownResult) {
        const mFwDual = dual(r.blowdownResult.mFeedwaterIfSoleConsumerKgH, 'mass_flow', { siDecPrimary: 2, siDecSecondary: 1, usDecPrimary: 1, usDecSecondary: 1 });
        const mBdDual = dual(r.blowdownResult.mBlowdownIfSoleConsumerKgH, 'mass_flow', { siDecPrimary: 2, siDecSecondary: 1, usDecPrimary: 1, usDecSecondary: 1 });
        bdLine = isHe
          ? `<br>4. ניקוז רציף של הדוד לפי מאזן מליחות TDS (<code>[S01, PDF p. 34; S22, p. 1]</code>): שיעור ממי ההזנה <code dir="ltr"><strong>${r.blowdownResult.bFeedwaterPct.toFixed(2)}%</strong></code> (מחזורי ריכוז <code dir="ltr">CC = ${r.blowdownResult.cyclesOfConcentration.toFixed(2)}</code>). אם צרכן זה הוא היחיד של הדוד: מי הזנה = ${mFwDual}, ניקוז = ${mBdDual}.`
          : `<br>4. Непрерывная продувка котла по балансу солесодержания (<code>[S01, PDF p. 34; S22, p. 1]</code>): доля от питательной воды <code dir="ltr"><strong>${r.blowdownResult.bFeedwaterPct.toFixed(2)}%</strong></code> (коэфф. концентрирования <code dir="ltr">CC = ${r.blowdownResult.cyclesOfConcentration.toFixed(2)}</code>). Если данный аппарат — единственный потребитель котла: питательная вода = ${mFwDual}, продувка = ${mBdDual}.`;
      }

      const warningsList = [];
      if (r.phaseWarning) {
        warningsList.push(
          isHe
            ? '⚠️ טמפרטורת המוצר ביציאה עולה על 100 °C: חימום בפאזה נוזלית מעבר ל-100 °C מחייב שהמוצר יימצא תחת לחץ עבודה גבוה מלחץ הרוויה P_sat(T_out) למניעת רתיחה.'
            : r.phaseWarning
        );
      }
      if (r.hfgIdentityFormula) {
        const hfgFormulaHe = String(r.hfgIdentityFormula).replace(/кДж\/кг/g, 'kJ/kg');
        const hfgBtu = UC.formatWithSpaces(UC.toImperial('enthalpy', r.hfg), 1);
        const hfgUsSuffix = sys === 'us' ? ` (${hfgBtu} Btu/lb)` : '';
        warningsList.push(
          isHe
            ? `ℹ️ זהות אנתלפיה אומתה: <code dir="ltr">${hfgFormulaHe}${hfgUsSuffix}</code>`
            : `ℹ️ Тождество энтальпий проверено: <code dir="ltr">${r.hfgIdentityFormula}${hfgUsSuffix}</code>`
        );
      }

      const EE = root.EconomicsEngine;
      const econ5B = EE
        ? EE.calcModule5BEconomics(r, {
            currency: getCurrency(),
            t_year_h: siValOf('c5_t_year'),
            eta_boiler_pct: siValOf('c5_eta'),
            tariff_per_gj: siValOf('c5_tariff_gj')
          })
        : null;
      if (econ5B && econ5B.realismWarning) {
        warningsList.push(
          isHe
            ? `⚠️ <strong>הערת נצילות דוד:</strong> ${translateRuntimeText(econ5B.realismWarning, 'he')}`
            : `⚠️ ${econ5B.realismWarning}`
        );
      }
      const econ5BHtml = buildEconomicsBlockHtml(econ5B, lang, sys);

      const qLoadDual = dual(r.qLoadKw, 'power', { prefix: 'Q_load = ', siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 0, usDecSecondary: 0 });
      const hUsefulDual = dual(r.hUsefulKjKg, 'enthalpy', { prefix: 'h_useful = ', siDecPrimary: 2, siDecSecondary: 1, usDecPrimary: 1, usDecSecondary: 1 });
      // Checkpoint: 350 kW, x=0.98, h_fg=2108.1 -> 609.89 kg/h in SI, and "1 344.6 lb/h (609.9 кг/ч)" in US
      const mSteamDual = dual(r.mSteamKgH, 'mass_flow', { prefix: 'm_steam = ', siDecPrimary: 2, siDecSecondary: 1, usDecPrimary: 1, usDecSecondary: 1 });

      const bodyHtml = isHe
        ? `1. עומס חום של המתקן: ${qLoadDual} (<code dir="ltr">${qLoadGjH.toFixed(4)} GJ/h</code>) | חום עיבוי שימושי (עבור <code dir="ltr">x = ${r.xDryness}</code>): ${hUsefulDual}<br>` +
          `2. ספיקת קיטור רווי מחושבת: ${mSteamDual} (<code dir="ltr">${r.mSteamTH.toFixed(4)} t/h</code>)` +
          `${trapLine}${bdLine}${econ5BHtml}`
        : `1. Тепловая нагрузка аппарата: ${qLoadDual} (<code dir="ltr">${qLoadGjH.toFixed(4)} ГДж/ч</code>) | Полезная теплота конденсации (при <code dir="ltr">x = ${r.xDryness}</code>): ${hUsefulDual}<br>` +
          `2. Расчётный расход насыщенного пара: ${mSteamDual} (<code dir="ltr">${r.mSteamTH.toFixed(4)} т/ч</code>)` +
          `${trapLine}${bdLine}${econ5BHtml}`;

      const card = buildCalcCardHtml(
        '5B',
        isHe ? 'תוצאות חישוב ספיקת קיטור וניקוז TDS (מודול 5ב, [S01, PDF p. 25, 34; S22])' : 'Результаты расчёта расхода пара и продувки по TDS (Модуль 5Б, [S01, PDF p. 25, 34; S22])',
        `Q_load=${r.qLoadKw.toFixed(2)} kW${originParen('c5_qkw')}, h_fg=${fmtFieldSummary('c5_hfg')}, x=${r.xDryness}${originParen('c5_x')}, SF=${valOf('c5_sf') || '—'}${originParen('c5_sf')}, TDS_fw=${valOf('c5_tdsfw') || '—'} ppm${originParen('c5_tdsfw')}`,
        bodyHtml,
        isHe
          ? 'בחירת מלכודת קיטור סופית מחייבת ידיעת מפל הלחץ ΔP = P₁ − P₂, לחץ עבודה מרבי MOP וטבלאות יצרן [S01, PDF p. 45–46; S02–S04].'
          : 'Реальный подбор конденсатоотводчика требует знания перепада ΔP = P₁ − P₂, максимального рабочего давления MOP и таблиц производителя [S01, PDF p. 45–46; S02–S04].',
        warningsList
      );
      renderCalcResult('out-calc-5', false, card);
    } catch (err) {
      handleCalcException('out-calc-5', 'Расчёт 5Б остановлен', 'חישוב 5ב נעצר', err);
    }
  };

  root.loadPreset5B = function (mode) {
    if (mode === 'pasteurizer') {
      document.getElementById('c5_load_mode').value = 'product_heating';
      document.getElementById('c5_steam_preset').value = '2';
      document.getElementById('c5_mp').value = '15000';
      document.getElementById('c5_cp').value = '3.93';
      document.getElementById('c5_tin').value = '4.0';
      document.getElementById('c5_tout').value = '75.0';
      document.getElementById('c5_hg').value = '2725.1';
      document.getElementById('c5_hf').value = '562.1';
      document.getElementById('c5_hfg').value = '2163.0';
      document.getElementById('c5_x').value = '1.0';
      document.getElementById('c5_sf').value = '2.5';
      document.getElementById('c5_tdsfw').value = '180';
      document.getElementById('c5_tdsmax').value = '3000';
    } else if (mode === 'spec_example') {
      document.getElementById('c5_load_mode').value = 'product_heating';
      document.getElementById('c5_steam_preset').value = '4';
      document.getElementById('c5_mp').value = '15000';
      document.getElementById('c5_cp').value = '3.95';
      document.getElementById('c5_tin').value = '20.0';
      document.getElementById('c5_tout').value = '85.0';
      document.getElementById('c5_hg').value = '';
      document.getElementById('c5_hf').value = '';
      document.getElementById('c5_hfg').value = '2120.38';
      document.getElementById('c5_x').value = '1.0';
      document.getElementById('c5_sf').value = '2.5';
      document.getElementById('c5_tdsfw').value = '180';
      document.getElementById('c5_tdsmax').value = '3000';
    } else if (mode === 'direct_control') {
      document.getElementById('c5_load_mode').value = 'direct_kw';
      document.getElementById('c5_steam_preset').value = '4';
      document.getElementById('c5_qkw').value = '350.0';
      document.getElementById('c5_hg').value = '';
      document.getElementById('c5_hf').value = '';
      document.getElementById('c5_hfg').value = '2108.1';
      document.getElementById('c5_x').value = '0.98';
      document.getElementById('c5_sf').value = '2.5';
      document.getElementById('c5_tdsfw').value = '';
      document.getElementById('c5_tdsmax').value = '';
    } else {
      document.getElementById('c5_load_mode').value = 'direct_kw';
      document.getElementById('c5_steam_preset').value = '4';
      document.getElementById('c5_qkw').value = '350.0';
      document.getElementById('c5_hg').value = '2748.2';
      document.getElementById('c5_hf').value = '640.5';
      document.getElementById('c5_hfg').value = '2107.7';
      document.getElementById('c5_x').value = '0.98';
      document.getElementById('c5_sf').value = '2.5';
      document.getElementById('c5_tdsfw').value = '150';
      document.getElementById('c5_tdsmax').value = '3000';
    }
    if (document.getElementById('c5_t_year')) document.getElementById('c5_t_year').value = '';
    if (document.getElementById('c5_eta')) document.getElementById('c5_eta').value = '';
    if (document.getElementById('c5_tariff_gj')) document.getElementById('c5_tariff_gj').value = '';
    syncModuleInputsFromPreset('5B');
    root.runCalc5();
  };

  root.runAllCalculators = function () {
    bootstrapDomSiValuesOnce();
    root.syncSteamPresetSelect();
    root.runCalc1A();
    root.runCalc1B();
    root.runCalc2();
    root.runCalc3A();
    root.runCalc3B();
    root.runCalc3();
    root.runCalc4A();
    root.runCalc4();
    root.runCalc5A();
    root.runCalc5();
  };

  // Stage 2 (v12): Cross-links between lessons, trainer cases, and calculator modules
  let activeReturnCase = null;

  const MODULE_WHERE_APPLIED = {
    '1a': {
      ru: `<a href="#system-condensate">Раздел 2 «Возврат конденсата»</a> • Проверочный расчёт в тренажёре: <a href="#case-2-2">Случай 2.2 (Потери 6.0 л/мин при 50→20 °C)</a>`,
      he: `<a href="#system-condensate">פרק 2 "החזרת עיבוי"</a> • בדיקה בסימולטור: <a href="#case-2-2">אירוע 2.2 (הפסדי <bdi dir="ltr">6.0 L/min</bdi> ב-<bdi dir="ltr">50→20 °C</bdi>)</a>`
    },
    '1b': {
      ru: `<a href="#system-condensate">Раздел 2 «Возврат конденсата»</a> • Проверочный расчёт в тренажёре: <a href="#case-2-1">Случай 2.1 (Вторичный пар 5.0→0.0 бар изб. и ресивер TLV)</a>`,
      he: `<a href="#system-condensate">פרק 2 "החזרת עיבוי"</a> • בדיקה בסימולטור: <a href="#case-2-1">אירוע 2.1 (קיטור משני <bdi dir="ltr">5.0→0.0 barg</bdi> ומכל TLV)</a>`
    },
    '2': {
      ru: `<a href="#system-chillers">Раздел 3 «Чиллеры»</a> • Проверочный расчёт в тренажёре: <a href="#case-3-1">Случай 3.1 (Подход конденсатора 10.0 °C)</a>, <a href="#case-3-2">Случай 3.2 (Падение протока до 44.81 м³/ч и защита от заморозки)</a>`,
      he: `<a href="#system-chillers">פרק 3 "צ'ילרים"</a> • בדיקה בסימולטור: <a href="#case-3-1">אירוע 3.1 (הפרש גישה במעבה <bdi dir="ltr">10.0 °C</bdi>)</a>, <a href="#case-3-2">אירוע 3.2 (צניחת ספיקה ל-<bdi dir="ltr">44.81 m³/h</bdi> והגנת קיפאון)</a>`
    },
    '3a': {
      ru: `<a href="#system-air">Раздел 4 «Сжатый воздух»</a> • Связанные ситуации раздела: <a href="#case-4-1">Случай 4.1</a>, <a href="#case-4-2">Случай 4.2</a> (пересчёт стандартного расхода Nl/s ⇄ FAD по S13)`,
      he: `<a href="#system-air">פרק 4 "אוויר דחוס"</a> • אירועים קשורים בפרק: <a href="#case-4-1">אירוע 4.1</a>, <a href="#case-4-2">אירוע 4.2</a> (המרת ספיקה תקנית <bdi dir="ltr">NL/s ⇄ FAD</bdi> לפי S13)`
    },
    '3b': {
      ru: `<a href="#system-air">Раздел 4 «Сжатый воздух»</a> • Проверочный расчёт в тренажёре: <a href="#case-4-2">Случай 4.2 (Цикл Load/Unload 1.5 и 3.5 мин → 30% утечек, 3.0 м³/мин)</a>`,
      he: `<a href="#system-air">פרק 4 "אוויר דחוס"</a> • בדיקה בסימולטור: <a href="#case-4-2">אירוע 4.2 (מחזור <bdi dir="ltr">Load/Unload</bdi> של <bdi dir="ltr">1.5</bdi> ו-<bdi dir="ltr">3.5 min</bdi> ← <bdi dir="ltr">30%</bdi> דליפות, <bdi dir="ltr">3.0 m³/min</bdi>)</a>`
    },
    '3c': {
      ru: `<a href="#system-air">Раздел 4 «Сжатый воздух»</a> • Связанная ситуация по влаге и осушке: <a href="#case-4-1">Случай 4.1 (Байпас осушителя и капельная влага в магистрали)</a>`,
      he: `<a href="#system-air">פרק 4 "אוויר דחוס"</a> • אירוע קשור ללחות וייבוש: <a href="#case-4-1">אירוע 4.1 (מעקף מייבש ומים נוזליים בקו האוויר)</a>`
    },
    '4a': {
      ru: `<a href="#system-ro">Раздел 5 «Обратный осмос RO»</a> • Связанные ситуации раздела: <a href="#case-5-1">Случай 5.1</a>, <a href="#case-5-2">Случай 5.2</a> (баланс потоков, Recovery Y и селективность по S16)`,
      he: `<a href="#system-ro">פרק 5 "אוסמוזה הפוכה RO"</a> • אירועים קשורים בפרק: <a href="#case-5-1">אירוע 5.1</a>, <a href="#case-5-2">אירוע 5.2</a> (מאזן ספיקות, אחוז השבה <bdi dir="ltr">Y</bdi> ודחיית מלחים לפי S16)`
    },
    '4b': {
      ru: `<a href="#system-ro">Раздел 5 «Обратный осмос RO»</a> • Связанные ситуации раздела: <a href="#case-5-1">Случай 5.1 (Нормализация по Eq. 72)</a>, <a href="#case-5-2">Случай 5.2 (Обратное давление пермеата P_p − P_c)</a>`,
      he: `<a href="#system-ro">פרק 5 "אוסמוזה הפוכה RO"</a> • אירועים קשורים בפרק: <a href="#case-5-1">אירוע 5.1 (נרמול לפי <bdi dir="ltr">Eq. 72</bdi>)</a>, <a href="#case-5-2">אירוע 5.2 (לחץ נגדי של פרמיאט <bdi dir="ltr">P_p − P_c</bdi>)</a>`
    },
    '5a': {
      ru: `<a href="#system-steam">Раздел 1 «Паровая система»</a> • Проверочный расчёт в тренажёре: <a href="#case-1-1">Случай 1.1 (P₃ = 1.2 бар изб. → 2.213 бар абс.)</a>, <a href="#case-1-2">Случай 1.2 (P₁ = 6.5 бар изб. → 7.513 бар абс.)</a>`,
      he: `<a href="#system-steam">פרק 1 "מערכת קיטור"</a> • בדיקה בסימולטור: <a href="#case-1-1">אירוע 1.1 (<bdi dir="ltr">P₃ = 1.2 barg → 2.213 bara</bdi>)</a>, <a href="#case-1-2">אירוע 1.2 (<bdi dir="ltr">P₁ = 6.5 barg → 7.513 bara</bdi>)</a>`
    },
    '5b': {
      ru: `<a href="#system-steam">Раздел 1 «Паровая система»</a> • Связанные ситуации раздела: <a href="#case-1-1">Случай 1.1</a>, <a href="#case-1-2">Случай 1.2</a> • <a href="#sec-steam-table">Таблица насыщенного пара (11 точек)</a>`,
      he: `<a href="#system-steam">פרק 1 "מערכת קיטור"</a> • אירועים קשורים בפרק: <a href="#case-1-1">אירוע 1.1</a>, <a href="#case-1-2">אירוע 1.2</a> • <a href="#sec-steam-table">טבלת קיטור רווי (11 נקודות)</a>`
    }
  };

  const CASE_CALC_CONFIG = {
    'case-1-1': {
      applicable: true,
      caseCode: '1.1',
      moduleId: '5a',
      panelId: 'calc-panel-5',
      anchorId: 'calc-5a',
      btnLabel: {
        ru: '🧮 Проверить расчётом (Модуль 5А: P₃ = 1.2 бар изб. → 2.213 бар абс.)',
        he: '🧮 בדיקה במחשבון (מודול 5א: <span dir="ltr" class="case-calc-ltr">P₃ = 1.2 barg → 2.213 bara</span>\u2060)'
      },
      apply: function () {
        document.getElementById('c5a_mode').value = 'gauge_to_abs';
        document.getElementById('c5a_unit').value = getUnitSystem() === 'us' ? 'psi' : 'bar';
        setFieldFromSiValue('c5a_pval', '1.2');
        setFieldFromSiValue('c5a_patm', '1.013');
        root.runCalc5A();
      }
    },
    'case-1-2': {
      applicable: true,
      caseCode: '1.2',
      moduleId: '5a',
      panelId: 'calc-panel-5',
      anchorId: 'calc-5a',
      btnLabel: {
        ru: '🧮 Проверить расчётом (Модуль 5А: P₁ = 6.5 бар изб. → 7.513 бар абс.)',
        he: '🧮 בדיקה במחשבון (מודול 5א: <span dir="ltr" class="case-calc-ltr">P₁ = 6.5 barg → 7.513 bara</span>\u2060)'
      },
      apply: function () {
        document.getElementById('c5a_mode').value = 'gauge_to_abs';
        document.getElementById('c5a_unit').value = getUnitSystem() === 'us' ? 'psi' : 'bar';
        setFieldFromSiValue('c5a_pval', '6.5');
        setFieldFromSiValue('c5a_patm', '1.013');
        root.runCalc5A();
      }
    },
    'case-2-1': {
      applicable: true,
      caseCode: '2.1',
      moduleId: '1b',
      panelId: 'calc-panel-1',
      anchorId: 'calc-1b',
      btnLabel: {
        ru: '🧮 Проверить расчётом (Модуль 1Б: x_flash = 11.15%, m_flash = 167.32 кг/ч, D_cr = 200 мм)',
        he: '🧮 בדיקה במחשבון (מודול 1ב: <span dir="ltr" class="case-calc-ltr">x_flash = 11.15%</span>, <span dir="ltr" class="case-calc-ltr">m_flash = 167.32 kg/h</span>, <span dir="ltr" class="case-calc-ltr">D_cr = 200 mm</span>\u2060)'
      },
      apply: function () {
        setFieldFromSiValue('c1_mc', '1500');
        setFieldFromSiValue('c1_p1', '5.0');
        setFieldFromSiValue('c1_p2', '0.0');
        setFieldFromSiValue('c1_hf1', '670.7');
        setFieldFromSiValue('c1_hf2', '419.0');
        setFieldFromSiValue('c1_hfg2', '2256.5');
        setFieldFromSiValue('c1_dop', '50');
        setFieldFromSiValue('c1b_t_year', '');
        setFieldFromSiValue('c1b_eta', '');
        setFieldFromSiValue('c1b_tariff_gj', '');
        root.runCalc1B();
      }
    },
    'case-2-2': {
      applicable: true,
      caseCode: '2.2',
      moduleId: '1a',
      panelId: 'calc-panel-1',
      anchorId: 'calc-1a',
      btnLabel: {
        ru: '🧮 Проверить расчётом (Модуль 1А: 6.0 л/мин, 50→20 °C → 12.56 кВт, 2880 м³/год)',
        he: '🧮 בדיקה במחשבון (מודול 1א: <span dir="ltr" class="case-calc-ltr">6.0 L/min</span>, <span dir="ltr" class="case-calc-ltr">50→20 °C → 12.56 kW</span>, <span dir="ltr" class="case-calc-ltr">2880 m³/yr</span>\u2060)'
      },
      apply: function () {
        document.getElementById('c1a_mode').value = 'direct_l_min';
        setFieldFromSiValue('c1a_q_l_min', '6');
        setFieldFromSiValue('c1a_t_cond', '50');
        setFieldFromSiValue('c1a_t_make', '20');
        setFieldFromSiValue('c1a_rho', '1');
        setFieldFromSiValue('c1a_cp', '4.186');
        setFieldFromSiValue('c1a_t_shift', '8');
        setFieldFromSiValue('c1a_t_year', '8000');
        setFieldFromSiValue('c1a_eta', '');
        setFieldFromSiValue('c1a_lhv', '');
        setFieldFromSiValue('c1a_tariff_gj', '');
        setFieldFromSiValue('c1a_tariff_water', '');
        root.runCalc1A();
      }
    },
    'case-3-1': {
      applicable: true,
      caseCode: '3.1',
      moduleId: '2',
      panelId: 'calc-panel-2',
      anchorId: 'calc-2',
      btnLabel: {
        ru: '🧮 Проверить расчётом (Модуль 2: подход конденсатора ΔT_app,cond = 10.0 °C)',
        he: '🧮 בדיקה במחשבון (מודול 2: הפרש גישה במעבה <span dir="ltr" class="case-calc-ltr">ΔT_app,cond = 10.0 °C</span>\u2060)'
      },
      apply: function () {
        document.getElementById('c2_fluid').value = 'water';
        setFieldFromSiValue('c2_vw', '85.6');
        setFieldFromSiValue('c2_rho', '1000.0');
        setFieldFromSiValue('c2_cp', '4.186');
        setFieldFromSiValue('c2_tin', '12.0');
        setFieldFromSiValue('c2_tout', '7.0');
        setFieldFromSiValue('c2_pel', '128.0');
        setFieldFromSiValue('c2_tsat_ev', '3.5');
        setFieldFromSiValue('c2_tcond_out', '34.5');
        setFieldFromSiValue('c2_tsat_cd', '44.5');
        setFieldFromSiValue('c2_t_year', '');
        setFieldFromSiValue('c2_tariff_kwh', '');
        root.runCalc2();
      }
    },
    'case-3-2': {
      applicable: true,
      caseCode: '3.2',
      moduleId: '2',
      panelId: 'calc-panel-2',
      anchorId: 'calc-2',
      btnLabel: {
        ru: '🧮 Проверить расчётом (Модуль 2: V_w = 44.81 м³/ч, 13.2→3.6 °C → Q_evap = 500 кВт, ΔT_app,evap = 2.8 °C)',
        he: '🧮 בדיקה במחשבון (מודול 2: <span dir="ltr" class="case-calc-ltr">V_w = 44.81 m³/h</span>, <span dir="ltr" class="case-calc-ltr">13.2→3.6 °C → Q_evap = 500 kW</span>, <span dir="ltr" class="case-calc-ltr">ΔT_app,evap = 2.8 °C</span>\u2060)'
      },
      apply: function () {
        document.getElementById('c2_fluid').value = 'water';
        setFieldFromSiValue('c2_vw', '44.81');
        setFieldFromSiValue('c2_rho', '999.7');
        setFieldFromSiValue('c2_cp', '4.186');
        setFieldFromSiValue('c2_tin', '13.2');
        setFieldFromSiValue('c2_tout', '3.6');
        setFieldFromSiValue('c2_pel', '');
        setFieldFromSiValue('c2_tsat_ev', '0.8');
        setFieldFromSiValue('c2_tcond_out', '');
        setFieldFromSiValue('c2_tsat_cd', '');
        setFieldFromSiValue('c2_t_year', '');
        setFieldFromSiValue('c2_tariff_kwh', '');
        root.runCalc2();
      }
    },
    'case-4-1': {
      applicable: false,
      caseCode: '4.1',
      notApplicableMsg: {
        ru: 'ℹ️ <strong>Расчёт к этому случаю не применяется:</strong> в условии качественного случая 4.1 не заданы численные значения подачи компрессора <code dir="ltr">q_c</code>, относительной влажности <code dir="ltr">RH</code>, абсолютных температур <code dir="ltr">T_amb, T_after</code>, давления <code dir="ltr">p_after</code> и табличных плотностей пара <code dir="ltr">ρ_in, ρ_out</code>, обязательные для расчёта в Модулях 3А и 3В.',
        he: 'ℹ️ <strong>חישוב אינו ישים לאירוע זה:</strong> בתיאור האיכותני של אירוע 4.1 לא ניתנו ערכים מספריים של ספיקת המדחס <code dir="ltr">q_c</code>, הלחות היחסית <code dir="ltr">RH</code>, הטמפרטורות המוחלטות <code dir="ltr">T_amb, T_after</code>, הלחץ <code dir="ltr">p_after</code> וצפיפויות האדים <code dir="ltr">ρ_in, ρ_out</code> הנדרשים כקלט חובה במודולים 3א ו-3ג.'
      }
    },
    'case-4-2': {
      applicable: true,
      caseCode: '4.2',
      moduleId: '3b',
      panelId: 'calc-panel-3',
      anchorId: 'calc-3b',
      btnLabel: {
        ru: '🧮 Проверить расчётом (Модуль 3Б: t_load = 1.5 мин, t_unload = 3.5 мин, Q_comp = 10 м³/мин → 30%, 3.0 м³/мин)',
        he: '🧮 בדיקה במחשבון (מודול 3ב: <span dir="ltr" class="case-calc-ltr">t_load = 1.5 min</span>, <span dir="ltr" class="case-calc-ltr">t_unload = 3.5 min</span>, <span dir="ltr" class="case-calc-ltr">Q_comp = 10 m³/min → 30%</span>, <span dir="ltr" class="case-calc-ltr">3.0 m³/min</span>\u2060)'
      },
      apply: function () {
        document.getElementById('c3b_method').value = 'load_unload';
        setFieldFromSiValue('c3b_tload', '1.5');
        setFieldFromSiValue('c3b_tunload', '3.5');
        setFieldFromSiValue('c3b_qcomp', '10.0');
        setFieldFromSiValue('c3b_spec_power', '');
        setFieldFromSiValue('c3b_t_year', '');
        setFieldFromSiValue('c3b_tariff_kwh', '');
        root.runCalc3B();
      }
    },
    'case-5-1': {
      applicable: false,
      caseCode: '5.1',
      notApplicableMsg: {
        ru: 'ℹ️ <strong>Расчёт к этому случаю не применяется:</strong> в тексте случая 5.1 приведены <code dir="ltr">Q_ps = 12.0 м³/ч</code>, <code dir="ltr">Q_po = 9.2 м³/ч</code>, <code dir="ltr">NDP_s = 10.5 бар</code>, <code dir="ltr">NDP_o = 11.4 бар</code>, <code dir="ltr">TCF_s = 1.00</code> и <code dir="ltr">TCF_o = 0.68</code>, но не указан текущий расход концентрата <code dir="ltr">Q_co</code> (обязательный параметр в функции ядра <code dir="ltr">calcRONormalization</code> Модуля 4Б для одновременного расчёта степени извлечения <code dir="ltr">Y</code>).',
        he: 'ℹ️ <strong>חישוב אינו ישים לאירוע זה:</strong> בטקסט של אירוע 5.1 ניתנו <code dir="ltr">Q_ps = 12.0 m³/h</code>, <code dir="ltr">Q_po = 9.2 m³/h</code>, <code dir="ltr">NDP_s = 10.5 bar</code>, <code dir="ltr">NDP_o = 11.4 bar</code>, <code dir="ltr">TCF_s = 1.00</code> ו-<code dir="ltr">TCF_o = 0.68</code>, אך לא צוינה ספיקת הרכז הנוכחית <code dir="ltr">Q_co</code> (פרמטר חובה בפונקציית הליבה <code dir="ltr">calcRONormalization</code> במודול 4ב לחישוב אחוז ההשבה <code dir="ltr">Y</code>).'
      }
    },
    'case-5-2': {
      applicable: false,
      caseCode: '5.2',
      notApplicableMsg: {
        ru: 'ℹ️ <strong>Расчёт к этому случаю не применяется:</strong> в тексте случая 5.2 заданы только давления пермеата и концентрата (<code dir="ltr">P_p = 1.2 бар</code>, <code dir="ltr">P_c,out = 0.8 бар</code>, <code dir="ltr">P_p − P_c = +0.4 бар &gt; 0.3 бар</code>), но отсутствуют расходы потоков (<code dir="ltr">Q_po, Q_co, Q_ps</code>), движущие силы (<code dir="ltr">NDP_s, NDP_o</code>) и температурные коэффициенты (<code dir="ltr">TCF_s, TCF_o</code>), обязательные для запуска расчёта в Модулях 4А и 4Б.',
        he: 'ℹ️ <strong>חישוב אינו ישים לאירוע זה:</strong> בטקסט של אירוע 5.2 ניתנו רק לחצי הפרמיאט והרכז (<code dir="ltr">P_p = 1.2 bar</code>, <code dir="ltr">P_c,out = 0.8 bar</code>, <code dir="ltr">P_p − P_c = +0.4 bar &gt; 0.3 bar</code>), אך חסרים נתוני הספיקות (<code dir="ltr">Q_po, Q_co, Q_ps</code>), הכוחות המניעים (<code dir="ltr">NDP_s, NDP_o</code>) ומקדמי הטמפרטורה (<code dir="ltr">TCF_s, TCF_o</code>) הנדרשים כקלט חובה במודולים 4א ו-4ב.'
      }
    }
  };
  root.CASE_CALC_CONFIG = CASE_CALC_CONFIG;

  root.verifyCaseInCalculator = function (caseId, stepNum = 6) {
    bootstrapDomSiValuesOnce();
    const cfg = CASE_CALC_CONFIG[caseId];
    if (!cfg || !cfg.applicable) return;
    activeReturnCase = {
      caseId,
      caseCode: cfg.caseCode,
      moduleId: cfg.moduleId,
      stepNum
    };
    if (typeof root.showSingleCalcModule === 'function') {
      root.showSingleCalcModule(cfg.moduleId, false);
    } else if (typeof root.openCalculatorTab === 'function') {
      root.openCalculatorTab(cfg.panelId, false);
    }
    if (typeof window !== 'undefined' && window.history && typeof window.history.pushState === 'function') {
      const targetHash = '#' + cfg.anchorId;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
    }
    root.applyCalculatorTranslations(getLang());
    cfg.apply();
    const anchorEl = document.getElementById(cfg.anchorId) || document.getElementById(`calc-meta-${cfg.moduleId}`) || document.getElementById('sec-calculators');
    const headingEl = document.getElementById(`calc-heading-${cfg.moduleId}`) || (anchorEl && anchorEl.querySelector('h3, h2'));
    if (typeof root.scrollAndFocusBlock === 'function') {
      root.scrollAndFocusBlock(anchorEl, headingEl);
    } else if (anchorEl) {
      anchorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  root.returnToTrainerCase = function (caseId, stepNum = 6) {
    if (typeof root.selectTrainerCase === 'function') {
      root.selectTrainerCase(caseId);
    }
    if (typeof root.goToTrainerStep === 'function') {
      root.goToTrainerStep(caseId, stepNum);
    }
    if (typeof window !== 'undefined') {
      window.location.hash = '#' + caseId;
    }
    if (typeof root.switchView === 'function') {
      root.switchView('case', { scrollTop: false, focusHeading: false });
    }
    const trSec = document.getElementById(caseId) || document.getElementById(`trainer-card-${caseId}`) || document.getElementById('sec-trainer');
    const trHeading = document.getElementById(`case-heading-${caseId}`) || (trSec && trSec.querySelector('h3'));
    if (typeof root.scrollAndFocusBlock === 'function') {
      root.scrollAndFocusBlock(trSec, trHeading);
    } else if (trSec) {
      trSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  root.applyCalculatorTranslations = function (lang) {
    bootstrapDomSiValuesOnce();
    updateUnitSwitcherBarUI();
    if (!root.I18N_UI) return;
    const UC = root.UnitConverter;
    const sys = getUnitSystem();
    const cur = getCurrency();
    const c1aMode = valOf('c1a_mode');
    const { CALC_FORM_LABELS, CALC_METADATA } = root.I18N_UI;
    if (CALC_FORM_LABELS) {
      for (const [sel, dict] of Object.entries(CALC_FORM_LABELS)) {
        const baseText = dict[lang] || dict.ru;
        if (!baseText) continue;
        const text = UC ? UC.transformLabelTextForUnits(sel, baseText, lang, sys, c1aMode, cur) : baseText;
        const el = sel.startsWith('#') || sel.startsWith('label') || sel.includes(' ')
          ? document.querySelector(sel)
          : document.getElementById(sel);
        if (el) el.textContent = text;
      }
    }
    // v15.1 (п. 1.4): доступные имена полей без собственной подписи — по языку и системе единиц
    const CALC_FIELD_ARIA = root.I18N_UI.CALC_FIELD_ARIA;
    if (CALC_FIELD_ARIA) {
      for (const [fid, dict] of Object.entries(CALC_FIELD_ARIA)) {
        const fieldEl = document.getElementById(fid);
        if (!fieldEl) continue;
        const usNow = sys === 'us' && isFieldConvertedNow(fid, sys);
        const ariaText = (usNow && dict[lang + 'Us']) || dict[lang] || dict.ru;
        if (ariaText) fieldEl.setAttribute('aria-label', ariaText);
      }
    }
    if (CALC_METADATA) {
      const tl = root.TRUST_LABELS;
      for (const [modKey, metaObj] of Object.entries(CALC_METADATA)) {
        const shortId = modKey.replace(/^calc-/, '');
        const normMod = shortId.toUpperCase();
        const box = document.getElementById(`calc-meta-${shortId}`) || document.getElementById(`calc-meta-${modKey}`);
        if (box && metaObj) {
          const pick = (field) => (field && typeof field === 'object' ? (field[lang] || field.ru) : '');
          const titleStr = pick(metaObj.title) || (metaObj[lang] && metaObj[lang].title) || '';
          const taskStr = pick(metaObj.task) || (metaObj[lang] && metaObj[lang].taskSolved) || '';
          const measStr = pick(metaObj.measurements) || (metaObj[lang] && metaObj[lang].measurementsNeeded) || '';
          const formStr = pick(metaObj.formula) || (metaObj[lang] && metaObj[lang].formulaAndAssumptions) || '';
          const lblTask = lang === 'he' ? '🎯 מה החישוב פותר:' : '🎯 Какую задачу решает:';
          const lblMeas = lang === 'he' ? '📟 מדידות נדרשות בשטח:' : '📟 Какие измерения нужны:';
          const lblForm = lang === 'he' ? '📐 נוסחה והנחות יסוד:' : '📐 Формула и границы применимости:';
          const lblWhere = lang === 'he' ? '🔗 איפה מיושם:' : '🔗 Где применяется:';
          const whereObj = MODULE_WHERE_APPLIED[shortId];
          const whereHtml = whereObj ? (whereObj[lang] || whereObj.ru) : '';
          const modTrust = (tl && tl.MODULES && tl.MODULES[normMod]) || null;
          const modHeaderTrustHtml = modTrust
            ? buildTrustLabelRowHtml({
                kind: modTrust.kind,
                source: modTrust.source,
                guideAnchor: modTrust.guideAnchor,
                moduleId: normMod
              }, lang)
            : '';
          const showReturn = activeReturnCase && activeReturnCase.moduleId === shortId;
          const returnBannerHtml = showReturn
            ? `<div class="calc-return-case-bar no-print" style="margin-block-top:0.65rem; padding-block-start:0.55rem; border-block-start:1px dashed var(--border-color); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
                 <span>${lang === 'he' ? `📌 הוזנו נתוני <strong>אירוע ${activeReturnCase.caseCode}</strong> מהסימולטור:` : `📌 Подставлены числа из <strong>Случая ${activeReturnCase.caseCode}</strong> тренажёра:`}</span>
                 <button type="button" class="btn btn-primary btn-sm calc-return-case-btn" onclick="window.returnToTrainerCase('${activeReturnCase.caseId}', ${activeReturnCase.stepNum})">
                   ⬅ ${lang === 'he' ? `חזרה לאירוע ${activeReturnCase.caseCode} (שלב ${activeReturnCase.stepNum})` : `Вернуться к случаю ${activeReturnCase.caseCode} (Шаг ${activeReturnCase.stepNum})`}
                 </button>
               </div>`
            : '';
          const lblHowMeta = lang === 'he' ? 'איך זה מחושב (נוסחה, מדידות בשטח ותחום תקפות)' : 'Как считается (формула, измерения и область применимости)';
          box.innerHTML = `
            <div class="calc-meta-box">
              <h3 class="calc-meta-title" id="calc-heading-${shortId}" tabindex="-1"><strong>${titleStr}</strong></h3>
              ${modHeaderTrustHtml}
              <div class="calc-meta-grid">
                <div><strong>${lblTask}</strong> ${taskStr}</div>
                ${whereHtml ? `<div class="calc-where-applied"><strong>${lblWhere}</strong> ${whereHtml}</div>` : ''}
              </div>
              <details class="calc-how-it-works-details calc-meta-how-details">
                <summary>${lblHowMeta}</summary>
                <div class="calc-how-it-works-body">
                  <div><strong>${lblMeas}</strong> ${measStr}</div>
                  <div><strong>${lblForm}</strong> ${formStr}</div>
                </div>
              </details>
              ${returnBannerHtml}
            </div>
          `;
        }
      }
    }
    // Translate all calculator field hints (.hint) across all 10 modules
    const HINTS_I18N = {
      // Module 1A
      c1a_mode_hint: {
        ru: 'Выберите прямой ввод (л/мин, кг/ч), баланс % возврата или эталон DOE S21',
        he: 'בחרו הזנה ישירה (L/min, kg/h), מאזן אחוזי השבת קונדנסט או תקן DOE S21'
      },
      c1a_q_l_min_hint: {
        ru: 'Для режима л/мин: контрольный пример = 6 л/мин (0.36 м³/ч; 0 = нулевые потери)',
        he: 'למצב L/min: דוגמת ייחוס = 6 L/min (0.36 m³/h; 0 = אפס הפסדים)'
      },
      c1a_m_kg_h_hint: {
        ru: 'Для режимов кг/ч, % возврата (2000 кг/ч) или DOE (5000 lb/hr; ≥ 0)',
        he: 'למצבי kg/h, אחוז השבה (2000 kg/h) או DOE (5000 lb/hr; ≥ 0)'
      },
      c1a_ret_pct_hint: {
        ru: 'Только для режима «По расходу пара и % возврата» (напр., 60%)',
        he: 'עבור מצב "לפי ספיקת קיטור ואחוז השבה" בלבד (למשל 60%)'
      },
      c1a_t_cond_hint: {
        ru: 'Жидкая вода (0 < T < 373.95 °C): 50 °C | 90 °C | DOE: 148 Btu/lb',
        he: 'מים נוזליים (0 < T < 373.95 °C): 50 °C | 90 °C | DOE: 148 Btu/lb'
      },
      c1a_t_make_hint: {
        ru: 'Жидкая вода (0 < T < 373.95 °C): 20 °C | 15 °C | DOE: 28 Btu/lb',
        he: 'מים נוזליים (0 < T < 373.95 °C): 20 °C | 15 °C | DOE: 28 Btu/lb'
      },
      c1a_rho_hint: {
        ru: 'Контрольный пример: 1.0 кг/л (1000 кг/м³)',
        he: 'דוגמת ייחוס: 1.0 kg/L (1000 kg/m³)'
      },
      c1a_cp_hint: {
        ru: 'Контрольный пример: 4.186 кДж/(кг·°C)',
        he: 'דוגמת ייחוס: 4.186 kJ/(kg·°C)'
      },
      c1a_t_shift_hint: {
        ru: 'Контрольный пример: 8 часов → 2.88 м³ и 100.464 кВт·ч',
        he: 'דוגמת ייחוס: 8 שעות ← 2.88 m³ ו-100.464 kWh'
      },
      c1a_t_year_hint: {
        ru: 'Напр., 8000 ч/год → 2880 м³ и 100 464 кВт·ч (обязательно для тарифа)',
        he: 'למשל 8000 שעות/שנה ← 2880 m³ ו-100,464 kWh (חובה לחישוב עלות)'
      },
      c1a_eta_hint: {
        ru: 'Допустимо 0 < η_b ≤ 100% (промышленный диапазон 50–98%, напр. 80–82%)',
        he: 'מותר 0 < η_b ≤ 100% (טווח תעשייתי 50–98%, למשל 80–82%)'
      },
      c1a_lhv_hint: {
        ru: 'Напр., газ: 34.0 МДж/м³ (для пересчёта в м³/год или кг/год)',
        he: 'למשל גז טבעי: 34.0 MJ/m³ (להמרה ל-m³/שנה או kg/שנה)'
      },
      c1a_tariff_gj_hint: {
        ru: 'Пусто = без оценки денег; 0 = нулевая цена; в DOE S21: 5 $/MMBtu',
        he: 'ריק = ללא חישוב כספי; 0 = מחיר אפס; ב-DOE S21: 5 $/MMBtu'
      },
      c1a_tariff_water_hint: {
        ru: 'Пусто = без оценки воды; 0 = бесплатная подпитка',
        he: 'ריק = ללא תמחור מים; 0 = מי תוספת ללא עלות'
      },
      // Module 1B
      c1_mc_hint: {
        ru: 'Обязательно: 0 < m_c ≤ 10 000 кг/ч (Пример 1А: 1500 кг/ч)',
        he: 'חובה: 0 < m_c ≤ 10,000 kg/h (דוגמה 1א: 1500 kg/h)'
      },
      c1_p1_hint: {
        ru: 'Обязательно: P₁ > P₂ (напр., 5.0 бар изб.)',
        he: 'חובה: P₁ > P₂ (למשל 5.0 barg)'
      },
      c1_p2_hint: {
        ru: 'Для открытого атмосферного ресивера TLV: 0.0 бар изб.',
        he: 'למכל איסוף אטמוספרי פתוח לפי TLV: 0.0 barg'
      },
      c1_hf1_hint: {
        ru: 'При 5.0 бар изб. (CoolProp 8.0.0 HEOS::Water): 670.7 кДж/кг',
        he: 'עבור 5.0 barg (CoolProp 8.0.0 HEOS::Water): 670.7 kJ/kg'
      },
      c1_hf2_hint: {
        ru: 'При 0.0 бар изб. (100.0 °C, CoolProp 8.0.0): 419.0 кДж/кг',
        he: 'עבור 0.0 barg (100.0 °C, CoolProp 8.0.0): 419.0 kJ/kg'
      },
      c1_hfg2_hint: {
        ru: 'При 0.0 бар изб. (100.0 °C, CoolProp 8.0.0): 2256.5 кДж/кг',
        he: 'עבור 0.0 barg (100.0 °C, CoolProp 8.0.0): 2256.5 kJ/kg'
      },
      c1_dop_hint: {
        ru: 'Для проверки условия D_cr ≥ 3·D_op [S07, PDF p. 14]',
        he: 'לבדיקת תנאי הגיאומטריה D_cr ≥ 3·D_op [S07, PDF p. 14]'
      },
      c1b_t_year_hint: {
        ru: 'Для годовой стоимости уноса пара (напр., 8000 ч/год) [инженерная оценка]',
        he: 'לחישוב עלות שנתית של אובדן קיטור משני (למשל 8000 שעות/שנה) [הערכה הנדסית]'
      },
      c1b_eta_hint: {
        ru: 'Типичный КПД парового котла: 70–95% [S01, PDF p. 12; S21, PDF p. 1], в примерах 80–82% [S21, PDF pp. 1–2; S22, p. 1]',
        he: 'נצילות אופיינית של דוד קיטור: 70–95% [S01, PDF p. 12; S21, PDF p. 1], בדוגמאות 80–82% [S21, PDF pp. 1–2; S22, p. 1]'
      },
      c1b_tariff_gj_hint: {
        ru: 'Цена топлива ($ или ₪ за ГДж / MMBtu) вводится пользователем [инженерная оценка]',
        he: 'מחיר הדלק ($ או ₪ ל-GJ / MMBtu) מוזן על ידי המשתמש [הערכה הנדסית]'
      },
      // Module 2
      c2_fluid_hint: {
        ru: 'При выборе гликоля проверьте фактические ρ и c_p раствора',
        he: 'בעת בחירת גליקול בדקו את ערכי הצפיפות ρ וקיבול החום c_p של התמיסה'
      },
      c2_vw_hint: {
        ru: 'Обязательно: > 0 (напр., 120.0 или 85.6 м³/ч)',
        he: 'חובה: > 0 (למשל 120.0 או 85.6 m³/h)'
      },
      c2_rho_hint: {
        ru: 'Вода: 999.7–1000 кг/м³ | 30% ПГ гликоль: ~1032 кг/м³',
        he: 'מים: 999.7–1000 kg/m³ | גליקול 30% PG: כ-1032 kg/m³'
      },
      c2_cp_hint: {
        ru: 'Вода: 4.186 | 30% ПГ гликоль: ~3.85 кДж/(кг·°C)',
        he: 'מים: 4.186 | גליקול 30% PG: כ-3.85 kJ/(kg·°C)'
      },
      c2_tin_hint: {
        ru: 'Обязательно: строго выше T_evap,out (напр., 12.0 °C)',
        he: 'חובה: גבוהה ממש מ-T_evap,out (למשל 12.0 °C)'
      },
      c2_tout_hint: {
        ru: 'Рабочая уставка Cool LWT (напр., 7.0 °C или −1.0 °C для гликоля)',
        he: 'נקודת עבודה Cool LWT (למשל 7.0 °C או −1.0 °C לגליקול)'
      },
      c2_pel_hint: {
        ru: 'Строго > 0 кВт для расчёта COP и кВт/TR (напр., 96.0 кВт)',
        he: 'חייב להיות > 0 kW לחישוב COP ו-kW/TR (למשל 96.0 kW)'
      },
      c2_tsat_ev_hint: {
        ru: 'Ниже T_evap,out (напр., 3.5 °C → Approach испарителя 3.5 °C)',
        he: 'נמוכה מ-T_evap,out (למשל 3.5 °C → הפרש גישה במאייד 3.5 °C)'
      },
      c2_tcond_out_hint: {
        ru: 'Заполняется в паре с T_sat,cond (напр., 32.8 или 34.5 °C)',
        he: 'מוזן יחד עם T_sat,cond (למשל 32.8 או 34.5 °C)'
      },
      c2_tsat_cd_hint: {
        ru: 'Заполняется в паре с T_cond,out (напр., 35.0 или 44.5 °C)',
        he: 'מוזן יחד עם T_cond,out (למשל 35.0 או 44.5 °C)'
      },
      c2_t_year_hint: {
        ru: 'Для годового расхода кВт·ч и стоимости (требуется P_el > 0) [инженерная оценка]',
        he: 'לצריכת חשמל שנתית kWh ועלות (נדרש P_el > 0) [הערכה הנדסית]'
      },
      c2_tariff_kwh_hint: {
        ru: 'Тариф на электроэнергию ($/кВт·ч или ₪/кВт·ч) вводится пользователем [инженерная оценка]',
        he: 'תעריף חשמל ($/kWh או ₪/kWh) מוזן על ידי המשתמש [הערכה הנדסית]'
      },
      // Module 3A
      c3a_q1_hint: {
        ru: 'Обязательно: > 0 (Тест 3.1: 400 Нл/с)',
        he: 'חובה: > 0 (מבחן 3.1: 400 NL/s)'
      },
      c3a_p1_hint: {
        ru: 'Нормальные условия: 1.01325 бар(а)',
        he: 'תנאים תקניים: 1.01325 bar(a)'
      },
      c3a_t1_hint: {
        ru: 'Нормальные условия: 0.0 °C',
        he: 'תנאים תקניים: 0.0 °C'
      },
      c3a_rh1_hint: {
        ru: 'Для сухого воздуха: φ₁ = 0%, p_sat1 = 0 бар',
        he: 'לאוויר יבש: φ₁ = 0%, p_sat1 = 0 bar'
      },
      c3a_p2_hint: {
        ru: 'Всас: 0.980 бар(а) (→ 471.24 л/с) или 1.000 бар(а) (→ 461.59 л/с)',
        he: 'יניקה: 0.980 bar(a) (← 471.24 L/s) או 1.000 bar(a) (← 461.59 L/s)'
      },
      c3a_t2_hint: {
        ru: 'Летний всас: +30.0 °C',
        he: 'יניקת קיץ: +30.0 °C'
      },
      c3a_rh2_hint: {
        ru: 'При +30 °C [S13, printed p. 134 / PDF p. 136]: φ₂ = 60%, p_sat2 = 0.04246 бар',
        he: 'ב-+30 °C [S13, PDF p. 136]: φ₂ = 60%, p_sat2 = 0.04246 bar'
      },
      // Module 3B
      c3b_method_hint: {
        ru: 'Метод 1 (спад давления ресивера) или Метод 2 (цикл Load/Unload)',
        he: 'שיטה 1 (נפילת לחץ במכל האוויר) או שיטה 2 (מחזור עומס/סרק Load/Unload)'
      },
      c3b_vr_hint: {
        ru: 'Тест 3.2: 10.0 м³',
        he: 'מבחן 3.2: 10.0 m³'
      },
      c3b_pstart_hint: {
        ru: 'Тест 3.2: спад с 7.0 до 6.0 бар изб.',
        he: 'מבחן 3.2: ירידה מ-7.0 ל-6.0 barg'
      },
      c3b_tdecay_hint: {
        ru: 'Тест 3.2: t = 5.0 мин при P_atm = 1.0 бар',
        he: 'מבחן 3.2: t = 5.0 min בלחץ אטמוספרי P_atm = 1.0 bar'
      },
      c3b_tload_hint: {
        ru: 'Тест 3.2Б: t_load = 3.0 мин, t_unload = 7.0 мин (→ 30%)',
        he: 'מבחן 3.2ב: t_load = 3.0 min, t_unload = 7.0 min (← 30%)'
      },
      c3b_qcomp_hint: {
        ru: 'Тест 3.2: 20.0 м³/мин (для расчёта доли утечек %)',
        he: 'מבחן 3.2: 20.0 m³/min (לחישוב אחוז הדליפות מתפוקת המדחס)'
      },
      c3b_spec_power_hint: {
        ru: 'При 6.9 бар изб. (100 psig) [S12, Fact Sheet 7, PDF pp. 52–53]: винтовой маслозаполненный 1-ступ. 18–19 kW/100 cfm (≈ 6.36–6.71 кВт/(м³/мин)), 2-ступ. 16–17 kW/100 cfm (≈ 5.65–6.00); безмасляный 18–22 (≈ 6.36–7.77); центробежный 16–20 (≈ 5.65–7.06)',
        he: 'עבור 6.9 barg (100 psig) [S12, Fact Sheet 7, PDF pp. 52–53]: בורגי מוזרק-שמן חד-שלבי 18–19 kW/100 cfm (≈ 6.36–6.71 kW/(m³/min)), דו-שלבי 16–17 kW/100 cfm (≈ 5.65–6.00); נטול שמן 18–22 (≈ 6.36–7.77); צנטריפוגלי 16–20 (≈ 5.65–7.06)'
      },
      c3b_t_year_hint: {
        ru: 'Напр., 8000 или 8760 ч/год (в примере DOE S12, PDF p. 31: 8760 ч/год) [инженерная оценка]',
        he: 'למשל 8000 או 8760 שעות/שנה (בדוגמת DOE S12, PDF p. 31: 8760 שעות/שנה) [הערכה הנדסית]'
      },
      c3b_tariff_kwh_hint: {
        ru: 'Тариф на электроэнергию ($/кВт·ч или ₪/кВт·ч) вводится пользователем [инженерная оценка]',
        he: 'תעריף חשמל ($/kWh או ₪/kWh) מוזן על ידי המשתמש [הערכה הנדסית]'
      },
      // Module 3C
      c3_qc_hint: {
        ru: 'В источнике S13, PDF p. 122: 445 л/с',
        he: 'במקור S13, PDF p. 122: 445 L/s'
      },
      c3_rh_hint: {
        ru: 'Пример S13, p. 122: 0.60 | Учебный охладитель: 0.50',
        he: 'דוגמת S13, p. 122: 0.60 | מצנן קצה לימודי: 0.50'
      },
      c3_rho_in_hint: {
        ru: 'При +30 °C: 30.078 г/м³ | При +20 °C: 17.148 г/м³ [S13, PDF pp. 136, 138]',
        he: 'ב-+30 °C: 30.078 g/m³ | ב-+20 °C: 17.148 g/m³ [S13, PDF pp. 136, 138]'
      },
      c3_tamb_hint: {
        ru: '+30 °C = 303.15 К | +20 °C = 293 К',
        he: '+30 °C = 303.15 K | +20 °C = 293 K'
      },
      c3_pafter_hint: {
        ru: 'В примере S13, p. 122: 8.0 бар(а)',
        he: 'בדוגמת S13, p. 122: 8.0 bar(a)'
      },
      c3_tafter_hint: {
        ru: '+6 °C = 279.15 К (S13) | +25 °C = 298 К (охладитель)',
        he: '+6 °C = 279.15 K (מייבש S13) | +25 °C = 298 K (מצנן קצה)'
      },
      c3_rho_out_hint: {
        ru: 'При +6 °C: 7.246 г/м³ | При +25 °C: 22.830 г/м³ [S13, p. 138]',
        he: 'ב-+6 °C: 7.246 g/m³ | ב-+25 °C: 22.830 g/m³ [S13, p. 138]'
      },
      // Module 4A
      c4a_qp_hint: {
        ru: 'Тест 4.1: 18.0 м³/ч',
        he: 'מבחן 4.1: 18.0 m³/h'
      },
      c4a_qc_hint: {
        ru: 'Тест 4.1: 6.0 м³/ч (→ Q_f = 24.0 м³/ч, Y = 75.0%)',
        he: 'מבחן 4.1: 6.0 m³/h (← Q_f = 24.0 m³/h, Y = 75.0%)'
      },
      c4a_qf_meas_hint: {
        ru: 'Для сверки расходомеров (напр., 24.2 м³/ч)',
        he: 'לאימות מד ספיקת הכניסה (למשל 24.2 m³/h)'
      },
      c4a_ecf_hint: {
        ru: 'Тест 4.1: 1200 мкСм/см (оценка по EC ≠ массовая концентрация TDS)',
        he: 'מבחן 4.1: 1200 µS/cm (אומדן לפי מוליכות EC ≠ ריכוז מלחים מסתי TDS)'
      },
      c4a_ecp_hint: {
        ru: 'Тест 4.1: 24 мкСм/см (→ SP_EC = 2.0%, SR_EC = 98.0% по EC)',
        he: 'מבחן 4.1: 24 µS/cm (← SP_EC = 2.0%, SR_EC = 98.0% לפי EC)'
      },
      c4a_ecc_hint: {
        ru: 'Тест 4.1: 4720 мкСм/см (для проверки баланса проводимости Eq. 80)',
        he: 'מבחן 4.1: 4720 µS/cm (לבדיקת מאזן מוליכות לפי Eq. 80)'
      },
      c4a_tdsf_hint: {
        ru: 'Опционально: для точного массового баланса солей (отдельно от оценки по EC)',
        he: 'אופציונלי: למאזן מלחים מסתי מדויק ב-mg/L (בנפרד מאומדן המוליכות EC)'
      },
      // Module 4B
      c4_qp_hint: {
        ru: 'Пример S16, PDF p. 132 (Случай 5.2): 127.0 м³/ч',
        he: 'דוגמת S16, PDF p. 132 (אירוע 5.2): 127.0 m³/h'
      },
      c4_qc_hint: {
        ru: 'В S16, PDF p. 132 при Recovery = 72%: Q_co = 49.39 м³/ч',
        he: 'ב-S16, PDF p. 132 עבור Recovery = 72%: Q_co = 49.39 m³/h'
      },
      c4_qbase_hint: {
        ru: 'При пуске (15 °C, Y = 75%): 150.0 м³/ч',
        he: 'בהרצה (15 °C, Y = 75%): 150.0 m³/h'
      },
      c4_ndps_hint: {
        ru: 'S16, PDF p. 131: 20.0 бар',
        he: 'S16, PDF p. 131: 20.0 bar'
      },
      c4_ndpo_hint: {
        ru: 'S16, PDF p. 132: окр. 21.3 бар | точн. 21.28 бар',
        he: 'S16, PDF p. 132: מעוגל 21.3 bar | מדויק 21.28 bar'
      },
      c4_tcfs_hint: {
        ru: 'При 15 °C [S16, Eq. 74 (298/273)]: окр. 0.70 | точн. 0.70336246',
        he: 'ב-15 °C [S16, Eq. 74]: מעוגל 0.70 | מדויק 0.70336246'
      },
      c4_tcfo_hint: {
        ru: 'При 10 °C [S16, Eq. 74 (298/273)]: окр. 0.58 | точн. 0.58441151',
        he: 'ב-10 °C [S16, Eq. 74]: מעוגל 0.58 | מדויק 0.58441151'
      },
      c4_pp_hint: {
        ru: 'Ориентир DuPont/Toray: ≤ 0.3 бар (≈ 4.35 psi) / 5 psi (≈ 0.345 бар)',
        he: 'גבול DuPont/Toray: ≤ 0.3 bar (≈ 4.35 psi) / 5 psi (≈ 0.345 bar)'
      },
      // Module 5A
      c5a_mode_hint: {
        ru: 'P_abs = P_gauge + P_atm (при P_abs > 0)',
        he: 'P_abs = P_gauge + P_atm (עבור P_abs > 0)'
      },
      c5a_unit_hint: {
        ru: '1 bar = 14.50377 psi = 100 kPa',
        he: '1 bar = 14.50377 psi = 100 kPa'
      },
      c5a_pval_hint: {
        ru: 'Тест 5.1: 6.0 бар изб. (→ 7.01325 бар абс. / 101.72 psia)',
        he: 'מבחן 5.1: 6.0 barg (← 7.01325 bara / 101.72 psia)'
      },
      c5a_patm_hint: {
        ru: 'Стандартное на уровне моря: 1.01325 бар',
        he: 'תקני בגובה פני הים: 1.01325 bar'
      },
      // Module 5B
      c5_load_mode_hint: {
        ru: 'Прямая мощность Q_load (кВт) или нагрев потока продукта',
        he: 'הספק חום ישיר Q_load (kW) או חימום זרם מוצר'
      },
      c5_steam_preset_hint: {
        ru: 'Подставляет согласованные T_sat, h_g, h_f и h_fg = h_g − h_f (при P_atm = 1.013 бар)',
        he: 'מציב ערכים מתואמים של T_sat, h_g, h_f ו-h_fg = h_g − h_f (עבור P_atm = 1.013 bar)'
      },
      c5_qkw_hint: {
        ru: 'Тест 5.2А: 350.0 кВт (при режиме прямого ввода кВт)',
        he: 'מבחן 5.2א: 350.0 kW (במצב הזנת הספק ישירה)'
      },
      c5_mp_hint: {
        ru: 'Тест 5.2Б (пастеризатор): 15000 кг/ч, c_p = 3.93 (или 3.95)',
        he: 'מבחן 5.2ב (פסטור): 15,000 kg/h, c_p = 3.93 (או 3.95)'
      },
      c5_tin_hint: {
        ru: 'Жидкая фаза (0 < T < 373.95 °C): 4→75 °C или 20→85 °C',
        he: 'פאזה נוזלית (0 < T < 373.95 °C): 4→75 °C או 20→85 °C'
      },
      c5_hg_hint: {
        ru: 'При 4.0 бар изб. (CoolProp 8.0.0): h_g = 2748.2, h_f = 640.5 → h_fg = 2107.7 кДж/кг',
        he: 'עבור 4.0 barg (CoolProp 8.0.0): h_g = 2748.2, h_f = 640.5 ← h_fg = 2107.7 kJ/kg'
      },
      c5_hfg_hint: {
        ru: 'При 4 бар изб.: 2107.7 (контроль: 2108.1) | При 2 бар изб.: 2163.0 кДж/кг',
        he: 'ב-4 barg: 2107.7 (בקרה: 2108.1) | ב-2 barg: 2163.0 kJ/kg'
      },
      c5_x_hint: {
        ru: 'Обязательно: 0.98 (→ 609.89 кг/ч) или 1.0; пустое поле вызывает ошибку!',
        he: 'חובה: 0.98 (← 609.89 kg/h) או 1.0; שדה ריק יעצור את החישוב!'
      },
      c5_sf_hint: {
        ru: 'Напр., 2.5 (реальный выбор КО требует ΔP, MOP и таблиц!)',
        he: 'למשל 2.5 (בחירה סופית של מלכודת קיטור מחייבת ΔP, MOP וטבלאות יצרן!)'
      },
      c5_tdsfw_hint: {
        ru: 'В паре (напр., 180 и 3000 ppm) — относится только к котлу в целом!',
        he: 'מוזנים יחד (למשל 180 ו-3000 ppm) — מתייחס לדוד הקיטור כולו!'
      },
      c5_t_year_hint: {
        ru: 'Для расчёта годового потребления пара (т/год) и тепла (ГДж/год) [инженерная оценка]',
        he: 'לחישוב צריכת קיטור שנתית (t/yr) ואנרגיה תרמית (GJ/yr) [הערכה הנדסית]'
      },
      c5_eta_hint: {
        ru: 'Типичный КПД парового котла: 70–95% [S01, PDF p. 12; S21, PDF p. 1], в примерах 80–82% [S21, PDF pp. 1–2; S22, p. 1]',
        he: 'נצילות אופיינית של דוד קיטור: 70–95% [S01, PDF p. 12; S21, PDF p. 1], בדוגמאות 80–82% [S21, PDF pp. 1–2; S22, p. 1]'
      },
      c5_tariff_gj_hint: {
        ru: 'Цена топлива ($ или ₪ за ГДж / MMBtu) вводится пользователем [инженерная оценка]',
        he: 'מחיר הדלק ($ או ₪ ל-GJ / MMBtu) מוזן על ידי המשתמש [הערכה הנדסית]'
      }
    };
    for (const [hId, hDict] of Object.entries(HINTS_I18N)) {
      const hEl = document.getElementById(hId);
      if (hEl) hEl.textContent = hDict[lang] || hDict.ru;
    }

    // Translate input placeholders across all modules
    const PLACEHOLDERS_I18N = {
      c1a_t_year: { ru: 'Оставьте пустым или укажите ч/год', he: 'השאירו ריק או הזינו שעות/שנה' },
      c1a_eta: { ru: 'Не задан (только физ. тепло)', he: 'לא הוזן (חום פיזי בלבד)' },
      c1a_lhv: { ru: 'МДж/ед. топлива (опц.)', he: 'MJ ליחידת דלק (אופציונלי)' },
      c1a_tariff_gj: { ru: 'Пусто = без расчёта денег', he: 'ריק = ללא חישוב עלות' },
      c1a_tariff_water: { ru: 'Пусто = без стоимости воды', he: 'ריק = ללא עלות מים' },
      c1_dop: { ru: 'Не задан (предварит. 200 мм)', he: 'לא הוזן (ראשוני 200 מ"מ)' },
      c1b_t_year: { ru: 'Пусто = без расчёта за год', he: 'ריק = ללא חישוב שנתי' },
      c1b_eta: { ru: 'Типично 80–82% [S21, p. 1]', he: 'אופייני 80–82% [S21, p. 1]' },
      c1b_tariff_gj: { ru: 'Пусто = без расчёта денег', he: 'ריק = ללא חישוב עלות' },
      c2_pel: { ru: 'Оставьте пустым без замера кВт', he: 'השאירו ריק ללא מדידת kW' },
      c2_tsat_ev: { ru: 'Опционально', he: 'אופציונלי' },
      c2_tcond_out: { ru: 'В паре с T_sat,cond', he: 'יחד עם T_sat,cond' },
      c2_tsat_cd: { ru: 'В паре с T_cond,out', he: 'יחד עם T_cond,out' },
      c2_t_year: { ru: 'Пусто = без расчёта за год', he: 'ריק = ללא חישוב שנתי' },
      c2_tariff_kwh: { ru: 'Пусто = без расчёта денег', he: 'ריק = ללא חישוב עלות' },
      c3b_spec_power: { ru: 'Напр., 6.5 кВт/(м³/мин) [S12, p. 52]', he: 'למשל 6.5 kW/(m³/min) [S12, p. 52]' },
      c3b_t_year: { ru: 'Пусто = без расчёта за год', he: 'ריק = ללא חישוב שנתי' },
      c3b_tariff_kwh: { ru: 'Пусто = без расчёта денег', he: 'ריק = ללא חישוב עלות' },
      c5_t_year: { ru: 'Пусто = без расчёта за год', he: 'ריק = ללא חישוב שנתי' },
      c5_eta: { ru: 'Типично 80–82% [S21, p. 1]', he: 'אופייני 80–82% [S21, p. 1]' },
      c5_tariff_gj: { ru: 'Пусто = без расчёта денег', he: 'ריק = ללא חישוב עלות' }
    };
    for (const [pId, pDict] of Object.entries(PLACEHOLDERS_I18N)) {
      const pEl = document.getElementById(pId);
      if (pEl) pEl.setAttribute('placeholder', pDict[lang] || pDict.ru);
    }

    // Translate calculator buttons (Run / Clear / Presets) across all 10 modules
    const PRESET_BTN_HE = {
      "loadPreset1A('benchmark')": 'דוגמת ייחוס (6 L/min, 50→20 °C, 8 שעות ו-8000 שעות)',
      "loadPreset1A('balance60')": 'מבחן 1.1: 2000 kg/h, השבה 60% (90→15 °C)',
      "loadPreset1A('doe')": 'מבחן 1.2: תקן DOE S21 (5000 lb/hr, 82%, $5/MMBtu ← $29,270/שנה)',
      "loadPreset1B('prelim')": 'דוגמה 1א ללא D_op (ראשוני 200 מ"מ)',
      "loadPreset1B('dop50')": 'דוגמה 1א עם D_op = 50 מ"מ (תוצאה 200 מ"מ)',
      "loadPreset1B('dop100')": 'דוגמה עם D_op = 100 מ"מ (3×100 = 300 מ"מ)',
      "loadPreset2('water')": 'מבחן 2.1: מים 120 m³/h (12→7 °C ← 697.7 kW, COP 7.27)',
      "loadPreset2('glycol')": 'מבחן 2.2: 30% גליקול PG \u200E120 m³/h (\u200E+4→−1 °C\u200E ← \u200E662.2 kW\u200E)',
      "loadPreset2('case31')": '<span>מבחן 2.3: אירוע 3.1 בסימולטור (Approach מעבה <bdi dir="ltr">10.0 °C</bdi>)</span>',
      "loadPreset3A(0.980)": 'מבחן 3.1א: P₂ = 0.980 bar(a) (← 471.24 L/s FAD)',
      "loadPreset3A(1.000)": 'מבחן 3.1ב: P₂ = 1.000 bar(a) (← 461.59 L/s FAD)',
      "loadPreset3B('receiver_drop')": 'מבחן 3.2א: נפילת לחץ במכל (10 m³, 7→6 bar, 5 min ← 2.0 m³/min, 10%)',
      "loadPreset3B('load_unload')": 'מבחן 3.2ב: מחזור Load/Unload (3 ו-7 דק׳ ← 30%, 6.0 m³/min)',
      "loadPreset3('s13_exact')": 'דוגמת מקור S13 (PDF p. 122: 30 °C, RH 60%, +6 °C ← 27.46 kg/h)',
      "loadPreset3('aftercooler_445')": 'מצנן קצה לימודי (20 °C, RH 50%, 445 L/s, +25 °C ← 9.09 L/h)',
      "loadPreset3('aftercooler_450')": 'מצנן קצה לימודי (450 L/s ← 9.19 L/h)',
      "loadPreset4A()": 'מבחן 4.1: מאזן RO (Qp=18, Qc=6, ECf=1200, ECp=24, ECc=4720 ← Y=75%, B_EC=1.0017)',
      "loadPreset4('rounded')": 'מבחן 4.2א: דוגמת S16 מעוגלת (0.70 ו-0.58 ← Q_s = 143.92 m³/h, −4.05%)',
      "loadPreset4('exact')": 'מבחן 4.2ב: לפי Eq. 74 ללא עיגול (← Q_s = 143.66 m³/h, −4.23%)',
      "loadPreset4('counterexample_ndp')": 'מבחן 4.2ג: דוגמה נגדית להשפעת NDP מול TCF (← 99.90 m³/h)',
      "loadPreset4('high_npf')": 'מבחן 4.2ד: עליית NPF ≥ +10% (פריצת O-ring / חמצון ממברנה)',
      "loadPreset4('alarm')": 'מבחן חסימה: לחץ נגדי בתוצר (+0.60 bar)',
      "loadPreset5A()": 'מבחן 5.1: 6.0 barg + 1.01325 bar ← 7.01325 bara (101.72 psia)',
      "loadPreset5B('direct_preset4')": 'נקודת 4 barg (CoolProp 8.0.0: 350 kW, h_fg=2107.7, x=0.98 ← 610.01 kg/h)',
      "loadPreset5B('direct_control')": 'בקרת מפרט (350 kW, h_fg=2108.1 ידני, x=0.98 ← 609.89 kg/h)',
      "loadPreset5B('pasteurizer')": 'מבחן 5.2ב: פסטור 15,000 kg/h (4→75 °C, 2 barg, h_fg=2163.0 ← 1935.02 kg/h)',
      "loadPreset5B('spec_example')": 'מבחן 5.2ג: דוגמת מפרט (15,000 kg/h, c_p=3.95, 20→85 °C, h_fg=2120.38 ← 1816.30 kg/h)'
    };

    document.querySelectorAll('#sec-calculators button[onclick]').forEach((btn) => {
      const oc = btn.getAttribute('onclick') || '';
      if (oc.includes('setCalculatorUnitSystem') || oc.includes('setCalculatorCurrency') || oc.includes('returnToTrainerCase')) {
        return;
      }
      if (!btn.dataset.ruText) btn.dataset.ruText = btn.textContent.trim();
      if (lang !== 'he') {
        btn.textContent = btn.dataset.ruText;
        return;
      }
      if (oc.startsWith('clearCalcModule')) {
        btn.textContent = '🧹 ניקוי שדות';
      } else if (oc.startsWith('runCalc')) {
        btn.textContent = '▶ חשב ועדכן כרטיס חישוב';
      } else if (PRESET_BTN_HE[oc]) {
        btn.innerHTML = PRESET_BTN_HE[oc];
      }
    });
    // Re-render calculator outputs in the active language without losing user input values
    root.runAllCalculators();
    renderFieldOriginTags(lang);
    root.renderExperiments(lang);
  };

  // ===========================================================================
  // v15.4 Task 2.4b: Ярлыки происхождения полей («измерено» / «принято» / «справочно»)
  // ===========================================================================
  function renderFieldOriginTags(lang) {
    if (typeof document === 'undefined') return;
    const expData = getExpData();
    if (!expData || !expData.FIELD_ORIGIN) return;

    for (const [fid, origin] of Object.entries(expData.FIELD_ORIGIN)) {
      const fieldEl = document.getElementById(fid);
      if (!fieldEl) continue;
      const fieldBox = fieldEl.closest('.field');
      if (!fieldBox) continue;

      let tagsRow = fieldBox.querySelector('.field-origin-tags-row');
      if (!tagsRow) {
        tagsRow = document.createElement('div');
        tagsRow.className = 'field-origin-tags-row';
        tagsRow.setAttribute('aria-hidden', 'true');
        const lblEl = fieldBox.querySelector('label');
        if (lblEl && lblEl.nextSibling) {
          fieldBox.insertBefore(tagsRow, lblEl.nextSibling);
        } else if (lblEl) {
          fieldBox.appendChild(tagsRow);
        } else {
          fieldBox.insertBefore(tagsRow, fieldBox.firstChild);
        }
      }

      let tagSpan = tagsRow.querySelector(`span.field-origin-tag[data-field-id="${fid}"]`);
      if (!tagSpan) {
        tagSpan = document.createElement('span');
        tagSpan.className = 'field-origin-tag';
        tagSpan.setAttribute('data-field-id', fid);
        tagSpan.setAttribute('aria-hidden', 'true');
        tagsRow.appendChild(tagSpan);
      }

      tagSpan.setAttribute('data-origin', origin);
      tagSpan.setAttribute('title', getFieldOriginTooltip(fid, lang));
      tagSpan.textContent = getFieldOriginLabel(fid, lang);
    }
  }

  // ===========================================================================
  // v15.4 Task 2.2: Учебные опыты в калькуляторах (1А, 2, 3Б, 4А, 4Б, 5Б)
  // ===========================================================================
  const STORAGE_KEY_EXPERIMENTS = 'eng_lib_v15_experiments_v1';
  let memoryExperimentsProgress = {};
  const openExperimentModules = new Set();
  const pendingRadioSelection = {};

  function loadExperimentsProgress() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_EXPERIMENTS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            memoryExperimentsProgress = { ...parsed };
            return memoryExperimentsProgress;
          }
        }
      }
    } catch (_) {
      if (typeof root.setStorageAvailabilityForTest === 'function') {
        root.setStorageAvailabilityForTest(false);
      }
    }
    return { ...memoryExperimentsProgress };
  }

  function saveExperimentsProgress(progObj) {
    memoryExperimentsProgress = { ...(progObj || {}) };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_EXPERIMENTS, JSON.stringify(memoryExperimentsProgress));
      }
    } catch (_) {
      if (typeof root.setStorageAvailabilityForTest === 'function') {
        root.setStorageAvailabilityForTest(false);
      }
    }
  }

  const EXP_MODULE_OUT_CONTAINERS = {
    '1A': 'out-calc-1a',
    '2': 'out-calc-2',
    '3B': 'out-calc-3b',
    '4A': 'out-calc-4a',
    '4B': 'out-calc-4',
    '5B': 'out-calc-5'
  };

  function applyExperimentPayloadToForm(exp, payload, isVariant) {
    for (const [key, mapCfg] of Object.entries(exp.fieldMap || {})) {
      const val = payload[key];
      if (val === undefined) continue;
      if (mapCfg.selectId) {
        const selEl = document.getElementById(mapCfg.selectId);
        const selVal = isVariant ? mapCfg.variantSelectValue : mapCfg.baseSelectValue;
        if (selEl && selVal !== undefined) {
          selEl.value = String(selVal);
        }
        const EC = root.EngineeringCalculators;
        const row = EC && Array.isArray(EC.VERIFIED_STEAM_TABLE)
          ? EC.VERIFIED_STEAM_TABLE.find((r) => r.p_barg === Number(selVal))
          : null;
        if (row) {
          setFieldFromSiValue('c5_hg', String(row.hg));
          setFieldFromSiValue('c5_hf', String(row.hf));
        }
      } else if (mapCfg.id === 'c5_hfg') {
        const hgNow = parseFloat(siValOf('c5_hg'));
        const hfNow = parseFloat(siValOf('c5_hf'));
        if (Number.isFinite(hgNow) && Number.isFinite(hfNow) && Math.abs((hgNow - hfNow) - Number(val)) > 0.5) {
          const EC = root.EngineeringCalculators;
          const row = EC && Array.isArray(EC.VERIFIED_STEAM_TABLE)
            ? EC.VERIFIED_STEAM_TABLE.find((r) => Math.abs(r.hfg - Number(val)) <= 0.5)
            : null;
          if (row) {
            const selEl = document.getElementById('c5_steam_preset');
            if (selEl) selEl.value = String(row.p_barg);
            setFieldFromSiValue('c5_hg', String(row.hg));
            setFieldFromSiValue('c5_hf', String(row.hf));
          }
        }
      }
      const domEl = document.getElementById(mapCfg.id);
      if (!domEl) continue;
      if (mapCfg.isSelect || domEl.tagName === 'SELECT') {
        domEl.value = String(val);
        domEl.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        setFieldFromSiValue(mapCfg.id, String(val));
      }
    }
    if (typeof root[exp.uiRunFn] === 'function') {
      root[exp.uiRunFn]();
    }
  }

  function formatExperimentValue(val, exp, lang, sys) {
    const UC = root.UnitConverter;
    const q = (exp.expect && exp.expect.quantity) || 'none';
    const key = (exp.expect && exp.expect.key) || '';
    if (UC && q && q !== 'none' && q !== 'si_only') {
      return UC.formatDual(val, q, lang, sys, {
        siDecPrimary: 2,
        siDecSecondary: 2,
        usDecPrimary: 2,
        usDecSecondary: 2
      });
    }
    const suffix = key.toLowerCase().endsWith('pct') ? '%' : '';
    return `<code dir="ltr"><strong>${Number(val).toFixed(2)}${suffix}</strong></code>`;
  }

  function buildExperimentResultBoxHtml(exp, selectedIdx, lang) {
    const EC = root.EngineeringCalculators;
    const expUi = getExpUi(lang);
    if (!EC || typeof EC[exp.runFn] !== 'function' || !expUi) return '';

    const rBase = EC[exp.runFn](exp.base);
    const rVar = EC[exp.runFn](exp.variant);
    const outKey = exp.expect.key;
    const valBase = Number(rBase[outKey]);
    const valVar = Number(rVar[outKey]);
    const diff = valVar - valBase;
    const deltaPct = Math.abs(valBase) > 1e-12 ? (diff / valBase) * 100 : 0;
    const deltaPctSigned = `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1).replace(/\.0$/, '')} %`;

    const sys = getUnitSystem();
    const baseDual = formatExperimentValue(valBase, exp, lang, sys);
    const varDual = formatExperimentValue(valVar, exp, lang, sys);

    const isCorrect = Number(selectedIdx) === Number(exp.correct);
    const verdictClass = isCorrect ? 'is-correct' : 'is-wrong';
    const verdictIcon = isCorrect ? '✓' : '✗';
    const verdictWord = isCorrect ? expUi.verdictCorrect : expUi.verdictWrong;

    const metaKey = `calc-${exp.moduleId.toLowerCase()}`;
    const metaObj = root.I18N_UI && root.I18N_UI.CALC_METADATA && root.I18N_UI.CALC_METADATA[metaKey];
    const formulaText = (metaObj && metaObj.formula && (metaObj.formula[lang] || metaObj.formula.ru)) || '';
    const explainText = (exp.explain && (exp.explain[lang] || exp.explain.ru)) || '';

    const arrowChar = lang === 'he' ? '←' : '→';
    const deltaHtml =
      `<strong>${expUi.beforeAfterLabel}:</strong> ` +
      `${expUi.beforeWord} ${baseDual} ${arrowChar} ${expUi.afterWord} ${varDual} (<code dir="ltr">${deltaPctSigned}</code>)`;

    return `
      <div class="exp-verdict ${verdictClass}" data-exp-correct="${isCorrect ? 'true' : 'false'}">
        <strong>${verdictIcon} ${verdictWord}</strong>
      </div>
      <div class="exp-delta" data-base-val="${valBase}" data-variant-val="${valVar}" data-delta-pct="${deltaPct.toFixed(4)}">
        ${deltaHtml}
      </div>
      <div class="exp-explain">
        <strong>${expUi.whySoLabel}:</strong> ${explainText}
      </div>
      <div class="exp-formula">
        <strong>${expUi.formulaLabel}:</strong> <span class="exp-formula-text">${formulaText}</span>
      </div>
      <div class="exp-links">
        <span><strong>${expUi.sourceLabel}:</strong> <a href="${exp.sourceHref}" class="exp-source-link">${exp.source}</a></span>
        <a href="${exp.guideHref}" class="exp-guide-link">${expUi.openInGuideLink} →</a>
      </div>
    `;
  }

  root.runSingleExperiment = function (expId) {
    const expData = getExpData();
    if (!expData || !Array.isArray(expData.EXPERIMENTS)) return false;
    const exp = expData.EXPERIMENTS.find((e) => e.id === expId);
    if (!exp) return false;
    const lang = getLang();
    const expUi = getExpUi(lang);

    const itemEl = document.querySelector(`.exp-item[data-exp-id="${expId}"]`);
    const checkedRadio = document.querySelector(`input[name="exp-${expId}"]:checked`);
    const hintBox = itemEl ? itemEl.querySelector('.exp-hint-warning') : null;

    if (!checkedRadio) {
      if (hintBox && expUi) {
        hintBox.textContent = `⚠️ ${expUi.selectHypothesisHint}`;
        hintBox.hidden = false;
      }
      return false;
    }

    if (hintBox) {
      hintBox.hidden = true;
      hintBox.textContent = '';
    }

    const selectedIdx = Number(checkedRadio.value);
    pendingRadioSelection[expId] = selectedIdx;

    const prog = loadExperimentsProgress();
    prog[expId] = selectedIdx;
    saveExperimentsProgress(prog);

    const detEl = itemEl && itemEl.closest('details.calc-experiments');
    if (detEl) {
      openExperimentModules.add(exp.moduleId);
    }

    // Snapshot all module fields outside fieldMap (except c5_hg/c5_hf for 5B-3) before applying base
    const UC = root.UnitConverter;
    const mappedIds = new Set(Object.values(exp.fieldMap || {}).map((m) => m.id));
    if (exp.id === '5B-3') {
      mappedIds.add('c5_hg');
      mappedIds.add('c5_hf');
    }
    const preservedSiValues = {};
    if (UC && UC.FIELD_UNIT_MAP) {
      for (const [fid, cfg] of Object.entries(UC.FIELD_UNIT_MAP)) {
        if (cfg.module !== exp.moduleId || mappedIds.has(fid)) continue;
        const el = document.getElementById(fid);
        if (!el || el.tagName === 'SELECT') continue;
        preservedSiValues[fid] = siValOf(fid);
      }
    }

    // (1) Apply base to form and run calculator
    applyExperimentPayloadToForm(exp, exp.base, false);
    // (2) Apply variant to form and run calculator so the card displays the variant result
    applyExperimentPayloadToForm(exp, exp.variant, true);

    // Ensure non-fieldMap fields match pre-experiment values
    for (const [fid, prevVal] of Object.entries(preservedSiValues)) {
      if (siValOf(fid) !== prevVal) {
        setFieldFromSiValue(fid, prevVal === null || prevVal === undefined ? '' : String(prevVal));
      }
    }

    // (3) Render result box for this experiment
    const resBox = itemEl ? itemEl.querySelector('.exp-result-box') : null;
    if (resBox) {
      resBox.innerHTML = buildExperimentResultBoxHtml(exp, selectedIdx, lang);
      resBox.hidden = false;
    }
    return true;
  };

  root.resetModuleExperiments = function (modId) {
    const expData = getExpData();
    if (!expData || !Array.isArray(expData.EXPERIMENTS)) return;
    const normMod = String(modId || '').toUpperCase();
    const prog = loadExperimentsProgress();
    expData.EXPERIMENTS.forEach((exp) => {
      if (exp.moduleId === normMod) {
        delete prog[exp.id];
        delete pendingRadioSelection[exp.id];
      }
    });
    const detEl = typeof document !== 'undefined'
      ? document.getElementById(`calc-experiments-${normMod.toLowerCase()}`)
      : null;
    if (detEl) {
      detEl.querySelectorAll('input[type="radio"]:checked').forEach((r) => {
        r.checked = false;
      });
    }
    saveExperimentsProgress(prog);
    openExperimentModules.add(normMod);
    root.renderExperiments(getLang());
  };

  root.renderExperiments = function (langInput) {
    if (typeof document === 'undefined') return;
    const expData = getExpData();
    if (!expData || !Array.isArray(expData.EXPERIMENTS)) return;
    const lang = langInput === 'he' ? 'he' : (langInput === 'ru' ? 'ru' : getLang());
    const expUi = getExpUi(lang);
    if (!expUi) return;

    const prog = loadExperimentsProgress();

    for (const [modId, outContainerId] of Object.entries(EXP_MODULE_OUT_CONTAINERS)) {
      const outEl = document.getElementById(outContainerId);
      if (!outEl || !outEl.parentElement) continue;
      const modExps = expData.EXPERIMENTS.filter((e) => e.moduleId === modId);
      if (!modExps.length) continue;

      const detailsId = `calc-experiments-${modId.toLowerCase()}`;
      let detailsEl = document.getElementById(detailsId);
      if (detailsEl) {
        if (detailsEl.open) {
          openExperimentModules.add(modId);
        } else {
          openExperimentModules.delete(modId);
        }
        // Preserve any unsaved radio selection before re-render
        modExps.forEach((exp) => {
          const checked = detailsEl.querySelector(`input[name="exp-${exp.id}"]:checked`);
          if (checked) {
            pendingRadioSelection[exp.id] = Number(checked.value);
          }
        });
      } else {
        detailsEl = document.createElement('details');
        detailsEl.id = detailsId;
        detailsEl.className = 'calc-experiments no-print';
        detailsEl.setAttribute('data-exp-module', modId);
        if (outEl.nextSibling) {
          outEl.parentElement.insertBefore(detailsEl, outEl.nextSibling);
        } else {
          outEl.parentElement.appendChild(detailsEl);
        }
        detailsEl.addEventListener('toggle', () => {
          if (detailsEl.open) {
            openExperimentModules.add(modId);
          } else {
            openExperimentModules.delete(modId);
          }
        });
      }

      detailsEl.open = openExperimentModules.has(modId);

      const itemsHtml = modExps.map((exp, idx) => {
        const savedChoice = Object.prototype.hasOwnProperty.call(prog, exp.id)
          ? Number(prog[exp.id])
          : undefined;
        const activeChoice = savedChoice !== undefined
          ? savedChoice
          : pendingRadioSelection[exp.id];

        const badgeStr = expUi.experimentIndexOf
          .replace('{n}', String(idx + 1))
          .replace('{m}', String(modExps.length));
        const qText = (exp.question && (exp.question[lang] || exp.question.ru)) || '';

        const optionsHtml = (exp.options || []).map((opt, optIdx) => {
          const radioId = `exp-radio-${exp.id}-${optIdx}`;
          const optText = opt[lang] || opt.ru;
          const isChecked = activeChoice === optIdx ? ' checked' : '';
          return `
            <div class="exp-option-row">
              <input type="radio" id="${radioId}" name="exp-${exp.id}" value="${optIdx}"${isChecked}>
              <label for="${radioId}">${optText}</label>
            </div>
          `;
        }).join('');

        const hasSavedAnswer = savedChoice !== undefined && Number.isFinite(savedChoice);
        const resultInnerHtml = hasSavedAnswer
          ? buildExperimentResultBoxHtml(exp, savedChoice, lang)
          : '';

        const tl = root.TRUST_LABELS;
        const expTrust = (tl && tl.EXPERIMENTS && tl.EXPERIMENTS[exp.id]) || null;
        const expTrustRowHtml = expTrust
          ? buildTrustLabelRowHtml({
              kind: expTrust.kind || 'example',
              source: expTrust.source || exp.source || '',
              expId: exp.id
            }, lang)
          : '';

        return `
          <div class="exp-item" data-exp-id="${exp.id}">
            <div class="exp-item-header">
              <span class="exp-item-badge">${badgeStr} · <code dir="ltr">${exp.id}</code></span>
              ${expTrustRowHtml}
            </div>
            <p class="exp-question"><strong>${qText}</strong></p>
            <div class="exp-hypothesis-label">${expUi.myHypothesis}:</div>
            <div class="exp-options">
              ${optionsHtml}
            </div>
            <div class="exp-actions">
              <button type="button" class="btn btn-primary btn-sm exp-check-btn" data-exp-check="${exp.id}">${expUi.btnCheckByCalc}</button>
            </div>
            <div class="exp-hint-warning" role="alert" hidden></div>
            <div class="exp-result-box"${hasSavedAnswer ? '' : ' hidden'}>
              ${resultInnerHtml}
            </div>
          </div>
        `;
      }).join('');

      detailsEl.innerHTML = `
        <summary class="calc-experiments-summary">🔬 ${expUi.experimentsTitle} (${modExps.length})</summary>
        <div class="calc-experiments-body">
          <div class="calc-experiments-toolbar">
            <span class="calc-experiments-subtitle">${expUi.experimentsSummaryPrefix}</span>
            <button type="button" class="btn btn-outline btn-sm exp-reset-btn" data-exp-reset="${modId}">${expUi.btnResetExperiments}</button>
          </div>
          <div class="calc-experiments-list">
            ${itemsHtml}
          </div>
        </div>
      `;

      detailsEl.querySelectorAll('.exp-check-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const eid = btn.getAttribute('data-exp-check');
          root.runSingleExperiment(eid);
        });
      });

      detailsEl.querySelectorAll('input[type="radio"]').forEach((rad) => {
        rad.addEventListener('change', () => {
          const eid = rad.name.replace(/^exp-/, '');
          pendingRadioSelection[eid] = Number(rad.value);
          const itemEl = rad.closest('.exp-item');
          const hintBox = itemEl && itemEl.querySelector('.exp-hint-warning');
          if (hintBox) {
            hintBox.hidden = true;
            hintBox.textContent = '';
          }
        });
      });

      const resetBtn = detailsEl.querySelector('.exp-reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          root.resetModuleExperiments(modId);
        });
      }
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
