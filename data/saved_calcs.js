// 06_web_project/data/saved_calcs.js
// Поручение v12 — Этап 5: Сохранение и сравнение расчётов (#sec-saved)
// Все входные данные и численные результаты сохраняются строго в метрических единицах СИ (inputsSi, resultsSi).
// При открытии и сравнении значения отображаются в текущих выбранных единицах (SI или US).

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    root.SavedCalculations = factory(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const STORAGE_KEY_SAVED_CALCS = 'eng_lib_v12_saved_calcs_v1';
  const SAVED_CALC_FORMAT_VERSION = 'v12.0';
  const MAX_SAVED_CALCS = 200;

  // Описание всех 10 модулей: входы, вкладка, функция запуска и выходные величины для таблицы сравнения
  const MODULE_DEFS = {
    '1A': {
      panelId: 'calc-panel-1',
      anchorId: 'calc-1a',
      runFnName: 'runCalc1A',
      title: { ru: 'Модуль 1А: Возврат и потери конденсата', he: 'מודול 1א: החזרה והפסדי קונדנסט' },
      inputs: [
        { id: 'c1a_mode', isSelect: true, quantity: 'none', label: { ru: 'Режим расчёта', he: 'מצב חישוב' } },
        { id: 'c1a_q_l_min', quantity: 'water_flow_lmin', decSi: 2, decUs: 2, label: { ru: 'Потери q_л/мин', he: 'הפסדים q_L/min' } },
        { id: 'c1a_m_kg_h', quantity: 'mass_flow', decSi: 2, decUs: 1, label: { ru: 'Массовый расход m', he: 'ספיקה מסתית m' } },
        { id: 'c1a_ret_pct', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'Возврат конденсата (%)', he: 'אחוז השבת קונדנסט (%)' } },
        { id: 'c1a_t_cond', quantity: 'temp', decSi: 1, decUs: 1, label: { ru: 'T конденсата / h_cond', he: 'T קונדנסט / h_cond' } },
        { id: 'c1a_t_make', quantity: 'temp', decSi: 1, decUs: 1, label: { ru: 'T подпитки / h_fw', he: 'T מי תוספת / h_fw' } },
        { id: 'c1a_rho', quantity: 'density_kgl', decSi: 3, decUs: 2, label: { ru: 'Плотность воды ρ', he: 'צפיפות מים ρ' } },
        { id: 'c1a_cp', quantity: 'specific_heat', decSi: 3, decUs: 3, label: { ru: 'Теплоёмкость c_p', he: 'קיבול חום c_p' } },
        { id: 'c1a_t_shift', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'Длительность смены (ч)', he: 'משך משמרת (שעות)' } },
        { id: 'c1a_t_year', quantity: 'none', decSi: 0, decUs: 0, label: { ru: 'Часы в год (ч/год)', he: 'שעות בשנה (שעות/שנה)' } },
        { id: 'c1a_eta', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'КПД котла η_b (%)', he: 'נצילות דוד η_b (%)' } },
        { id: 'c1a_lhv', quantity: 'none', decSi: 2, decUs: 2, label: { ru: 'НТС топлива LHV', he: 'ערך קלורי תחתון LHV' } },
        { id: 'c1a_tariff_gj', quantity: 'tariff_energy', decSi: 2, decUs: 2, label: { ru: 'Тариф на тепло', he: 'תעריף חום/דלק' } },
        { id: 'c1a_tariff_water', quantity: 'none', decSi: 2, decUs: 2, label: { ru: 'Тариф на воду', he: 'תעריף מים' } }
      ],
      outputs: [
        { key: 'mTargetKgH', legacyKey: 'mLossKgH', quantity: 'mass_flow', decSi: 2, decUs: 1, label: { ru: 'Массовый поток потерь конденсата m_target', he: 'ספיקת מסה של הפסדי קונדנסט m_target' } },
        { key: 'vTargetM3H', legacyKey: 'vLossM3H', quantity: 'water_flow_m3h', decSi: 3, decUs: 2, label: { ru: 'Объёмный поток потерь воды V_target', he: 'ספיקת נפח של הפסדי מים V_target' } },
        { key: 'qThermalKw', legacyKey: 'qLossKw', quantity: 'power', decSi: 2, decUs: 0, label: { ru: 'Тепловая мощность потерь Q_therm', he: 'הספק תרמי של הפסדים Q_therm' } },
        { key: 'vShiftM3', quantity: 'volume', decSi: 2, decUs: 1, label: { ru: 'Потери воды за смену V_shift', he: 'אובדן מים למשמרת V_shift' } },
        { key: 'eShiftKwh', quantity: 'energy_kwh', decSi: 2, decUs: 1, label: { ru: 'Потери тепла за смену E_shift', he: 'אובדן חום למשמרת E_shift' } },
        { key: 'mReturnKgH', quantity: 'mass_flow', decSi: 2, decUs: 1, label: { ru: 'Массовый поток возврата m_ret', he: 'ספיקת מסה מוחזרת m_ret' } },
        { key: 'vReturnM3H', quantity: 'water_flow_m3h', decSi: 3, decUs: 2, label: { ru: 'Объёмный поток возврата V_ret', he: 'ספיקה נפחית מוחזרת V_ret' } },
        { key: 'vYearM3', quantity: 'volume', decSi: 1, decUs: 0, label: { ru: 'Потери воды за год V_year', he: 'הפסדי מים בשנה V_year' } },
        { key: 'eYearGJ', quantity: 'energy_gj', decSi: 2, decUs: 2, label: { ru: 'Потери тепла конденсата за год E_year', he: 'אובדן חום עיבוי בשנה E_year' } },
        { key: 'eFuelYearGJ', quantity: 'energy_gj', decSi: 2, decUs: 2, label: { ru: 'Эквивалент топлива котла за год E_fuel', he: 'שווה-ערך דלק בדוד בשנה E_fuel' } },
        { key: 'costTotalYear', quantity: 'money', decSi: 2, decUs: 2, label: { ru: 'Итоговая стоимость потерь за год', he: 'עלות שנתית כוללת של הפסדים' } }
      ]
    },
    '1B': {
      panelId: 'calc-panel-1',
      anchorId: 'calc-1b',
      runFnName: 'runCalc1B',
      title: { ru: 'Модуль 1Б: Вторичный пар (Flash Steam) и ресивер TLV', he: 'מודול 1ב: קיטור משני (Flash Steam) ומכל TLV' },
      inputs: [
        { id: 'c1_mc', quantity: 'mass_flow', decSi: 1, decUs: 1, label: { ru: 'Расход конденсата m_c', he: 'ספיקת קונדנסט m_c' } },
        { id: 'c1_p1', quantity: 'pressure_g', decSi: 2, decUs: 2, label: { ru: 'Давление P₁ до КО', he: 'לחץ P₁ לפני המלכודת' } },
        { id: 'c1_p2', quantity: 'pressure_g', decSi: 2, decUs: 2, label: { ru: 'Давление P₂ в ресивере', he: 'לחץ P₂ במכל האיסוף' } },
        { id: 'c1_hf1', quantity: 'enthalpy', decSi: 1, decUs: 1, label: { ru: 'Энтальпия жидкости h_f(P₁)', he: 'אנתלפיית נוזל h_f(P₁)' } },
        { id: 'c1_hf2', quantity: 'enthalpy', decSi: 1, decUs: 1, label: { ru: 'Энтальпия жидкости h_f(P₂)', he: 'אנתלפיית נוזל h_f(P₂)' } },
        { id: 'c1_hfg2', quantity: 'enthalpy', decSi: 1, decUs: 1, label: { ru: 'Скрытая теплота h_fg(P₂)', he: 'חום כמוס h_fg(P₂)' } },
        { id: 'c1_dop', quantity: 'diameter', decSi: 1, decUs: 2, label: { ru: 'Диаметр коллектора D_op', he: 'קוטר קו הכניסה D_op' } },
        { id: 'c1b_t_year', quantity: 'none', decSi: 0, decUs: 0, label: { ru: 'Часы работы в год (ч/год)', he: 'שעות עבודה בשנה (שעות/שנה)' } },
        { id: 'c1b_eta', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'КПД котла η_b (%)', he: 'נצילות דוד η_b (%)' } },
        { id: 'c1b_tariff_gj', quantity: 'tariff_energy', decSi: 2, decUs: 2, label: { ru: 'Тариф на тепло', he: 'תעריף חום/דלק' } }
      ],
      outputs: [
        { key: 'xFlashPct', quantity: 'none', decSi: 2, decUs: 2, unitSuffix: '%', label: { ru: 'Доля вторичного пара x_flash (%)', he: 'אחוז קיטור משני x_flash (%)' } },
        { key: 'mFlashKgH', quantity: 'mass_flow', decSi: 2, decUs: 1, label: { ru: 'Массовый выход вторичного пара m_flash', he: 'ספיקת קיטור משני m_flash' } },
        { key: 'dReceiverMm', quantity: 'diameter', decSi: 0, decUs: 2, label: { ru: 'Диаметр ресивера TLV D_cr', he: 'קוטר מכל איסוף TLV D_cr' } },
        { key: 'ventLineMm', legacyKey: 'dVentMm', quantity: 'diameter', decSi: 0, decUs: 2, label: { ru: 'Диаметр выхлопной трубы D_vp', he: 'קוטר צינור פליטה D_vp' } },
        { key: 'qFlashKw', quantity: 'power', decSi: 2, decUs: 0, label: { ru: 'Тепловая мощность вторичного пара Q_flash', he: 'הספק תרמי של קיטור משני Q_flash' } },
        { key: 'costTotalYear', quantity: 'money', decSi: 2, decUs: 2, label: { ru: 'Годовая стоимость уносимого вторичного пара', he: 'עלות שנתית של קיטור משני הנפלט' } }
      ]
    },
    '2': {
      panelId: 'calc-panel-2',
      anchorId: 'calc-2',
      runFnName: 'runCalc2',
      title: { ru: 'Модуль 2: Чиллеры (холодопроизводительность, Approach, COP)', he: 'מודול 2: צ\'ילרים (תפוקת קירור, Approach, COP)' },
      inputs: [
        { id: 'c2_fluid', isSelect: true, quantity: 'none', label: { ru: 'Тип хладоносителя', he: 'סוג נוזל קירור' } },
        { id: 'c2_vw', quantity: 'water_flow_m3h', decSi: 2, decUs: 1, label: { ru: 'Объёмный расход V_w', he: 'ספיקה נפחית V_w' } },
        { id: 'c2_rho', quantity: 'density_kgm3', decSi: 1, decUs: 2, label: { ru: 'Плотность ρ', he: 'צפיפות ρ' } },
        { id: 'c2_cp', quantity: 'specific_heat', decSi: 3, decUs: 3, label: { ru: 'Теплоёмкость c_p', he: 'קיבול חום c_p' } },
        { id: 'c2_tin', quantity: 'temp', decSi: 2, decUs: 1, label: { ru: 'Температура входа T_evap,in', he: 'טמפרטורת כניסה T_evap,in' } },
        { id: 'c2_tout', quantity: 'temp', decSi: 2, decUs: 1, label: { ru: 'Температура выхода T_evap,out', he: 'טמפרטורת יציאה T_evap,out' } },
        { id: 'c2_pel', quantity: 'power', decSi: 2, decUs: 0, label: { ru: 'Электрическая мощность P_el', he: 'הספק חשמלי P_el' } },
        { id: 'c2_tsat_ev', quantity: 'temp', decSi: 2, decUs: 1, label: { ru: 'T кипения хладагента T_sat,evap', he: 'T רתיחה במאייד T_sat,evap' } },
        { id: 'c2_tcond_out', quantity: 'temp', decSi: 2, decUs: 1, label: { ru: 'T воды из конденсатора T_cond,out', he: 'T מים ביציאת מעבה T_cond,out' } },
        { id: 'c2_tsat_cd', quantity: 'temp', decSi: 2, decUs: 1, label: { ru: 'T конденсации T_sat,cond', he: 'T עיבוי במעבה T_sat,cond' } },
        { id: 'c2_t_year', quantity: 'none', decSi: 0, decUs: 0, label: { ru: 'Часы работы в год (ч/год)', he: 'שעות עבודה בשנה (שעות/שנה)' } },
        { id: 'c2_tariff_kwh', quantity: 'none', decSi: 3, decUs: 3, label: { ru: 'Тариф на электроэнергию', he: 'תעריף חשמל' } }
      ],
      outputs: [
        { key: 'qEvapKw', quantity: 'power', decSi: 2, decUs: 0, label: { ru: 'Холодопроизводительность Q_evap', he: 'תפוקת קירור Q_evap' } },
        { key: 'qEvapTr', quantity: 'none', decSi: 2, decUs: 2, unitSuffix: ' TR', label: { ru: 'Холодопроизводительность (TR)', he: 'תפוקת קירור (TR)' } },
        { key: 'dTevapC', legacyKey: 'dtEvapC', quantity: 'delta_temp', decSi: 2, decUs: 2, label: { ru: 'Перепад температур ΔT_evap', he: 'מפל טמפרטורות ΔT_evap' } },
        { key: 'cop', quantity: 'none', decSi: 2, decUs: 2, label: { ru: 'Холодильный коэффициент COP', he: 'מקדם יעילות COP' } },
        { key: 'kwPerTr', quantity: 'none', decSi: 3, decUs: 3, unitSuffix: ' kW/TR', label: { ru: 'Удельная мощность кВт/TR', he: 'הספק סגולי kW/TR' } },
        { key: 'appEvapC', quantity: 'delta_temp', decSi: 2, decUs: 2, label: { ru: 'Approach испарителя ΔT_app,evap', he: 'הפרש גישה במאייד ΔT_app,evap' } },
        { key: 'appCondC', quantity: 'delta_temp', decSi: 2, decUs: 2, label: { ru: 'Approach конденсатора ΔT_app,cond', he: 'הפרש גישה במעבה ΔT_app,cond' } },
        { key: 'costTotalYear', quantity: 'money', decSi: 2, decUs: 2, label: { ru: 'Годовая стоимость электроэнергии', he: 'עלות חשמל שנתית' } }
      ]
    },
    '3A': {
      panelId: 'calc-panel-3',
      anchorId: 'calc-3a',
      runFnName: 'runCalc3A',
      title: { ru: 'Модуль 3А: Пересчёт расхода воздуха (FAD ⇄ Нл/с)', he: 'מודול 3א: המרת ספיקת אוויר (FAD ⇄ NL/s)' },
      inputs: [
        { id: 'c3a_q1', quantity: 'air_flow_ls', decSi: 2, decUs: 2, label: { ru: 'Исходный расход Q₁', he: 'ספיקה התחלתית Q₁' } },
        { id: 'c3a_p1', quantity: 'pressure_a', decSi: 4, decUs: 2, label: { ru: 'Давление P₁', he: 'לחץ P₁' } },
        { id: 'c3a_t1', quantity: 'temp', decSi: 1, decUs: 1, label: { ru: 'Температура T₁', he: 'טמפרטורה T₁' } },
        { id: 'c3a_rh1', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'Влажность φ₁ (%)', he: 'לחות יחסית φ₁ (%)' } },
        { id: 'c3a_psat1', quantity: 'pressure_a', decSi: 5, decUs: 3, label: { ru: 'Давление пара p_sat1', he: 'לחץ אדים p_sat1' } },
        { id: 'c3a_p2', quantity: 'pressure_a', decSi: 4, decUs: 2, label: { ru: 'Давление всаса P₂', he: 'לחץ יניקה P₂' } },
        { id: 'c3a_t2', quantity: 'temp', decSi: 1, decUs: 1, label: { ru: 'Температура всаса T₂', he: 'טמפרטורת יניקה T₂' } },
        { id: 'c3a_rh2', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'Влажность всаса φ₂ (%)', he: 'לחות ביניקה φ₂ (%)' } },
        { id: 'c3a_psat2', quantity: 'pressure_a', decSi: 5, decUs: 3, label: { ru: 'Давление пара p_sat2', he: 'לחץ אדים p_sat2' } }
      ],
      outputs: [
        { key: 'q2LS', legacyKey: 'q2', quantity: 'air_flow_ls', decSi: 2, decUs: 2, label: { ru: 'Приведённый расход Q₂ (FAD)', he: 'ספיקה מומרת Q₂ (FAD)' } },
        { key: 'q2M3Min', quantity: 'air_flow_m3min', decSi: 3, decUs: 2, label: { ru: 'Приведённый расход Q₂ (м³/мин)', he: 'ספיקה מומרת Q₂ (m³/min)' } },
        { key: 'q2M3H', quantity: 'water_flow_m3h', decSi: 2, decUs: 1, label: { ru: 'Приведённый расход Q₂ (м³/ч)', he: 'ספיקה מומרת Q₂ (m³/h)' } }
      ]
    },
    '3B': {
      panelId: 'calc-panel-3',
      anchorId: 'calc-3b',
      runFnName: 'runCalc3B',
      title: { ru: 'Модуль 3Б: Оценка утечек сжатого воздуха', he: 'מודול 3ב: הערכת דליפות אוויר דחוס' },
      inputs: [
        { id: 'c3b_method', isSelect: true, quantity: 'none', label: { ru: 'Метод замера утечек', he: 'שיטת מדידת דליפות' } },
        { id: 'c3b_vr', quantity: 'volume', decSi: 2, decUs: 1, label: { ru: 'Объём сети V_r', he: 'נפח הרשת V_r' } },
        { id: 'c3b_pstart', quantity: 'pressure_g', decSi: 2, decUs: 2, label: { ru: 'Начальное давление P₁', he: 'לחץ התחלתי P₁' } },
        { id: 'c3b_pend', quantity: 'pressure_g', decSi: 2, decUs: 2, label: { ru: 'Конечное давление P₂', he: 'לחץ סופי P₂' } },
        { id: 'c3b_tdecay', quantity: 'none', decSi: 2, decUs: 2, label: { ru: 'Время спада t (мин)', he: 'זמן דעיכה t (דקות)' } },
        { id: 'c3b_patm', quantity: 'pressure_a', decSi: 4, decUs: 2, label: { ru: 'Атмосферное давление P_atm', he: 'לחץ אטמוספרי P_atm' } },
        { id: 'c3b_tload', quantity: 'none', decSi: 2, decUs: 2, label: { ru: 'Время нагрузки t_load (мин)', he: 'זמן העמסה t_load (דקות)' } },
        { id: 'c3b_tunload', quantity: 'none', decSi: 2, decUs: 2, label: { ru: 'Время разгрузки t_unload (мин)', he: 'זמן סרק t_unload (דקות)' } },
        { id: 'c3b_qcomp', quantity: 'air_flow_m3min', decSi: 2, decUs: 1, label: { ru: 'Подача компрессора Q_comp', he: 'תפוקת המדחס Q_comp' } },
        { id: 'c3b_spec_power', quantity: 'si_only', decSi: 2, decUs: 2, label: { ru: 'Уд. мощность w_spec (кВт/(м³/мин))', he: 'הספק סגולי w_spec (kW/(m³/min))' } },
        { id: 'c3b_t_year', quantity: 'none', decSi: 0, decUs: 0, label: { ru: 'Часы работы в год (ч/год)', he: 'שעות עבודה בשנה (שעות/שנה)' } },
        { id: 'c3b_tariff_kwh', quantity: 'none', decSi: 3, decUs: 3, label: { ru: 'Тариф на электроэнергию', he: 'תעריף חשמל' } }
      ],
      outputs: [
        { key: 'qLeakM3Min', quantity: 'air_flow_m3min', decSi: 2, decUs: 2, label: { ru: 'Расход утечек Q_leak', he: 'ספיקת דליפות Q_leak' } },
        { key: 'qLeakLS', quantity: 'air_flow_ls', decSi: 2, decUs: 2, label: { ru: 'Расход утечек (л/с)', he: 'ספיקת דליפות (L/s)' } },
        { key: 'leakPct', quantity: 'none', decSi: 2, decUs: 2, unitSuffix: '%', label: { ru: 'Доля утечек от подачи (%)', he: 'אחוז דליפות מתפוקת המדחס (%)' } },
        { key: 'pLeakKw', quantity: 'power', decSi: 2, decUs: 0, label: { ru: 'Мощность на утечки P_leak', he: 'הספק מדחס על דליפות P_leak' } },
        { key: 'costTotalYear', quantity: 'money', decSi: 2, decUs: 2, label: { ru: 'Годовая стоимость утечек', he: 'עלות שנתית של דליפות' } }
      ]
    },
    '3C': {
      panelId: 'calc-panel-3',
      anchorId: 'calc-3c',
      runFnName: 'runCalc3',
      title: { ru: 'Модуль 3В: Конденсация влаги из сжатого воздуха [S13]', he: 'מודול 3ג: התעבות לחות מאוויר דחוס [S13]' },
      inputs: [
        { id: 'c3_qc', quantity: 'si_only', decSi: 1, decUs: 1, label: { ru: 'Подача компрессора q_c (л/с)', he: 'תפוקת מדחס q_c (L/s)' } },
        { id: 'c3_rh', quantity: 'none', decSi: 2, decUs: 2, label: { ru: 'Относительная влажность RH', he: 'לחות יחסית RH' } },
        { id: 'c3_rho_in', quantity: 'si_only', decSi: 3, decUs: 3, label: { ru: 'Плотность пара на всасе ρ_in (г/м³)', he: 'צפיפות אדים ביניקה ρ_in (g/m³)' } },
        { id: 'c3_tamb', quantity: 'si_only', decSi: 2, decUs: 2, label: { ru: 'Температура всаса T_amb (К)', he: 'טמפרטורת יניקה T_amb (K)' } },
        { id: 'c3_pafter', quantity: 'si_only', decSi: 2, decUs: 2, label: { ru: 'Давление после сжатия p_after (бар(а))', he: 'לחץ אחרי דחיסה p_after (bar(a))' } },
        { id: 'c3_tafter', quantity: 'si_only', decSi: 2, decUs: 2, label: { ru: 'Температура после охлаждения T_after (К)', he: 'טמפרטורה אחרי קירור T_after (K)' } },
        { id: 'c3_rho_out', quantity: 'si_only', decSi: 3, decUs: 3, label: { ru: 'Плотность пара на выходе ρ_out (г/м³)', he: 'צפיפות אדים ביציאה ρ_out (g/m³)' } }
      ],
      outputs: [
        { key: 'mCondTempKgH', quantity: 'mass_flow', decSi: 2, decUs: 2, label: { ru: 'Конденсат с температурной поправкой', he: 'קונדנסט עם תיקון טמפרטורה' } },
        { key: 'mCondIsoKgH', quantity: 'mass_flow', decSi: 2, decUs: 2, label: { ru: 'Конденсат по упрощённой формуле S13', he: 'קונדנסט לפי נוסחת S13 המקוצרת' } }
      ]
    },
    '4A': {
      panelId: 'calc-panel-4',
      anchorId: 'calc-4a',
      runFnName: 'runCalc4A',
      title: { ru: 'Модуль 4А: Баланс потоков и селективность RO [S16]', he: 'מודול 4א: מאזן זרימה ודחיית מלחים RO [S16]' },
      inputs: [
        { id: 'c4a_qp', quantity: 'water_flow_m3h', decSi: 2, decUs: 1, label: { ru: 'Расход пермеата Q_p', he: 'ספיקת תוצר Q_p' } },
        { id: 'c4a_qc', quantity: 'water_flow_m3h', decSi: 2, decUs: 1, label: { ru: 'Расход концентрата Q_c', he: 'ספיקת רכז Q_c' } },
        { id: 'c4a_qf_meas', quantity: 'water_flow_m3h', decSi: 2, decUs: 1, label: { ru: 'Замеренный вход Q_f,meas', he: 'ספיקת הזנה נמדדת Q_f,meas' } },
        { id: 'c4a_ecf', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'Проводимость входа EC_f (мкСм/см)', he: 'מוליכות הזנה EC_f (µS/cm)' } },
        { id: 'c4a_ecp', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'Проводимость пермеата EC_p (мкСм/см)', he: 'מוליכות תוצר EC_p (µS/cm)' } },
        { id: 'c4a_ecc', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'Проводимость концентрата EC_c (мкСм/см)', he: 'מוליכות רכז EC_c (µS/cm)' } },
        { id: 'c4a_tdsf', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'Солесодержание входа TDS_f (мг/л)', he: 'ריכוז מלחים בהזנה TDS_f (mg/L)' } },
        { id: 'c4a_tdsp', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'Солесодержание пермеата TDS_p (мг/л)', he: 'ריכוז מלחים בפרמיאט TDS_p (mg/L)' } },
        { id: 'c4a_tdsc', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'Солесодержание концентрата TDS_c (мг/л)', he: 'ריכוז מלחים ברכז TDS_c (mg/L)' } }
      ],
      outputs: [
        { key: 'qfCalc', quantity: 'water_flow_m3h', decSi: 2, decUs: 1, label: { ru: 'Расчётный расход питания Q_f', he: 'ספיקת הזנה מחושבת Q_f' } },
        { key: 'recoveryPct', quantity: 'none', decSi: 2, decUs: 2, unitSuffix: '%', label: { ru: 'Степень извлечения Recovery Y (%)', he: 'אחוז השבה Recovery Y (%)' } },
        { key: 'srEcPct', quantity: 'none', decSi: 2, decUs: 2, unitSuffix: '%', label: { ru: 'Наблюдаемая селективность SR_EC (%)', he: 'דחיית מלחים נצפית SR_EC (%)' } },
        { key: 'cfApproxEc', quantity: 'none', decSi: 2, decUs: 2, label: { ru: 'Фактор концентрирования CF_EC', he: 'פקטור ריכוז CF_EC' } },
        { key: 'bEc', quantity: 'none', decSi: 4, decUs: 4, label: { ru: 'Баланс проводимости B_EC', he: 'מאזן מוליכות B_EC' } },
        { key: 'spMassPct', quantity: 'none', decSi: 2, decUs: 2, unitSuffix: '%', label: { ru: 'Массовый проскок солей SP_TDS (%)', he: 'מעבר מלחים מסתי SP_TDS (%)' } },
        { key: 'srMassPct', quantity: 'none', decSi: 2, decUs: 2, unitSuffix: '%', label: { ru: 'Массовая селективность SR_TDS (%)', he: 'דחיית מלחים מסתית SR_TDS (%)' } },
        { key: 'cfMass', quantity: 'none', decSi: 2, decUs: 2, label: { ru: 'Массовый фактор концентрирования CF_TDS', he: 'פקטור ריכוז מסתי CF_TDS' } },
        { key: 'bMass', quantity: 'none', decSi: 4, decUs: 4, label: { ru: 'Массовый солевой баланс B_TDS', he: 'מאזן מלחים מסתי B_TDS' } }
      ]
    },
    '4B': {
      panelId: 'calc-panel-4',
      anchorId: 'calc-4b',
      runFnName: 'runCalc4',
      title: { ru: 'Модуль 4Б: Нормализация потока пермеата RO (Eq. 72 [S16])', he: 'מודול 4ב: נרמול ספיקת תוצר RO (Eq. 72 [S16])' },
      inputs: [
        { id: 'c4_qp', quantity: 'water_flow_m3h', decSi: 2, decUs: 1, label: { ru: 'Текущий пермеат Q_po', he: 'ספיקת תוצר נוכחית Q_po' } },
        { id: 'c4_qc', quantity: 'water_flow_m3h', decSi: 2, decUs: 1, label: { ru: 'Текущий концентрат Q_co', he: 'ספיקת רכז נוכחית Q_co' } },
        { id: 'c4_qbase', quantity: 'water_flow_m3h', decSi: 2, decUs: 1, label: { ru: 'Эталонный пермеат Q_ps', he: 'ספיקת תוצר בהרצה Q_ps' } },
        { id: 'c4_ndps', quantity: 'pressure_diff', decSi: 2, decUs: 2, label: { ru: 'Эталонная NDP_s', he: 'כוח מניע בהרצה NDP_s' } },
        { id: 'c4_ndpo', quantity: 'pressure_diff', decSi: 2, decUs: 2, label: { ru: 'Текущая NDP_o', he: 'כוח מניע נוכחי NDP_o' } },
        { id: 'c4_tcfs', quantity: 'none', decSi: 4, decUs: 4, label: { ru: 'Эталонный TCF_s', he: 'מקדם טמפרטורה בהרצה TCF_s' } },
        { id: 'c4_tcfo', quantity: 'none', decSi: 4, decUs: 4, label: { ru: 'Текущий TCF_o', he: 'מקדם טמפרטורה נוכחי TCF_o' } },
        { id: 'c4_pp', quantity: 'pressure_diff', decSi: 2, decUs: 2, label: { ru: 'Разность давлений P_p − P_c', he: 'הפרש לחצים P_p − P_c' } }
      ],
      outputs: [
        { key: 'qsNorm', quantity: 'water_flow_m3h', decSi: 2, decUs: 1, label: { ru: 'Нормализованный поток Q_s', he: 'ספיקת תוצר מנורמלת Q_s' } },
        { key: 'normDevPct', quantity: 'none', decSi: 2, decUs: 2, unitSuffix: '%', label: { ru: 'Нормализованное отклонение (%)', he: 'סטייה מנורמלת מההרצה (%)' } },
        { key: 'rawDevPct', quantity: 'none', decSi: 2, decUs: 2, unitSuffix: '%', label: { ru: 'Сырое отклонение (%)', he: 'סטייה גולמית מההרצה (%)' } },
        { key: 'yPct', quantity: 'none', decSi: 2, decUs: 2, unitSuffix: '%', label: { ru: 'Текущее извлечение Y_o (%)', he: 'אחוז השבה נוכחי Y_o (%)' } }
      ]
    },
    '5A': {
      panelId: 'calc-panel-5',
      anchorId: 'calc-5a',
      runFnName: 'runCalc5A',
      title: { ru: 'Модуль 5А: Перевод давления пара (P_abs ⇄ P_gauge)', he: 'מודול 5א: המרת לחץ קיטור (P_abs ⇄ P_gauge)' },
      inputs: [
        { id: 'c5a_mode', isSelect: true, quantity: 'none', label: { ru: 'Направление перевода', he: 'כיוון המרה' } },
        { id: 'c5a_unit', isSelect: true, quantity: 'none', label: { ru: 'Единица измерения', he: 'יחידת מידה' } },
        { id: 'c5a_pval', quantity: 'pressure_g', decSi: 3, decUs: 2, label: { ru: 'Входное давление P_in', he: 'לחץ קלט P_in' } },
        { id: 'c5a_patm', quantity: 'pressure_a', decSi: 5, decUs: 2, label: { ru: 'Атмосферное давление P_atm', he: 'לחץ אטמוספרי P_atm' } }
      ],
      outputs: [
        { key: 'pAbsBar', quantity: 'pressure_a', decSi: 5, decUs: 2, label: { ru: 'Абсолютное давление P_abs', he: 'לחץ מוחלט P_abs' } },
        { key: 'pGaugeBar', quantity: 'pressure_g', decSi: 5, decUs: 2, label: { ru: 'Избыточное давление P_gauge', he: 'לחץ מד P_gauge' } }
      ]
    },
    '5B': {
      panelId: 'calc-panel-5',
      anchorId: 'calc-5b',
      runFnName: 'runCalc5',
      title: { ru: 'Модуль 5Б: Расход насыщенного пара и продувка по TDS', he: 'מודול 5ב: ספיקת קיטור רווי וניקוז דוד לפי TDS' },
      inputs: [
        { id: 'c5_load_mode', isSelect: true, quantity: 'none', label: { ru: 'Режим задания нагрузки', he: 'מצב הגדרת עומס חום' } },
        { id: 'c5_steam_preset', isSelect: true, quantity: 'none', label: { ru: 'Точка насыщения пара (бар изб.)', he: 'נקודת קיטור רווי (barg)' } },
        { id: 'c5_qkw', quantity: 'power', decSi: 2, decUs: 0, label: { ru: 'Тепловая мощность Q_load', he: 'הספק תרמי Q_load' } },
        { id: 'c5_mp', quantity: 'mass_flow', decSi: 1, decUs: 0, label: { ru: 'Расход продукта m_p', he: 'ספיקת מוצר m_p' } },
        { id: 'c5_cp', quantity: 'specific_heat', decSi: 2, decUs: 3, label: { ru: 'Теплоёмкость продукта c_p', he: 'קיבול חום של המוצר c_p' } },
        { id: 'c5_tin', quantity: 'temp', decSi: 1, decUs: 1, label: { ru: 'Начальная температура T_in', he: 'טמפרטורת כניסה T_in' } },
        { id: 'c5_tout', quantity: 'temp', decSi: 1, decUs: 1, label: { ru: 'Конечная температура T_out', he: 'טמפרטורת יציאה T_out' } },
        { id: 'c5_hg', quantity: 'enthalpy', decSi: 1, decUs: 1, label: { ru: 'Энтальпия пара h_g', he: 'אנתלפיית קיטור h_g' } },
        { id: 'c5_hf', quantity: 'enthalpy', decSi: 1, decUs: 1, label: { ru: 'Энтальпия жидкости h_f', he: 'אנתלפיית נוזל h_f' } },
        { id: 'c5_hfg', quantity: 'enthalpy', decSi: 2, decUs: 1, label: { ru: 'Скрытая теплота h_fg', he: 'חום כמוס h_fg' } },
        { id: 'c5_x', quantity: 'none', decSi: 2, decUs: 2, label: { ru: 'Степень сухости пара x', he: 'דרגת יובש הקיטור x' } },
        { id: 'c5_sf', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'Коэффициент запаса КО SF', he: 'מקדם ביטחון למלכודת SF' } },
        { id: 'c5_tdsfw', quantity: 'none', decSi: 0, decUs: 0, label: { ru: 'TDS питательной воды (ppm)', he: 'TDS מי הזנה (ppm)' } },
        { id: 'c5_tdsmax', quantity: 'none', decSi: 0, decUs: 0, label: { ru: 'Макс. TDS котловой воды (ppm)', he: 'TDS מרבי במי הדוד (ppm)' } },
        { id: 'c5_t_year', quantity: 'none', decSi: 0, decUs: 0, label: { ru: 'Часы работы в год (ч/год)', he: 'שעות עבודה בשנה (שעות/שנה)' } },
        { id: 'c5_eta', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'КПД котла η_b (%)', he: 'נצילות דוד η_b (%)' } },
        { id: 'c5_tariff_gj', quantity: 'tariff_energy', decSi: 2, decUs: 2, label: { ru: 'Тариф на тепло', he: 'תעריף חום/דלק' } }
      ],
      outputs: [
        { key: 'qLoadKw', quantity: 'power', decSi: 2, decUs: 0, label: { ru: 'Тепловая нагрузка аппарата Q_load', he: 'עומס חום של המתקן Q_load' } },
        { key: 'hUsefulKjKg', quantity: 'enthalpy', decSi: 2, decUs: 1, label: { ru: 'Полезная теплота конденсации h_useful', he: 'חום עיבוי שימושי h_useful' } },
        { key: 'mSteamKgH', quantity: 'mass_flow', decSi: 2, decUs: 1, label: { ru: 'Расчётный расход пара m_steam', he: 'ספיקת קיטור מחושבת m_steam' } },
        { key: 'mTrapCalcKgH', quantity: 'mass_flow', decSi: 2, decUs: 1, label: { ru: 'Предварительная нагрузка КО (с учётом SF)', he: 'ספיקת תכנון למלכודת קיטור (עם SF)' } },
        { key: 'costTotalYear', quantity: 'money', decSi: 2, decUs: 2, label: { ru: 'Годовая стоимость пара для аппарата', he: 'עלות שנתית של הקיטור למתקן' } }
      ]
    }
  };

  const I18N = {
    ru: {
      sectionTitle: 'Мои расчёты: сохранение, открытие и сравнение вариантов',
      sectionLead: 'Сохранённые инженерные расчёты со всех 10 модулей хранятся в точных метрических единицах СИ, открываются без потери точности при любом положении переключателя единиц и позволяют сравнивать два варианта одного модуля бок о бок.',
      lblFilterModule: 'Фильтр по модулю:',
      optAllModules: 'Все модули',
      btnSampleCompare2: 'Загрузить контрольную пару Модуля 2 (Вода 697.79 кВт vs Гликоль 662.20 кВт)',
      btnExportJson: 'Выгрузить JSON',
      btnImportJson: 'Загрузить JSON',
      btnClearAll: 'Очистить все записи',
      confirmDeleteRecord: 'Удалить выбранный сохранённый расчёт?',
      confirmClearAll: 'Удалить все сохранённые расчёты?',
      limitWarning: '⚠️ Достигнут предел хранилища: 200 записей. Новая запись не добавлена, чтобы не стирать старые расчёты без вашего ведома. Выгрузите архив в JSON или удалите ненужные записи.',
      emptyList: 'Пока нет сохранённых расчётов. Нажмите кнопку «Сохранить расчёт» на карточке любого модуля калькулятора или загрузите контрольную пару Модуля 2.',
      emptyCardTitle: 'Здесь появятся ваши сохранённые расчёты',
      emptyCardDesc: 'Выполните расчёт в любом из 10 модулей и нажмите кнопку «Сохранить расчёт» под карточкой результата, либо загрузите готовый эталонный пример сравнения чиллера (вода против гликоля).',
      emptyCardBtnCalc: 'Перейти к расчётам →',
      colDate: 'Дата / версия',
      colModule: 'Модуль',
      colNote: 'Заметка инженера',
      colKeyResult: 'Основной результат',
      colActions: 'Действия',
      btnOpen: 'Открыть в калькуляторе',
      btnSelectA: 'А',
      btnSelectB: 'Б',
      btnDelete: 'Удалить',
      compareTitle: 'Сравнение двух наборов (А / Б)',
      compareHint: 'Выберите два сохранённых расчёта одного и того же модуля в выпадающих списках «Набор А» и «Набор Б» ниже (или кнопками «А» и «Б» в таблице выше). Значения и разница отображаются в текущих выбранных единицах (SI / US).',
      lblCompareA: 'Набор А (базовый):',
      lblCompareB: 'Набор Б (сравниваемый):',
      colParam: 'Параметр',
      colValA: 'Набор А',
      colValB: 'Набор Б',
      colDiffAbs: 'Разница Δ (Б − А)',
      colDiffPct: 'Разница Δ%',
      grpInputs: 'Исходные данные',
      grpOutputs: 'Результаты',
      mismatchModuleWarning: 'Для сравнения выберите две записи одного и того же расчётного модуля.',
      diffUnitSystemNotice: 'ℹ️ Наборы сохранены в разных системах единиц — значения показаны в текущей системе',
      diffCurrencyWarning: '⚠️ Разные валюты — денежные строки не сравниваются',
      doeCompareBlocked: '⚠️ Сравнение недоступно: запись Модуля 1А сохранена в неметрическом режиме DOE S21 (lb/hr, Btu/lb, $/MMBtu), где поле inputsSi хранит имперские значения и не приводится к СИ.',
      kpaCompareBlocked: '⚠️ Сравнение недоступно: запись Модуля 5А сохранена с входной единицей кПа (kPa), где поле inputsSi хранит кПа вместо бар.',
      saveErrorPrefix: '❌ Ошибка сохранения расчёта:',
      compareNeedSaveHint: 'ℹ️ Чтобы сравнить текущий расчёт с сохранённым, сначала нажмите «💾 Сохранить расчёт».',
      promptNote: 'Введите заметку к сохраняемому расчёту (необязательно):',
      defaultNotePrefix: 'Расчёт модуля '
    },
    he: {
      sectionTitle: 'החישובים שלי: שמירה, פתיחה והשוואת חלופות',
      sectionLead: 'חישובים הנדסיים שנשמרו מכל 10 המודולים נשמרים ביחידות מטריות מדויקות (SI), נפתחים מחדש ללא איבוד דיוק בכל מצב של בורר היחידות, ומאפשרים השוואה צד-אחר-צד של שתי חלופות מאותו מודול.',
      lblFilterModule: 'סינון לפי מודול:',
      optAllModules: 'כל המודולים',
      btnSampleCompare2: 'טעינת זוג בקרה למודול 2 (מים 697.79 kW מול גליקול 662.20 kW)',
      btnExportJson: 'ייצוא JSON',
      btnImportJson: 'ייבוא JSON',
      btnClearAll: 'מחיקת כל הרשומות',
      confirmDeleteRecord: 'האם למחוק את החישוב השמור שנבחר?',
      confirmClearAll: 'האם למחוק את כל החישובים השמורים?',
      limitWarning: '⚠️ הגעתם למגבלת האחסון: 200 רשומות. הרשומה החדשה לא נוספה כדי לא למחוק חישובים ישנים ללא ידיעתכם. ייצאו גיבוי ל-JSON או מחקו רשומות שאינן נדרשות.',
      emptyList: 'טרם נשמרו חישובים. לחצו על הכפתור "שמירת חישוב" בכרטיס של כל מודול במחשבון או טענו את זוג הבקרה של מודול 2.',
      emptyCardTitle: 'כאן יופיעו החישובים השמורים שלכם',
      emptyCardDesc: 'בצעו חישוב באחד מ-10 המודולים ולחצו על "שמירת חישוב" מתחת לכרטיס התוצאה, או טענו כעת את זוג הבקרה של מודול 2 (מים מול גליקול).',
      emptyCardBtnCalc: 'מעבר למחשבונים ←',
      colDate: 'תאריך / גרסה',
      colModule: 'מודול',
      colNote: 'הערת מהנדס',
      colKeyResult: 'תוצאה עיקרית',
      colActions: 'פעולות',
      btnOpen: 'פתיחה במחשבון',
      btnSelectA: 'א׳',
      btnSelectB: 'ב׳',
      btnDelete: 'מחיקה',
      compareTitle: 'השוואת שתי ערכות (א׳ / ב׳)',
      compareHint: 'בחרו שני חישובים שמורים מאותו מודול בתיבות הבחירה "ערכה א׳" ו-"ערכה ב׳" למטה (או באמצעות כפתורי "א׳" ו-"ב׳" בטבלה למעלה). הערכים וההפרשים מוצגים ביחידות המידה הפעילות כעת (SI / US).',
      lblCompareA: 'ערכה א׳ (ייחוס):',
      lblCompareB: 'ערכה ב׳ (מושוה):',
      colParam: 'פרמטר',
      colValA: 'ערכה א׳',
      colValB: 'ערכה ב׳',
      colDiffAbs: 'הפרש Δ (ב׳ − א׳)',
      colDiffPct: 'הפרש Δ%',
      grpInputs: 'נתוני קלט',
      grpOutputs: 'תוצאות',
      mismatchModuleWarning: 'להשוואה יש לבחור שתי רשומות של אותו מודול חישוב.',
      diffUnitSystemNotice: 'ℹ️ הערכות נשמרו במערכות יחידות שונות — הערכים מוצגים במערכת היחידות הפעילה כעת',
      diffCurrencyWarning: '⚠️ מטבעות שונים — שורות כספיות אינן מושוות',
      doeCompareBlocked: '⚠️ ההשוואה אינה זמינה: רשומת מודול 1א נשמרה במצב האימפריאלי DOE S21 (lb/hr, Btu/lb, $/MMBtu), שבו השדה inputsSi שומר ערכים אימפריאליים שאינם מומרים ל-SI.',
      kpaCompareBlocked: '⚠️ ההשוואה אינה זמינה: רשומת מודול 5א נשמרה עם יחידת קלט kPa, שבה השדה inputsSi שומר kPa במקום bar.',
      saveErrorPrefix: '❌ שגיאה בשמירת החישוב:',
      compareNeedSaveHint: 'ℹ️ כדי להשוות את החישוב הנוכחי עם חישוב שמור, לחצו תחילה על "💾 שמירת חישוב".',
      promptNote: 'הזינו הערה לחישוב הנשמר (אופציונלי):',
      defaultNotePrefix: 'חישוב מודול '
    }
  };

  let memoryRecords = [];
  let filterModule = 'ALL';
  let compareIdA = null;
  let compareIdB = null;
  let limitWarningActive = false;

  function loadSavedRecords() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_SAVED_CALCS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            memoryRecords = parsed;
            return memoryRecords;
          }
        }
      }
    } catch (_) {
      if (typeof root.setStorageAvailabilityForTest === 'function') {
        root.setStorageAvailabilityForTest(false);
      }
    }
    return memoryRecords;
  }

  function saveRecordsToStorage(records) {
    memoryRecords = records;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SAVED_CALCS, JSON.stringify(records));
      }
    } catch (_) {
      if (typeof root.setStorageAvailabilityForTest === 'function') {
        root.setStorageAvailabilityForTest(false);
      }
    }
  }

  function pickVal(inputsSi, domId, engineKey) {
    if (!inputsSi) return '';
    if (inputsSi[domId] !== undefined && inputsSi[domId] !== '') return inputsSi[domId];
    if (engineKey && inputsSi[engineKey] !== undefined && inputsSi[engineKey] !== '') return inputsSi[engineKey];
    if (inputsSi[domId] !== undefined) return inputsSi[domId];
    if (engineKey && inputsSi[engineKey] !== undefined) return inputsSi[engineKey];
    return '';
  }

  // Вычисление точных результатов СИ (resultsSi) из точных входов СИ (inputsSi) через EngineeringCalculators + EconomicsEngine
  function computeResultsSiFromInputs(moduleCode, inputsSi, currency) {
    const EC = root.EngineeringCalculators;
    const EE = root.EconomicsEngine;
    if (!EC) return {};
    const cur = currency || '$';
    const code = String(moduleCode || '').toUpperCase().replace(/-DOE$/, '');
    const p = (domId, engKey) => pickVal(inputsSi, domId, engKey);

    if (code === '1A') {
      const mode = p('c1a_mode', 'mode') || 'direct_l_min';
      if (mode === 'doe_s21_imperial') {
        const r = EC.calcCondensatePrimary({
          mode: 'doe_s21_imperial',
          m_lb_hr: p('c1a_m_kg_h', 'm_lb_hr'),
          hf_cond_btu_lb: p('c1a_t_cond', 'hf_cond_btu_lb'),
          hf_mk_btu_lb: p('c1a_t_make', 'hf_mk_btu_lb'),
          t_year_h: p('c1a_t_year', 't_year_h'),
          eta_boiler_pct: p('c1a_eta', 'eta_boiler_pct'),
          tariff_per_mmbtu: p('c1a_tariff_gj', 'tariff_per_mmbtu')
        });
        const econ = EE ? EE.calcModule1AEconomics(r, {
          eta_boiler_pct: p('c1a_eta', 'eta_boiler_pct'),
          tariff_per_mmbtu: p('c1a_tariff_gj', 'tariff_per_mmbtu')
        }) : null;
        return {
          mode: 'doe_s21_imperial',
          mLbHr: r.mLbHr,
          heatRateKw: r.heatRateKw,
          annualCondMMBtu: r.annualCondMMBtu,
          annualFuelMMBtuExact: r.annualFuelMMBtuExact,
          annualFuelMMBtuRoundedDOE: r.annualFuelMMBtuRoundedDOE,
          annualCostExact: r.annualCostExact,
          annualCostRoundedDOE: r.annualCostRoundedDOE,
          mTargetKgH: null,
          vTargetM3H: null,
          qThermalKw: r.heatRateKw,
          vShiftM3: null,
          eShiftKwh: null,
          mReturnKgH: null,
          vReturnM3H: null,
          vYearM3: null,
          eYearGJ: null,
          eFuelYearGJ: null,
          costTotalYear: r.annualCostExact
        };
      }

      const mVal = p('c1a_m_kg_h', 'm_kg_h') !== '' ? p('c1a_m_kg_h', 'm_kg_h') : p('c1a_m_kg_h', 'm_steam_kg_h');
      const r = EC.calcCondensatePrimary({
        mode,
        q_l_min: p('c1a_q_l_min', 'q_l_min'),
        m_kg_h: mVal,
        m_steam_kg_h: p('m_steam_kg_h', 'c1a_m_kg_h') !== '' ? p('m_steam_kg_h', 'c1a_m_kg_h') : mVal,
        return_pct: p('c1a_ret_pct', 'return_pct'),
        t_cond_c: p('c1a_t_cond', 't_cond_c'),
        t_makeup_c: p('c1a_t_make', 't_makeup_c'),
        rho_kg_l: p('c1a_rho', 'rho_kg_l'),
        cp_kj_kgc: p('c1a_cp', 'cp_kj_kgc'),
        t_shift_h: p('c1a_t_shift', 't_shift_h'),
        t_year_h: p('c1a_t_year', 't_year_h'),
        eta_boiler_pct: p('c1a_eta', 'eta_boiler_pct'),
        fuel_lhv_kwh: p('c1a_lhv', 'fuel_lhv_kwh'),
        tariff_per_gj: p('c1a_tariff_gj', 'tariff_per_gj'),
        tariff_water_m3: p('c1a_tariff_water', 'tariff_water_m3')
      });
      const econ = EE ? EE.calcModule1AEconomics(r, {
        currency: cur,
        t_year_h: p('c1a_t_year', 't_year_h'),
        eta_boiler_pct: p('c1a_eta', 'eta_boiler_pct'),
        tariff_per_gj: p('c1a_tariff_gj', 'tariff_per_gj'),
        tariff_water_m3: p('c1a_tariff_water', 'tariff_water_m3')
      }) : null;
      return {
        mTargetKgH: r.mTargetKgH,
        vTargetM3H: r.vTargetM3H,
        qThermalKw: r.qThermalKw,
        vShiftM3: r.vShiftM3,
        eShiftKwh: r.eShiftKwh,
        eShiftGJ: r.eShiftGJ,
        mReturnKgH: r.mReturnKgH,
        vReturnM3H: r.vReturnM3H,
        qReturnKw: r.qReturnKw,
        vYearM3: r.vYearM3,
        eYearKwh: r.eYearKwh,
        eYearGJ: r.eYearGJ,
        eFuelYearGJ: r.eFuelYearGJ,
        costEnergyYear: r.costEnergyYear,
        costWaterYear: r.costWaterYear,
        costTotalYear: econ && econ.hasCost ? econ.costTotalYear : r.costTotalYear
      };
    }

    if (code === '1B') {
      const r = EC.calcCondensateFlashAndTLV({
        mc_kg_h: p('c1_mc', 'mc_kg_h'),
        p1_barg: p('c1_p1', 'p1_barg'),
        p2_barg: p('c1_p2', 'p2_barg'),
        hf1_kj_kg: p('c1_hf1', 'hf1_kj_kg'),
        hf2_kj_kg: p('c1_hf2', 'hf2_kj_kg'),
        hfg2_kj_kg: p('c1_hfg2', 'hfg2_kj_kg'),
        dop_mm: p('c1_dop', 'dop_mm')
      });
      const econ = EE ? EE.calcModule1BEconomics(r, {
        currency: cur,
        t_year_h: p('c1b_t_year', 't_year_h'),
        eta_boiler_pct: p('c1b_eta', 'eta_boiler_pct'),
        tariff_per_gj: p('c1b_tariff_gj', 'tariff_per_gj')
      }) : null;
      const hfg2Num = Number(p('c1_hfg2', 'hfg2_kj_kg'));
      return {
        xFlashPct: r.xFlashPct,
        mFlashKgH: r.mFlashKgH,
        dReceiverMm: r.dReceiverMm,
        ventLineMm: r.table1Row ? r.table1Row.ventLineMm : null,
        qFlashKw: econ ? econ.qFlashKw : (r.mFlashKgH * hfg2Num) / 3600,
        costTotalYear: econ ? econ.costTotalYear : null
      };
    }

    if (code === '2') {
      const r = EC.calcChillerPerformance({
        fluid_type: p('c2_fluid', 'fluid_type') || 'water',
        vw_m3_h: p('c2_vw', 'vw_m3_h'),
        rho_kg_m3: p('c2_rho', 'rho_kg_m3'),
        cp_kj_kgc: p('c2_cp', 'cp_kj_kgc'),
        t_evap_in_c: p('c2_tin', 't_evap_in_c'),
        t_evap_out_c: p('c2_tout', 't_evap_out_c'),
        p_el_kw: p('c2_pel', 'p_el_kw'),
        t_sat_evap_c: p('c2_tsat_ev', 't_sat_evap_c'),
        t_cond_out_c: p('c2_tcond_out', 't_cond_out_c'),
        t_sat_cond_c: p('c2_tsat_cd', 't_sat_cond_c')
      });
      const econ = EE ? EE.calcModule2Economics(r, {
        currency: cur,
        t_year_h: p('c2_t_year', 't_year_h'),
        tariff_per_kwh: p('c2_tariff_kwh', 'tariff_per_kwh')
      }) : null;
      return {
        qEvapKw: r.qKw !== undefined ? r.qKw : r.qEvapKw,
        qEvapTr: r.qTr !== undefined ? r.qTr : r.qEvapTr,
        dTevapC: r.dTevapC !== undefined ? r.dTevapC : (r.dtEvap !== undefined ? r.dtEvap : r.dtEvapC),
        dtEvapC: r.dTevapC !== undefined ? r.dTevapC : (r.dtEvap !== undefined ? r.dtEvap : r.dtEvapC),
        cop: r.cop,
        kwPerTr: r.kwPerTr,
        appEvapC: r.evapApproach !== undefined ? r.evapApproach : r.appEvapC,
        appCondC: r.condApproach !== undefined ? r.condApproach : r.appCondC,
        costTotalYear: econ ? econ.costTotalYear : null
      };
    }

    if (code === '3A') {
      const r = EC.calcAirFlowConversion({
        q1_l_s: p('c3a_q1', 'q1_l_s'),
        p1_abs_bar: p('c3a_p1', 'p1_abs_bar'),
        t1_c: p('c3a_t1', 't1_c'),
        rh1_pct: p('c3a_rh1', 'rh1_pct'),
        psat1_bar: p('c3a_psat1', 'psat1_bar'),
        p2_abs_bar: p('c3a_p2', 'p2_abs_bar'),
        t2_c: p('c3a_t2', 't2_c'),
        rh2_pct: p('c3a_rh2', 'rh2_pct'),
        psat2_bar: p('c3a_psat2', 'psat2_bar')
      });
      return {
        q2LS: r.q2LS,
        q2M3Min: r.q2M3Min,
        q2M3H: r.q2M3H
      };
    }

    if (code === '3B') {
      const r = EC.calcAirLeaks({
        method: p('c3b_method', 'method') || 'receiver_drop',
        v_rec_m3: p('c3b_vr', 'v_rec_m3'),
        p1_g_bar: p('c3b_pstart', 'p1_g_bar'),
        p2_g_bar: p('c3b_pend', 'p2_g_bar'),
        t_min: p('c3b_tdecay', 't_min'),
        p_atm_bar: p('c3b_patm', 'p_atm_bar'),
        q_comp_m3_min: p('c3b_qcomp', 'q_comp_m3_min'),
        t_load_min: p('c3b_tload', 't_load_min'),
        t_unload_min: p('c3b_tunload', 't_unload_min')
      });
      const econ = EE ? EE.calcModule3BEconomics(r, {
        currency: cur,
        spec_power_kw_m3min: p('c3b_spec_power', 'spec_power_kw_m3min'),
        t_year_h: p('c3b_t_year', 't_year_h'),
        tariff_per_kwh: p('c3b_tariff_kwh', 'tariff_per_kwh')
      }) : null;
      return {
        qLeakM3Min: r.qLeakM3Min,
        qLeakLS: r.qLeakLS,
        leakPct: r.leakPct,
        pLeakKw: econ ? econ.pLeakKw : null,
        costTotalYear: econ ? econ.costTotalYear : null
      };
    }

    if (code === '3C') {
      const r = EC.calcAirMoistureCondensation({
        qc_l_s: p('c3_qc', 'qc_l_s'),
        rh_fraction: p('c3_rh', 'rh_fraction'),
        rho_in_g_m3: p('c3_rho_in', 'rho_in_g_m3'),
        t_amb_k: p('c3_tamb', 't_amb_k'),
        p_after_abs_bar: p('c3_pafter', 'p_after_abs_bar'),
        t_after_k: p('c3_tafter', 't_after_k'),
        rho_out_g_m3: p('c3_rho_out', 'rho_out_g_m3')
      });
      return {
        mCondTempKgH: r.mCondTempKgH,
        mCondIsoKgH: r.mCondIsoKgH
      };
    }

    if (code === '4A') {
      const r = EC.calcROBalance({
        qp_m3_h: p('c4a_qp', 'qp_m3_h'),
        qc_m3_h: p('c4a_qc', 'qc_m3_h'),
        qf_meas_m3_h: p('c4a_qf_meas', 'qf_meas_m3_h'),
        ec_f_us_cm: p('c4a_ecf', 'ec_f_us_cm'),
        ec_p_us_cm: p('c4a_ecp', 'ec_p_us_cm'),
        ec_c_us_cm: p('c4a_ecc', 'ec_c_us_cm'),
        tds_f_mg_l: p('c4a_tdsf', 'tds_f_mg_l'),
        tds_p_mg_l: p('c4a_tdsp', 'tds_p_mg_l'),
        tds_c_mg_l: p('c4a_tdsc', 'tds_c_mg_l')
      });
      return {
        qfCalc: r.qfCalc,
        recoveryPct: r.recoveryPct,
        srEcPct: r.srEcPct,
        cfApproxEc: r.cfApproxEc,
        bEc: r.bEc,
        spMassPct: r.massSaltBalance ? r.massSaltBalance.spMassPct : null,
        srMassPct: r.massSaltBalance ? r.massSaltBalance.srMassPct : null,
        cfMass: r.massSaltBalance ? r.massSaltBalance.cfMass : null,
        bMass: r.massSaltBalance ? r.massSaltBalance.bMass : null,
        spTdsPct: r.spTdsPct,
        srTdsPct: r.srTdsPct,
        cfMassTds: r.cfMassTds,
        bTds: r.bTds
      };
    }

    if (code === '4B') {
      const r = EC.calcRONormalization({
        qp_o_m3_h: p('c4_qp', 'qp_o_m3_h'),
        qc_o_m3_h: p('c4_qc', 'qc_o_m3_h'),
        qp_s_m3_h: p('c4_qbase', 'qp_s_m3_h'),
        ndp_s_bar: p('c4_ndps', 'ndp_s_bar'),
        ndp_o_bar: p('c4_ndpo', 'ndp_o_bar'),
        tcf_s: p('c4_tcfs', 'tcf_s'),
        tcf_o: p('c4_tcfo', 'tcf_o'),
        dp_back_bar: p('c4_pp', 'dp_back_bar')
      });
      return {
        qsNorm: r.qsNorm,
        normDevPct: r.normDevPct,
        rawDevPct: r.rawDevPct,
        yPct: r.yPct
      };
    }

    if (code === '5A') {
      const unitSel = p('c5a_unit', 'unit') || 'bar';
      const engineUnit = unitSel === 'kpa' ? 'kpa' : 'bar';
      const r = EC.calcSteamPressureConversion({
        mode: p('c5a_mode', 'mode') || 'gauge_to_abs',
        unit: engineUnit,
        p_val: p('c5a_pval', 'p_val'),
        p_atm_bar: p('c5a_patm', 'p_atm_bar')
      });
      return {
        pAbsBar: r.pAbsBar,
        pGaugeBar: r.pGaugeBar
      };
    }

    if (code === '5B') {
      const r = EC.calcSteamLoad({
        load_mode: p('c5_load_mode', 'load_mode') || 'direct_kw',
        q_load_kw: p('c5_qkw', 'q_load_kw'),
        mp_kg_h: p('c5_mp', 'mp_kg_h'),
        cp_kj_kgc: p('c5_cp', 'cp_kj_kgc'),
        t_in_c: p('c5_tin', 't_in_c'),
        t_out_c: p('c5_tout', 't_out_c'),
        p_barg_preset: p('c5_steam_preset', 'p_barg_preset'),
        hg_kj_kg: p('c5_hg', 'hg_kj_kg'),
        hf_kj_kg: p('c5_hf', 'hf_kj_kg'),
        hfg_kj_kg: p('c5_hfg', 'hfg_kj_kg'),
        x_dryness: p('c5_x', 'x_dryness'),
        sf: p('c5_sf', 'sf'),
        tds_fw_ppm: p('c5_tdsfw', 'tds_fw_ppm'),
        tds_max_ppm: p('c5_tdsmax', 'tds_max_ppm')
      });
      const econ = EE ? EE.calcModule5BEconomics(r, {
        currency: cur,
        t_year_h: p('c5_t_year', 't_year_h'),
        eta_boiler_pct: p('c5_eta', 'eta_boiler_pct'),
        tariff_per_gj: p('c5_tariff_gj', 'tariff_per_gj')
      }) : null;
      return {
        qLoadKw: r.qLoadKw,
        hUsefulKjKg: r.hUsefulKjKg,
        mSteamKgH: r.mSteamKgH,
        mTrapCalcKgH: r.mTrapCalcKgH,
        costTotalYear: econ ? econ.costTotalYear : null
      };
    }

    return {};
  }

  // Чтение точных метрических входных значений модуля из DOM
  function readModuleInputsSiFromDom(moduleCode) {
    const code = String(moduleCode || '').toUpperCase().replace(/-DOE$/, '');
    const def = MODULE_DEFS[code];
    if (!def) return {};
    const out = {};
    for (const inp of def.inputs) {
      const el = typeof document !== 'undefined' ? document.getElementById(inp.id) : null;
      if (!el) continue;
      if (inp.isSelect || el.tagName === 'SELECT') {
        out[inp.id] = el.value;
      } else {
        const siVal = typeof root.getFieldSiValue === 'function'
          ? root.getFieldSiValue(inp.id)
          : (el.dataset.siValue !== undefined ? el.dataset.siValue : el.value);
        out[inp.id] = String(siVal === null || siVal === undefined ? '' : siVal).trim();
      }
    }
    return out;
  }

  // Добавление новой записи с проверкой лимита MAX_SAVED_CALCS = 200
  function addSavedRecord(recordData) {
    const records = loadSavedRecords();
    if (records.length >= MAX_SAVED_CALCS) {
      limitWarningActive = true;
      renderSavedCalcsSection();
      return { ok: false, reason: 'limit_exceeded', max: MAX_SAVED_CALCS };
    }
    limitWarningActive = false;
    const moduleCode = String(recordData.module || '2').toUpperCase().replace(/-DOE$/, '');
    const cur = recordData.currency || (typeof root.getCalculatorCurrency === 'function' ? root.getCalculatorCurrency() : '$');
    const sys = recordData.savedInUnitSystem || (typeof root.getCalculatorUnitSystem === 'function' ? root.getCalculatorUnitSystem() : 'si');
    const inputsSi = { ...(recordData.inputsSi || {}) };
    const resultsSi = recordData.resultsSi || computeResultsSiFromInputs(moduleCode, inputsSi, cur);

    const newRec = {
      id: recordData.id || `calc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      version: SAVED_CALC_FORMAT_VERSION,
      module: moduleCode,
      savedAt: recordData.savedAt || new Date().toISOString(),
      note: String(recordData.note || ''),
      noteRu: recordData.noteRu ? String(recordData.noteRu) : undefined,
      noteHe: recordData.noteHe ? String(recordData.noteHe) : undefined,
      currency: cur,
      savedInUnitSystem: sys,
      inputsSi,
      resultsSi
    };

    records.push(newRec);
    saveRecordsToStorage(records);

    // Автоматически подставляем в сравнение, если подходит по модулю
    const sameMod = records.filter((r) => r.module === moduleCode);
    if (sameMod.length >= 2) {
      compareIdA = sameMod[sameMod.length - 2].id;
      compareIdB = sameMod[sameMod.length - 1].id;
    } else if (sameMod.length === 1) {
      compareIdA = sameMod[0].id;
    }

    renderSavedCalcsSection();
    return { ok: true, record: newRec };
  }

  function showCardSaveFeedbackError(btnEl, moduleCode, errMsg) {
    if (typeof document === 'undefined') return;
    const wrapper = btnEl && typeof btnEl.closest === 'function' ? btnEl.closest('.calc-card-wrapper') : null;
    const targetBox = wrapper || document.getElementById(`out-calc-${String(moduleCode || '').toLowerCase()}`);
    if (!targetBox) return;
    let errEl = targetBox.querySelector('.calc-save-error-banner');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'warning-box calc-save-error-banner';
      errEl.setAttribute('role', 'alert');
      errEl.style.marginTop = '0.5rem';
      targetBox.appendChild(errEl);
    }
    errEl.textContent = errMsg;
  }

  // Сохранение текущего расчёта модуля из карточки калькулятора
  function saveCalculationFromCard(moduleCode, btnEl, optionalNote) {
    const lang = (root.AppState && root.AppState.lang === 'he') ? 'he' : 'ru';
    const t = I18N[lang];
    const code = String(moduleCode || '2').toUpperCase().replace(/-DOE$/, '');
    try {
      const inputsSi = readModuleInputsSiFromDom(code);
      const cur = typeof root.getCalculatorCurrency === 'function' ? root.getCalculatorCurrency() : '$';
      const resultsSi = computeResultsSiFromInputs(code, inputsSi, cur);

      let note = optionalNote;
      if (note === undefined) {
        note = `${t.defaultNotePrefix}${code}`;
      }

      const res = addSavedRecord({
        module: code,
        note,
        currency: cur,
        inputsSi,
        resultsSi
      });

      if (btnEl && typeof btnEl.closest === 'function') {
        const wrapper = btnEl.closest('.calc-card-wrapper');
        const oldErr = wrapper && wrapper.querySelector('.calc-save-error-banner');
        if (oldErr) oldErr.remove();
      }

      if (btnEl && res.ok) {
        const orig = btnEl.textContent;
        btnEl.textContent = lang === 'he' ? '✓ נשמר ב"החישובים שלי"!' : '✓ Сохранено в «Мои расчёты»!';
        setTimeout(() => {
          btnEl.textContent = orig;
        }, 1600);
      }
      return res;
    } catch (err) {
      const rawMsg = err && err.message ? err.message : String(err);
      const fullMsg = `${t.saveErrorPrefix} ${rawMsg}`;
      showCardSaveFeedbackError(btnEl, code, fullMsg);
      return { ok: false, reason: 'compute_error', error: rawMsg };
    }
  }

  // Открытие сохранённого расчёта обратно в калькуляторе
  function openSavedCalculation(recordId) {
    const records = loadSavedRecords();
    const rec = records.find((r) => r.id === recordId);
    if (!rec) return false;
    const def = MODULE_DEFS[rec.module];
    if (!def) return false;

    if (typeof root.openCalculatorTab === 'function') {
      root.openCalculatorTab(def.panelId, false);
    }
    if (rec.currency && typeof root.setCalculatorCurrency === 'function') {
      root.setCalculatorCurrency(rec.currency);
    }

    // Сначала устанавливаем select-поля (например, c1a_mode, c5a_unit, c2_fluid), чтобы зависимые поля правильно определяли конвертацию
    for (const inp of def.inputs) {
      if (inp.isSelect && rec.inputsSi && rec.inputsSi[inp.id] !== undefined) {
        const el = typeof document !== 'undefined' ? document.getElementById(inp.id) : null;
        if (el) el.value = String(rec.inputsSi[inp.id]);
      }
    }

    // Затем восстанавливаем точные метрические значения (data-si-value) для всех численных полей
    for (const inp of def.inputs) {
      if (!inp.isSelect && rec.inputsSi && rec.inputsSi[inp.id] !== undefined) {
        const siVal = String(rec.inputsSi[inp.id]);
        if (typeof root.setFieldFromSiValue === 'function') {
          root.setFieldFromSiValue(inp.id, siVal);
        } else {
          const el = typeof document !== 'undefined' ? document.getElementById(inp.id) : null;
          if (el) {
            el.dataset.siValue = siVal;
            el.value = siVal;
          }
        }
      }
    }

    if (typeof root.applyCalculatorTranslations === 'function') {
      root.applyCalculatorTranslations((root.AppState && root.AppState.lang) || 'ru');
    }

    if (typeof root[def.runFnName] === 'function') {
      root[def.runFnName]();
    }

    if (typeof document !== 'undefined') {
      const anchor = document.getElementById(def.anchorId) || document.getElementById('sec-calculators');
      if (anchor && typeof anchor.scrollIntoView === 'function') {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    return true;
  }

  function deleteSavedCalculation(recordId) {
    const lang = (root.AppState && root.AppState.lang === 'he') ? 'he' : 'ru';
    const msg = I18N[lang].confirmDeleteRecord;
    if (typeof root.confirm === 'function' && !root.confirm(msg)) {
      return false;
    }
    const records = loadSavedRecords();
    const idx = records.findIndex((r) => r.id === recordId);
    if (idx === -1) return false;
    records.splice(idx, 1);
    limitWarningActive = false;
    saveRecordsToStorage(records);
    if (compareIdA === recordId) compareIdA = null;
    if (compareIdB === recordId) compareIdB = null;
    renderSavedCalcsSection();
    return true;
  }

  // Загрузка контрольной пары Модуля 2: Вода 697.79 кВт vs Гликоль 662.20 кВт (разница −35.59 кВт)
  function loadSampleComparisonModule2() {
    const lang = (root.AppState && root.AppState.lang === 'he') ? 'he' : 'ru';
    const isHe = lang === 'he';
    const waterInputs = {
      c2_fluid: 'water',
      c2_vw: '120.0',
      c2_rho: '999.7',
      c2_cp: '4.188',
      c2_tin: '12.0',
      c2_tout: '7.0',
      c2_pel: '96.0',
      c2_tsat_ev: '3.5',
      c2_tcond_out: '34.0',
      c2_tsat_cd: '36.2',
      c2_t_year: '',
      c2_tariff_kwh: ''
    };
    const glycolInputs = {
      c2_fluid: 'glycol',
      c2_vw: '120.0',
      c2_rho: '1032.0',
      c2_cp: '3.850',
      c2_tin: '4.0',
      c2_tout: '-1.0',
      c2_pel: '105.0',
      c2_tsat_ev: '-4.5',
      c2_tcond_out: '33.0',
      c2_tsat_cd: '35.5',
      c2_t_year: '',
      c2_tariff_kwh: ''
    };

    const noteWaterRu = 'Вода (120 м³/ч, 12→7 °C, ρ=999.7, cp=4.188) → 697.79 кВт';
    const noteWaterHe = 'מים (120 m³/h, 12→7 °C, ρ=999.7, cp=4.188) → 697.79 kW';
    const noteGlycolRu = '30% ПГ гликоль (120 м³/ч, 4→−1 °C, ρ=1032, cp=3.85) → 662.20 кВт';
    const noteGlycolHe = '30% גליקול PG (120 m³/h, 4→−1 °C, ρ=1032, cp=3.85) → 662.20 kW';

    const resA = addSavedRecord({
      id: 'sample_mod2_water_697_79',
      module: '2',
      note: isHe ? noteWaterHe : noteWaterRu,
      noteRu: noteWaterRu,
      noteHe: noteWaterHe,
      inputsSi: waterInputs
    });
    const resB = addSavedRecord({
      id: 'sample_mod2_glycol_662_20',
      module: '2',
      note: isHe ? noteGlycolHe : noteGlycolRu,
      noteRu: noteGlycolRu,
      noteHe: noteGlycolHe,
      inputsSi: glycolInputs
    });

    if (resA.ok && resB.ok) {
      compareIdA = resA.record.id;
      compareIdB = resB.record.id;
      renderSavedCalcsSection();
      if (typeof root.showToolSubview === 'function') {
        root.showToolSubview('sec-saved', { scrollTop: false, focusHeading: false });
      }
    }
    return { resA, resB };
  }

  // Форматирование одного значения и разницы Δ (Б − А) в активных единицах (SI или US)
  function formatValueInActiveUnits(siVal, fieldCfg, lang, sys, currency) {
    if (siVal === null || siVal === undefined || siVal === '') return '—';
    if (fieldCfg.isSelect) return String(siVal);
    const num = Number(siVal);
    if (!Number.isFinite(num)) return String(siVal);

    const UC = root.UnitConverter;
    const EE = root.EconomicsEngine;
    const q = fieldCfg.quantity || 'none';

    if (q === 'money') {
      return EE ? EE.formatMoney(num, currency || '$', 2) : `${currency || '$'}${num.toFixed(2)}`;
    }
    if (q === 'none' || q === 'si_only' || !UC || !UC.QUANTITIES[q]) {
      const dec = fieldCfg.decSi !== undefined ? fieldCfg.decSi : 2;
      const suffix = fieldCfg.unitSuffix || '';
      return `${num.toFixed(dec)}${suffix}`;
    }

    const dispNum = sys === 'us' ? UC.toImperial(q, num) : num;
    const dec = sys === 'us' ? (fieldCfg.decUs !== undefined ? fieldCfg.decUs : 2) : (fieldCfg.decSi !== undefined ? fieldCfg.decSi : 2);
    const unitSym = UC.getUnitSymbol(q, lang, sys);
    return `${UC.formatWithSpaces(dispNum, dec)}${unitSym ? ' ' + unitSym : ''}`;
  }

  function getRecordOutputVal(rec, out) {
    if (!rec || !rec.resultsSi || !out) return undefined;
    if (rec.resultsSi[out.key] !== undefined) return rec.resultsSi[out.key];
    if (out.legacyKey && rec.resultsSi[out.legacyKey] !== undefined) return rec.resultsSi[out.legacyKey];
    return undefined;
  }

  function isRecordDoeImperial(rec) {
    if (!rec || rec.module !== '1A') return false;
    const mode = rec.inputsSi && (rec.inputsSi.c1a_mode || rec.inputsSi.mode);
    return mode === 'doe_s21_imperial' || (rec.resultsSi && rec.resultsSi.mode === 'doe_s21_imperial');
  }

  function isRecord5AKpa(rec) {
    if (!rec || rec.module !== '5A') return false;
    const unit = rec.inputsSi && (rec.inputsSi.c5a_unit || rec.inputsSi.unit);
    return unit === 'kpa';
  }

  function isMoneyOrTariffField(fieldCfg) {
    if (!fieldCfg) return false;
    const q = fieldCfg.quantity || 'none';
    if (q === 'money' || q === 'tariff_energy') return true;
    const id = String(fieldCfg.id || fieldCfg.key || '');
    return id.includes('tariff');
  }

  function computeComparisonRows(recA, recB, lang, sys) {
    if (!recA || !recB || recA.module !== recB.module) return null;
    const def = MODULE_DEFS[recA.module];
    if (!def) return null;
    const t = I18N[lang === 'he' ? 'he' : 'ru'];

    if (isRecordDoeImperial(recA) || isRecordDoeImperial(recB)) {
      return {
        module: recA.module,
        blocked: true,
        blockedReason: 'doe_s21_imperial',
        blockedMessage: t.doeCompareBlocked,
        inputRows: [],
        outputRows: []
      };
    }
    if (isRecord5AKpa(recA) || isRecord5AKpa(recB)) {
      return {
        module: recA.module,
        blocked: true,
        blockedReason: '5a_kpa',
        blockedMessage: t.kpaCompareBlocked,
        inputRows: [],
        outputRows: []
      };
    }

    const UC = root.UnitConverter;
    const EE = root.EconomicsEngine;
    const diffCurrencies = (recA.currency || '$') !== (recB.currency || '$');
    const diffUnitSystems = (recA.savedInUnitSystem || 'si') !== (recB.savedInUnitSystem || 'si');

    const buildRow = (fieldCfg, rawA, rawB, curA, curB) => {
      const label = (fieldCfg.label && (fieldCfg.label[lang] || fieldCfg.label.ru)) || fieldCfg.id || fieldCfg.key;
      const strA = formatValueInActiveUnits(rawA, fieldCfg, lang, sys, curA);
      const strB = formatValueInActiveUnits(rawB, fieldCfg, lang, sys, curB);

      if (fieldCfg.isSelect || rawA === '' || rawA === null || rawA === undefined || rawB === '' || rawB === null || rawB === undefined) {
        return { key: fieldCfg.id || fieldCfg.key, label, strA, strB, diffAbsStr: '—', diffPctStr: '—', diffSi: null, diffActive: null };
      }
      if (diffCurrencies && isMoneyOrTariffField(fieldCfg)) {
        return { key: fieldCfg.id || fieldCfg.key, label, strA, strB, diffAbsStr: '—', diffPctStr: '—', diffSi: null, diffActive: null };
      }
      const numA = Number(rawA);
      const numB = Number(rawB);
      if (!Number.isFinite(numA) || !Number.isFinite(numB)) {
        return { key: fieldCfg.id || fieldCfg.key, label, strA, strB, diffAbsStr: '—', diffPctStr: '—', diffSi: null, diffActive: null };
      }

      const q = fieldCfg.quantity || 'none';
      const diffSi = numB - numA;

      // Для температуры (temp) разница двух температур — это перепад температур (delta_temp)!
      const diffQuantity = q === 'temp' ? 'delta_temp' : q;
      let diffActive = diffSi;
      if (sys === 'us' && UC && UC.QUANTITIES[diffQuantity] && diffQuantity !== 'none' && diffQuantity !== 'si_only' && diffQuantity !== 'money') {
        diffActive = UC.toImperial(diffQuantity, diffSi);
      }

      const sign = diffActive > 0 ? '+' : (diffActive < 0 ? '−' : '');
      const absDiffActive = Math.abs(diffActive);
      const dec = sys === 'us' ? (fieldCfg.decUs !== undefined ? fieldCfg.decUs : 2) : (fieldCfg.decSi !== undefined ? fieldCfg.decSi : 2);

      let diffAbsStr = '';
      if (q === 'money') {
        const cur = curB || curA || '$';
        diffAbsStr = EE ? `${sign}${EE.formatMoney(absDiffActive, cur, 2)}` : `${sign}${cur}${absDiffActive.toFixed(2)}`;
      } else if (q === 'none' || q === 'si_only' || !UC || !UC.QUANTITIES[diffQuantity]) {
        const suffix = fieldCfg.unitSuffix || '';
        diffAbsStr = `${sign}${absDiffActive.toFixed(dec)}${suffix}`;
      } else {
        const unitSym = UC.getUnitSymbol(diffQuantity, lang, sys);
        diffAbsStr = `${sign}${UC.formatWithSpaces(absDiffActive, dec)}${unitSym ? ' ' + unitSym : ''}`;
      }

      let diffPctStr = '—';
      if (Math.abs(numA) > 1e-12) {
        const pct = ((numB - numA) / Math.abs(numA)) * 100;
        const pctSign = pct > 0 ? '+' : (pct < 0 ? '−' : '');
        diffPctStr = `${pctSign}${Math.abs(pct).toFixed(2)}%`;
      }

      return {
        key: fieldCfg.id || fieldCfg.key,
        label,
        strA,
        strB,
        diffAbsStr,
        diffPctStr,
        diffSi,
        diffActive
      };
    };

    const inputRows = def.inputs.map((inp) => buildRow(inp, recA.inputsSi ? recA.inputsSi[inp.id] : undefined, recB.inputsSi ? recB.inputsSi[inp.id] : undefined, recA.currency, recB.currency));
    const outputRows = def.outputs.map((out) => buildRow(out, getRecordOutputVal(recA, out), getRecordOutputVal(recB, out), recA.currency, recB.currency));

    return {
      module: recA.module,
      blocked: false,
      diffCurrencies,
      diffUnitSystems,
      inputRows,
      outputRows
    };
  }

  function exportSavedCalcsToJsonString() {
    const records = loadSavedRecords();
    return JSON.stringify(
      {
        version: SAVED_CALC_FORMAT_VERSION,
        exportedAt: new Date().toISOString(),
        records
      },
      null,
      2
    );
  }

  function importSavedCalcsFromJsonString(jsonStr) {
    const parsed = JSON.parse(jsonStr);
    const list = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.records) ? parsed.records : null);
    if (!list) {
      throw new Error('Invalid saved calculations JSON format');
    }
    if (list.length > MAX_SAVED_CALCS) {
      limitWarningActive = true;
      renderSavedCalcsSection();
      return { ok: false, reason: 'limit_exceeded', max: MAX_SAVED_CALCS };
    }
    limitWarningActive = false;
    const normalized = list.map((r, idx) => {
      const mod = String(r.module || '2').toUpperCase().replace(/-DOE$/, '');
      const cur = r.currency || '$';
      const inputsSi = r.inputsSi || {};
      const resultsSi = r.resultsSi || computeResultsSiFromInputs(mod, inputsSi, cur);
      return {
        id: String(r.id || `calc_imp_${idx + 1}`),
        version: String(r.version || SAVED_CALC_FORMAT_VERSION),
        module: mod,
        savedAt: String(r.savedAt || new Date().toISOString()),
        note: String(r.note || ''),
        noteRu: r.noteRu ? String(r.noteRu) : undefined,
        noteHe: r.noteHe ? String(r.noteHe) : undefined,
        currency: cur,
        savedInUnitSystem: r.savedInUnitSystem || 'si',
        inputsSi,
        resultsSi
      };
    });
    saveRecordsToStorage(normalized);
    renderSavedCalcsSection();
    return { ok: true, count: normalized.length };
  }

  function escapeHtml(str) {
    return String(str === null || str === undefined ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatOptionSummary(rec, lang, sys) {
    if (!rec) return '';
    const def = MODULE_DEFS[rec.module];
    const dateShort = String(rec.savedAt || '').replace('T', ' ').slice(0, 16);
    const note = (lang === 'he' && rec.noteHe) ? rec.noteHe : ((lang !== 'he' && rec.noteRu) ? rec.noteRu : (rec.note || rec.id || ''));
    const keyNums = [];
    if (def && Array.isArray(def.outputs)) {
      for (const out of def.outputs) {
        const val = getRecordOutputVal(rec, out);
        if (val !== null && val !== undefined && val !== '') {
          keyNums.push(`${out.key}: ${formatValueInActiveUnits(val, out, lang, sys, rec.currency)}`);
          if (keyNums.length >= 2) break;
        }
      }
    }
    const numsPart = keyNums.length > 0 ? ` — [${keyNums.join('; ')}]` : '';
    return `[${rec.module}] ${dateShort} · ${note}${numsPart}`;
  }

  function renderSavedCalcsSection() {
    if (typeof document === 'undefined') return;
    const box = document.getElementById('dynamic-saved-calcs-container');
    if (!box) return;

    const lang = (root.AppState && root.AppState.lang === 'he') ? 'he' : 'ru';
    const t = I18N[lang];
    const sys = typeof root.getCalculatorUnitSystem === 'function' ? root.getCalculatorUnitSystem() : 'si';
    const records = loadSavedRecords();

    const filtered = filterModule === 'ALL'
      ? records
      : records.filter((r) => r.module === filterModule);

    if ((!compareIdA || !records.some((r) => r.id === compareIdA)) && filtered.length >= 1) {
      compareIdA = filtered[0].id;
    }
    if ((!compareIdB || !records.some((r) => r.id === compareIdB)) && filtered.length >= 2) {
      const baseMod = (records.find((x) => x.id === compareIdA) || {}).module;
      const second = filtered.find((r) => r.id !== compareIdA && r.module === baseMod) || filtered.find((r) => r.id !== compareIdA);
      if (second) compareIdB = second.id;
    }

    const recA = records.find((r) => r.id === compareIdA) || null;
    const recB = records.find((r) => r.id === compareIdB) || null;
    const compData = (recA && recB && recA.module === recB.module)
      ? computeComparisonRows(recA, recB, lang, sys)
      : null;

    const moduleOptionsHtml = ['ALL', ...Object.keys(MODULE_DEFS)].map((m) => {
      const label = m === 'ALL' ? t.optAllModules : (MODULE_DEFS[m].title[lang] || m);
      return `<option value="${m}" ${filterModule === m ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    }).join('');

    const getRecNote = (r) => {
      if (!r) return '';
      if (lang === 'he' && r.noteHe) return r.noteHe;
      if (lang !== 'he' && r.noteRu) return r.noteRu;
      return r.note || r.id || '';
    };

    const rowsHtml = filtered.length === 0
      ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">${t.emptyList}</td></tr>`
      : filtered.map((rec) => {
          const def = MODULE_DEFS[rec.module];
          let primaryOut = def && def.outputs && def.outputs[0];
          if (rec.module === '1A' && isRecordDoeImperial(rec) && def && def.outputs) {
            primaryOut = def.outputs.find((o) => o.key === 'qThermalKw') || primaryOut;
          }
          const outVal = primaryOut ? getRecordOutputVal(rec, primaryOut) : undefined;
          const primaryStr = (primaryOut && outVal !== undefined && outVal !== null)
            ? `${primaryOut.label[lang]}: <code dir="ltr"><strong>${formatValueInActiveUnits(outVal, primaryOut, lang, sys, rec.currency)}</strong></code>`
            : '—';
          const dateShort = String(rec.savedAt || '').replace('T', ' ').slice(0, 16);
          return `
            <tr data-saved-id="${escapeHtml(rec.id)}">
              <td dir="ltr">${escapeHtml(dateShort)} <span class="badge">${escapeHtml(rec.version || SAVED_CALC_FORMAT_VERSION)}</span></td>
              <td><strong>${escapeHtml(def ? def.title[lang] : rec.module)}</strong></td>
              <td>${escapeHtml(getRecNote(rec))}</td>
              <td>${primaryStr}</td>
              <td>
                <div style="display:flex; flex-wrap:wrap; gap:0.35rem;">
                  <button type="button" class="btn btn-primary btn-sm saved-open-btn" onclick="window.openSavedCalculation('${escapeHtml(rec.id)}')">${t.btnOpen}</button>
                  <button type="button" class="btn btn-sm ${compareIdA === rec.id ? 'btn-primary' : 'btn-outline'}" onclick="window.setSavedCompareSlot('A', '${escapeHtml(rec.id)}')">${t.btnSelectA}</button>
                  <button type="button" class="btn btn-sm ${compareIdB === rec.id ? 'btn-primary' : 'btn-outline'}" onclick="window.setSavedCompareSlot('B', '${escapeHtml(rec.id)}')">${t.btnSelectB}</button>
                  <button type="button" class="btn btn-outline btn-sm saved-delete-btn" onclick="window.deleteSavedCalculation('${escapeHtml(rec.id)}')">${t.btnDelete}</button>
                </div>
              </td>
            </tr>
          `;
        }).join('');

    const compareCandidates = filtered.length > 0 ? filtered : records;
    const selectOptionsA = compareCandidates.map((r) =>
      `<option value="${escapeHtml(r.id)}" ${compareIdA === r.id ? 'selected' : ''}>${escapeHtml(formatOptionSummary(r, lang, sys))}</option>`
    ).join('');
    const selectOptionsB = compareCandidates.map((r) =>
      `<option value="${escapeHtml(r.id)}" ${compareIdB === r.id ? 'selected' : ''}>${escapeHtml(formatOptionSummary(r, lang, sys))}</option>`
    ).join('');

    const selectsBarHtml = compareCandidates.length > 0 ? `
      <div class="saved-compare-selects-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:0.75rem; margin-block-bottom:0.75rem;">
        <div class="field" style="margin:0; min-inline-size:0;">
          <label for="saved-select-compare-a"><strong>${t.lblCompareA}</strong></label>
          <select id="saved-select-compare-a" style="inline-size:100%; max-inline-size:100%;" onchange="window.setSavedCompareSlot('A', this.value)">
            ${selectOptionsA}
          </select>
        </div>
        <div class="field" style="margin:0; min-inline-size:0;">
          <label for="saved-select-compare-b"><strong>${t.lblCompareB}</strong></label>
          <select id="saved-select-compare-b" style="inline-size:100%; max-inline-size:100%;" onchange="window.setSavedCompareSlot('B', this.value)">
            ${selectOptionsB}
          </select>
        </div>
      </div>
    ` : '';

    let compareHtml = '';
    if (compData && compData.blocked) {
      compareHtml = `<div class="warning-box" id="saved-compare-blocked-warning" role="alert" style="margin-block-top:0.65rem;">${escapeHtml(compData.blockedMessage)}</div>`;
    } else if (compData) {
      const renderCompRows = (arr) => arr.map((r) => `
        <tr data-comp-key="${escapeHtml(r.key)}">
          <td data-label="${escapeHtml(t.colParam)}">${escapeHtml(r.label)}</td>
          <td data-label="${escapeHtml(t.colValA)}" dir="ltr">${escapeHtml(r.strA)}</td>
          <td data-label="${escapeHtml(t.colValB)}" dir="ltr">${escapeHtml(r.strB)}</td>
          <td data-label="${escapeHtml(t.colDiffAbs)}" dir="ltr"><strong>${escapeHtml(r.diffAbsStr)}</strong></td>
          <td data-label="${escapeHtml(t.colDiffPct)}" dir="ltr">${escapeHtml(r.diffPctStr)}</td>
        </tr>
      `).join('');

      const noticesHtml = [
        compData.diffUnitSystems ? `<div class="notice-box" id="saved-compare-units-notice" role="status" style="margin-block-top:0.5rem;">${escapeHtml(t.diffUnitSystemNotice)}</div>` : '',
        compData.diffCurrencies ? `<div class="warning-box" id="saved-compare-currency-warning" role="alert" style="margin-block-top:0.5rem;">${escapeHtml(t.diffCurrencyWarning)}</div>` : ''
      ].filter(Boolean).join('');

      compareHtml = `
        ${noticesHtml}
        <div class="table-wrapper saved-comparison-table-wrapper" tabindex="0" role="region" aria-label="${escapeHtml(t.compareTitle)}" style="margin-block-top:0.75rem;">
          <table id="saved-comparison-table" class="responsive-card-table">
            <thead>
              <tr>
                <th>${t.colParam}</th>
                <th>${t.colValA}: ${escapeHtml(getRecNote(recA))}</th>
                <th>${t.colValB}: ${escapeHtml(getRecNote(recB))}</th>
                <th>${t.colDiffAbs}</th>
                <th>${t.colDiffPct}</th>
              </tr>
            </thead>
            <tbody>
              <tr class="comp-group-header-row"><th colspan="5" style="background:var(--bg-subtle); text-align:start;">${t.grpOutputs}</th></tr>
              ${renderCompRows(compData.outputRows)}
              <tr class="comp-group-header-row"><th colspan="5" style="background:var(--bg-subtle); text-align:start;">${t.grpInputs}</th></tr>
              ${renderCompRows(compData.inputRows)}
            </tbody>
          </table>
        </div>
      `;
    } else if (recA && recB && recA.module !== recB.module) {
      compareHtml = `<div class="warning-box" style="margin-block-top:0.65rem;">⚠️ ${t.mismatchModuleWarning}</div>`;
    }

    box.innerHTML = `
      <div class="section-header">
        <div>
          <h2>${t.sectionTitle} (<span dir="ltr">${records.length}/${MAX_SAVED_CALCS}</span>)</h2>
          <p class="section-lead">${t.sectionLead}</p>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
          <button type="button" class="btn btn-secondary btn-sm" id="saved-btn-sample-mod2" onclick="window.loadSampleComparisonModule2()">${t.btnSampleCompare2}</button>
        </div>
      </div>

      ${limitWarningActive ? `<div class="warning-box" id="saved-calcs-limit-warning" role="alert">${t.limitWarning}</div>` : ''}

      <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:0.65rem; margin-block-end:1rem; max-inline-size:100%;">
        <div class="field" style="flex:1 1 240px; max-inline-size:100%; min-inline-size:0;">
          <label for="saved-filter-module"><strong>${t.lblFilterModule}</strong></label>
          <select id="saved-filter-module" style="max-inline-size:100%; inline-size:100%;" onchange="window.setSavedCalcsModuleFilter(this.value)">
            ${moduleOptionsHtml}
          </select>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem; max-inline-size:100%;">
          <button type="button" class="btn btn-outline btn-sm" id="saved-btn-export-json" onclick="window.downloadSavedCalcsJson()">${t.btnExportJson}</button>
          <label class="btn btn-outline btn-sm" style="margin:0; cursor:pointer;">
            ${t.btnImportJson}
            <input type="file" id="saved-input-import-json" accept=".json,application/json" style="display:none;" onchange="window.handleSavedCalcsJsonFile(this)">
          </label>
          <button type="button" class="btn btn-outline btn-sm" id="saved-btn-clear-all" onclick="window.clearAllSavedCalcs()">${t.btnClearAll}</button>
        </div>
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state-card" id="saved-calcs-empty-card">
          <h4>${t.emptyCardTitle}</h4>
          <p>${t.emptyCardDesc}</p>
          <div class="empty-state-actions">
            <a href="#calc" class="btn btn-primary btn-sm">${t.emptyCardBtnCalc}</a>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.loadSampleComparisonModule2()">${t.btnSampleCompare2}</button>
          </div>
        </div>
      ` : ''}

      <div class="table-wrapper" tabindex="0" role="region" aria-label="${escapeHtml(t.sectionTitle)}">
        <table id="saved-calcs-list-table">
          <thead>
            <tr>
              <th>${t.colDate}</th>
              <th>${t.colModule}</th>
              <th>${t.colNote}</th>
              <th>${t.colKeyResult}</th>
              <th>${t.colActions}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div style="margin-block-top:1.25rem; border-block-start:1px solid var(--border-color); padding-block-start:1rem;">
        <h3 style="margin:0 0 0.4rem;">${t.compareTitle}</h3>
        <p style="margin:0 0 0.65rem; font-size:0.9rem; color:var(--text-muted);">${t.compareHint}</p>
        ${selectsBarHtml}
        ${compareHtml}
      </div>
    `;
  }

  function compareCurrentCardWithSaved(moduleCode, btnEl) {
    const lang = (root.AppState && root.AppState.lang === 'he') ? 'he' : 'ru';
    const t = I18N[lang];
    const code = String(moduleCode || '2').toUpperCase().replace(/-DOE$/, '');
    const records = loadSavedRecords();
    const sameMod = records.filter((r) => r.module === code);

    if (sameMod.length === 0) {
      if (typeof document !== 'undefined') {
        const wrapper = btnEl && typeof btnEl.closest === 'function' ? btnEl.closest('.calc-card-wrapper') : null;
        const targetBox = wrapper || document.getElementById(`out-calc-${code.toLowerCase()}`);
        if (targetBox) {
          let hintEl = targetBox.querySelector('.calc-compare-hint-banner');
          if (!hintEl) {
            hintEl = document.createElement('div');
            hintEl.className = 'notice-box calc-compare-hint-banner';
            hintEl.setAttribute('role', 'status');
            hintEl.style.marginTop = '0.5rem';
            targetBox.appendChild(hintEl);
          }
          hintEl.textContent = t.compareNeedSaveHint;
        }
      }
      return { ok: false, reason: 'no_saved_record', module: code };
    }

    filterModule = code;
    const latestRec = sameMod[sameMod.length - 1];
    compareIdA = latestRec.id;
    if (sameMod.length >= 2) {
      compareIdB = sameMod[sameMod.length - 2].id;
    }
    renderSavedCalcsSection();
    if (typeof root.showToolSubview === 'function') {
      root.showToolSubview('sec-saved', { scrollTop: true, focusHeading: false });
    } else if (typeof root.navigateToHash === 'function') {
      root.navigateToHash('#sec-saved');
    }
    return { ok: true, module: code, compareIdA, compareIdB };
  }

  if (typeof root !== 'undefined') {
    root.renderSavedCalcsSection = renderSavedCalcsSection;
    root.saveCalculationFromCard = saveCalculationFromCard;
    root.openSavedCalculation = openSavedCalculation;
    root.deleteSavedCalculation = deleteSavedCalculation;
    root.loadSampleComparisonModule2 = loadSampleComparisonModule2;
    root.compareCurrentCardWithSaved = compareCurrentCardWithSaved;

    root.setSavedCalcsModuleFilter = function (mod) {
      filterModule = mod || 'ALL';
      renderSavedCalcsSection();
    };

    root.setSavedCompareSlot = function (slot, id) {
      if (slot === 'A') compareIdA = id;
      else compareIdB = id;
      renderSavedCalcsSection();
    };

    root.clearAllSavedCalcs = function (skipConfirmForTest) {
      const lang = (root.AppState && root.AppState.lang === 'he') ? 'he' : 'ru';
      if (!skipConfirmForTest && typeof root.confirm === 'function' && !root.confirm(I18N[lang].confirmClearAll)) {
        return false;
      }
      limitWarningActive = false;
      compareIdA = null;
      compareIdB = null;
      saveRecordsToStorage([]);
      renderSavedCalcsSection();
      return true;
    };

    root.downloadSavedCalcsJson = function () {
      const jsonStr = exportSavedCalcsToJsonString();
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'saved_calculations_v12.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return jsonStr;
    };

    root.handleSavedCalcsJsonFile = function (inputEl) {
      const file = inputEl && inputEl.files && inputEl.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          importSavedCalcsFromJsonString(String(e.target.result || ''));
        } catch (_) {}
      };
      reader.readAsText(file);
    };
  }

  return {
    STORAGE_KEY_SAVED_CALCS,
    SAVED_CALC_FORMAT_VERSION,
    MAX_SAVED_CALCS,
    MODULE_DEFS,
    I18N,
    loadSavedRecords,
    saveRecordsToStorage,
    computeResultsSiFromInputs,
    readModuleInputsSiFromDom,
    addSavedRecord,
    saveCalculationFromCard,
    openSavedCalculation,
    deleteSavedCalculation,
    loadSampleComparisonModule2,
    computeComparisonRows,
    compareCurrentCardWithSaved,
    exportSavedCalcsToJsonString,
    importSavedCalcsFromJsonString,
    renderSavedCalcsSection
  };
});
