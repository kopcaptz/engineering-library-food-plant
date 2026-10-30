// 06_web_project/data/units.js
// Dedicated Metric (SI) <-> Imperial (US) Conversion & Formatting Layer (Edition v11)
// Core principle: calculators.js remains bit-for-bit untouched and always receives/returns SI units.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.UnitConverter = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  // ===========================================================================
  // 1. EXACT CONVERSION CONSTANTS (Section 3 Reference Table)
  // ===========================================================================
  const CONSTANTS = Object.freeze({
    PSI_TO_BAR: 0.0689475729,        // 1 psi = 0.0689475729 bar
    LB_TO_KG: 0.45359237,            // 1 lb = 0.45359237 kg
    GAL_TO_L: 3.785411784,           // 1 US gal = 3.785411784 L
    FT3_TO_M3: 0.028316846592,       // 1 ft³ = 0.028316846592 m³
    BTU_LB_TO_KJ_KG: 2.326,          // 1 Btu/lb = 2.326 kJ/kg
    BTU_LBF_TO_KJ_KGK: 4.1868,       // 1 Btu/(lb·°F) = 4.1868 kJ/(kg·K)
    LB_FT3_TO_KG_M3: 16.018463,      // 1 lb/ft³ = 16.018463 kg/m³
    KW_TO_BTU_H: 3412.142,           // 1 kW = 3412.142 Btu/h
    TR_TO_KW: 3.516853,              // 1 TR = 3.516853 kW
    MMBTU_TO_GJ: 1.055056,           // 1 MMBtu = 1.055056 GJ
    IN_TO_MM: 25.4                   // 1 in = 25.4 mm
  });

  // Derived exact factors for composite flow / density units
  const GPM_TO_M3H = (CONSTANTS.GAL_TO_L * 60) / 1000;       // 1 US gpm = 0.22712470704 m³/h
  const CFM_TO_LS = (CONSTANTS.FT3_TO_M3 * 1000) / 60;       // 1 cfm = 0.4719474432 L/s
  const LB_FT3_TO_KG_L = CONSTANTS.LB_FT3_TO_KG_M3 / 1000;   // 1 lb/ft³ = 0.016018463 kg/L

  // ===========================================================================
  // 2. QUANTITY DEFINITIONS & CONVERSION FUNCTIONS
  // ===========================================================================
  const QUANTITIES = Object.freeze({
    temp: {
      nameRu: 'Температура (точка)',
      unitSi: { ru: '°C', he: '°C' },
      unitUs: { ru: '°F', he: '°F' },
      toImperial: (c) => c * 1.8 + 32,
      toSI: (f) => (f - 32) / 1.8,
      inputDecimalsSi: 1,
      inputDecimalsUs: 2,
      outDecimalsSi: 1,
      outDecimalsUs: 1
    },
    delta_temp: {
      // Trap 1: Temperature difference (ΔT, Approach, superheat, subcooling) -> ONLY * 1.8, NO +32!
      nameRu: 'Разность температур (ΔT, Approach)',
      unitSi: { ru: '°C', he: '°C' },
      unitUs: { ru: '°F', he: '°F' },
      toImperial: (dc) => dc * 1.8,
      toSI: (df) => df / 1.8,
      inputDecimalsSi: 1,
      inputDecimalsUs: 2,
      outDecimalsSi: 1,
      outDecimalsUs: 1
    },
    abs_temp: {
      nameRu: 'Абсолютная температура',
      unitSi: { ru: 'К', he: 'K' },
      unitUs: { ru: '°F', he: '°F' },
      toImperial: (k) => (k - 273.15) * 1.8 + 32,
      toSI: (f) => (f - 32) / 1.8 + 273.15,
      inputDecimalsSi: 2,
      inputDecimalsUs: 2,
      outDecimalsSi: 2,
      outDecimalsUs: 1
    },
    pressure_g: {
      // Trap 2: Gauge pressure (bar g <-> psig), never mix with absolute!
      nameRu: 'Давление избыточное',
      unitSi: { ru: 'бар изб.', he: 'barg' },
      unitUs: { ru: 'psig', he: 'psig' },
      toImperial: (barg) => barg / CONSTANTS.PSI_TO_BAR,
      toSI: (psig) => psig * CONSTANTS.PSI_TO_BAR,
      inputDecimalsSi: 2,
      inputDecimalsUs: 2,
      outDecimalsSi: 2,
      outDecimalsUs: 2
    },
    pressure_a: {
      // Trap 2: Absolute pressure (bar(a) <-> psia), never mix with gauge!
      nameRu: 'Давление абсолютное',
      unitSi: { ru: 'бар(а)', he: 'bar(a)' },
      unitUs: { ru: 'psia', he: 'psia' },
      toImperial: (bara) => bara / CONSTANTS.PSI_TO_BAR,
      toSI: (psia) => psia * CONSTANTS.PSI_TO_BAR,
      inputDecimalsSi: 3,
      inputDecimalsUs: 2,
      outDecimalsSi: 4,
      outDecimalsUs: 2
    },
    pressure_diff: {
      nameRu: 'Перепад давления, NDP, p_sat',
      unitSi: { ru: 'бар', he: 'bar' },
      unitUs: { ru: 'psi', he: 'psi' },
      toImperial: (bar) => bar / CONSTANTS.PSI_TO_BAR,
      toSI: (psi) => psi * CONSTANTS.PSI_TO_BAR,
      inputDecimalsSi: 2,
      inputDecimalsUs: 3,
      outDecimalsSi: 2,
      outDecimalsUs: 2
    },
    mass_flow: {
      nameRu: 'Массовый расход',
      unitSi: { ru: 'кг/ч', he: 'kg/h' },
      unitUs: { ru: 'lb/h', he: 'lb/h' },
      toImperial: (kgh) => kgh / CONSTANTS.LB_TO_KG,
      toSI: (lbh) => lbh * CONSTANTS.LB_TO_KG,
      inputDecimalsSi: 2,
      inputDecimalsUs: 2,
      outDecimalsSi: 2,
      outDecimalsUs: 1
    },
    water_flow_m3h: {
      nameRu: 'Расход воды (м³/ч)',
      unitSi: { ru: 'м³/ч', he: 'm³/h' },
      unitUs: { ru: 'US gpm', he: 'US gpm' },
      toImperial: (m3h) => m3h / GPM_TO_M3H,
      toSI: (gpm) => gpm * GPM_TO_M3H,
      inputDecimalsSi: 2,
      inputDecimalsUs: 2,
      outDecimalsSi: 2,
      outDecimalsUs: 2
    },
    water_flow_lmin: {
      nameRu: 'Расход воды (л/мин)',
      unitSi: { ru: 'л/мин', he: 'L/min' },
      unitUs: { ru: 'US gpm', he: 'US gpm' },
      toImperial: (lmin) => lmin / CONSTANTS.GAL_TO_L,
      toSI: (gpm) => gpm * CONSTANTS.GAL_TO_L,
      inputDecimalsSi: 2,
      inputDecimalsUs: 2,
      outDecimalsSi: 2,
      outDecimalsUs: 2
    },
    air_flow_ls: {
      nameRu: 'Расход воздуха (л/с)',
      unitSi: { ru: 'л/с', he: 'L/s' },
      unitUs: { ru: 'cfm', he: 'cfm' },
      toImperial: (ls) => ls / CFM_TO_LS,
      toSI: (cfm) => cfm * CFM_TO_LS,
      inputDecimalsSi: 2,
      inputDecimalsUs: 2,
      outDecimalsSi: 2,
      outDecimalsUs: 2
    },
    air_flow_m3min: {
      nameRu: 'Расход воздуха (м³/мин)',
      unitSi: { ru: 'м³/мин', he: 'm³/min' },
      unitUs: { ru: 'cfm', he: 'cfm' },
      toImperial: (m3min) => m3min / CONSTANTS.FT3_TO_M3,
      toSI: (cfm) => cfm * CONSTANTS.FT3_TO_M3,
      inputDecimalsSi: 2,
      inputDecimalsUs: 2,
      outDecimalsSi: 2,
      outDecimalsUs: 2
    },
    volume: {
      nameRu: 'Объём ресивера / воды',
      unitSi: { ru: 'м³', he: 'm³' },
      unitUs: { ru: 'ft³', he: 'ft³' },
      toImperial: (m3) => m3 / CONSTANTS.FT3_TO_M3,
      toSI: (ft3) => ft3 * CONSTANTS.FT3_TO_M3,
      inputDecimalsSi: 2,
      inputDecimalsUs: 2,
      outDecimalsSi: 2,
      outDecimalsUs: 2
    },
    moisture_flow_lh: {
      nameRu: 'Объёмный расход воды на выходе влаги',
      unitSi: { ru: 'л/ч', he: 'L/h' },
      unitUs: { ru: 'US gal/h', he: 'US gal/h' },
      toImperial: (lh) => lh / CONSTANTS.GAL_TO_L,
      toSI: (galh) => galh * CONSTANTS.GAL_TO_L,
      inputDecimalsSi: 2,
      inputDecimalsUs: 2,
      outDecimalsSi: 2,
      outDecimalsUs: 2
    },
    enthalpy: {
      nameRu: 'Энтальпия, скрытая теплота',
      unitSi: { ru: 'кДж/кг', he: 'kJ/kg' },
      unitUs: { ru: 'Btu/lb', he: 'Btu/lb' },
      toImperial: (kjkg) => kjkg / CONSTANTS.BTU_LB_TO_KJ_KG,
      toSI: (btulb) => btulb * CONSTANTS.BTU_LB_TO_KJ_KG,
      inputDecimalsSi: 2,
      inputDecimalsUs: 2,
      outDecimalsSi: 1,
      outDecimalsUs: 1
    },
    specific_heat: {
      nameRu: 'Теплоёмкость',
      unitSi: { ru: 'кДж/(кг·°C)', he: 'kJ/(kg·°C)' },
      unitUs: { ru: 'Btu/(lb·°F)', he: 'Btu/(lb·°F)' },
      toImperial: (kjkgk) => kjkgk / CONSTANTS.BTU_LBF_TO_KJ_KGK,
      toSI: (btulbf) => btulbf * CONSTANTS.BTU_LBF_TO_KJ_KGK,
      inputDecimalsSi: 3,
      inputDecimalsUs: 4,
      outDecimalsSi: 3,
      outDecimalsUs: 4
    },
    density_kgm3: {
      nameRu: 'Плотность (кг/м³)',
      unitSi: { ru: 'кг/м³', he: 'kg/m³' },
      unitUs: { ru: 'lb/ft³', he: 'lb/ft³' },
      toImperial: (kgm3) => kgm3 / CONSTANTS.LB_FT3_TO_KG_M3,
      toSI: (lbft3) => lbft3 * CONSTANTS.LB_FT3_TO_KG_M3,
      inputDecimalsSi: 1,
      inputDecimalsUs: 2,
      outDecimalsSi: 1,
      outDecimalsUs: 2
    },
    density_kgl: {
      nameRu: 'Плотность (кг/л)',
      unitSi: { ru: 'кг/л', he: 'kg/L' },
      unitUs: { ru: 'lb/ft³', he: 'lb/ft³' },
      toImperial: (kgl) => kgl / LB_FT3_TO_KG_L,
      toSI: (lbft3) => lbft3 * LB_FT3_TO_KG_L,
      inputDecimalsSi: 3,
      inputDecimalsUs: 2,
      outDecimalsSi: 3,
      outDecimalsUs: 2
    },
    power: {
      nameRu: 'Мощность (кВт ⇄ Btu/h)',
      unitSi: { ru: 'кВт', he: 'kW' },
      unitUs: { ru: 'Btu/h', he: 'Btu/h' },
      toImperial: (kw) => kw * CONSTANTS.KW_TO_BTU_H,
      toSI: (btuh) => btuh / CONSTANTS.KW_TO_BTU_H,
      inputDecimalsSi: 2,
      inputDecimalsUs: 1,
      outDecimalsSi: 2,
      outDecimalsUs: 0
    },
    cooling_power_tr: {
      nameRu: 'Холодопроизводительность (кВт ⇄ TR)',
      unitSi: { ru: 'кВт', he: 'kW' },
      unitUs: { ru: 'TR', he: 'TR' },
      toImperial: (kw) => kw / CONSTANTS.TR_TO_KW,
      toSI: (tr) => tr * CONSTANTS.TR_TO_KW,
      inputDecimalsSi: 2,
      inputDecimalsUs: 2,
      outDecimalsSi: 2,
      outDecimalsUs: 2
    },
    energy_gj: {
      nameRu: 'Энергия (ГДж ⇄ MMBtu)',
      unitSi: { ru: 'ГДж', he: 'GJ' },
      unitUs: { ru: 'MMBtu', he: 'MMBtu' },
      toImperial: (gj) => gj / CONSTANTS.MMBTU_TO_GJ,
      toSI: (mmbtu) => mmbtu * CONSTANTS.MMBTU_TO_GJ,
      inputDecimalsSi: 2,
      inputDecimalsUs: 3,
      outDecimalsSi: 2,
      outDecimalsUs: 2
    },
    tariff_energy: {
      // Price per GJ <-> Price per MMBtu: since 1 MMBtu = 1.055056 GJ, price/MMBtu = price/GJ * 1.055056
      nameRu: 'Тариф на тепло (валюта/ГДж ⇄ валюта/MMBtu)',
      unitSi: { ru: 'валюта/ГДж', he: 'מטבע/GJ' },
      unitUs: { ru: 'валюта/MMBtu', he: 'מטבע/MMBtu' },
      toImperial: (perGj) => perGj * CONSTANTS.MMBTU_TO_GJ,
      toSI: (perMmbtu) => perMmbtu / CONSTANTS.MMBTU_TO_GJ,
      inputDecimalsSi: 2,
      inputDecimalsUs: 2,
      outDecimalsSi: 2,
      outDecimalsUs: 2
    },
    diameter: {
      nameRu: 'Диаметр',
      unitSi: { ru: 'мм', he: 'mm' },
      unitUs: { ru: 'in', he: 'in' },
      toImperial: (mm) => mm / CONSTANTS.IN_TO_MM,
      toSI: (inch) => inch * CONSTANTS.IN_TO_MM,
      inputDecimalsSi: 1,
      inputDecimalsUs: 2,
      outDecimalsSi: 0,
      outDecimalsUs: 2
    },
    none: {
      nameRu: 'Не переводится',
      unitSi: { ru: '', he: '' },
      unitUs: { ru: '', he: '' },
      toImperial: (v) => v,
      toSI: (v) => v,
      inputDecimalsUs: null,
      outDecimalsSi: 2,
      outDecimalsUs: 2
    },
    si_only: {
      nameRu: 'Только SI',
      unitSi: { ru: 'только SI', he: 'SI בלבד' },
      unitUs: { ru: 'только SI', he: 'SI בלבד' },
      toImperial: (v) => v,
      toSI: (v) => v,
      inputDecimalsUs: null,
      outDecimalsSi: 3,
      outDecimalsUs: 3
    }
  });

  function toImperial(quantity, siVal) {
    const num = Number(siVal);
    if (!Number.isFinite(num)) return NaN;
    const q = QUANTITIES[quantity];
    if (!q) throw new Error(`Unknown quantity: ${quantity}`);
    return q.toImperial(num);
  }

  function toSI(quantity, usVal) {
    const num = Number(usVal);
    if (!Number.isFinite(num)) return NaN;
    const q = QUANTITIES[quantity];
    if (!q) throw new Error(`Unknown quantity: ${quantity}`);
    return q.toSI(num);
  }

  // ===========================================================================
  // 3. COMPLETE FIELD INVENTORY ACROSS ALL 10 MODULES
  // ===========================================================================
  const FIELD_UNIT_MAP = Object.freeze({
    // Module 1A (14 controls)
    c1a_mode:         { module: '1A', quantity: 'none',            siUnit: '—',               usUnit: 'не переводится' },
    c1a_q_l_min:      { module: '1A', quantity: 'water_flow_lmin', siUnit: 'л/мин',           usUnit: 'US gpm', decimalsUs: 2 },
    c1a_m_kg_h:       { module: '1A', quantity: 'mass_flow',       siUnit: 'кг/ч',            usUnit: 'lb/h',   decimalsUs: 1, doeBypass: true },
    c1a_ret_pct:      { module: '1A', quantity: 'none',            siUnit: '%',               usUnit: 'не переводится (%)' },
    c1a_t_cond:       { module: '1A', quantity: 'temp',            siUnit: '°C',              usUnit: '°F',     decimalsUs: 1, doeBypass: true },
    c1a_t_make:       { module: '1A', quantity: 'temp',            siUnit: '°C',              usUnit: '°F',     decimalsUs: 1, doeBypass: true },
    c1a_rho:          { module: '1A', quantity: 'density_kgl',     siUnit: 'кг/л',            usUnit: 'lb/ft³', decimalsUs: 2 },
    c1a_cp:           { module: '1A', quantity: 'specific_heat',   siUnit: 'кДж/(кг·°C)',     usUnit: 'Btu/(lb·°F)', decimalsUs: 4 },
    c1a_t_shift:      { module: '1A', quantity: 'none',            siUnit: 'ч',               usUnit: 'не переводится (ч)' },
    c1a_t_year:       { module: '1A', quantity: 'none',            siUnit: 'ч/год',           usUnit: 'не переводится (ч/год)' },
    c1a_eta:          { module: '1A', quantity: 'none',            siUnit: '%',               usUnit: 'не переводится (%)' },
    c1a_lhv:          { module: '1A', quantity: 'si_only',         siUnit: 'кВт·ч/ед.',       usUnit: 'только SI' },
    c1a_tariff_gj:    { module: '1A', quantity: 'tariff_energy',   siUnit: 'валюта/ГДж',      usUnit: 'валюта/MMBtu', decimalsUs: 2, doeBypass: true },
    c1a_tariff_water: { module: '1A', quantity: 'si_only',         siUnit: 'валюта/м³',       usUnit: 'только SI' },

    // Module 1B (10 controls)
    c1_mc:            { module: '1B', quantity: 'mass_flow',       siUnit: 'кг/ч',            usUnit: 'lb/h',   decimalsUs: 1 },
    c1_p1:            { module: '1B', quantity: 'pressure_g',      siUnit: 'бар изб.',        usUnit: 'psig',   decimalsUs: 2 },
    c1_p2:            { module: '1B', quantity: 'pressure_g',      siUnit: 'бар изб.',        usUnit: 'psig',   decimalsUs: 2 },
    c1_hf1:           { module: '1B', quantity: 'enthalpy',        siUnit: 'кДж/кг',          usUnit: 'Btu/lb', decimalsUs: 2 },
    c1_hf2:           { module: '1B', quantity: 'enthalpy',        siUnit: 'кДж/кг',          usUnit: 'Btu/lb', decimalsUs: 2 },
    c1_hfg2:          { module: '1B', quantity: 'enthalpy',        siUnit: 'кДж/кг',          usUnit: 'Btu/lb', decimalsUs: 2 },
    c1_dop:           { module: '1B', quantity: 'diameter',        siUnit: 'мм',              usUnit: 'in',     decimalsUs: 2 },
    c1b_t_year:       { module: '1B', quantity: 'none',            siUnit: 'ч/год',           usUnit: 'не переводится (ч/год)' },
    c1b_eta:          { module: '1B', quantity: 'none',            siUnit: '%',               usUnit: 'не переводится (%)' },
    c1b_tariff_gj:    { module: '1B', quantity: 'tariff_energy',   siUnit: 'валюта/ГДж',      usUnit: 'валюта/MMBtu', decimalsUs: 2 },

    // Module 2 (12 controls)
    c2_fluid:         { module: '2',  quantity: 'none',            siUnit: '—',               usUnit: 'не переводится' },
    c2_vw:            { module: '2',  quantity: 'water_flow_m3h',  siUnit: 'м³/ч',            usUnit: 'US gpm', decimalsUs: 2 },
    c2_rho:           { module: '2',  quantity: 'density_kgm3',    siUnit: 'кг/м³',           usUnit: 'lb/ft³', decimalsUs: 2 },
    c2_cp:            { module: '2',  quantity: 'specific_heat',   siUnit: 'кДж/(кг·°C)',     usUnit: 'Btu/(lb·°F)', decimalsUs: 4 },
    c2_tin:           { module: '2',  quantity: 'temp',            siUnit: '°C',              usUnit: '°F',     decimalsUs: 1 },
    c2_tout:          { module: '2',  quantity: 'temp',            siUnit: '°C',              usUnit: '°F',     decimalsUs: 1 },
    c2_pel:           { module: '2',  quantity: 'power',           siUnit: 'кВт',             usUnit: 'Btu/h',  decimalsUs: 0 },
    c2_tsat_ev:       { module: '2',  quantity: 'temp',            siUnit: '°C',              usUnit: '°F',     decimalsUs: 1 },
    c2_tcond_out:     { module: '2',  quantity: 'temp',            siUnit: '°C',              usUnit: '°F',     decimalsUs: 1 },
    c2_tsat_cd:       { module: '2',  quantity: 'temp',            siUnit: '°C',              usUnit: '°F',     decimalsUs: 1 },
    c2_t_year:        { module: '2',  quantity: 'none',            siUnit: 'ч/год',           usUnit: 'не переводится (ч/год)' },
    c2_tariff_kwh:    { module: '2',  quantity: 'none',            siUnit: 'валюта/кВт·ч',    usUnit: 'не переводится (валюта/kWh)' },

    // Module 3A (9 controls)
    c3a_q1:           { module: '3A', quantity: 'si_only',         siUnit: 'л/с (Нл/с)',      usUnit: 'только SI (разные опорные условия Нл/с и scfm)' },
    c3a_p1:           { module: '3A', quantity: 'pressure_a',      siUnit: 'бар(а)',          usUnit: 'psia',   decimalsUs: 2 },
    c3a_t1:           { module: '3A', quantity: 'temp',            siUnit: '°C',              usUnit: '°F',     decimalsUs: 1 },
    c3a_rh1:          { module: '3A', quantity: 'none',            siUnit: '%',               usUnit: 'не переводится (%)' },
    c3a_psat1:        { module: '3A', quantity: 'pressure_diff',   siUnit: 'бар',             usUnit: 'psi',    decimalsUs: 3 },
    c3a_p2:           { module: '3A', quantity: 'pressure_a',      siUnit: 'бар(а)',          usUnit: 'psia',   decimalsUs: 2 },
    c3a_t2:           { module: '3A', quantity: 'temp',            siUnit: '°C',              usUnit: '°F',     decimalsUs: 1 },
    c3a_rh2:          { module: '3A', quantity: 'none',            siUnit: '%',               usUnit: 'не переводится (%)' },
    c3a_psat2:        { module: '3A', quantity: 'pressure_diff',   siUnit: 'бар',             usUnit: 'psi',    decimalsUs: 3 },

    // Module 3B (12 controls)
    c3b_method:       { module: '3B', quantity: 'none',            siUnit: '—',               usUnit: 'не переводится' },
    c3b_vr:           { module: '3B', quantity: 'volume',          siUnit: 'м³',              usUnit: 'ft³',    decimalsUs: 2 },
    c3b_pstart:       { module: '3B', quantity: 'pressure_g',      siUnit: 'бар изб.',        usUnit: 'psig',   decimalsUs: 2 },
    c3b_pend:         { module: '3B', quantity: 'pressure_g',      siUnit: 'бар изб.',        usUnit: 'psig',   decimalsUs: 2 },
    c3b_tdecay:       { module: '3B', quantity: 'none',            siUnit: 'мин',             usUnit: 'не переводится (мин)' },
    c3b_patm:         { module: '3B', quantity: 'pressure_a',      siUnit: 'бар(а)',          usUnit: 'psia',   decimalsUs: 2 },
    c3b_tload:        { module: '3B', quantity: 'none',            siUnit: 'мин',             usUnit: 'не переводится (мин)' },
    c3b_tunload:      { module: '3B', quantity: 'none',            siUnit: 'мин',             usUnit: 'не переводится (мин)' },
    c3b_qcomp:        { module: '3B', quantity: 'air_flow_m3min',  siUnit: 'м³/мин',          usUnit: 'cfm',    decimalsUs: 2 },
    c3b_spec_power:   { module: '3B', quantity: 'si_only',         siUnit: 'кВт/(м³/мин)',    usUnit: 'только SI' },
    c3b_t_year:       { module: '3B', quantity: 'none',            siUnit: 'ч/год',           usUnit: 'не переводится (ч/год)' },
    c3b_tariff_kwh:   { module: '3B', quantity: 'none',            siUnit: 'валюта/кВт·ч',    usUnit: 'не переводится (валюта/kWh)' },

    // Module 3C (7 controls)
    c3_qc:            { module: '3C', quantity: 'si_only',         siUnit: 'л/с',             usUnit: 'только SI' },
    c3_rh:            { module: '3C', quantity: 'none',            siUnit: 'доля 0..1',       usUnit: 'не переводится (0..1)' },
    c3_rho_in:        { module: '3C', quantity: 'si_only',         siUnit: 'г/м³',            usUnit: 'только SI' },
    c3_tamb:          { module: '3C', quantity: 'si_only',         siUnit: 'К',               usUnit: 'только SI' },
    c3_pafter:        { module: '3C', quantity: 'si_only',         siUnit: 'бар(а)',          usUnit: 'только SI' },
    c3_tafter:        { module: '3C', quantity: 'si_only',         siUnit: 'К',               usUnit: 'только SI' },
    c3_rho_out:       { module: '3C', quantity: 'si_only',         siUnit: 'г/м³',            usUnit: 'только SI' },

    // Module 4A (9 controls)
    c4a_qp:           { module: '4A', quantity: 'water_flow_m3h',  siUnit: 'м³/ч',            usUnit: 'US gpm', decimalsUs: 2 },
    c4a_qc:           { module: '4A', quantity: 'water_flow_m3h',  siUnit: 'м³/ч',            usUnit: 'US gpm', decimalsUs: 2 },
    c4a_qf_meas:      { module: '4A', quantity: 'water_flow_m3h',  siUnit: 'м³/ч',            usUnit: 'US gpm', decimalsUs: 2 },
    c4a_ecf:          { module: '4A', quantity: 'none',            siUnit: 'мкСм/см',         usUnit: 'не переводится (мкСм/см)' },
    c4a_ecp:          { module: '4A', quantity: 'none',            siUnit: 'мкСм/см',         usUnit: 'не переводится (мкСм/см)' },
    c4a_ecc:          { module: '4A', quantity: 'none',            siUnit: 'мкСм/см',         usUnit: 'не переводится (мкСм/см)' },
    c4a_tdsf:         { module: '4A', quantity: 'none',            siUnit: 'мг/л',            usUnit: 'не переводится (мг/л)' },
    c4a_tdsp:         { module: '4A', quantity: 'none',            siUnit: 'мг/л',            usUnit: 'не переводится (мг/л)' },
    c4a_tdsc:         { module: '4A', quantity: 'none',            siUnit: 'мг/л',            usUnit: 'не переводится (мг/л)' },

    // Module 4B (8 controls)
    c4_qp:            { module: '4B', quantity: 'water_flow_m3h',  siUnit: 'м³/ч',            usUnit: 'US gpm', decimalsUs: 2 },
    c4_qc:            { module: '4B', quantity: 'water_flow_m3h',  siUnit: 'м³/ч',            usUnit: 'US gpm', decimalsUs: 2 },
    c4_qbase:         { module: '4B', quantity: 'water_flow_m3h',  siUnit: 'м³/ч',            usUnit: 'US gpm', decimalsUs: 2 },
    c4_ndps:          { module: '4B', quantity: 'pressure_diff',   siUnit: 'бар',             usUnit: 'psi',    decimalsUs: 2 },
    c4_ndpo:          { module: '4B', quantity: 'pressure_diff',   siUnit: 'бар',             usUnit: 'psi',    decimalsUs: 2 },
    c4_tcfs:          { module: '4B', quantity: 'none',            siUnit: 'безразмерный',    usUnit: 'не переводится' },
    c4_tcfo:          { module: '4B', quantity: 'none',            siUnit: 'безразмерный',    usUnit: 'не переводится' },
    c4_pp:            { module: '4B', quantity: 'pressure_diff',   siUnit: 'бар',             usUnit: 'psi',    decimalsUs: 2 },

    // Module 5A (4 controls — Trap 5)
    c5a_mode:         { module: '5A', quantity: 'none',            siUnit: '—',               usUnit: 'не переводится' },
    c5a_unit:         { module: '5A', quantity: 'none',            siUnit: 'bar (по умолч.)', usUnit: 'psi (по умолч.)', c5aUnitSelect: true },
    c5a_pval:         { module: '5A', quantity: 'pressure_g',      siUnit: 'бар изб. / бар(а)', usUnit: 'psig / psia',  decimalsUs: 2, c5aPressureVal: true },
    c5a_patm:         { module: '5A', quantity: 'pressure_a',      siUnit: 'бар(а)',          usUnit: 'psia',   decimalsUs: 2 },

    // Module 5B (14 controls)
    c5_load_mode:     { module: '5B', quantity: 'none',            siUnit: '—',               usUnit: 'не переводится' },
    c5_steam_preset:  { module: '5B', quantity: 'none',            siUnit: 'бар изб., °C, кДж/кг', usUnit: 'psig, °F, Btu/lb' },
    c5_qkw:           { module: '5B', quantity: 'power',           siUnit: 'кВт',             usUnit: 'Btu/h',  decimalsUs: 0 },
    c5_mp:            { module: '5B', quantity: 'mass_flow',       siUnit: 'кг/ч',            usUnit: 'lb/h',   decimalsUs: 1 },
    c5_cp:            { module: '5B', quantity: 'specific_heat',   siUnit: 'кДж/(кг·°C)',     usUnit: 'Btu/(lb·°F)', decimalsUs: 4 },
    c5_tin:           { module: '5B', quantity: 'temp',            siUnit: '°C',              usUnit: '°F',     decimalsUs: 1 },
    c5_tout:          { module: '5B', quantity: 'temp',            siUnit: '°C',              usUnit: '°F',     decimalsUs: 1 },
    c5_hg:            { module: '5B', quantity: 'enthalpy',        siUnit: 'кДж/кг',          usUnit: 'Btu/lb', decimalsUs: 2 },
    c5_hf:            { module: '5B', quantity: 'enthalpy',        siUnit: 'кДж/кг',          usUnit: 'Btu/lb', decimalsUs: 2 },
    c5_hfg:           { module: '5B', quantity: 'enthalpy',        siUnit: 'кДж/кг',          usUnit: 'Btu/lb', decimalsUs: 2 },
    c5_x:             { module: '5B', quantity: 'none',            siUnit: 'доля 0..1',       usUnit: 'не переводится (0..1)' },
    c5_sf:            { module: '5B', quantity: 'none',            siUnit: 'безразмерный',    usUnit: 'не переводится' },
    c5_tdsfw:         { module: '5B', quantity: 'none',            siUnit: 'мг/л (ppm)',      usUnit: 'не переводится (ppm)' },
    c5_tdsmax:        { module: '5B', quantity: 'none',            siUnit: 'мг/л (ppm)',      usUnit: 'не переводится (ppm)' },
    c5_t_year:        { module: '5B', quantity: 'none',            siUnit: 'ч/год',           usUnit: 'не переводится (ч/год)' },
    c5_eta:           { module: '5B', quantity: 'none',            siUnit: '%',               usUnit: 'не переводится (%)' },
    c5_tariff_gj:     { module: '5B', quantity: 'tariff_energy',   siUnit: 'валюта/ГДж',      usUnit: 'валюта/MMBtu', decimalsUs: 2 }
  });

  // ===========================================================================
  // 4. NUMBER FORMATTING & DUAL-UNIT RESULT RENDERING
  // ===========================================================================
  /**
   * Formats a number with space thousands separator for human display in output cards.
   * E.g. 1344.58 -> "1 344.6" (when decimals = 1).
   */
  function formatWithSpaces(num, decimals) {
    const n = Number(num);
    if (!Number.isFinite(n)) return '—';
    const fixed = n.toFixed(decimals);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
  }

  /**
   * Formats a number for an <input type="number"> field (no spaces!).
   */
  function formatForInput(num, decimals = 2) {
    const n = Number(num);
    if (!Number.isFinite(n)) return '';
    // Keep exact decimals (e.g. 87.02) while avoiding ugly trailing .0000 on integers when appropriate
    if (decimals === 0) return String(Math.round(n));
    return n.toFixed(decimals);
  }

  function getUnitSymbol(quantity, lang, system) {
    const q = QUANTITIES[quantity];
    if (!q) return '';
    const map = system === 'us' ? q.unitUs : q.unitSi;
    return (lang === 'he' ? map.he : map.ru) || '';
  }

  /**
   * Renders a numeric result in both unit systems:
   * - Active system is primary/bold: <strong>1 344.6 lb/h</strong>
   * - Secondary system is smaller/grey: <span class="unit-secondary">(609.9 кг/ч)</span>
   *
   * Options:
   * - siDecPrimary: decimals when SI is primary (default from QUANTITIES)
   * - siDecSecondary: decimals when SI is secondary in parentheses (defaults to siDecPrimary)
   * - usDecPrimary: decimals when US is primary (default from QUANTITIES)
   * - usDecSecondary: decimals when US is secondary in parentheses (defaults to usDecPrimary)
   * - prefix: optional string inside <strong> before the primary value (e.g. "Q_evap = ")
   * - useSpacesSi: whether to use space thousands separator on SI value (default false for <10000 to preserve existing substring checks like "609.89 кг/ч", true for US)
   */
  function formatDual(siVal, quantity, lang = 'ru', unitSystem = 'si', opts = {}) {
    const nSi = Number(siVal);
    if (!Number.isFinite(nSi)) return '';
    const q = QUANTITIES[quantity];
    if (!q || quantity === 'none' || quantity === 'si_only') {
      const dec = opts.siDecPrimary !== undefined ? opts.siDecPrimary : 2;
      const unitStr = getUnitSymbol(quantity, lang, 'si');
      return `<code dir="ltr"><strong>${nSi.toFixed(dec)}${unitStr ? ' ' + unitStr : ''}</strong></code>`;
    }

    const nUs = q.toImperial(nSi);
    const siUnit = opts.siUnitOverride || getUnitSymbol(quantity, lang, 'si');
    const usUnit = opts.usUnitOverride || getUnitSymbol(quantity, lang, 'us');

    const siDecP = opts.siDecPrimary !== undefined ? opts.siDecPrimary : q.outDecimalsSi;
    const siDecS = opts.siDecSecondary !== undefined ? opts.siDecSecondary : siDecP;
    const usDecP = opts.usDecPrimary !== undefined ? opts.usDecPrimary : q.outDecimalsUs;
    const usDecS = opts.usDecSecondary !== undefined ? opts.usDecSecondary : usDecP;

    const siStrPrimary = opts.useSpacesSi ? formatWithSpaces(nSi, siDecP) : nSi.toFixed(siDecP);
    const siStrSecondary = opts.useSpacesSi ? formatWithSpaces(nSi, siDecS) : nSi.toFixed(siDecS);
    const usStrPrimary = opts.noSpacesUs ? nUs.toFixed(usDecP) : formatWithSpaces(nUs, usDecP);
    const usStrSecondary = opts.noSpacesUs ? nUs.toFixed(usDecS) : formatWithSpaces(nUs, usDecS);

    const pfx = opts.prefix || '';
    if (unitSystem === 'us') {
      return `<code dir="ltr">${pfx}<strong>${usStrPrimary} ${usUnit}</strong> <span class="unit-secondary">(${siStrSecondary} ${siUnit})</span></code>`;
    }
    return `<code dir="ltr">${pfx}<strong>${siStrPrimary} ${siUnit}</strong> <span class="unit-secondary">(${usStrSecondary} ${usUnit})</span></code>`;
  }

  // ===========================================================================
  // 5. ERROR & WARNING THRESHOLD ANNOTATION (Section 2 Item 6)
  // ===========================================================================
  /**
   * In Imperial (US) mode, appends converted imperial thresholds in parentheses
   * next to metric thresholds inside engine error and warning messages without
   * rewriting the original text.
   * Example: "P₁ > 10 бар изб." -> "P₁ > 10 бар изб. (145.0 psig)"
   */
  function annotateErrorThresholds(msg, lang = 'ru', unitSystem = 'si') {
    if (!msg || unitSystem !== 'us') return msg;
    let out = String(msg);

    const parseNum = (s) => Number(String(s).replace(/\s+/g, '').replace(',', '.').replace('‎', ''));
    const fmtSign = (origStr, val, dec) => {
      const hasPlus = String(origStr).trim().startsWith('+');
      const s = formatWithSpaces(val, dec);
      return hasPlus && val > 0 ? `+${s}` : s;
    };

    // 1. Interval ranges: e.g. "(0; 60] °C", "[-60; +200] °C", "(-50; 373.95) °C"
    out = out.replace(/([(\[])\s*(‎?[+-]?\d+(?:[.,]\d+)?)\s*;\s*(‎?[+-]?\d+(?:[.,]\d+)?)\s*([)\]])\s*°C(?!\s*\()/g, (m, b1, v1, v2, b2) => {
      const f1 = toImperial('temp', parseNum(v1));
      const f2 = toImperial('temp', parseNum(v2));
      return `${m} (${b1}${fmtSign(v1, f1, 1)}; ${fmtSign(v2, f2, 1)}${b2} °F)`;
    });

    // Interval ranges for kg/L, kg/m³, kJ/(kg·°C), kJ/kg, bar abs
    out = out.replace(/([(\[])\s*([+-]?\d+(?:[.,]\d+)?)\s*;\s*([+-]?\d+(?:[.,]\d+)?)\s*([)\]])\s*(кг\/л|kg\/L)(?!\s*\()/g, (m, b1, v1, v2, b2) => {
      const u1 = toImperial('density_kgl', parseNum(v1));
      const u2 = toImperial('density_kgl', parseNum(v2));
      return `${m} (${b1}${u1.toFixed(1)}; ${u2.toFixed(1)}${b2} lb/ft³)`;
    });
    out = out.replace(/([(\[])\s*([+-]?\d+(?:[.,]\d+)?)\s*;\s*([+-]?\d+(?:[.,]\d+)?)\s*([)\]])\s*(кг\/м³|kg\/m³)(?!\s*\()/g, (m, b1, v1, v2, b2) => {
      const u1 = toImperial('density_kgm3', parseNum(v1));
      const u2 = toImperial('density_kgm3', parseNum(v2));
      return `${m} (${b1}${u1.toFixed(1)}; ${u2.toFixed(1)}${b2} lb/ft³)`;
    });
    out = out.replace(/([(\[])\s*([+-]?\d+(?:[.,]\d+)?)\s*;\s*([+-]?\d+(?:[.,]\d+)?)\s*([)\]])\s*(кДж\/\(кг·°C\)|kJ\/\(kg·°C\))(?!\s*\()/g, (m, b1, v1, v2, b2) => {
      const u1 = toImperial('specific_heat', parseNum(v1));
      const u2 = toImperial('specific_heat', parseNum(v2));
      return `${m} (${b1}${u1.toFixed(2)}; ${u2.toFixed(2)}${b2} Btu/(lb·°F))`;
    });
    out = out.replace(/([(\[])\s*([+-]?\d+(?:[.,]\d+)?)\s*;\s*([+-]?\d+(?:[.,]\d+)?)\s*([)\]])\s*(кДж\/кг|kJ\/kg)(?!\s*\()/g, (m, b1, v1, v2, b2) => {
      const u1 = toImperial('enthalpy', parseNum(v1));
      const u2 = toImperial('enthalpy', parseNum(v2));
      return `${m} (${b1}${formatWithSpaces(u1, 1)}; ${formatWithSpaces(u2, 1)}${b2} Btu/lb)`;
    });
    out = out.replace(/([(\[])\s*([+-]?\d+(?:[.,]\d+)?)\s*;\s*([+-]?\d+(?:[.,]\d+)?)\s*([)\]])\s*(бар абс\.|bara|bar\(a\)|бар\(а\))(?!\s*\()/g, (m, b1, v1, v2, b2) => {
      const u1 = toImperial('pressure_a', parseNum(v1));
      const u2 = toImperial('pressure_a', parseNum(v2));
      return `${m} (${b1}${u1.toFixed(1)}; ${u2.toFixed(1)}${b2} psia)`;
    });

    // 2. Single values with gauge pressure: "10 бар изб.", "0 бар изб.", "5.0 barg"
    out = out.replace(/(?<![\d.,])(‎?[+-]?\d+(?:[.,]\d+)?)\s*(бар изб\.|barg)(?!\s*\()/g, (m, numStr) => {
      const us = toImperial('pressure_g', parseNum(numStr));
      return `${m} (${fmtSign(numStr, us, 1)} psig)`;
    });

    // 3. Single values with absolute pressure: "1.0 бар(а)", "1.0 bar(a)", "0 бар абс.", "0 bara"
    out = out.replace(/(?<![\d.,])(‎?[+-]?\d+(?:[.,]\d+)?)\s*(бар\s*абс\.|бар\(а\)|bar\(a\)|bara)(?!\s*\()/g, (m, numStr) => {
      const us = toImperial('pressure_a', parseNum(numStr));
      return `${m} (${fmtSign(numStr, us, 1)} psia)`;
    });

    // 4. Single values with bar difference / bar (not followed by изб/абс/(а)/(a) or "(≈" or "(5 psi")
    out = out.replace(/(?<![\d.,])(‎?[+-]?\d+(?:[.,]\d+)?)\s*(бар|bar)(?![а-яa-z(]|\s*(?:изб|абс|\(а\)|\(a\)|\/|\())/gi, (m, numStr) => {
      const us = toImperial('pressure_diff', parseNum(numStr));
      return `${m} (${fmtSign(numStr, us, 2)} psi)`;
    });

    // 5. Single temperature points in °C (avoiding ~5.6 °C / ≈ 5.6 °C if ΔT, or if followed by "(" or "/")
    out = out.replace(/(?<![~≈]\s*[+-−]?)(?<![\d.,])(‎?[+-]?\d+(?:[.,]\d+)?)\s*°C(?!\s*[\(\/])/g, (m, numStr) => {
      const us = toImperial('temp', parseNum(numStr));
      return `${m} (${fmtSign(numStr, us, 1)} °F)`;
    });

    // 6. Single absolute temperature in K ("150 К", "150 K")
    out = out.replace(/(?<![\d.,])(‎?[+-]?\d+(?:[.,]\d+)?)\s*(?:К|K)(?![a-zA-Zа-яА-Я]|\s*\()/g, (m, numStr) => {
      const us = toImperial('abs_temp', parseNum(numStr));
      return `${m} (${fmtSign(numStr, us, 1)} °F)`;
    });

    // 7. Mass flow: "1500 кг/ч", "10 000 кг/ч", "10,000 kg/h", "0 кг/ч"
    out = out.replace(/(?<![\d.,])(\d+(?:[\s,]\d{3})*(?:[.,]\d+)?)\s*(кг\/ч|kg\/h)(?!\s*\()/g, (m, numStr) => {
      const cleaned = numStr.replace(/[\s,]/g, '');
      const us = toImperial('mass_flow', Number(cleaned));
      return `${m} (${formatWithSpaces(us, 1)} lb/h)`;
    });

    // 8. Water flow m³/h and L/min
    out = out.replace(/(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(м³\/ч|m³\/h)(?!\s*\()/g, (m, numStr) => {
      const us = toImperial('water_flow_m3h', parseNum(numStr));
      return `${m} (${formatWithSpaces(us, 2)} US gpm)`;
    });
    out = out.replace(/(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(л\/мин|L\/min)(?!\s*\()/g, (m, numStr) => {
      const us = toImperial('water_flow_lmin', parseNum(numStr));
      return `${m} (${formatWithSpaces(us, 2)} US gpm)`;
    });

    // 9. Air flow L/s and m³/min
    out = out.replace(/(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(л\/с|L\/s)(?!\s*\()/g, (m, numStr) => {
      const us = toImperial('air_flow_ls', parseNum(numStr));
      return `${m} (${formatWithSpaces(us, 2)} cfm)`;
    });
    out = out.replace(/(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(м³\/мин|m³\/min)(?!\s*\()/g, (m, numStr) => {
      const us = toImperial('air_flow_m3min', parseNum(numStr));
      return `${m} (${formatWithSpaces(us, 2)} cfm)`;
    });

    // 10. Receiver volume m³ (not followed by /ч, /мин, /год)
    out = out.replace(/(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(м³|m³)(?!\/|\s*\()/g, (m, numStr) => {
      const us = toImperial('volume', parseNum(numStr));
      return `${m} (${formatWithSpaces(us, 2)} ft³)`;
    });

    // 11. Enthalpy kJ/kg
    out = out.replace(/(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(кДж\/кг|kJ\/kg)(?!\s*\()/g, (m, numStr) => {
      const us = toImperial('enthalpy', parseNum(numStr));
      return `${m} (${formatWithSpaces(us, 1)} Btu/lb)`;
    });

    // 12. Specific heat kJ/(kg·°C)
    out = out.replace(/(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(кДж\/\(кг·°C\)|kJ\/\(kg·°C\))(?!\s*\()/g, (m, numStr) => {
      const us = toImperial('specific_heat', parseNum(numStr));
      return `${m} (${us.toFixed(2)} Btu/(lb·°F))`;
    });

    // 13. Density kg/m³ and kg/L
    out = out.replace(/(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(кг\/м³|kg\/m³)(?!\s*\()/g, (m, numStr) => {
      const us = toImperial('density_kgm3', parseNum(numStr));
      return `${m} (${us.toFixed(2)} lb/ft³)`;
    });
    out = out.replace(/(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(кг\/л|kg\/L)(?!\s*\()/g, (m, numStr) => {
      const us = toImperial('density_kgl', parseNum(numStr));
      return `${m} (${us.toFixed(2)} lb/ft³)`;
    });

    // 14. Power kW (not followed by ·ч or /TR or h)
    out = out.replace(/(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(кВт|kW)(?![·\/hч]|\s*\()/g, (m, numStr) => {
      const us = toImperial('power', parseNum(numStr));
      return `${m} (${formatWithSpaces(us, 0)} Btu/h)`;
    });

    // 15. Diameter mm
    out = out.replace(/(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(мм|mm)(?!\s*\()/g, (m, numStr) => {
      const us = toImperial('diameter', parseNum(numStr));
      return `${m} (${us.toFixed(2)} in)`;
    });

    return out;
  }

  // ===========================================================================
  // 6. FORM LABEL UNIT TRANSFORMATION (SI <-> US, RU & HE, $ <-> ₪)
  // ===========================================================================
  function transformLabelTextForUnits(selector, baseLabelText, lang = 'ru', unitSystem = 'si', c1aMode = 'direct_l_min', currency = '$') {
    if (!baseLabelText) return baseLabelText;
    const isHe = lang === 'he';
    const currSym = currency === '₪' ? '₪' : '$';
    const applyCurr = (s) => String(s).replace(/валюта/g, currSym).replace(/מטבע/g, currSym);

    // Trap 3 & SI-only badges (always visible in both SI and US modes for clarity, or explicitly marked)
    const siOnlySelectors = {
      'label[for="c3a_q1"]': isHe
        ? 'ספיקה נפחית התחלתית Q₁ (NL/s — SI בלבד) *'
        : 'Исходный объёмный расход Q₁ (Нл/с — только SI) *',
      'label[for="c3b_spec_power"]': isHe
        ? 'הספק סגולי של המדחס w_spec (kW/(m³/min) — SI בלבד) [אופציונלי]'
        : 'Удельная мощность компрессора w_spec (кВт/(м³/мин) — только SI) [Опц.]',
      'label[for="c3_qc"]': isHe
        ? 'ספיקת מדחס ביניקה FAD q_c (L/s — SI בלבד — לפי טבלת S13) *'
        : 'Подача компрессора FAD q_c (л/с — только SI — по таблице S13) *',
      'label[for="c3_rho_in"]': isHe
        ? 'צפיפות אדים רוויים ביניקה (g/m³ — SI בלבד — לפי טבלת S13) *'
        : 'Плотность насыщ. пара на всасе (г/м³ — только SI — по таблице S13) *',
      'label[for="c3_tamb"]': isHe
        ? 'טמפרטורת יניקה מוחלטת T_amb (K — SI בלבד — לפי טבלת S13) *'
        : 'Абсолютная температура всаса T_amb (К — только SI — по таблице S13) *',
      'label[for="c3_pafter"]': isHe
        ? 'לחץ דחיסה מוחלט p_after (bar(a) — SI בלבד — לפי טבלת S13) *'
        : 'Абсолютное давление сжатия p_after (бар(а) — только SI — по таблице S13) *',
      'label[for="c3_tafter"]': isHe
        ? 'טמפרטורה מוחלטת אחרי ייבוש / מצנן (K — SI בלבד — לפי טבלת S13) *'
        : 'Абсолютная температура после осушки / охладителя (К — только SI — по таблице S13) *',
      'label[for="c3_rho_out"]': isHe
        ? 'צפיפות אדים רוויים בטמפרטורה T_after (g/m³ — SI בלבד — לפי טבלת S13) *'
        : 'Плотность насыщ. пара при T_after (г/м³ — только SI — по таблице S13) *',
      'label[for="c1a_lhv"]': isHe
        ? 'ערך קלורי תחתון של דלק LHV (kWh/יח\' — SI בלבד) [אופציונלי]'
        : 'Теплотворная способность топлива LHV (кВт·ч/ед. — только SI) [Опц.]',
      'label[for="c1a_tariff_water"]': isHe
        ? `תעריף מים וטיפול כימי (${currSym} ל-m³ — SI בלבד) [אופציונלי]`
        : `Тариф на воду и химводоподготовку (${currSym}/м³ — только SI) [Опц.]`
    };
    if (siOnlySelectors[selector]) {
      return siOnlySelectors[selector];
    }

    // Trap 4: Module 1A in doe_s21_imperial mode always shows its native DOE imperial units and $ currency
    if (c1aMode === 'doe_s21_imperial') {
      if (selector === 'label[for="c1a_m_kg_h"]') {
        return isHe ? 'ספיקת מסה של עיבוי מוחזר (lb/hr) *' : 'Массовый расход конденсата (lb/hr) *';
      }
      if (selector === 'label[for="c1a_t_cond"]') {
        return isHe ? 'אנתלפיית עיבוי h_cond (Btu/lb) *' : 'Энтальпия конденсата h_cond (Btu/lb) *';
      }
      if (selector === 'label[for="c1a_t_make"]') {
        return isHe ? 'אנתלפיית מי הזנה h_fw (Btu/lb) *' : 'Энтальпия подпиточной воды h_fw (Btu/lb) *';
      }
      if (selector === 'label[for="c1a_tariff_gj"]') {
        return isHe ? 'תעריף חום / דלק ($/MMBtu) [אופציונלי]' : 'Тариф на тепло / топливо ($/MMBtu) [Опц.]';
      }
    }

    if (unitSystem !== 'us') {
      return applyCurr(baseLabelText);
    }

    // In US mode (and c1aMode !== 'doe_s21_imperial'), replace metric unit suffixes in labels with Imperial units
    const usOverrides = {
      'label[for="c1a_m_kg_h"]': isHe
        ? 'ספיקת מסה של עיבוי / קיטור (lb/h)'
        : 'Массовый расход конденсата / пара (lb/h)',
      'label[for="c1a_t_cond"]': isHe
        ? 'טמפרטורת עיבוי T_cond (°F) *'
        : 'Температура конденсата T_cond (°F) *',
      'label[for="c1a_t_make"]': isHe
        ? 'טמפרטורת מי הזנה T_makeup (°F) *'
        : 'Температура подпиточной воды T_makeup (°F) *',
      'label[for="c1a_tariff_gj"]': isHe
        ? `תעריף חום / דלק (${currSym} ל-MMBtu) [אופציונלי]`
        : `Тариф на тепло / топливо (${currSym} за MMBtu) [Опц.]`,
      'label[for="c1b_tariff_gj"]': isHe
        ? `תעריף חום / דלק (${currSym} ל-MMBtu) [אופציונלי]`
        : `Тариф на тепло / топливо (${currSym} за MMBtu) [Опц.]`,
      'label[for="c5_tariff_gj"]': isHe
        ? `תעריף חום / דלק (${currSym} ל-MMBtu) [אופציונלי]`
        : `Тариф на тепло / топливо (${currSym} за MMBtu) [Опц.]`,
      'label[for="c3b_tdecay"]': isHe
        ? 'זמן נפילת לחץ t (דקות) ו-P_atm (psia) [שיטה 1]'
        : 'Время спада t (мин) и P_atm (psia) [Метод 1]',
      'label[for="c5a_patm"]': isHe
        ? 'לחץ אטמוספרי P_atm (psia) *'
        : 'Атмосферное давление P_atm (psia) *',
      'label[for="c5_mp"]': isHe
        ? 'ספיקת מוצר m_p (lb/h) וקיבול חום c_p (Btu/(lb·°F)) [מצב חימום]'
        : 'Расход продукта m_p (lb/h) и c_p (Btu/(lb·°F)) [Режим нагрева]',
      '#c1a_mode option[value="direct_l_min"]': isHe
        ? 'ספיקת עיבוי ישירה ב-US gpm (דוגמת בקרה 1.59 US gpm = 6 L/min)'
        : 'Прямой расход конденсата в US gpm (Контрольный пример 1.59 US gpm = 6 л/мин)',
      '#c1a_mode option[value="direct_kg_h"]': isHe
        ? 'ספיקת מסה ישירה של עיבוי ב-lb/h'
        : 'Прямой массовый расход конденсата в lb/h',
      '#c1a_mode option[value="steam_return_pct"]': isHe
        ? 'לפי ספיקת קיטור (lb/h) ואחוז החזרת עיבוי (%)'
        : 'По расходу пара (lb/h) и доле возврата конденсата (%)',
      '#c5_load_mode option[value="direct_kw"]': isHe
        ? 'הזנה ישירה של הספק תרמי Q_load (Btu/h) — מבחן 5.2א (1,194,250 Btu/h = 350 kW)'
        : 'Прямой ввод тепловой мощности Q_load (Btu/h) — Тест 5.2А (1 194 250 Btu/h = 350 кВт)',
      'label[for="c5_steam_preset"]': isHe
        ? 'בחירת נקודת קיטור רווי מאומתת (0…174 psig / 0…12 barg, מתוך 11 נקודות CoolProp)'
        : 'Выбор проверенной точки насыщенного пара (0…174 psig / 0…12 бар изб., 11 точек)'
    };
    if (usOverrides[selector]) {
      return usOverrides[selector];
    }

    let txt = applyCurr(baseLabelText);
    txt = txt
      .replace(/\(л\/мин\)|\(L\/min\)/g, '(US gpm)')
      .replace(/\(м³\/ч\)|\(м³\/h\)|\(m³\/h\)/g, '(US gpm)')
      .replace(/\(кг\/ч\)|\(kg\/h\)/g, '(lb/h)')
      .replace(/\(бар изб\.\)|\(barg\)/g, '(psig)')
      .replace(/\(бар\(а\)\)|\(bar\(a\)\)/g, '(psia)')
      .replace(/\(бар\)|\(bar\)/g, '(psi)')
      .replace(/\(°C\)/g, '(°F)')
      .replace(/\(К\)|\(K\)/g, '(°F)')
      .replace(/\(кДж\/кг\)|\(kJ\/kg\)/g, '(Btu/lb)')
      .replace(/\(кДж\/\(кг·°C\)\)|\(kJ\/\(kg·°C\)\)|\(кДж\/\(кг·К\)\)|\(kJ\/\(kg·K\)\)/g, '(Btu/(lb·°F))')
      .replace(/\(кг\/м³\)|\(kg\/m³\)/g, '(lb/ft³)')
      .replace(/\(кг\/л\)|\(kg\/L\)/g, '(lb/ft³)')
      .replace(/\(кВт\)|\(kW\)/g, '(Btu/h)')
      .replace(/\(м³\)|\(m³\)/g, '(ft³)')
      .replace(/\(л\/с\)|\(L\/s\)/g, '(cfm)')
      .replace(/\(м³\/мин\)|\(m³\/min\)/g, '(cfm)')
      .replace(/\(мм\)|\(mm\)/g, '(in)');

    return txt;
  }

  return {
    CONSTANTS,
    QUANTITIES,
    FIELD_UNIT_MAP,
    toImperial,
    toSI,
    formatWithSpaces,
    formatForInput,
    getUnitSymbol,
    formatDual,
    annotateErrorThresholds,
    transformLabelTextForUnits
  };
});
