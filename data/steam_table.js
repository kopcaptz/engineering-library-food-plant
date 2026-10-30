// 06_web_project/data/steam_table.js
// Поручение v12 — Этап 6: Таблица насыщенного пара (#sec-steam-table)
// Получает все 11 проверенных точек исключительно из существующего интерфейса ядра
// window.EngineeringCalculators.VERIFIED_STEAM_TABLE и calcSteamPressureConversion (без ручной переписи чисел).

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    root.SteamTableSection = factory(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const I18N = {
    ru: {
      sectionTitle: '🌡️ Таблица насыщенного водяного пара (11 проверенных точек CoolProp 8.0.0)',
      sectionLead: 'Единый верифицированный набор свойств насыщенного пара из расчётного ядра (модель HEOS::Water / IAPWS-95, тождество h_fg = h_g − h_f) с переключением единиц (SI ⇄ US), проверкой давления без интерполяции и передачей выбранной точки в Модуль 5Б.',
      lookupTitle: 'Проверка давления по таблице и перевод P_изб → P_абс (через Модуль 5А ядра)',
      lblLookupInput: { si: 'Введите избыточное давление P_изб (бар изб.):', us: 'Введите избыточное давление P_gauge (psig):' },
      btnLookupCheck: '🔍 Проверить точку в таблице',
      notInTableMsg: '⚠️ Промежуточное или внешнее давление: нет в проверенной таблице (интерполяция между 11 опорными точками ядра запрещена регламентом).',
      foundInTablePrefix: '✓ Точка найдена в проверенной таблице:',
      colPGauge: { si: 'P_изб (бар изб.)', us: 'P_gauge (psig)' },
      colPAbsStd: { si: 'P_абс при 1.01325 бар (бар абс.)', us: 'P_abs при 14.696 psia (psia)' },
      colPAbsTab: { si: 'P_абс табл. (при 1.013 бар)', us: 'P_abs табл. (psia)' },
      colTSat: { si: 'T_sat (°C)', us: 'T_sat (°F)' },
      colHf: { si: 'h_f жидкости (кДж/кг)', us: 'h_f жидкости (Btu/lb)' },
      colHfg: { si: 'h_fg скрытая (кДж/кг)', us: 'h_fg скрытая (Btu/lb)' },
      colHg: { si: 'h_g пара (кДж/кг)', us: 'h_g пара (Btu/lb)' },
      colAction: 'Связь с расчётом 5Б',
      btnUseIn5B: '➡️ Использовать в модуле 5Б',
      btnControl609: '🎯 Контроль ТЗ (350 кВт, x=0.98, h_fg=2108.1 → 609.89 кг/ч)',
      metaNote: 'Источник данных: интерфейс ядра EngineeringCalculators.VERIFIED_STEAM_TABLE (CoolProp 8.0.0, HEOS::Water / IAPWS-95) и EngineeringCalculators.calcSteamPressureConversion [S01, PDF p. 25, 37].'
    },
    he: {
      sectionTitle: '🌡️ טבלת קיטור רווי (11 נקודות מאומתות CoolProp 8.0.0)',
      sectionLead: 'מערך נתונים מאומת של תכונות קיטור רווי מתוך ליבת החישוב (מודל HEOS::Water / IAPWS-95, זהות h_fg = h_g − h_f) עם החלפת יחידות (SI ⇄ US), בדיקת לחץ ללא אינטרפולציה והעברת נקודה ישירות למודול 5ב.',
      lookupTitle: 'בדיקת לחץ בטבלה והמרת P_gauge → P_abs (דרך מודול 5א בליבה)',
      lblLookupInput: { si: 'הזינו לחץ מד P_gauge (barg):', us: 'הזינו לחץ מד P_gauge (psig):' },
      btnLookupCheck: '🔍 בדיקת נקודה בטבלה',
      notInTableMsg: '⚠️ לחץ ביניים או מחוץ לטווח: לא קיים בטבלה המאומתת (אינטרפולציה בין 11 נקודות הייחוס של הליבה אסורה לפי הנוהל).',
      foundInTablePrefix: '✓ הנקודה נמצאה בטבלה המאומתת:',
      colPGauge: { si: 'P_gauge (barg)', us: 'P_gauge (psig)' },
      colPAbsStd: { si: 'P_abs עבור 1.01325 bar (bara)', us: 'P_abs עבור 14.696 psia (psia)' },
      colPAbsTab: { si: 'P_abs טבלאי (עבור 1.013 bar)', us: 'P_abs טבלאי (psia)' },
      colTSat: { si: 'T_sat (°C)', us: 'T_sat (°F)' },
      colHf: { si: 'h_f נוזל (kJ/kg)', us: 'h_f נוזל (Btu/lb)' },
      colHfg: { si: 'h_fg חום כמוס (kJ/kg)', us: 'h_fg חום כמוס (Btu/lb)' },
      colHg: { si: 'h_g קיטור (kJ/kg)', us: 'h_g קיטור (Btu/lb)' },
      colAction: 'קישור למודול 5ב',
      btnUseIn5B: '➡️ שימוש במודול 5ב',
      btnControl609: '🎯 בקרת מפרט (350 kW, x=0.98, h_fg=2108.1 ← 609.89 kg/h)',
      metaNote: 'מקור הנתונים: ממשק הליבה EngineeringCalculators.VERIFIED_STEAM_TABLE (CoolProp 8.0.0, HEOS::Water / IAPWS-95) ו-EngineeringCalculators.calcSteamPressureConversion [S01, PDF p. 25, 37].'
    }
  };

  let currentLookupBarg = 6.0;

  function getVerifiedTableFromCore() {
    const EC = root.EngineeringCalculators;
    if (!EC || !Array.isArray(EC.VERIFIED_STEAM_TABLE)) {
      return null;
    }
    return EC.VERIFIED_STEAM_TABLE;
  }

  function lookupSteamPoint(pBargInput, lang) {
    const EC = root.EngineeringCalculators;
    const table = getVerifiedTableFromCore();
    const isHe = lang === 'he';
    const t = I18N[isHe ? 'he' : 'ru'];
    if (!EC || !table) {
      return { found: false, message: t.notInTableMsg, pConversion: null, row: null };
    }
    const pNum = Number(pBargInput);
    if (!Number.isFinite(pNum)) {
      return { found: false, message: t.notInTableMsg, pConversion: null, row: null };
    }

    let pConversion = null;
    try {
      pConversion = EC.calcSteamPressureConversion({
        mode: 'gauge_to_abs',
        unit: 'bar',
        p_val: pNum,
        p_atm_bar: 1.01325
      });
    } catch (_) {
      pConversion = null;
    }

    const matchedRow = table.find((r) => Math.abs(r.p_barg - pNum) < 1e-4) || null;
    if (!matchedRow) {
      return {
        found: false,
        message: t.notInTableMsg,
        pConversion,
        row: null
      };
    }

    return {
      found: true,
      message: t.foundInTablePrefix,
      pConversion,
      row: matchedRow
    };
  }

  // Передача точки из таблицы насыщенного пара в Модуль 5Б и запуск расчёта
  function useSteamTableRowInCalc5B(pBarg, useControlHfg) {
    const table = getVerifiedTableFromCore();
    if (!table) return false;
    const pNum = Number(pBarg);
    const row = table.find((r) => Math.abs(r.p_barg - pNum) < 1e-4);
    if (!row) return false;

    if (typeof root.openCalculatorTab === 'function') {
      root.openCalculatorTab('calc-panel-5', false);
    }

    if (useControlHfg && typeof root.loadPreset5B === 'function') {
      root.loadPreset5B('direct_control');
    } else {
      const sel = typeof document !== 'undefined' ? document.getElementById('c5_steam_preset') : null;
      if (sel) sel.value = String(row.p_barg);

      const modeEl = typeof document !== 'undefined' ? document.getElementById('c5_load_mode') : null;
      if (modeEl && !modeEl.value) modeEl.value = 'direct_kw';

      const setSi = typeof root.setFieldFromSiValue === 'function'
        ? root.setFieldFromSiValue
        : (id, v) => {
            const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
            if (el) { el.dataset.siValue = v; el.value = v; }
          };

      setSi('c5_hg', String(row.hg));
      setSi('c5_hf', String(row.hf));
      setSi('c5_hfg', String(row.hfg));

      if (typeof root.runCalc5 === 'function') {
        root.runCalc5();
      }
    }

    if (typeof document !== 'undefined') {
      const anchor = document.getElementById('calc-5b') || document.getElementById('sec-calculators');
      if (anchor && typeof anchor.scrollIntoView === 'function') {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    return true;
  }

  function renderSteamTableSection() {
    if (typeof document === 'undefined') return;
    const box = document.getElementById('dynamic-steam-table-container');
    if (!box) return;

    const lang = (root.AppState && root.AppState.lang === 'he') ? 'he' : 'ru';
    const isHe = lang === 'he';
    const t = I18N[lang];
    const sys = typeof root.getCalculatorUnitSystem === 'function' ? root.getCalculatorUnitSystem() : 'si';
    const UC = root.UnitConverter;
    const EC = root.EngineeringCalculators;
    const table = getVerifiedTableFromCore();

    if (!table || !EC) {
      box.innerHTML = `<div class="warning-box">EngineeringCalculators.VERIFIED_STEAM_TABLE unavailable</div>`;
      return;
    }

    const dispLookupVal = (sys === 'us' && UC)
      ? UC.toImperial('pressure_g', currentLookupBarg).toFixed(2)
      : currentLookupBarg.toFixed(2);

    const lookupRes = lookupSteamPoint(currentLookupBarg, lang);
    let lookupStatusHtml = '';
    if (lookupRes.pConversion) {
      const pConv = lookupRes.pConversion;
      const pHeaderStr = sys === 'us'
        ? `<code dir="ltr">${pConv.pGaugePsi.toFixed(2)} psig + ${UC ? UC.toImperial('pressure_a', pConv.pAtmBar).toFixed(2) : '14.70'} psia = <strong>${pConv.pAbsPsi.toFixed(2)} psia</strong> (${pConv.pAbsBar.toFixed(5)} bara)</code>`
        : `<code dir="ltr">${pConv.pGaugeBar.toFixed(2)} ${isHe ? 'barg' : 'бар изб.'} + ${pConv.pAtmBar.toFixed(5)} ${isHe ? 'bar' : 'бар'} = <strong>${pConv.pAbsBar.toFixed(5)} ${isHe ? 'bara' : 'бар абс.'}</strong> (${pConv.pAbsPsi.toFixed(2)} psia)</code>`;

      if (lookupRes.found && lookupRes.row) {
        const r = lookupRes.row;
        const tSatDisp = sys === 'us' && UC ? `${UC.toImperial('temp', r.t_sat_C).toFixed(1)} °F` : `${r.t_sat_C.toFixed(1)} °C`;
        const hfgDisp = sys === 'us' && UC ? `${UC.formatWithSpaces(UC.toImperial('enthalpy', r.hfg), 1)} Btu/lb` : `${r.hfg.toFixed(1)} ${isHe ? 'kJ/kg' : 'кДж/кг'}`;
        lookupStatusHtml = `
          <div class="operator-box" id="steam-table-lookup-result" style="margin-block-top:0.65rem;">
            <div>${pHeaderStr}</div>
            <div style="margin-block-top:0.25rem;">
              ${lookupRes.message} <code dir="ltr">T_sat = <strong>${tSatDisp}</strong>, h_fg = <strong>${hfgDisp}</strong></code>
            </div>
          </div>
        `;
      } else {
        lookupStatusHtml = `
          <div class="warning-box" id="steam-table-lookup-result" style="margin-block-top:0.65rem;">
            <div>${pHeaderStr}</div>
            <div style="margin-block-top:0.25rem;"><strong>${lookupRes.message}</strong></div>
          </div>
        `;
      }
    } else {
      lookupStatusHtml = `<div class="warning-box" id="steam-table-lookup-result" style="margin-block-top:0.65rem;"><strong>${lookupRes.message}</strong></div>`;
    }

    const rowsHtml = table.map((row) => {
      const conv = EC.calcSteamPressureConversion({
        mode: 'gauge_to_abs',
        unit: 'bar',
        p_val: row.p_barg,
        p_atm_bar: 1.01325
      });

      const pGaugeStr = sys === 'us' && UC
        ? `${UC.toImperial('pressure_g', row.p_barg).toFixed(2)} psig`
        : `${row.p_barg.toFixed(1)} ${isHe ? 'barg' : 'бар изб.'}`;

      const pAbsStdStr = sys === 'us'
        ? `${conv.pAbsPsi.toFixed(2)} psia (${conv.pAbsBar.toFixed(5)} bara)`
        : `${conv.pAbsBar.toFixed(5)} ${isHe ? 'bara' : 'бар абс.'}`;

      const pAbsTabStr = sys === 'us' && UC
        ? `${UC.toImperial('pressure_a', row.p_bara).toFixed(2)} psia`
        : `${row.p_bara.toFixed(3)} ${isHe ? 'bara' : 'бар абс.'}`;

      const tSatStr = sys === 'us' && UC
        ? `${UC.toImperial('temp', row.t_sat_C).toFixed(1)} °F`
        : `${row.t_sat_C.toFixed(1)} °C`;

      const hfStr = sys === 'us' && UC
        ? `${UC.formatWithSpaces(UC.toImperial('enthalpy', row.hf), 1)}`
        : `${row.hf.toFixed(1)}`;

      const hfgStr = sys === 'us' && UC
        ? `${UC.formatWithSpaces(UC.toImperial('enthalpy', row.hfg), 1)}`
        : `${row.hfg.toFixed(1)}`;

      const hgStr = sys === 'us' && UC
        ? `${UC.formatWithSpaces(UC.toImperial('enthalpy', row.hg), 1)}`
        : `${row.hg.toFixed(1)}`;

      const isHighlighted = lookupRes.found && lookupRes.row && Math.abs(lookupRes.row.p_barg - row.p_barg) < 1e-4;

      return `
        <tr data-steam-barg="${row.p_barg}" style="${isHighlighted ? 'background:rgba(59,130,246,0.09);' : ''}">
          <td dir="ltr"><strong>${pGaugeStr}</strong></td>
          <td dir="ltr"><strong>${pAbsStdStr}</strong></td>
          <td dir="ltr">${pAbsTabStr}</td>
          <td dir="ltr">${tSatStr}</td>
          <td dir="ltr">${hfStr}</td>
          <td dir="ltr"><strong>${hfgStr}</strong></td>
          <td dir="ltr">${hgStr}</td>
          <td>
            <button type="button" class="btn btn-primary btn-sm steam-use-5b-btn" data-barg="${row.p_barg}" onclick="window.useSteamTableRowInCalc5B(${row.p_barg}, false)">
              ${t.btnUseIn5B}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    box.innerHTML = `
      <div class="section-header">
        <div>
          <h2>${t.sectionTitle}</h2>
          <p class="section-lead">${t.sectionLead}</p>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem; max-inline-size:100%;">
          <button type="button" class="btn btn-secondary btn-sm" id="steam-btn-control-609" style="white-space:normal; text-align:start; max-inline-size:100%;" onclick="window.useSteamTableRowInCalc5B(4.0, true)">${t.btnControl609}</button>
        </div>
      </div>

      <!-- Панель проверки любого давления без интерполяции -->
      <div style="border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.85rem 1rem; margin-block-end:1rem; background:var(--bg-subtle);">
        <h3 style="margin:0 0 0.55rem; font-size:1rem;">${t.lookupTitle}</h3>
        <div style="display:flex; flex-wrap:wrap; align-items:flex-end; gap:0.65rem;">
          <div class="field" style="flex:1 1 220px; max-inline-size:320px;">
            <label for="steam-table-lookup-input">${t.lblLookupInput[sys]}</label>
            <input type="number" id="steam-table-lookup-input" step="any" value="${dispLookupVal}">
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="steam-table-lookup-btn" onclick="window.checkSteamTableLookupFromDom()">
            ${t.btnLookupCheck}
          </button>
        </div>
        ${lookupStatusHtml}
      </div>

      <div class="table-wrapper" tabindex="0" role="region" aria-label="${t.sectionTitle}">
        <table id="verified-steam-table-grid">
          <thead>
            <tr>
              <th>${t.colPGauge[sys]}</th>
              <th>${t.colPAbsStd[sys]}</th>
              <th>${t.colPAbsTab[sys]}</th>
              <th>${t.colTSat[sys]}</th>
              <th>${t.colHf[sys]}</th>
              <th>${t.colHfg[sys]}</th>
              <th>${t.colHg[sys]}</th>
              <th>${t.colAction}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div class="source-stamp" style="margin-block-top:0.85rem; overflow-wrap:anywhere; word-break:break-word;">
        ℹ️ ${t.metaNote}
      </div>
    `;
  }

  if (typeof root !== 'undefined') {
    root.renderSteamTableSection = renderSteamTableSection;
    root.useSteamTableRowInCalc5B = useSteamTableRowInCalc5B;
    root.lookupSteamPoint = lookupSteamPoint;

    root.checkSteamTableLookupFromDom = function () {
      const el = typeof document !== 'undefined' ? document.getElementById('steam-table-lookup-input') : null;
      if (!el) return;
      const raw = Number(el.value);
      if (!Number.isFinite(raw)) return;
      const sys = typeof root.getCalculatorUnitSystem === 'function' ? root.getCalculatorUnitSystem() : 'si';
      const UC = root.UnitConverter;
      currentLookupBarg = (sys === 'us' && UC) ? UC.toMetric('pressure_g', raw) : raw;
      renderSteamTableSection();
    };
  }

  return {
    I18N,
    getVerifiedTableFromCore,
    lookupSteamPoint,
    useSteamTableRowInCalc5B,
    renderSteamTableSection
  };
});
