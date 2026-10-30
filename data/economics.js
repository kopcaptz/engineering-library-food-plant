/**
 * 06_web_project/data/economics.js — Чистый слой расчёта годовой стоимости в $ и ₪ (Этап 3 v12)
 *
 * ГЛАВНЫЕ ПРИНЦИПЫ:
 * 1. Чистые функции без обращения к DOM (работают как в Node.js для test_economics.mjs, так и в браузере).
 * 2. calculators.js остаётся неизменным бит в бит. EconomicsEngine принимает результаты из calculators.js
 *    и введённые пользователем опциональные параметры (часы в год, КПД котла, удельную мощность компрессора, тариф).
 * 3. Валюты: только доллары США ($) и новые израильские шекели (₪). Курс между валютами не встраивается:
 *    тариф вводится сразу в выбранной валюте. Режим DOE S21 в модуле 1А всегда остаётся в $.
 * 4. Обработка пустого, нулевого и отрицательного тарифа строго совпадает с Блоком 9 test_calculators.py:
 *    - пустой тариф ('' / null / undefined) -> блок «Деньги за год» не показывается (hasCost = false, cost = null);
 *    - нулевой тариф (0 / '0') -> стоимость равна 0.00 (при заполненных сопутствующих параметрах);
 *    - отрицательный тариф (< 0) -> выбрасывается ошибка с подстрокой «не может быть отрицательным»;
 *    - тариф >= 0 без обязательных сопутствующих параметров (часы в год, КПД котла, удельная мощность) -> ошибка!
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.EconomicsEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SUPPORTED_CURRENCIES = Object.freeze(['$', '₪']);

  // Справочные ориентиры из первоисточников S01–S23 с точным указанием страниц
  const TYPICAL_HINTS = Object.freeze({
    boiler_efficiency: {
      source: '[S01, PDF p. 12; S21, PDF p. 1; S22, PDF p. 1]',
      rangePct: [70, 95],
      examplesPct: [80, 82],
      ru: 'Ориентир по источникам: типичный промышленный диапазон паровых котлов 70–95% (в примерах DOE Tip Sheet #8 [S21, PDF p. 1–2] и Rosemount [S22, PDF p. 1]: η_b = 80–82%). Не подставляется по умолчанию.',
      he: 'ערך ייחוס מהמקורות: תחום תעשייתי אופייני לדודי קיטור 70–95% (בדוגמאות DOE Tip Sheet #8 [S21, PDF p. 1–2] ו-Rosemount [S22, PDF p. 1]: η_b = 80–82%). אינו מוזן כברירת מחדל.'
    },
    compressor_spec_power: {
      source: '[S12, Fact Sheet 7, печ. с. 48–49 / PDF с. 52–53]',
      ru: 'Ориентир [S12, Fact Sheet 7, печ. с. 48–49 / PDF с. 52–53] при 100 psig (6.9 бар изб.): винтовой маслозаполненный 1-ступ. 18–19 kW/100 cfm (≈ 6.36–6.71 кВт/(м³/мин)), 2-ступ. 16–17 kW/100 cfm (≈ 5.65–6.00 кВт/(м³/мин)); безмасляный винтовой 18–22 kW/100 cfm (≈ 6.36–7.77 кВт/(м³/мин)). Не подставляется по умолчанию.',
      he: 'ערך ייחוס [S12, Fact Sheet 7, עמ׳ מודפס 48–49 / PDF עמ׳ 52–53] ב-100 psig (6.9 bar g): מדחס בורגי מוזרק שמן חד-דרגתי 18–19 kW/100 cfm (≈ 6.36–6.71 kW/(m³/min)), דו-דרגתי 16–17 kW/100 cfm (≈ 5.65–6.00 kW/(m³/min)); בורגי נטול שמן 18–22 kW/100 cfm (≈ 6.36–7.77 kW/(m³/min)). אינו מוזן כברירת מחדל.'
    }
  });

  function normalizeCurrency(curr) {
    if (curr === '₪' || curr === 'ILS' || curr === 'ils' || curr === 'NIS') {
      return '₪';
    }
    return '$';
  }

  function parseOptionalNumber(raw, label) {
    if (raw === undefined || raw === null) return null;
    const str = String(raw).trim();
    if (str === '') return null;
    const val = Number(str);
    if (!Number.isFinite(val)) {
      throw new Error(`Опциональное поле «${label}» содержит некорректное число.`);
    }
    return val;
  }

  function parseRequiredNumber(raw, label) {
    if (raw === undefined || raw === null || String(raw).trim() === '') {
      throw new Error(`Обязательное поле «${label}» не заполнено. Пустой ввод не заменяется значением по умолчанию.`);
    }
    const val = Number(String(raw).trim());
    if (!Number.isFinite(val)) {
      throw new Error(`Поле «${label}» должно содержать корректное число.`);
    }
    return val;
  }

  function validateHoursYear(tYearH) {
    if (tYearH <= 0 || tYearH > 8784) {
      throw new Error('Часы работы в год t_year должны быть в диапазоне (0; 8784] ч/год.');
    }
  }

  function validateBoilerEfficiency(etaBoilerPct) {
    if (etaBoilerPct <= 0 || etaBoilerPct > 100) {
      throw new Error('Математически КПД котла η_b должен быть в интервале (0%; 100%].');
    }
    if (etaBoilerPct < 50 || etaBoilerPct > 98) {
      return `Математически расчёт выполнен (0% < η_b ≤ 100%), однако введённый КПД котла η_b = ${etaBoilerPct}% выходит за типичный промышленный диапазон паровых котлов (70–95% по [S01, PDF p. 12; S21, PDF p. 1]) — проверьте реалистичность исходных данных.`;
    }
    return null;
  }

  function formatMoneyNumber(num, decimals = 2) {
    const n = Number(num);
    if (!Number.isFinite(n)) return '—';
    const fixed = n.toFixed(decimals);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
  }

  function formatMoney(amount, currency = '$', decimals = 2) {
    const sign = normalizeCurrency(currency);
    const n = Number(amount);
    if (!Number.isFinite(n)) return '—';
    if (n < 0) {
      return `−${sign}${formatMoneyNumber(Math.abs(n), decimals)}`;
    }
    return `${sign}${formatMoneyNumber(n, decimals)}`;
  }

  // ============================================================================
  // 1. МОДУЛЬ 1А: Годовая стоимость потерь / возврата конденсата и подпиточной воды
  // ============================================================================
  function calcModule1AEconomics(r1a, rawParams = {}) {
    if (!r1a || typeof r1a !== 'object') {
      throw new Error('Для расчёта экономики Модуля 1А необходим результат calcCondensatePrimary.');
    }

    // Режим DOE S21 всегда остаётся в долларах США ($)
    if (r1a.mode === 'doe_s21_imperial') {
      const currency = '$';
      const tariffMmbtu = rawParams.tariff_per_mmbtu !== undefined
        ? parseOptionalNumber(rawParams.tariff_per_mmbtu, 'Тариф на топливо ($/MMBtu)')
        : (r1a.annualCostExact !== null && r1a.annualFuelMMBtuExact > 0
            ? r1a.annualCostExact / r1a.annualFuelMMBtuExact
            : null);
      const etaBoilerPct = rawParams.eta_boiler_pct !== undefined
        ? parseOptionalNumber(rawParams.eta_boiler_pct, 'КПД котла (%)')
        : (r1a.annualFuelMMBtuExact !== null && r1a.annualCondMMBtu > 0
            ? (r1a.annualCondMMBtu / r1a.annualFuelMMBtuExact) * 100.0
            : null);

      let realismWarning = r1a.realismWarning || null;
      if (etaBoilerPct !== null) {
        const w = validateBoilerEfficiency(etaBoilerPct);
        if (w) realismWarning = w;
      }

      if (tariffMmbtu === null) {
        return {
          module: '1A',
          mode: 'doe_s21_imperial',
          hasCost: false,
          currency: '$',
          annualCondMMBtu: r1a.annualCondMMBtu,
          annualFuelMMBtuExact: r1a.annualFuelMMBtuExact,
          annualFuelMMBtuRoundedDOE: r1a.annualFuelMMBtuRoundedDOE,
          costEnergyYearExact: null,
          costEnergyYearRoundedDOE: null,
          costTotalYear: null,
          realismWarning,
          formulaRu: 'Cost = (Q_cond [MMBtu/год] / (η_b / 100)) · Tariff [$/MMBtu]',
          formulaHe: 'Cost = (Q_cond [MMBtu/yr] / (η_b / 100)) · Tariff [$/MMBtu]',
          sourceRu: '[S21, DOE Steam Tip Sheet #8, PDF pp. 1–2]',
          sourceHe: '[S21, DOE Steam Tip Sheet #8, PDF pp. 1–2]'
        };
      }

      if (tariffMmbtu < 0) {
        throw new Error('Тариф на топливо не может быть отрицательным (должен быть ≥ 0 $/MMBtu).');
      }
      if (etaBoilerPct === null) {
        throw new Error('Для расчёта стоимости топлива необходимо явно ввести КПД котла (%).');
      }

      const annualFuelMMBtuExact = r1a.annualCondMMBtu / (etaBoilerPct / 100.0);
      const annualFuelMMBtuRoundedDOE = Math.round(annualFuelMMBtuExact);
      const costExact = annualFuelMMBtuExact * tariffMmbtu;
      const costRoundedDOE = annualFuelMMBtuRoundedDOE * tariffMmbtu;

      return {
        module: '1A',
        mode: 'doe_s21_imperial',
        hasCost: true,
        currency,
        tariffPerMmbtu: tariffMmbtu,
        etaBoilerPct,
        annualCondMMBtu: r1a.annualCondMMBtu,
        annualFuelMMBtuExact,
        annualFuelMMBtuRoundedDOE,
        costEnergyYearExact: costExact,
        costEnergyYearRoundedDOE: costRoundedDOE,
        costTotalYear: costRoundedDOE,
        realismWarning,
        formulaRu: 'E_fuel = E_cond / (η_b / 100); Cost = E_fuel [MMBtu/год] · Tariff [$/MMBtu]',
        formulaHe: 'E_fuel = E_cond / (η_b / 100); Cost = E_fuel [MMBtu/yr] · Tariff [$/MMBtu]',
        sourceRu: '[S21, DOE Steam Tip Sheet #8, PDF pp. 1–2]',
        sourceHe: '[S21, DOE Steam Tip Sheet #8, PDF pp. 1–2]'
      };
    }

    // Стандартные режимы 1А (direct_l_min, direct_kg_h, steam_return_pct)
    const currency = normalizeCurrency(rawParams.currency);
    const tYearH = rawParams.t_year_h !== undefined
      ? parseOptionalNumber(rawParams.t_year_h, 'Часы работы в год t_year (ч/год)')
      : (r1a.tYearH !== undefined ? r1a.tYearH : null);
    const etaBoilerPct = rawParams.eta_boiler_pct !== undefined
      ? parseOptionalNumber(rawParams.eta_boiler_pct, 'КПД котла η_b (%)')
      : (r1a.etaBoilerPct !== undefined ? r1a.etaBoilerPct : null);
    const tariffEnergyPerGJ = rawParams.tariff_per_gj !== undefined
      ? parseOptionalNumber(rawParams.tariff_per_gj, `Тариф на тепло/топливо (${currency}/ГДж)`)
      : null;
    const tariffWaterPerM3 = rawParams.tariff_water_m3 !== undefined
      ? parseOptionalNumber(rawParams.tariff_water_m3, `Тариф на воду и стоки (${currency}/м³)`)
      : null;

    if (tYearH !== null) {
      validateHoursYear(tYearH);
    }

    let realismWarning = r1a.realismWarning || null;
    if (etaBoilerPct !== null) {
      const w = validateBoilerEfficiency(etaBoilerPct);
      if (w) realismWarning = w;
    }

    const qThermalKw = Number(r1a.qThermalKw);
    const vTargetM3H = Number(r1a.vTargetM3H);
    const vYearM3 = tYearH !== null ? vTargetM3H * tYearH : null;
    const eYearKwh = tYearH !== null ? qThermalKw * tYearH : null;
    const eYearGJ = eYearKwh !== null ? eYearKwh * 0.0036 : null;
    const eFuelYearGJ = (eYearGJ !== null && etaBoilerPct !== null)
      ? eYearGJ / (etaBoilerPct / 100.0)
      : null;

    let costEnergyYear = null;
    let costWaterYear = null;

    if (tariffEnergyPerGJ !== null) {
      if (tariffEnergyPerGJ < 0) {
        throw new Error('Тариф на тепло/топливо не может быть отрицательным (должен быть ≥ 0).');
      }
      if (tYearH === null || etaBoilerPct === null) {
        throw new Error('Для расчёта годовой стоимости тепла необходимо явно ввести часы работы в год (t_year) и КПД котла (η_b). Скрытые значения по умолчанию не используются.');
      }
      costEnergyYear = eFuelYearGJ * tariffEnergyPerGJ;
    }

    if (tariffWaterPerM3 !== null) {
      if (tariffWaterPerM3 < 0) {
        throw new Error('Тариф на воду и стоки не может быть отрицательным (должен быть ≥ 0).');
      }
      if (tYearH === null) {
        throw new Error('Для расчёта годовой стоимости воды необходимо явно ввести часы работы в год (t_year).');
      }
      costWaterYear = vYearM3 * tariffWaterPerM3;
    }

    const hasCost = costEnergyYear !== null || costWaterYear !== null;
    const costTotalYear = hasCost
      ? (costEnergyYear !== null ? costEnergyYear : 0.0) + (costWaterYear !== null ? costWaterYear : 0.0)
      : null;

    return {
      module: '1A',
      mode: r1a.mode || 'direct_l_min',
      hasCost,
      currency,
      tYearH,
      etaBoilerPct,
      tariffEnergyPerGJ,
      tariffWaterPerM3,
      vYearM3,
      eYearKwh,
      eYearGJ,
      eFuelYearGJ,
      costEnergyYear,
      costWaterYear,
      costTotalYear,
      realismWarning,
      formulaRu: 'E_fuel [ГДж/год] = (Q_тепл [кВт] · t_year [ч/год] · 0.0036) / (η_b / 100); Cost = E_fuel · Тариф_ГДж + V_год · Тариф_вода',
      formulaHe: 'E_fuel [GJ/yr] = (Q_therm [kW] · t_year [h/yr] · 0.0036) / (η_b / 100); Cost = E_fuel · Tariff_GJ + V_year · Tariff_water',
      sourceRu: '[S01, PDF p. 26, 42; S21, PDF pp. 1–2] [инженерная оценка]',
      sourceHe: '[S01, PDF p. 26, 42; S21, PDF pp. 1–2] [הערכה הנדסית]'
    };
  }

  // ============================================================================
  // 2. МОДУЛЬ 1Б: Годовая стоимость вторичного пара вскипания (Flash Steam)
  // ============================================================================
  function calcModule1BEconomics(r1b, rawParams = {}) {
    if (!r1b || typeof r1b !== 'object') {
      throw new Error('Для расчёта экономики Модуля 1Б необходим результат calcCondensateFlashAndTLV.');
    }

    const currency = normalizeCurrency(rawParams.currency);
    const tYearH = parseOptionalNumber(rawParams.t_year_h, 'Часы работы в год t_year (ч/год)');
    const etaBoilerPct = parseOptionalNumber(rawParams.eta_boiler_pct, 'КПД котла η_b (%)');
    const tariffEnergyPerGJ = parseOptionalNumber(rawParams.tariff_per_gj, `Тариф на тепло/пар (${currency}/ГДж)`);

    if (tYearH !== null) {
      validateHoursYear(tYearH);
    }
    let realismWarning = null;
    if (etaBoilerPct !== null) {
      realismWarning = validateBoilerEfficiency(etaBoilerPct);
    }

    const mFlashKgH = parseRequiredNumber(r1b.mFlashKgH, 'Расход вторичного пара m_flash (кг/ч)');
    const hfg2KjKg = parseRequiredNumber(
      r1b.hfg2 !== undefined ? r1b.hfg2 : rawParams.hfg2_kj_kg,
      'Скрытая теплота парообразования h_fg2 (кДж/кг)'
    );

    // Тепловая мощность потока вторичного пара Q_flash [кВт] = m_flash [кг/ч] * h_fg2 [кДж/кг] / 3600
    const qFlashKw = (mFlashKgH * hfg2KjKg) / 3600.0;
    const eFlashYearKwh = tYearH !== null ? qFlashKw * tYearH : null;
    const eFlashYearGJ = eFlashYearKwh !== null ? eFlashYearKwh * 0.0036 : null;
    const eFuelYearGJ = (eFlashYearGJ !== null && etaBoilerPct !== null)
      ? eFlashYearGJ / (etaBoilerPct / 100.0)
      : null;

    if (tariffEnergyPerGJ === null) {
      return {
        module: '1B',
        hasCost: false,
        currency,
        tYearH,
        etaBoilerPct,
        tariffEnergyPerGJ: null,
        qFlashKw,
        eFlashYearKwh,
        eFlashYearGJ,
        eFuelYearGJ,
        costTotalYear: null,
        realismWarning,
        formulaRu: 'Q_flash [кВт] = m_flash · h_fg2 / 3600; E_fuel [ГДж/год] = (Q_flash · t_year · 0.0036) / (η_b / 100); Cost = E_fuel · Тариф_ГДж',
        formulaHe: 'Q_flash [kW] = m_flash · h_fg2 / 3600; E_fuel [GJ/yr] = (Q_flash · t_year · 0.0036) / (η_b / 100); Cost = E_fuel · Tariff_GJ',
        sourceRu: '[S07, PDF p. 14; S21, PDF pp. 1–2; S23, PDF p. 1] [инженерная оценка]',
        sourceHe: '[S07, PDF p. 14; S21, PDF pp. 1–2; S23, PDF p. 1] [הערכה הנדסית]'
      };
    }

    if (tariffEnergyPerGJ < 0) {
      throw new Error('Тариф на тепло/пар не может быть отрицательным (должен быть ≥ 0).');
    }
    if (tYearH === null || etaBoilerPct === null) {
      throw new Error('Для расчёта годовой стоимости вторичного пара необходимо явно ввести часы работы в год (t_year) и КПД котла (η_b). Скрытые значения по умолчанию не используются.');
    }

    const costTotalYear = eFuelYearGJ * tariffEnergyPerGJ;

    return {
      module: '1B',
      hasCost: true,
      currency,
      tYearH,
      etaBoilerPct,
      tariffEnergyPerGJ,
      qFlashKw,
      eFlashYearKwh,
      eFlashYearGJ,
      eFuelYearGJ,
      costTotalYear,
      realismWarning,
      formulaRu: 'Q_flash [кВт] = m_flash · h_fg2 / 3600; E_fuel [ГДж/год] = (Q_flash · t_year · 0.0036) / (η_b / 100); Cost = E_fuel · Тариф_ГДж',
      formulaHe: 'Q_flash [kW] = m_flash · h_fg2 / 3600; E_fuel [GJ/yr] = (Q_flash · t_year · 0.0036) / (η_b / 100); Cost = E_fuel · Tariff_GJ',
      sourceRu: '[S07, PDF p. 14; S21, PDF pp. 1–2; S23, PDF p. 1] [инженерная оценка]',
      sourceHe: '[S07, PDF p. 14; S21, PDF pp. 1–2; S23, PDF p. 1] [הערכה הנדסית]'
    };
  }

  // ============================================================================
  // 3. МОДУЛЬ 2: Годовая стоимость электроэнергии чиллера
  // ============================================================================
  function calcModule2Economics(r2, rawParams = {}) {
    if (!r2 || typeof r2 !== 'object') {
      throw new Error('Для расчёта экономики Модуля 2 необходим результат calcChillerPerformance.');
    }

    const currency = normalizeCurrency(rawParams.currency);
    const tYearH = parseOptionalNumber(rawParams.t_year_h, 'Часы работы чиллера в год t_year (ч/год)');
    const tariffPerKwh = parseOptionalNumber(rawParams.tariff_per_kwh, `Тариф на электроэнергию (${currency}/кВт·ч)`);
    const pElKw = r2.pEl !== undefined && r2.pEl !== null
      ? Number(r2.pEl)
      : parseOptionalNumber(rawParams.p_el_kw, 'Электрическая мощность чиллера W_elec (кВт)');

    if (tYearH !== null) {
      validateHoursYear(tYearH);
    }
    if (pElKw !== null && pElKw <= 0) {
      throw new Error('Потребляемая электрическая мощность чиллера W_elec должна быть строго больше 0 кВт.');
    }

    const eElecYearKwh = (pElKw !== null && tYearH !== null) ? pElKw * tYearH : null;

    if (tariffPerKwh === null) {
      return {
        module: '2',
        hasCost: false,
        currency,
        pElKw,
        tYearH,
        tariffPerKwh: null,
        eElecYearKwh,
        costTotalYear: null,
        formulaRu: 'E_эл [кВт·ч/год] = W_elec [кВт] · t_year [ч/год]; Cost = E_эл · Тариф_кВт·ч',
        formulaHe: 'E_el [kWh/yr] = W_elec [kW] · t_year [h/yr]; Cost = E_el · Tariff_kWh',
        sourceRu: '[S08, PDF p. 66; S09, PDF p. 129] [инженерная оценка]',
        sourceHe: '[S08, PDF p. 66; S09, PDF p. 129] [הערכה הנדסית]'
      };
    }

    if (tariffPerKwh < 0) {
      throw new Error('Тариф на электроэнергию не может быть отрицательным (должен быть ≥ 0).');
    }
    if (tYearH === null) {
      throw new Error('Для расчёта годовой стоимости электроэнергии чиллера необходимо явно ввести часы работы в год (t_year). Скрытые значения по умолчанию не используются.');
    }
    if (pElKw === null) {
      throw new Error('Для расчёта годовой стоимости электроэнергии чиллера необходимо явно ввести потребляемую электрическую мощность W_elec (кВт).');
    }

    const costTotalYear = eElecYearKwh * tariffPerKwh;

    return {
      module: '2',
      hasCost: true,
      currency,
      pElKw,
      tYearH,
      tariffPerKwh,
      eElecYearKwh,
      costTotalYear,
      formulaRu: 'E_эл [кВт·ч/год] = W_elec [кВт] · t_year [ч/год]; Cost = E_эл · Тариф_кВт·ч',
      formulaHe: 'E_el [kWh/yr] = W_elec [kW] · t_year [h/yr]; Cost = E_el · Tariff_kWh',
      sourceRu: '[S08, PDF p. 66; S09, PDF p. 129] [инженерная оценка]',
      sourceHe: '[S08, PDF p. 66; S09, PDF p. 129] [הערכה הנדסית]'
    };
  }

  // ============================================================================
  // 4. МОДУЛЬ 3Б: Годовая стоимость утечек сжатого воздуха
  // ============================================================================
  function calcModule3BEconomics(r3b, rawParams = {}) {
    if (!r3b || typeof r3b !== 'object') {
      throw new Error('Для расчёта экономики Модуля 3Б необходим результат calcAirLeaks.');
    }

    const currency = normalizeCurrency(rawParams.currency);
    const specPowerKwM3Min = parseOptionalNumber(
      rawParams.spec_power_kw_m3min,
      'Удельная мощность компрессора w_spec (кВт/(м³/мин))'
    );
    const tYearH = parseOptionalNumber(rawParams.t_year_h, 'Часы работы в год t_year (ч/год)');
    const tariffPerKwh = parseOptionalNumber(rawParams.tariff_per_kwh, `Тариф на электроэнергию (${currency}/кВт·ч)`);

    if (tYearH !== null) {
      validateHoursYear(tYearH);
    }
    if (specPowerKwM3Min !== null && (specPowerKwM3Min <= 0 || specPowerKwM3Min > 50)) {
      throw new Error('Удельная мощность компрессора w_spec должна быть строго больше 0 кВт/(м³/мин) (допустимый диапазон (0; 50] кВт/(м³/мин)).');
    }

    const qLeakM3Min = r3b.qLeakM3Min !== undefined && r3b.qLeakM3Min !== null
      ? Number(r3b.qLeakM3Min)
      : null;
    const pLeakKw = (qLeakM3Min !== null && specPowerKwM3Min !== null)
      ? qLeakM3Min * specPowerKwM3Min
      : null;
    const eLeakYearKwh = (pLeakKw !== null && tYearH !== null)
      ? pLeakKw * tYearH
      : null;

    if (tariffPerKwh === null) {
      return {
        module: '3B',
        hasCost: false,
        currency,
        qLeakM3Min,
        specPowerKwM3Min,
        tYearH,
        tariffPerKwh: null,
        pLeakKw,
        eLeakYearKwh,
        costTotalYear: null,
        formulaRu: 'P_leak [кВт] = Q_leak [м³/мин] · w_spec [кВт/(м³/мин)]; E_leak [кВт·ч/год] = P_leak · t_year; Cost = E_leak · Тариф_кВт·ч',
        formulaHe: 'P_leak [kW] = Q_leak [m³/min] · w_spec [kW/(m³/min)]; E_leak [kWh/yr] = P_leak · t_year; Cost = E_leak · Tariff_kWh',
        sourceRu: '[S12, Fact Sheet 3 & 7, печ. с. 27, 48–49 / PDF с. 31, 52–53] [инженерная оценка]',
        sourceHe: '[S12, Fact Sheet 3 & 7, עמ׳ מודפס 27, 48–49 / PDF עמ׳ 31, 52–53] [הערכה הנדסית]'
      };
    }

    if (tariffPerKwh < 0) {
      throw new Error('Тариф на электроэнергию не может быть отрицательным (должен быть ≥ 0).');
    }
    if (tYearH === null || specPowerKwM3Min === null) {
      throw new Error('Для расчёта годовой стоимости утечек сжатого воздуха необходимо явно ввести удельную мощность компрессора w_spec (кВт/(м³/мин)) и часы работы в год (t_year). Скрытые значения по умолчанию не используются.');
    }
    if (qLeakM3Min === null) {
      throw new Error('Для расчёта годовой стоимости утечек в Методе 2 (Load/Unload) необходимо ввести номинальную подачу компрессора Q_comp (м³/мин), чтобы получить расход утечек в м³/мин.');
    }

    const costTotalYear = eLeakYearKwh * tariffPerKwh;

    return {
      module: '3B',
      hasCost: true,
      currency,
      qLeakM3Min,
      specPowerKwM3Min,
      tYearH,
      tariffPerKwh,
      pLeakKw,
      eLeakYearKwh,
      costTotalYear,
      formulaRu: 'P_leak [кВт] = Q_leak [м³/мин] · w_spec [кВт/(м³/мин)]; E_leak [кВт·ч/год] = P_leak · t_year; Cost = E_leak · Тариф_кВт·ч',
      formulaHe: 'P_leak [kW] = Q_leak [m³/min] · w_spec [kW/(m³/min)]; E_leak [kWh/yr] = P_leak · t_year; Cost = E_leak · Tariff_kWh',
      sourceRu: '[S12, Fact Sheet 3 & 7, печ. с. 27, 48–49 / PDF с. 31, 52–53] [инженерная оценка]',
      sourceHe: '[S12, Fact Sheet 3 & 7, עמ׳ מודפס 27, 48–49 / PDF עמ׳ 31, 52–53] [הערכה הנדסית]'
    };
  }

  // ============================================================================
  // 5. МОДУЛЬ 5Б: Годовая стоимость пара для технологического аппарата
  // ============================================================================
  function calcModule5BEconomics(r5b, rawParams = {}) {
    if (!r5b || typeof r5b !== 'object') {
      throw new Error('Для расчёта экономики Модуля 5Б необходим результат calcSteamLoad.');
    }

    const currency = normalizeCurrency(rawParams.currency);
    const tYearH = parseOptionalNumber(rawParams.t_year_h, 'Часы работы аппарата в год t_year (ч/год)');
    const etaBoilerPct = parseOptionalNumber(rawParams.eta_boiler_pct, 'КПД котла η_b (%)');
    const tariffEnergyPerGJ = parseOptionalNumber(rawParams.tariff_per_gj, `Тариф на тепло/топливо (${currency}/ГДж)`);

    if (tYearH !== null) {
      validateHoursYear(tYearH);
    }
    let realismWarning = null;
    if (etaBoilerPct !== null) {
      realismWarning = validateBoilerEfficiency(etaBoilerPct);
    }

    const qLoadKw = parseRequiredNumber(r5b.qLoadKw, 'Тепловая мощность аппарата Q_load (кВт)');
    const eLoadYearKwh = tYearH !== null ? qLoadKw * tYearH : null;
    const eLoadYearGJ = eLoadYearKwh !== null ? eLoadYearKwh * 0.0036 : null;
    const eFuelYearGJ = (eLoadYearGJ !== null && etaBoilerPct !== null)
      ? eLoadYearGJ / (etaBoilerPct / 100.0)
      : null;

    if (tariffEnergyPerGJ === null) {
      return {
        module: '5B',
        hasCost: false,
        currency,
        qLoadKw,
        tYearH,
        etaBoilerPct,
        tariffEnergyPerGJ: null,
        eLoadYearKwh,
        eLoadYearGJ,
        eFuelYearGJ,
        costTotalYear: null,
        realismWarning,
        formulaRu: 'E_load [ГДж/год] = Q_load [кВт] · t_year [ч/год] · 0.0036; E_fuel [ГДж/год] = E_load / (η_b / 100); Cost = E_fuel · Тариф_ГДж',
        formulaHe: 'E_load [GJ/yr] = Q_load [kW] · t_year [h/yr] · 0.0036; E_fuel [GJ/yr] = E_load / (η_b / 100); Cost = E_load · Tariff_GJ',
        sourceRu: '[S01, PDF p. 12, 36; S21, PDF pp. 1–2; S22, PDF p. 1] [инженерная оценка]',
        sourceHe: '[S01, PDF p. 12, 36; S21, PDF pp. 1–2; S22, PDF p. 1] [הערכה הנדסית]'
      };
    }

    if (tariffEnergyPerGJ < 0) {
      throw new Error('Тариф на тепло/топливо не может быть отрицательным (должен быть ≥ 0).');
    }
    if (tYearH === null || etaBoilerPct === null) {
      throw new Error('Для расчёта годовой стоимости пара для аппарата необходимо явно ввести часы работы в год (t_year) и КПД котла (η_b). Скрытые значения по умолчанию не используются.');
    }

    const costTotalYear = eFuelYearGJ * tariffEnergyPerGJ;

    return {
      module: '5B',
      hasCost: true,
      currency,
      qLoadKw,
      tYearH,
      etaBoilerPct,
      tariffEnergyPerGJ,
      eLoadYearKwh,
      eLoadYearGJ,
      eFuelYearGJ,
      costTotalYear,
      realismWarning,
      formulaRu: 'E_load [ГДж/год] = Q_load [кВт] · t_year [ч/год] · 0.0036; E_fuel [ГДж/год] = E_load / (η_b / 100); Cost = E_fuel · Тариф_ГДж',
      formulaHe: 'E_load [GJ/yr] = Q_load [kW] · t_year [h/yr] · 0.0036; E_fuel [GJ/yr] = E_load / (η_b / 100); Cost = E_load · Tariff_GJ',
      sourceRu: '[S01, PDF p. 12, 36; S21, PDF pp. 1–2; S22, PDF p. 1] [инженерная оценка]',
      sourceHe: '[S01, PDF p. 12, 36; S21, PDF pp. 1–2; S22, PDF p. 1] [הערכה הנדסית]'
    };
  }

  return {
    SUPPORTED_CURRENCIES,
    TYPICAL_HINTS,
    normalizeCurrency,
    formatMoneyNumber,
    formatMoney,
    calcModule1AEconomics,
    calcModule1BEconomics,
    calcModule2Economics,
    calcModule3BEconomics,
    calcModule5BEconomics
  };
});
