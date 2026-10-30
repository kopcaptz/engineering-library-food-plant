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
        { key: 'mLossKgH', quantity: 'mass_flow', decSi: 2, decUs: 1, label: { ru: 'Массовый поток потерь конденсата', he: 'ספיקת מסה של הפסדי קונדנסט' } },
        { key: 'vLossM3H', quantity: 'water_flow_m3h', decSi: 3, decUs: 2, label: { ru: 'Объёмный поток потерь воды', he: 'ספיקת נפח של הפסדי מים' } },
        { key: 'qLossKw', quantity: 'power', decSi: 2, decUs: 0, label: { ru: 'Тепловая мощность потерь Q_loss', he: 'הספק תרמי של הפסדים Q_loss' } },
        { key: 'vYearM3', quantity: 'volume', decSi: 1, decUs: 0, label: { ru: 'Потери воды за год', he: 'הפסדי מים בשנה' } },
        { key: 'eFuelYearGJ', quantity: 'energy_gj', decSi: 2, decUs: 2, label: { ru: 'Эквивалент топлива котла за год', he: 'שווה-ערך דלק בדוד בשנה' } },
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
        { key: 'dVentMm', quantity: 'diameter', decSi: 0, decUs: 2, label: { ru: 'Диаметр выхлопной трубы D_vp', he: 'קוטר צינור פליטה D_vp' } },
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
        { key: 'dtEvapC', quantity: 'delta_temp', decSi: 2, decUs: 2, label: { ru: 'Перепад температур ΔT_evap', he: 'מפל טמפרטורות ΔT_evap' } },
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
        { key: 'q2', quantity: 'air_flow_ls', decSi: 2, decUs: 2, label: { ru: 'Приведённый расход Q₂ (FAD)', he: 'ספיקה מומרת Q₂ (FAD)' } },
        { key: 'q2M3Min', quantity: 'air_flow_m3min', decSi: 3, decUs: 2, label: { ru: 'Приведённый расход Q₂ (м³/мин)', he: 'ספיקה מומרת Q₂ (m³/min)' } }
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
        { id: 'c4a_ecc', quantity: 'none', decSi: 1, decUs: 1, label: { ru: 'Проводимость концентрата EC_c (мкСм/см)', he: 'מוליכות רכז EC_c (µS/cm)' } }
      ],
      outputs: [
        { key: 'qfCalc', quantity: 'water_flow_m3h', decSi: 2, decUs: 1, label: { ru: 'Расчётный расход питания Q_f', he: 'ספיקת הזנה מחושבת Q_f' } },
        { key: 'recoveryPct', quantity: 'none', decSi: 2, decUs: 2, unitSuffix: '%', label: { ru: 'Степень извлечения Recovery Y (%)', he: 'אחוז השבה Recovery Y (%)' } },
        { key: 'srEcPct', quantity: 'none', decSi: 2, decUs: 2, unitSuffix: '%', label: { ru: 'Наблюдаемая селективность SR_EC (%)', he: 'דחיית מלחים נצפית SR_EC (%)' } },
        { key: 'cfApproxEc', quantity: 'none', decSi: 2, decUs: 2, label: { ru: 'Фактор концентрирования CF_EC', he: 'פקטור ריכוז CF_EC' } },
        { key: 'bEc', quantity: 'none', decSi: 4, decUs: 4, label: { ru: 'Баланс проводимости B_EC', he: 'מאזן מוליכות B_EC' } }
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
      compareTitle: 'Таблица сравнения двух расчётов одного модуля',
      compareHint: 'Выберите два сохранённых расчёта одного и того же модуля кнопками «А» и «Б» в списке выше (или в выпадающих списках ниже). Значения и разница отображаются в текущих выбранных единицах (SI / US).',
      lblCompareA: 'Расчёт А (базовый):',
      lblCompareB: 'Расчёт Б (сравниваемый):',
      colParam: 'Параметр / результат',
      colValA: 'Расчёт А',
      colValB: 'Расчёт Б',
      colDiffAbs: 'Разница Δ (Б − А)',
      colDiffPct: 'Разница Δ%',
      grpInputs: 'Входные данные',
      grpOutputs: 'Результаты расчёта',
      mismatchModuleWarning: 'Для сравнения выберите две записи одного и того же расчётного модуля.',
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
      compareTitle: 'טבלת השוואה בין שני חישובים מאותו מודול',
      compareHint: 'בחרו שני חישובים שמורים מאותו מודול באמצעות כפתורי "א׳" ו-"ב׳" ברשימה למעלה (או בתיבות הבחירה למטה). הערכים וההפרשים מוצגים ביחידות המידה הפעילות כעת (SI / US).',
      lblCompareA: 'חישוב א׳ (ייחוס):',
      lblCompareB: 'חישוב ב׳ (מושוה):',
      colParam: 'פרמטר / תוצאה',
      colValA: 'חישוב א׳',
      colValB: 'חישוב ב׳',
      colDiffAbs: 'הפרש Δ (ב׳ − א׳)',
      colDiffPct: 'הפרש Δ%',
      grpInputs: 'נתוני קלט',
      grpOutputs: 'תוצאות החישוב',
      mismatchModuleWarning: 'להשוואה יש לבחור שתי רשומות של אותו מודול חישוב.',
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

  // Вычисление точных результатов СИ (resultsSi) из точных входов СИ (inputsSi) через EngineeringCalculators + EconomicsEngine
  function computeResultsSiFromInputs(moduleCode, inputsSi, currency) {
    const EC = root.EngineeringCalculators;
    const EE = root.EconomicsEngine;
    if (!EC) return {};
    const cur = currency || '$';
    const g = (id) => (inputsSi && inputsSi[id] !== undefined ? inputsSi[id] : '');

    if (moduleCode === '1A') {
      const r = EC.calcCondensateFromFlow({
        mode: g('c1a_mode') || 'direct_l_min',
        q_l_min: g('c1a_q_l_min'),
        m_kg_h: g('c1a_m_kg_h'),
        return_pct: g('c1a_ret_pct'),
        t_cond_c: g('c1a_t_cond'),
        t_make_c: g('c1a_t_make'),
        rho_kg_l: g('c1a_rho'),
        cp_kj_kgc: g('c1a_cp'),
        t_shift_h: g('c1a_t_shift'),
        t_year_h: g('c1a_t_year'),
        eta_boiler_pct: g('c1a_eta'),
        lhv_mj_per_unit: g('c1a_lhv'),
        tariff_per_gj: g('c1a_tariff_gj'),
        tariff_per_m3: g('c1a_tariff_water')
      });
      return {
        mLossKgH: r.mLossKgH,
        vLossM3H: r.vLossM3H,
        qLossKw: r.qLossKw,
        vYearM3: r.vYearM3,
        eFuelYearGJ: r.eFuelYearGJ,
        costTotalYear: r.costTotalYear
      };
    }

    if (moduleCode === '1B') {
      const r = EC.calcCondensateFlashAndTLV({
        mc_kg_h: g('c1_mc'),
        p1_barg: g('c1_p1'),
        p2_barg: g('c1_p2'),
        hf1_kj_kg: g('c1_hf1'),
        hf2_kj_kg: g('c1_hf2'),
        hfg2_kj_kg: g('c1_hfg2'),
        dop_mm: g('c1_dop')
      });
      const econ = EE ? EE.calcModule1BEconomics(r, {
        currency: cur,
        t_year_h: g('c1b_t_year'),
        eta_boiler_pct: g('c1b_eta'),
        tariff_per_gj: g('c1b_tariff_gj')
      }) : null;
      return {
        xFlashPct: r.xFlashPct,
        mFlashKgH: r.mFlashKgH,
        dReceiverMm: r.dReceiverMm,
        dVentMm: r.dVentMm,
        qFlashKw: econ ? econ.qFlashKw : (r.mFlashKgH * Number(g('c1_hfg2'))) / 3600,
        costTotalYear: econ ? econ.costTotalYear : null
      };
    }

    if (moduleCode === '2') {
      const r = EC.calcChillerPerformance({
        fluid_type: g('c2_fluid') || 'water',
        vw_m3_h: g('c2_vw'),
        rho_kg_m3: g('c2_rho'),
        cp_kj_kgc: g('c2_cp'),
        t_evap_in_c: g('c2_tin'),
        t_evap_out_c: g('c2_tout'),
        p_el_kw: g('c2_pel'),
        t_sat_evap_c: g('c2_tsat_ev'),
        t_cond_out_c: g('c2_tcond_out'),
        t_sat_cond_c: g('c2_tsat_cd')
      });
      const econ = EE ? EE.calcModule2Economics(r, {
        currency: cur,
        t_year_h: g('c2_t_year'),
        tariff_per_kwh: g('c2_tariff_kwh')
      }) : null;
      return {
        qEvapKw: r.qKw !== undefined ? r.qKw : r.qEvapKw,
        qEvapTr: r.qTr !== undefined ? r.qTr : r.qEvapTr,
        dtEvapC: r.dTevapC !== undefined ? r.dTevapC : (r.dtEvap !== undefined ? r.dtEvap : r.dtEvapC),
        cop: r.cop,
        kwPerTr: r.kwPerTr,
        appEvapC: r.evapApproach !== undefined ? r.evapApproach : r.appEvapC,
        appCondC: r.condApproach !== undefined ? r.condApproach : r.appCondC,
        costTotalYear: econ ? econ.costTotalYear : null
      };
    }

    if (moduleCode === '3A') {
      const r = EC.calcAirFlowConversion({
        q1: g('c3a_q1'),
        p1_abs_bar: g('c3a_p1'),
        t1_c: g('c3a_t1'),
        rh1_pct: g('c3a_rh1'),
        psat1_bar: g('c3a_psat1'),
        p2_abs_bar: g('c3a_p2'),
        t2_c: g('c3a_t2'),
        rh2_pct: g('c3a_rh2'),
        psat2_bar: g('c3a_psat2')
      });
      return {
        q2: r.q2,
        q2M3Min: (r.q2 * 60) / 1000
      };
    }

    if (moduleCode === '3B') {
      const r = EC.calcAirLeaks({
        method: g('c3b_method') || 'receiver_drop',
        v_rec_m3: g('c3b_vr'),
        p1_g_bar: g('c3b_pstart'),
        p2_g_bar: g('c3b_pend'),
        t_min: g('c3b_tdecay'),
        p_atm_bar: g('c3b_patm'),
        q_comp_m3_min: g('c3b_qcomp'),
        t_load_min: g('c3b_tload'),
        t_unload_min: g('c3b_tunload')
      });
      const econ = EE ? EE.calcModule3BEconomics(r, {
        currency: cur,
        spec_power_kw_m3min: g('c3b_spec_power'),
        t_year_h: g('c3b_t_year'),
        tariff_per_kwh: g('c3b_tariff_kwh')
      }) : null;
      return {
        qLeakM3Min: r.qLeakM3Min,
        qLeakLS: r.qLeakLS,
        leakPct: r.leakPct,
        pLeakKw: econ ? econ.pLeakKw : null,
        costTotalYear: econ ? econ.costTotalYear : null
      };
    }

    if (moduleCode === '3C') {
      const r = EC.calcAirMoistureCondensation({
        qc_l_s: g('c3_qc'),
        rh_fraction: g('c3_rh'),
        rho_in_g_m3: g('c3_rho_in'),
        t_amb_k: g('c3_tamb'),
        p_after_abs_bar: g('c3_pafter'),
        t_after_k: g('c3_tafter'),
        rho_out_g_m3: g('c3_rho_out')
      });
      return {
        mCondTempKgH: r.mCondTempKgH,
        mCondIsoKgH: r.mCondIsoKgH
      };
    }

    if (moduleCode === '4A') {
      const r = EC.calcROBalance({
        qp_m3_h: g('c4a_qp'),
        qc_m3_h: g('c4a_qc'),
        qf_meas_m3_h: g('c4a_qf_meas'),
        ec_f_us_cm: g('c4a_ecf'),
        ec_p_us_cm: g('c4a_ecp'),
        ec_c_us_cm: g('c4a_ecc')
      });
      return {
        qfCalc: r.qfCalc,
        recoveryPct: r.recoveryPct,
        srEcPct: r.srEcPct,
        cfApproxEc: r.cfApproxEc,
        bEc: r.bEc
      };
    }

    if (moduleCode === '4B') {
      const r = EC.calcRONormalization({
        qp_o_m3_h: g('c4_qp'),
        qc_o_m3_h: g('c4_qc'),
        qp_s_m3_h: g('c4_qbase'),
        ndp_s_bar: g('c4_ndps'),
        ndp_o_bar: g('c4_ndpo'),
        tcf_s: g('c4_tcfs'),
        tcf_o: g('c4_tcfo'),
        dp_back_bar: g('c4_pp')
      });
      return {
        qsNorm: r.qsNorm,
        normDevPct: r.normDevPct,
        rawDevPct: r.rawDevPct,
        yPct: r.yPct
      };
    }

    if (moduleCode === '5A') {
      const unitSel = g('c5a_unit') || 'bar';
      const engineUnit = unitSel === 'kpa' ? 'kpa' : 'bar';
      const r = EC.calcSteamPressureConversion({
        mode: g('c5a_mode') || 'gauge_to_abs',
        unit: engineUnit,
        p_val: g('c5a_pval'),
        p_atm_bar: g('c5a_patm')
      });
      return {
        pAbsBar: r.pAbsBar,
        pGaugeBar: r.pGaugeBar
      };
    }

    if (moduleCode === '5B') {
      const r = EC.calcSteamLoad({
        load_mode: g('c5_load_mode') || 'direct_kw',
        q_load_kw: g('c5_qkw'),
        mp_kg_h: g('c5_mp'),
        cp_kj_kgc: g('c5_cp'),
        t_in_c: g('c5_tin'),
        t_out_c: g('c5_tout'),
        p_barg_preset: g('c5_steam_preset'),
        hg_kj_kg: g('c5_hg'),
        hf_kj_kg: g('c5_hf'),
        hfg_kj_kg: g('c5_hfg'),
        x_dryness: g('c5_x'),
        sf: g('c5_sf'),
        tds_fw_ppm: g('c5_tdsfw'),
        tds_max_ppm: g('c5_tdsmax')
      });
      const econ = EE ? EE.calcModule5BEconomics(r, {
        currency: cur,
        t_year_h: g('c5_t_year'),
        eta_boiler_pct: g('c5_eta'),
        tariff_per_gj: g('c5_tariff_gj')
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
    const def = MODULE_DEFS[moduleCode];
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
    const moduleCode = String(recordData.module || '2').toUpperCase();
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

  // Сохранение текущего расчёта модуля из карточки калькулятора
  function saveCalculationFromCard(moduleCode, btnEl, optionalNote) {
    const lang = (root.AppState && root.AppState.lang === 'he') ? 'he' : 'ru';
    const t = I18N[lang];
    const code = String(moduleCode || '2').toUpperCase();
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

    if (btnEl && res.ok) {
      const orig = btnEl.textContent;
      btnEl.textContent = lang === 'he' ? '✓ נשמר ב"החישובים שלי"!' : '✓ Сохранено в «Мои расчёты»!';
      setTimeout(() => {
        btnEl.textContent = orig;
      }, 1600);
    }
    return res;
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

  function computeComparisonRows(recA, recB, lang, sys) {
    if (!recA || !recB || recA.module !== recB.module) return null;
    const def = MODULE_DEFS[recA.module];
    if (!def) return null;
    const UC = root.UnitConverter;
    const EE = root.EconomicsEngine;

    const buildRow = (fieldCfg, rawA, rawB, curA, curB) => {
      const label = (fieldCfg.label && (fieldCfg.label[lang] || fieldCfg.label.ru)) || fieldCfg.id || fieldCfg.key;
      const strA = formatValueInActiveUnits(rawA, fieldCfg, lang, sys, curA);
      const strB = formatValueInActiveUnits(rawB, fieldCfg, lang, sys, curB);

      if (fieldCfg.isSelect || rawA === '' || rawA === null || rawA === undefined || rawB === '' || rawB === null || rawB === undefined) {
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

    const inputRows = def.inputs.map((inp) => buildRow(inp, recA.inputsSi[inp.id], recB.inputsSi[inp.id], recA.currency, recB.currency));
    const outputRows = def.outputs.map((out) => buildRow(out, recA.resultsSi[out.key], recB.resultsSi[out.key], recA.currency, recB.currency));

    return { module: recA.module, inputRows, outputRows };
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
      const mod = String(r.module || '2').toUpperCase();
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
      const second = filtered.find((r) => r.id !== compareIdA && r.module === (records.find((x) => x.id === compareIdA) || {}).module);
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
          const primaryOut = def && def.outputs && def.outputs[0];
          const primaryStr = primaryOut
            ? `${primaryOut.label[lang]}: <code dir="ltr"><strong>${formatValueInActiveUnits(rec.resultsSi[primaryOut.key], primaryOut, lang, sys, rec.currency)}</strong></code>`
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

    let compareHtml = '';
    if (compData) {
      const renderCompRows = (arr) => arr.map((r) => `
        <tr data-comp-key="${escapeHtml(r.key)}">
          <td>${escapeHtml(r.label)}</td>
          <td dir="ltr">${escapeHtml(r.strA)}</td>
          <td dir="ltr">${escapeHtml(r.strB)}</td>
          <td dir="ltr"><strong>${escapeHtml(r.diffAbsStr)}</strong></td>
          <td dir="ltr">${escapeHtml(r.diffPctStr)}</td>
        </tr>
      `).join('');

      compareHtml = `
        <div class="table-wrapper" tabindex="0" role="region" aria-label="${escapeHtml(t.compareTitle)}" style="margin-block-top:0.75rem;">
          <table id="saved-comparison-table">
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
              <tr><th colspan="5" style="background:var(--bg-subtle); text-align:start;">${t.grpOutputs}</th></tr>
              ${renderCompRows(compData.outputRows)}
              <tr><th colspan="5" style="background:var(--bg-subtle); text-align:start;">${t.grpInputs}</th></tr>
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
        ${compareHtml}
      </div>
    `;
  }

  if (typeof root !== 'undefined') {
    root.renderSavedCalcsSection = renderSavedCalcsSection;
    root.saveCalculationFromCard = saveCalculationFromCard;
    root.openSavedCalculation = openSavedCalculation;
    root.deleteSavedCalculation = deleteSavedCalculation;
    root.loadSampleComparisonModule2 = loadSampleComparisonModule2;

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
    exportSavedCalcsToJsonString,
    importSavedCalcsFromJsonString,
    renderSavedCalcsSection
  };
});
