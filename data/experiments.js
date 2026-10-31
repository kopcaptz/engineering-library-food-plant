/**
 * 06_web_project/data/experiments.js — Учебные опыты («предположение → расчёт → объяснение»),
 * физический смысл результатов MODULE_MEANING, происхождение входных величин FIELD_ORIGIN
 * и двуязычные строки интерфейса опытов и сравнения (Поручение v15.4).
 *
 * Правила:
 * 1. Все расчёты опытов выполняются только через существующее ядро EngineeringCalculators (calculators.js).
 * 2. Никаких новых формул, выдуманных норм или уставок: каждое пояснение опирается на CALC_METADATA[mod].formula,
 *    блок formulas учебника (#guide-<sys>-formulas) и первоисточники S01–S23.
 * 3. UMD-обёртка: в Node — module.exports, в браузере — window.LEARNING_EXPERIMENTS.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    let EC = root && root.EngineeringCalculators;
    if (!EC && typeof require === 'function') {
      try {
        EC = require('../calculators.js');
      } catch (_) {}
    }
    module.exports = factory(EC);
  } else {
    root.LEARNING_EXPERIMENTS = factory(root.EngineeringCalculators);
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function (EC) {
  'use strict';

  // Для опыта 5Б-3 скрытая теплота h_fg при 10 бар изб. берётся напрямую из таблицы ядра VERIFIED_STEAM_TABLE по p_barg = 10 (без дублирования числа в данных)
  const steamTable = (EC && Array.isArray(EC.VERIFIED_STEAM_TABLE)) ? EC.VERIFIED_STEAM_TABLE : [];
  const steamRow10Barg = steamTable.find((r) => r.p_barg === 10);
  if (!steamRow10Barg) {
    throw new Error('LEARNING_EXPERIMENTS: строка p_barg = 10 не найдена в EngineeringCalculators.VERIFIED_STEAM_TABLE.');
  }
  const hfgAt10Barg = steamRow10Barg.hfg;

  const BASE_1A = Object.freeze({
    mode: 'direct_l_min',
    q_l_min: 6,
    rho_kg_l: 1.0,
    cp_kj_kgc: 4.186,
    t_cond_c: 50,
    t_makeup_c: 20,
    t_shift_h: 8
  });

  const BASE_2 = Object.freeze({
    fluid_type: 'water',
    vw_m3_h: 100,
    rho_kg_m3: 1000,
    cp_kj_kgc: 4.186,
    t_evap_in_c: 12,
    t_evap_out_c: 7,
    p_el_kw: 100
  });

  const BASE_3B_DROP = Object.freeze({
    method: 'receiver_drop',
    v_rec_m3: 10,
    p1_g_bar: 7,
    p2_g_bar: 6,
    t_min: 5,
    p_atm_bar: 1
  });

  const BASE_3B_LOAD = Object.freeze({
    method: 'load_unload',
    t_load_min: 3,
    t_unload_min: 7
  });

  const BASE_4A = Object.freeze({
    qp_m3_h: 7.5,
    qc_m3_h: 2.5,
    ec_f_us_cm: 1000,
    ec_p_us_cm: 10,
    ec_c_us_cm: 3970
  });

  const BASE_4B = Object.freeze({
    qp_o_m3_h: 8,
    qc_o_m3_h: 2,
    qp_s_m3_h: 10,
    ndp_s_bar: 10,
    ndp_o_bar: 10,
    tcf_s: 1.0,
    tcf_o: 0.8
  });

  const BASE_5B = Object.freeze({
    load_mode: 'direct_kw',
    q_load_kw: 350,
    hfg_kj_kg: 2108.1,
    x_dryness: 0.98
  });

  const EXPERIMENTS = Object.freeze([
    // -------------------------------------------------------------------------
    // МОДУЛЬ 1А: Возврат и потери конденсата
    // -------------------------------------------------------------------------
    {
      id: '1A-1',
      moduleId: '1A',
      runFn: 'calcCondensatePrimary',
      uiRunFn: 'runCalc1A',
      base: BASE_1A,
      variant: Object.freeze({ ...BASE_1A, q_l_min: 12 }),
      changed: Object.freeze(['q_l_min']),
      fieldMap: Object.freeze({
        mode: { id: 'c1a_mode', isSelect: true },
        q_l_min: { id: 'c1a_q_l_min' },
        rho_kg_l: { id: 'c1a_rho' },
        cp_kj_kgc: { id: 'c1a_cp' },
        t_cond_c: { id: 'c1a_t_cond' },
        t_makeup_c: { id: 'c1a_t_make' },
        t_shift_h: { id: 'c1a_t_shift' }
      }),
      question: {
        ru: 'Что станет с теряемой тепловой мощностью Q_therm, если объёмный расход потерь горячего конденсата q вырастет вдвое при неизменных температурах конденсата и подпитки?',
        he: 'מה יקרה להספק התרמי האובד Q_therm אם הספיקה הנפחית של הפסדי הקונדנסט החם q תגדל פי שניים בטמפרטורות קבועות של קונדנסט ומי תוספת?'
      },
      options: Object.freeze([
        { ru: 'Вырастет пропорционально расходу', he: 'יגדל ביחס ישר לספיקה' },
        { ru: 'Уменьшится', he: 'יקטן' },
        { ru: 'Не изменится', he: 'לא ישתנה' }
      ]),
      correct: 0,
      expect: Object.freeze({ key: 'qThermalKw', quantity: 'power', direction: 'up', ratio: 2 }),
      explain: {
        ru: 'В формуле чувствительного тепла жидкого конденсата Q = m · c_p · (T_cond − T_make) / 3600 тепловая мощность прямо пропорциональна массовому (и объёмному) расходу потока при неизменном перепаде температур.',
        he: 'בנוסחת החום המורגש של קונדנסט נוזלי Q = m · c_p · (T_cond − T_make) / 3600 ההספק התרמי עומד ביחס ישר לספיקה המסתית (והנפחית) כאשר מפל הטמפרטורות קבוע.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 4 (#guide-steam-formulas)',
      source: 'S01, PDF p. 37; S21, PDF p. 1',
      sourceHref: '#source-S01',
      guideHref: '#guide-steam-formulas'
    },
    {
      id: '1A-2',
      moduleId: '1A',
      runFn: 'calcCondensatePrimary',
      uiRunFn: 'runCalc1A',
      base: BASE_1A,
      variant: Object.freeze({ ...BASE_1A, t_makeup_c: 40 }),
      changed: Object.freeze(['t_makeup_c']),
      fieldMap: Object.freeze({
        mode: { id: 'c1a_mode', isSelect: true },
        q_l_min: { id: 'c1a_q_l_min' },
        rho_kg_l: { id: 'c1a_rho' },
        cp_kj_kgc: { id: 'c1a_cp' },
        t_cond_c: { id: 'c1a_t_cond' },
        t_makeup_c: { id: 'c1a_t_make' },
        t_shift_h: { id: 'c1a_t_shift' }
      }),
      question: {
        ru: 'Что станет с теряемой тепловой мощностью Q_therm относительно подпиточной воды, если температура холодной подпитки T_makeup повысится (сближаясь с T_cond) при том же расходе?',
        he: 'מה יקרה להספק התרמי האובד Q_therm ביחס למי התוספת אם טמפרטורת מי התוספת T_makeup תעלה (ותתקרב ל-T_cond) באותה ספיקה?'
      },
      options: Object.freeze([
        { ru: 'Вырастет', he: 'יגדל' },
        { ru: 'Уменьшится пропорционально сокращению разности (T_cond − T_make)', he: 'יקטן ביחס ישר לצמצום ההפרש (T_cond − T_make)' },
        { ru: 'Не изменится', he: 'לא ישתנה' }
      ]),
      correct: 1,
      expect: Object.freeze({ key: 'qThermalKw', quantity: 'power', direction: 'down', ratio: 1 / 3 }),
      explain: {
        ru: 'Потеря чувствительного тепла конденсата определяется разностью температур (T_cond − T_make): чем теплее исходная подпиточная вода, тем меньше дополнительного тепла требуется на её догрев до температуры конденсата.',
        he: 'אובדן החום המורגש של הקונדנסט נקבע לפי הפרש הטמפרטורות (T_cond − T_make): ככל שמי התוספת חמים יותר מלכתחילה, כך נדרש פחות חום נוסף כדי לחמם אותם לטמפרטורת הקונדנסט.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 4 (#guide-steam-formulas)',
      source: 'S01, PDF p. 37; S21, PDF p. 1',
      sourceHref: '#source-S01',
      guideHref: '#guide-steam-formulas'
    },

    // -------------------------------------------------------------------------
    // МОДУЛЬ 2: Чиллеры (холодопроизводительность и COP)
    // -------------------------------------------------------------------------
    {
      id: '2-1',
      moduleId: '2',
      runFn: 'calcChillerPerformance',
      uiRunFn: 'runCalc2',
      base: BASE_2,
      variant: Object.freeze({ ...BASE_2, vw_m3_h: 120 }),
      changed: Object.freeze(['vw_m3_h']),
      fieldMap: Object.freeze({
        fluid_type: { id: 'c2_fluid', isSelect: true },
        vw_m3_h: { id: 'c2_vw' },
        rho_kg_m3: { id: 'c2_rho' },
        cp_kj_kgc: { id: 'c2_cp' },
        t_evap_in_c: { id: 'c2_tin' },
        t_evap_out_c: { id: 'c2_tout' },
        p_el_kw: { id: 'c2_pel' }
      }),
      question: {
        ru: 'Как изменится холодопроизводительность испарителя Q_evap, если объёмный расход охлаждаемой воды V_w увеличится при том же перепаде температур на испарителе?',
        he: 'כיצד תשתנה תפוקת הקירור של המאייד Q_evap אם הספיקה הנפחית של המים המצוננים V_w תגדל באותו מפל טמפרטורות על פני המאייד?'
      },
      options: Object.freeze([
        { ru: 'Вырастет пропорционально объёмному расходу', he: 'תגדל ביחס ישר לספיקה הנפחית' },
        { ru: 'Уменьшится', he: 'תקטן' },
        { ru: 'Не изменится', he: 'לא תשתנה' }
      ]),
      correct: 0,
      expect: Object.freeze({ key: 'qEvapKw', quantity: 'power', direction: 'up', ratio: 1.2 }),
      explain: {
        ru: 'По уравнению теплового баланса испарителя Q_evap = (V_w · ρ / 3600) · c_p · (T_in − T_out) отводимый тепловой поток линейно растёт с увеличением расхода хладоносителя при фиксированном ΔT.',
        he: 'לפי משוואת מאזן החום של המאייד Q_evap = (V_w · ρ / 3600) · c_p · (T_in − T_out), הספק הקירור גדל באופן ליניארי עם הגדלת ספיקת נוזל הקירור כאשר ΔT קבוע.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 1 (#guide-chillers-formulas)',
      source: 'S08, PDF p. 11, 33; S09, PDF p. 129',
      sourceHref: '#source-S08',
      guideHref: '#guide-chillers-formulas'
    },
    {
      id: '2-2',
      moduleId: '2',
      runFn: 'calcChillerPerformance',
      uiRunFn: 'runCalc2',
      base: BASE_2,
      variant: Object.freeze({ ...BASE_2, t_evap_out_c: 5 }),
      changed: Object.freeze(['t_evap_out_c']),
      fieldMap: Object.freeze({
        fluid_type: { id: 'c2_fluid', isSelect: true },
        vw_m3_h: { id: 'c2_vw' },
        rho_kg_m3: { id: 'c2_rho' },
        cp_kj_kgc: { id: 'c2_cp' },
        t_evap_in_c: { id: 'c2_tin' },
        t_evap_out_c: { id: 'c2_tout' },
        p_el_kw: { id: 'c2_pel' }
      }),
      question: {
        ru: 'Что произойдёт с расчётной холодопроизводительностью Q_evap, если при постоянных V_w и T_evap,in температура воды на выходе испарителя T_evap,out станет ниже (перепад ΔT увеличится)?',
        he: 'מה יקרה לתפוקת הקירור המחושבת Q_evap אם עבור V_w ו-T_evap,in קבועים טמפרטורת המים ביציאת המאייד T_evap,out תהיה נמוכה יותר (כלומר מפל הטמפרטורות ΔT יגדל)?'
      },
      options: Object.freeze([
        { ru: 'Вырастет пропорционально увеличению перепада ΔT_evap', he: 'תגדל ביחס ישר להגדלת מפל הטמפרטורות ΔT_evap' },
        { ru: 'Уменьшится', he: 'תקטן' },
        { ru: 'Не изменится', he: 'לא תשתנה' }
      ]),
      correct: 0,
      expect: Object.freeze({ key: 'qEvapKw', quantity: 'power', direction: 'up', ratio: 1.4 }),
      explain: {
        ru: 'Каждый килограмм воды при большем перепаде температур ΔT_evap = T_evap,in − T_evap,out отдаёт испарителю больше тепла, поэтому при неизменном расходе тепловая нагрузка Q_evap растёт пропорционально ΔT_evap.',
        he: 'כל קילוגרם מים במפל טמפרטורות גדול יותר ΔT_evap = T_evap,in − T_evap,out מוסר למאייד יותר חום, ולכן בספיקה קבועה תפוקת הקירור Q_evap גדלה ביחס ישר ל-ΔT_evap.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 1 (#guide-chillers-formulas)',
      source: 'S08, PDF p. 11, 33; S09, PDF p. 129',
      sourceHref: '#source-S08',
      guideHref: '#guide-chillers-formulas'
    },
    {
      id: '2-3',
      moduleId: '2',
      runFn: 'calcChillerPerformance',
      uiRunFn: 'runCalc2',
      base: BASE_2,
      variant: Object.freeze({ ...BASE_2, p_el_kw: 120 }),
      changed: Object.freeze(['p_el_kw']),
      fieldMap: Object.freeze({
        fluid_type: { id: 'c2_fluid', isSelect: true },
        vw_m3_h: { id: 'c2_vw' },
        rho_kg_m3: { id: 'c2_rho' },
        cp_kj_kgc: { id: 'c2_cp' },
        t_evap_in_c: { id: 'c2_tin' },
        t_evap_out_c: { id: 'c2_tout' },
        p_el_kw: { id: 'c2_pel' }
      }),
      question: {
        ru: 'Что станет с холодильным коэффициентом COP чиллера, если при той же холодопроизводительности Q_evap потребляемая электрическая мощность P_el вырастет?',
        he: 'מה יקרה למקדם היעילות COP של הצ׳ילר אם באותה תפוקת קירור Q_evap ההספק החשמלי הנצרך P_el יגדל?'
      },
      options: Object.freeze([
        { ru: 'Вырастет', he: 'יגדל' },
        { ru: 'Уменьшится обратно пропорционально электрической мощности P_el', he: 'יקטן ביחס הפוך להספק החשמלי P_el' },
        { ru: 'Не изменится', he: 'לא ישתנה' }
      ]),
      correct: 1,
      expect: Object.freeze({ key: 'cop', quantity: 'none', direction: 'down', ratio: 1 / 1.2 }),
      explain: {
        ru: 'Холодильный коэффициент определяется отношением COP = Q_evap / P_el: рост затрат электроэнергии на ту же холодопроизводительность означает снижение энергетической эффективности цикла.',
        he: 'מקדם היעילות מוגדר כיחס COP = Q_evap / P_el: עלייה בצריכת החשמל עבור אותה תפוקת קירור משמעותה ירידה ביעילות האנרגטית של המחזור.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 4 (#guide-chillers-formulas)',
      source: 'S09, PDF p. 129; S10, PDF p. 44–45',
      sourceHref: '#source-S09',
      guideHref: '#guide-chillers-formulas'
    },

    // -------------------------------------------------------------------------
    // МОДУЛЬ 3Б: Оценка утечек сжатого воздуха
    // -------------------------------------------------------------------------
    {
      id: '3B-1',
      moduleId: '3B',
      runFn: 'calcAirLeaks',
      uiRunFn: 'runCalc3B',
      base: BASE_3B_DROP,
      variant: Object.freeze({ ...BASE_3B_DROP, t_min: 10 }),
      changed: Object.freeze(['t_min']),
      fieldMap: Object.freeze({
        method: { id: 'c3b_method', isSelect: true },
        v_rec_m3: { id: 'c3b_vr' },
        p1_g_bar: { id: 'c3b_pstart' },
        p2_g_bar: { id: 'c3b_pend' },
        t_min: { id: 'c3b_tdecay' },
        p_atm_bar: { id: 'c3b_patm' }
      }),
      question: {
        ru: 'В тесте спада давления в ресивере один и тот же перепад (P₁ − P₂) произошёл за вдвое большее время t. Что это означает для расчётного расхода утечек Q_leak?',
        he: 'בבדיקת דעיכת לחץ במכל האוויר אותה ירידת לחץ (P₁ − P₂) התרחשה בפרק זמן t כפול באורכו. מה המשמעות לגבי ספיקת הדליפות המחושבת Q_leak?'
      },
      options: Object.freeze([
        { ru: 'Расход утечек вдвое больше', he: 'ספיקת הדליפות גדולה פי שניים' },
        { ru: 'Расход утечек вдвое меньше (время t стоит в знаменателе)', he: 'ספיקת הדליפות קטנה פי שניים (הזמן t נמצא במכנה)' },
        { ru: 'Расход утечек не зависит от времени спада', he: 'ספיקת הדליפות אינה תלויה בזמן הדעיכה' }
      ]),
      correct: 1,
      expect: Object.freeze({ key: 'qLeakM3Min', quantity: 'air_flow_m3min', direction: 'down', ratio: 0.5 }),
      explain: {
        ru: 'По формуле опорожнения ресивера Q_leak = V_r · (P₁ − P₂) / (t · P_atm) время спада давления t находится в знаменателе: чем медленнее падает давление, тем герметичнее сеть и меньше расход утечек.',
        he: 'לפי נוסחת ריקון המכל Q_leak = V_r · (P₁ − P₂) / (t · P_atm), זמן דעיכת הלחץ t נמצא במכנה: ככל שהלחץ יורד לאט יותר, הרשת אטומה יותר וספיקת הדליפות קטנה יותר.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 2 (#guide-air-formulas)',
      source: 'S12, PDF p. 84; S13, PDF p. 111–112',
      sourceHref: '#source-S12',
      guideHref: '#guide-air-formulas'
    },
    {
      id: '3B-2',
      moduleId: '3B',
      runFn: 'calcAirLeaks',
      uiRunFn: 'runCalc3B',
      base: BASE_3B_DROP,
      variant: Object.freeze({ ...BASE_3B_DROP, v_rec_m3: 20 }),
      changed: Object.freeze(['v_rec_m3']),
      fieldMap: Object.freeze({
        method: { id: 'c3b_method', isSelect: true },
        v_rec_m3: { id: 'c3b_vr' },
        p1_g_bar: { id: 'c3b_pstart' },
        p2_g_bar: { id: 'c3b_pend' },
        t_min: { id: 'c3b_tdecay' },
        p_atm_bar: { id: 'c3b_patm' }
      }),
      question: {
        ru: 'Если тот же спад давления за то же время t зафиксирован в пневмосети с вдвое большим вмещающим объёмом V_r, каким окажется расход утечек Q_leak?',
        he: 'אם אותה ירידת לחץ באותו פרק זמן t נמדדה ברשת אוויר דחוס בעלת נפח אגירה V_r כפול בגודלו, מה תהיה ספיקת הדליפות Q_leak?'
      },
      options: Object.freeze([
        { ru: 'Вырастет вдвое пропорционально объёму сети V_r', he: 'תגדל פי שניים ביחס ישר לנפח הרשת V_r' },
        { ru: 'Уменьшится вдвое', he: 'תקטן פי שניים' },
        { ru: 'Не изменится', he: 'לא תשתנה' }
      ]),
      correct: 0,
      expect: Object.freeze({ key: 'qLeakM3Min', quantity: 'air_flow_m3min', direction: 'up', ratio: 2 }),
      explain: {
        ru: 'Объём системы V_r стоит в числителе формулы Q_leak = V_r · (P₁ − P₂) / (t · P_atm): чтобы уронить давление на ту же величину в большем объёме за то же время, из сети должна выйти пропорционально большая масса воздуха.',
        he: 'נפח המערכת V_r נמצא במונה הנוסחה Q_leak = V_r · (P₁ − P₂) / (t · P_atm): כדי להוריד את הלחץ באותו שיעור בנפח גדול יותר ובאותו זמן, על כמות אוויר גדולה יותר ביחס ישר לדלוף מהרשת.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 2 (#guide-air-formulas)',
      source: 'S12, PDF p. 84; S13, PDF p. 111–112',
      sourceHref: '#source-S12',
      guideHref: '#guide-air-formulas'
    },
    {
      id: '3B-3',
      moduleId: '3B',
      runFn: 'calcAirLeaks',
      uiRunFn: 'runCalc3B',
      base: BASE_3B_LOAD,
      variant: Object.freeze({ ...BASE_3B_LOAD, t_unload_min: 3 }),
      changed: Object.freeze(['t_unload_min']),
      fieldMap: Object.freeze({
        method: { id: 'c3b_method', isSelect: true },
        t_load_min: { id: 'c3b_tload' },
        t_unload_min: { id: 'c3b_tunload' }
      }),
      question: {
        ru: 'При замере цикла «нагрузка / разгрузка» в нерабочую смену время разгрузки (паузы) t_unload сократилось при неизменном времени загрузки t_load. Что произошло с долей утечек Leak %?',
        he: 'במדידת מחזור "העמסה / סרק" במשמרת ללא ייצור, זמן הסרק (ההפסקה) t_unload התקצר בעוד זמן ההעמסה t_load נותר ללא שינוי. מה קרה לאחוז הדליפות Leak %?'
      },
      options: Object.freeze([
        { ru: 'Доля утечек выросла (компрессор чаще включается на подпитку сети)', he: 'אחוז הדליפות גדל (המדחס נכנס להעמסה לעיתים תכופות יותר)' },
        { ru: 'Доля утечек уменьшилась', he: 'אחוז הדליפות קטן' },
        { ru: 'Не изменилась', he: 'לא השתנה' }
      ]),
      correct: 0,
      expect: Object.freeze({ key: 'leakPct', quantity: 'none', unitSuffix: '%', direction: 'up' }),
      explain: {
        ru: 'В формуле цикла Leak % = t_load / (t_load + t_unload) · 100 сокращение паузы разгрузки t_unload уменьшает длительность полного цикла в знаменателе, что означает более частую работу компрессора на компенсацию утечек.',
        he: 'בנוסחת המחזור Leak % = t_load / (t_load + t_unload) · 100 קיצור זמן הסרק t_unload מקטין את משך המחזור הכולל במכנה, ומשמעותו עבודה תכופה יותר של המדחס לפיצוי על דליפות.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 3 (#guide-air-formulas)',
      source: 'S12, PDF p. 84–85',
      sourceHref: '#source-S12',
      guideHref: '#guide-air-formulas'
    },

    // -------------------------------------------------------------------------
    // МОДУЛЬ 4А: Баланс потоков и селективность RO
    // -------------------------------------------------------------------------
    {
      id: '4A-1',
      moduleId: '4A',
      runFn: 'calcROBalance',
      uiRunFn: 'runCalc4A',
      base: BASE_4A,
      variant: Object.freeze({ ...BASE_4A, qc_m3_h: 5 }),
      changed: Object.freeze(['qc_m3_h']),
      fieldMap: Object.freeze({
        qp_m3_h: { id: 'c4a_qp' },
        qc_m3_h: { id: 'c4a_qc' },
        ec_f_us_cm: { id: 'c4a_ecf' },
        ec_p_us_cm: { id: 'c4a_ecp' },
        ec_c_us_cm: { id: 'c4a_ecc' }
      }),
      question: {
        ru: 'Как изменится степень извлечения пермеата Recovery Y (%), если при неизменном расходе пермеата Q_p открыть клапан сброса и увеличить расход концентрата Q_c?',
        he: 'כיצד ישתנה אחוז ההשבה Recovery Y (%) אם בספיקת תוצר Q_p קבועה נפתח את שסתום הרכז ונגדיל את ספיקת הרכז Q_c?'
      },
      options: Object.freeze([
        { ru: 'Вырастет', he: 'יגדל' },
        { ru: 'Уменьшится (большая доля питательной воды уходит в концентрат)', he: 'יקטן (חלק גדול יותר ממי ההזנה מופנה לרכז)' },
        { ru: 'Не изменится', he: 'לא ישתנה' }
      ]),
      correct: 1,
      expect: Object.freeze({ key: 'recoveryPct', quantity: 'none', unitSuffix: '%', direction: 'down' }),
      explain: {
        ru: 'По определению Recovery Y = Q_p / (Q_p + Q_c) · 100 увеличение потока концентрата Q_c при фиксированном Q_p увеличивает общий расход питания в знаменателе и снижает долю отбора пермеата.',
        he: 'לפי הגדרת Recovery Y = Q_p / (Q_p + Q_c) · 100, הגדלת ספיקת הרכז Q_c עבור Q_p קבוע מגדילה את ספיקת ההזנה הכוללת במכנה ומקטינה את חלק התוצר המופק.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 1 (#guide-ro-formulas)',
      source: 'S16, PDF p. 35, 102, 152',
      sourceHref: '#source-S16',
      guideHref: '#guide-ro-formulas'
    },
    {
      id: '4A-2',
      moduleId: '4A',
      runFn: 'calcROBalance',
      uiRunFn: 'runCalc4A',
      base: BASE_4A,
      variant: Object.freeze({ ...BASE_4A, ec_p_us_cm: 50 }),
      changed: Object.freeze(['ec_p_us_cm']),
      fieldMap: Object.freeze({
        qp_m3_h: { id: 'c4a_qp' },
        qc_m3_h: { id: 'c4a_qc' },
        ec_f_us_cm: { id: 'c4a_ecf' },
        ec_p_us_cm: { id: 'c4a_ecp' },
        ec_c_us_cm: { id: 'c4a_ecc' }
      }),
      question: {
        ru: 'Что произойдёт с наблюдаемой селективностью мембран по проводимости SR_EC (%), если проводимость пермеата EC_p вырастет при неизменной проводимости исходной воды EC_f?',
        he: 'מה יקרה לדחיית המלחים הנצפית לפי מוליכות SR_EC (%) אם מוליכות התוצר EC_p תעלה בעוד מוליכות מי ההזנה EC_f נותרת קבועה?'
      },
      options: Object.freeze([
        { ru: 'Селективность вырастет', he: 'דחיית המלחים תגדל' },
        { ru: 'Селективность снизится (проскок солей SP_EC = EC_p / EC_f вырос)', he: 'דחיית המלחים תרד (מעבר המלחים SP_EC = EC_p / EC_f גדל)' },
        { ru: 'Не изменится', he: 'לא תשתנה' }
      ]),
      correct: 1,
      expect: Object.freeze({ key: 'srEcPct', quantity: 'none', unitSuffix: '%', direction: 'down' }),
      explain: {
        ru: 'Наблюдаемая селективность вычисляется как SR_EC = (1 − EC_p / EC_f) · 100%: рост электропроводности пермеата при неизменном входе означает увеличение солевого проскока через мембраны или уплотнения.',
        he: 'דחיית המלחים הנצפית מחושבת לפי SR_EC = (1 − EC_p / EC_f) · 100%: עלייה במוליכות התוצר ביחס להזנה קבועה פירושה עלייה במעבר המלחים דרך הממברנות או האטמים.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 2 (#guide-ro-formulas)',
      source: 'S16, PDF p. 35, 102',
      sourceHref: '#source-S16',
      guideHref: '#guide-ro-formulas'
    },

    // -------------------------------------------------------------------------
    // МОДУЛЬ 4Б: Нормализация потока пермеата RO (Eq. 72 [S16])
    // -------------------------------------------------------------------------
    {
      id: '4B-1',
      moduleId: '4B',
      runFn: 'calcRONormalization',
      uiRunFn: 'runCalc4',
      base: BASE_4B,
      variant: Object.freeze({ ...BASE_4B, tcf_o: 1.0 }),
      changed: Object.freeze(['tcf_o']),
      fieldMap: Object.freeze({
        qp_o_m3_h: { id: 'c4_qp' },
        qc_o_m3_h: { id: 'c4_qc' },
        qp_s_m3_h: { id: 'c4_qbase' },
        ndp_s_bar: { id: 'c4_ndps' },
        ndp_o_bar: { id: 'c4_ndpo' },
        tcf_s: { id: 'c4_tcfs' },
        tcf_o: { id: 'c4_tcfo' }
      }),
      question: {
        ru: 'При одном и том же фактическом расходе пермеата Q_po и одинаковой движущей силе NDP текущий температурный коэффициент TCF_o оказался выше (вода теплее). Как изменится приведённый к эталону поток Q_s?',
        he: 'עבור אותה ספיקת תוצר בפועל Q_po ואותו כוח מניע NDP, מקדם הטמפרטורה הנוכחי TCF_o גבוה יותר (המים חמים יותר). כיצד תשתנה הספיקה המנורמלת לתנאי ההרצה Q_s?'
      },
      options: Object.freeze([
        { ru: 'Нормализованный поток Q_s вырастет', he: 'הספיקה המנורמלת Q_s תגדל' },
        { ru: 'Нормализованный поток Q_s уменьшится (TCF_o стоит в знаменателе Eq. 72)', he: 'הספיקה המנורמלת Q_s תקטן (TCF_o נמצא במכנה של משוואה 72)' },
        { ru: 'Не изменится', he: 'לא תשתנה' }
      ]),
      correct: 1,
      expect: Object.freeze({ key: 'qsNorm', quantity: 'water_flow_m3h', direction: 'down', ratio: 0.8 }),
      explain: {
        ru: 'В формуле нормализации Q_s = Q_po · (NDP_s / NDP_o) · (TCF_s / TCF_o) коэффициент TCF_o стоит в знаменателе: если тот же расход Q_po получен на более тёплой и менее вязкой воде (больший TCF_o), то в пересчёте на эталонную температуру проницаемость мембраны ниже.',
        he: 'בנוסחת הנרמול Q_s = Q_po · (NDP_s / NDP_o) · (TCF_s / TCF_o) המקדם TCF_o נמצא במכנה: אם אותה ספיקה Q_po התקבלה במים חמים וצמיגים פחות (TCF_o גבוה יותר), הרי שבהמרה לטמפרטורת הייחוס חדירות הממברנה נמוכה יותר.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 4 (Eq. 72, #guide-ro-formulas)',
      source: 'S16, PDF p. 131–133, Eq. 72',
      sourceHref: '#source-S16',
      guideHref: '#guide-ro-formulas'
    },
    {
      id: '4B-2',
      moduleId: '4B',
      runFn: 'calcRONormalization',
      uiRunFn: 'runCalc4',
      base: BASE_4B,
      variant: Object.freeze({ ...BASE_4B, ndp_o_bar: 12 }),
      changed: Object.freeze(['ndp_o_bar']),
      fieldMap: Object.freeze({
        qp_o_m3_h: { id: 'c4_qp' },
        qc_o_m3_h: { id: 'c4_qc' },
        qp_s_m3_h: { id: 'c4_qbase' },
        ndp_s_bar: { id: 'c4_ndps' },
        ndp_o_bar: { id: 'c4_ndpo' },
        tcf_s: { id: 'c4_tcfs' },
        tcf_o: { id: 'c4_tcfo' }
      }),
      question: {
        ru: 'Чтобы удержать прежний расход пермеата Q_po при той же температуре, насосу пришлось поднять текущую чистую движущую силу NDP_o. Что покажет нормализованный поток Q_s?',
        he: 'כדי לשמור על אותה ספיקת תוצר Q_po באותה טמפרטורה, נדרש להעלות את הכוח המניע הנטו הנוכחי NDP_o. מה תראה הספיקה המנורמלת Q_s?'
      },
      options: Object.freeze([
        { ru: 'Вырастет', he: 'תגדל' },
        { ru: 'Снизится обратно пропорционально NDP_o (признак загрязнения/зарастания мембран)', he: 'תרד ביחס הפוך ל-NDP_o (סימן לאילוח או השקעת אבנית בממברנות)' },
        { ru: 'Не изменится', he: 'לא תשתנה' }
      ]),
      correct: 1,
      expect: Object.freeze({ key: 'qsNorm', quantity: 'water_flow_m3h', direction: 'down', ratio: 1 / 1.2 }),
      explain: {
        ru: 'По уравнению Eq. 72 Q_s = Q_po · (NDP_s / NDP_o) · (TCF_s / TCF_o) текущая движущая сила NDP_o стоит в знаменателе: если для получения того же потока требуется большее эффективное давление, приведённая производительность Q_s падает.',
        he: 'לפי משוואה 72 Q_s = Q_po · (NDP_s / NDP_o) · (TCF_s / TCF_o) הכוח המניע הנוכחי NDP_o נמצא במכנה: אם נדרש לחץ אפקטיבי גבוה יותר כדי להפיק את אותה ספיקה, הספיקה המנורמלת Q_s יורדת.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 4 (Eq. 72, #guide-ro-formulas)',
      source: 'S16, PDF p. 131–133, Eq. 72',
      sourceHref: '#source-S16',
      guideHref: '#guide-ro-formulas'
    },

    // -------------------------------------------------------------------------
    // МОДУЛЬ 5Б: Расход насыщенного пара и продувка по TDS
    // -------------------------------------------------------------------------
    {
      id: '5B-1',
      moduleId: '5B',
      runFn: 'calcSteamLoad',
      uiRunFn: 'runCalc5',
      base: BASE_5B,
      variant: Object.freeze({ ...BASE_5B, x_dryness: 0.90 }),
      changed: Object.freeze(['x_dryness']),
      fieldMap: Object.freeze({
        load_mode: { id: 'c5_load_mode', isSelect: true },
        q_load_kw: { id: 'c5_qkw' },
        hfg_kj_kg: { id: 'c5_hfg' },
        x_dryness: { id: 'c5_x' }
      }),
      question: {
        ru: 'Как изменится требуемый массовый расход пара m_steam при неизменной тепловой нагрузке Q_load, если степень сухости пара x снизится (пар станет более влажным)?',
        he: 'כיצד תשתנה ספיקת הקיטור המסתית הנדרשת m_steam בעומס חום Q_load קבוע אם דרגת היובש של הקיטור x תרד (הקיטור יהיה רטוב יותר)?'
      },
      options: Object.freeze([
        { ru: 'Потребуется больший массовый расход пара (полезная теплота x · h_fg на 1 кг снизилась)', he: 'תידרש ספיקת קיטור מסתית גדולה יותר (החום השימושי x · h_fg לק״ג ירד)' },
        { ru: 'Потребуется меньший расход пара', he: 'תידרש ספיקת קיטור קטנה יותר' },
        { ru: 'Расход пара не зависит от степени сухости x', he: 'ספיקת הקיטור אינה תלויה בדרגת היובש x' }
      ]),
      correct: 0,
      expect: Object.freeze({ key: 'mSteamKgH', quantity: 'mass_flow', direction: 'up', ratio: 0.98 / 0.90 }),
      explain: {
        ru: 'Капельная влага в влажном паре уже не несёт скрытой теплоты конденсации h_fg, поэтому полезная теплота каждого килограмма равна h_useful = x · h_fg, а требуемый расход пара m_steam = Q_load · 3600 / (x · h_fg) растёт обратно пропорционально сухости x.',
        he: 'טיפות המים בקיטור רטוב אינן נושאות עוד חום כמוס h_fg, ולכן החום השימושי של כל קילוגרם הוא h_useful = x · h_fg, וספיקת הקיטור הנדרשת m_steam = Q_load · 3600 / (x · h_fg) גדלה ביחס הפוך לדרגת היובש x.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 2 (#guide-steam-formulas)',
      source: 'S01, PDF p. 25',
      sourceHref: '#source-S01',
      guideHref: '#guide-steam-formulas'
    },
    {
      id: '5B-2',
      moduleId: '5B',
      runFn: 'calcSteamLoad',
      uiRunFn: 'runCalc5',
      base: BASE_5B,
      variant: Object.freeze({ ...BASE_5B, q_load_kw: 700 }),
      changed: Object.freeze(['q_load_kw']),
      fieldMap: Object.freeze({
        load_mode: { id: 'c5_load_mode', isSelect: true },
        q_load_kw: { id: 'c5_qkw' },
        hfg_kj_kg: { id: 'c5_hfg' },
        x_dryness: { id: 'c5_x' }
      }),
      question: {
        ru: 'Что станет с расчётным массовым расходом пара m_steam, если тепловая нагрузка аппарата Q_load вырастет вдвое при том же давлении и сухости пара?',
        he: 'מה יקרה לספיקת הקיטור המסתית המחושבת m_steam אם עומס החום של המתקן Q_load יגדל פי שניים באותו לחץ ובאותה דרגת יובש?'
      },
      options: Object.freeze([
        { ru: 'Вырастет вдвое пропорционально тепловой нагрузке Q_load', he: 'תגדל פי שניים ביחס ישר לעומס החום Q_load' },
        { ru: 'Уменьшится вдвое', he: 'תקטן פי שניים' },
        { ru: 'Не изменится', he: 'לא תשתנה' }
      ]),
      correct: 0,
      expect: Object.freeze({ key: 'mSteamKgH', quantity: 'mass_flow', direction: 'up', ratio: 2 }),
      explain: {
        ru: 'В формуле m_steam = (Q_load · 3600) / (x · h_fg) тепловая нагрузка Q_load стоит в числителе: при неизменном состоянии пара требуемый массовый расход прямо пропорционален передаваемой мощности.',
        he: 'בנוסחה m_steam = (Q_load · 3600) / (x · h_fg) עומס החום Q_load נמצא במונה: במצב קיטור קבוע הספיקה המסתית הנדרשת עומדת ביחס ישר להספק התרמי המועבר.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 2 (#guide-steam-formulas)',
      source: 'S01, PDF p. 25',
      sourceHref: '#source-S01',
      guideHref: '#guide-steam-formulas'
    },
    {
      id: '5B-3',
      moduleId: '5B',
      runFn: 'calcSteamLoad',
      uiRunFn: 'runCalc5',
      base: BASE_5B,
      variant: Object.freeze({ ...BASE_5B, hfg_kj_kg: hfgAt10Barg }),
      changed: Object.freeze(['hfg_kj_kg']),
      fieldMap: Object.freeze({
        load_mode: { id: 'c5_load_mode', isSelect: true },
        q_load_kw: { id: 'c5_qkw' },
        hfg_kj_kg: {
          id: 'c5_hfg',
          selectId: 'c5_steam_preset',
          baseSelectValue: '4',
          variantSelectValue: '10'
        },
        x_dryness: { id: 'c5_x' }
      }),
      question: {
        ru: 'Как изменится массовый расход пара m_steam для той же тепловой нагрузки Q_load, если поднять давление насыщенного пара с 4 до 10 бар изб. по таблице насыщения?',
        he: 'כיצד תשתנה ספיקת הקיטור המסתית m_steam עבור אותו עומס חום Q_load אם מעלים את לחץ הקיטור הרווי מ-4 ל-10 bar g לפי טבלת הרוויה?'
      },
      options: Object.freeze([
        { ru: 'Массовый расход пара увеличится (с ростом давления скрытая теплота h_fg убывает)', he: 'ספיקת הקיטור המסתית תגדל (עם עליית הלחץ החום הכמוס h_fg קטן)' },
        { ru: 'Массовый расход пара уменьшится', he: 'ספיקת הקיטור המסתית תקטן' },
        { ru: 'Не изменится', he: 'לא תשתנה' }
      ]),
      correct: 0,
      expect: Object.freeze({ key: 'mSteamKgH', quantity: 'mass_flow', direction: 'up' }),
      explain: {
        ru: 'По таблице насыщенного пара IAPWS-IF97 с ростом давления растёт температура кипения и энтальпия жидкости h_f, а удельная скрытая теплота конденсации h_fg снижается — поэтому для передачи той же мощности Q_load требуется больше килограммов пара в час.',
        he: 'לפי טבלת הקיטור הרווי IAPWS-IF97, עם עליית הלחץ עולות טמפרטורת הרתיחה ואנתלפיית הנוזל h_f, ואילו החום הכמוס הסגולי של העיבוי h_fg יורד — לכן להעברת אותו הספק Q_load נדרשים יותר קילוגרמים של קיטור בשעה.'
      },
      formulaRef: 'CALC_METADATA',
      formulaSectionRef: 'Формула 2 и Таблица 1.1 (#guide-steam-formulas)',
      source: 'S01, PDF p. 25, 42; IAPWS-IF97',
      sourceHref: '#source-S01',
      guideHref: '#guide-steam-formulas'
    }
  ]);

  // ---------------------------------------------------------------------------
  // 2.1b. MODULE_MEANING — физический смысл результата («Что это значит») для 10 модулей
  // ---------------------------------------------------------------------------
  const MODULE_MEANING = Object.freeze({
    '1A': {
      ru: 'Показывает, сколько чувствительного тепла и подготовленной воды теряется со сбросом горячего конденсата (или возвращается в котельную) относительно холодной подпитки, и сколько дополнительного топлива котёл тратит на догрев свежей воды.',
      he: 'מציג כמה חום מורגש ומים מטופלים אובדים עם ניקוז קונדנסט חם (או מוחזרים לחדר הדוודים) ביחס למי תוספת קרים, וכמה דלק נוסף הדוד צורך כדי לחמם מים טריים.',
      source: 'CALC_METADATA["1A"].formula; #guide-steam-formulas (Формула 4); [S01, PDF p. 37; S21, PDF p. 1]'
    },
    '1B': {
      ru: 'Показывает, какая массовая доля горячего конденсата мгновенно вскипает во вторичный пар (Flash Steam) при сбросе давления с P₁ до P₂ из-за избытка энтальпии жидкости h_f(P₁) > h_f(P₂), и какого диаметра нужны ресивер и выхлопная труба по таблицам TLV, чтобы выпустить пар без опасного противодавления.',
      he: 'מציג איזה חלק מסתי מהקונדנסט החם מתאדה מיידית לקיטור משני (Flash Steam) בעת הפחתת לחץ מ-P₁ ל-P₂ עקב עודף אנתלפיית הנוזל h_f(P₁) > h_f(P₂), ומהם קוטרי המכל וצינור הפליטה הנדרשים לפי טבלאות TLV לשחרור הקיטור ללא לחץ נגדי מסוכן.',
      source: 'CALC_METADATA["1B"].formula; #guide-steam-formulas (Формула 3); [S01, PDF p. 33; S07, PDF p. 15]'
    },
    '2': {
      ru: 'Связывает фактическую холодопроизводительность испарителя Q_evap с электрической мощностью чиллера (COP и кВт/TR) и температурными напорами сближения (Approach) в испарителе и конденсаторе, позволяя отделить изменение внешней нагрузки от загрязнения теплообменников.',
      he: 'מקשר בין תפוקת הקירור בפועל של המאייד Q_evap לבין ההספק החשמלי של הצ׳ילר (COP ו-kW/TR) ומפלי הגישה הטמפרטוריים (Approach) במאייד ובמעבה, ומאפשר להבחין בין שינוי בעומס החיצוני לבין אילוח של מחליפי החום.',
      source: 'CALC_METADATA["2"].formula; #guide-chiller-formulas (Формулы 1–4); [S08, PDF p. 11, 33; S09, PDF p. 129; S10, PDF p. 44–45]'
    },
    '3A': {
      ru: 'Переводит паспортный расход сухого воздуха из стандартных (нормальных) условий в фактический объёмный расход на всасе компрессора (FAD) с учётом реального давления, температуры и парциального давления водяного пара.',
      he: 'מתרגם ספיקת אוויר יבש מתנאי ייחוס תקניים לספיקה נפחית בפועל בתנאי היניקה של המדחס (FAD), תוך התחשבות בלחץ, בטמפרטורה ובלחץ החלקי של אדי המים באתר.',
      source: 'CALC_METADATA["3A"].formula; #guide-air-formulas (Формула 1); [S13, PDF p. 102–103]'
    },
    '3B': {
      ru: 'Оценивает объёмный расход непроизводительных утечек сжатого воздуха и электрическую мощность, которую компрессор непрерывно тратит впустую на поддержание давления в негерметичной сети.',
      he: 'מעריך את הספיקה הנפחית של דליפות אוויר דחוס בלתי-יצרניות ואת ההספק החשמלי שהמדחס מבזבז ברציפות רק כדי לשמור על הלחץ ברשת לא אטומה.',
      source: 'CALC_METADATA["3B"].formula; #guide-air-formulas (Формулы 2–3); [S12, PDF p. 52–53, 84–85; S13, PDF p. 111–112]'
    },
    '3C': {
      ru: 'Показывает, сколько килограммов жидкого конденсата в час выпадает из влажного атмосферного воздуха после его сжатия и охлаждения, поскольку сжатый до малого объёма воздух больше не может удерживать прежнюю массу водяного пара.',
      he: 'מציג כמה קילוגרמים לשעה של מים נוזליים מתעבים מהאוויר האטמוספרי הלח לאחר דחיסתו וקירורו, משום שהאוויר שנדחס לנפח קטן אינו יכול עוד להכיל את אותה מסת אדי מים.',
      source: 'CALC_METADATA["3C"].formula; #guide-air-formulas (Формула 4); [S13, Section 5.4.1, PDF p. 102–103]'
    },
    '4A': {
      ru: 'Проверяет сходимость водного и солевого баланса установки обратного осмоса (Q_f = Q_p + Q_c, B_EC ≈ 1.00), определяет долю отбора пермеата Recovery Y, видимую селективность мембран и степень концентрирования рассола у поверхности мембран.',
      he: 'בודק את סגירת מאזן המים והמלחים של מתקן האוסמוזה ההפוכה (Q_f = Q_p + Q_c, B_EC ≈ 1.00), וקובע את אחוז ההשבה Recovery Y, את דחיית המלחים הנצפית ואת פקטור הריכוז של הרכז על פני הממברנות.',
      source: 'CALC_METADATA["4A"].formula; #guide-ro-formulas (Формулы 1–3, Eq. 80); [S16, PDF p. 35, 102, 152]'
    },
    '4B': {
      ru: 'Приводит текущий расход пермеата Q_po к пусковым (эталонным) температуре и чистой движущей силе по уравнению Eq. 72 [S16], позволяя отличить обратимое влияние холодной воды или снижения давления от реального загрязнения (fouling/scaling) и деградации мембран.',
      he: 'מנרמל את ספיקת התוצר הנוכחית Q_po לטמפרטורת ההרצה ולכוח המניע הנטו המקורי לפי משוואה 72 [S16], ומאפשר להבדיל בין השפעה הפיכה של מים קרים או שינוי לחץ לבין אילוח ממשי (fouling/scaling) או פגיעה בממברנות.',
      source: 'CALC_METADATA["4B"].formula; #guide-ro-formulas (Формула 4, Eq. 72); [S16, PDF p. 106, 131–133, 165]'
    },
    '5A': {
      ru: 'Переводит показания манометра (избыточное давление P_gauge) в абсолютное термодинамическое давление P_abs = P_gauge + P_atm (и обратно), от которого зависят истинная температура насыщения пара и плотность газа.',
      he: 'מתרגם את קריאת מד הלחץ (לחץ מד P_gauge) ללחץ תרמודינמי מוחלט P_abs = P_gauge + P_atm (ולהפך), שעליו נשענות טמפרטורת הרוויה האמיתית של הקיטור וצפיפות הגז.',
      source: 'CALC_METADATA["5A"].formula; #guide-steam-formulas (Формула 1); [S01, PDF p. 16]'
    },
    '5B': {
      ru: 'Определяет массовый расход пара m_steam, необходимый для покрытия тепловой нагрузки Q_load за счёт полезной скрытой теплоты конденсации h_useful = x · h_fg, а также расчётную пропускную способность конденсатоотводчика (с запасом SF) и непрерывную продувку котла по солевому балансу TDS.',
      he: 'קובע את ספיקת הקיטור המסתית m_steam הנדרשת לכיסוי עומס החום Q_load באמצעות חום העיבוי הכמוס השימושי h_useful = x · h_fg, וכן את ספיקת התכנון של מלכודת הקיטור (עם מקדם ביטחון SF) ואת ניקוז הדוד הרציף לפי מאזן מליחות TDS.',
      source: 'CALC_METADATA["5B"].formula; #guide-steam-formulas (Формулы 2, 5); [S01, PDF p. 25, 34; S22, PDF p. 1]'
    }
  });

  // ---------------------------------------------------------------------------
  // 2.1c. FIELD_ORIGIN_META и FIELD_ORIGIN — классификация всех 102 полей калькуляторов
  // ('measured' — показания приборов; 'assumed' — принятые значения/режимы; 'reference' — табличные величины)
  // ---------------------------------------------------------------------------
  const FIELD_ORIGIN_META = Object.freeze({
    // Модуль 1А (14 полей)
    c1a_mode: { origin: 'assumed', controversial: false, ru: 'Выбор расчётного режима ввода исходных данных', he: 'בחירת מצב החישוב להזנת נתוני הקלט' },
    c1a_q_l_min: { origin: 'measured', controversial: false, ru: 'Замер объёмного расхода потерь конденсата (мерный бак и секундомер или расходомер)', he: 'מדידת ספיקה נפחית של הפסדי קונדנסט (מכל מדידה ושעון עצר או מד ספיקה)' },
    c1a_m_kg_h: { origin: 'measured', controversial: true, ru: 'Показание расходомера конденсата/пара (спорное: в режиме доли возврата расход пара может браться по паспорту котла)', he: 'קריאת מד ספיקת קונדנסט/קיטור (גבולי: במצב אחוז השבה ספיקת הקיטור עשויה להילקח מנתוני הדוד)' },
    c1a_ret_pct: { origin: 'assumed', controversial: false, ru: 'Принятая или оценочная доля возврата конденсата в котельную (%)', he: 'אחוז מוערך או מונח של השבת קונדנסט לחדר הדוודים (%)' },
    c1a_t_cond: { origin: 'measured', controversial: true, ru: 'Измеренная термометром температура конденсата T_cond (спорное: в режиме DOE S21 в это же поле вводится табличная энтальпия h_f)', he: 'טמפרטורת קונדנסט T_cond הנמדדת במדחום (גבולי: במצב DOE S21 מוזנת בשדה זה אנתלפיה טבלאית h_f)' },
    c1a_t_make: { origin: 'measured', controversial: true, ru: 'Измеренная термометром температура подпиточной воды T_make (спорное: в режиме DOE S21 вводится табличная энтальпия h_f)', he: 'טמפרטורת מי תוספת T_make הנמדדת במדחום (גבולי: במצב DOE S21 מוזנת אנתלפיה טבלאית h_f)' },
    c1a_rho: { origin: 'assumed', controversial: true, ru: 'Принятая расчётная плотность воды ρ (по правилу п. 2.1c отнесено к assumed; также может браться по таблицам свойств воды)', he: 'צפיפות מים מונחת לחישוב ρ (לפי כלל 2.1c מסווג כ-assumed; ניתן לקחת גם מטבלאות תכונות מים)' },
    c1a_cp: { origin: 'assumed', controversial: true, ru: 'Принятая удельная теплоёмкость жидкой воды c_p (по правилу п. 2.1c отнесено к assumed; также справочная величина)', he: 'קיבול חום סגולי מונח של מים נוזליים c_p (לפי כלל 2.1c מסווג כ-assumed; גם ערך ייחוס)' },
    c1a_t_shift: { origin: 'assumed', controversial: false, ru: 'Принятая расчётная длительность рабочей смены (ч)', he: 'משך משמרת עבודה מונח לחישוב (שעות)' },
    c1a_t_year: { origin: 'assumed', controversial: false, ru: 'Принятая годовая наработка оборудования (ч/год)', he: 'שעות עבודה שנתיות מונחות של הציוד (שעות/שנה)' },
    c1a_eta: { origin: 'assumed', controversial: false, ru: 'Принятый эксплуатационный КПД парового котла η_b (%)', he: 'נצילות תפעולית מונחת של דוד הקיטור η_b (%)' },
    c1a_lhv: { origin: 'reference', controversial: true, ru: 'Справочная низшая теплота сгорания топлива LHV по таблицам или паспорту топлива (спорное: справочник или данные поставщика)', he: 'ערך קלורי תחתון של הדלק LHV מטבלאות ייחוס או תעודת ספק הגז/דלק (גבולי)' },
    c1a_tariff_gj: { origin: 'assumed', controversial: false, ru: 'Принятый в экономическом расчёте тариф на тепло/топливо', he: 'תעריף חום/דלק מונח בחישוב הכלכלי' },
    c1a_tariff_water: { origin: 'assumed', controversial: false, ru: 'Принятый в экономическом расчёте тариф на химводоподготовку и стоки', he: 'תעריף מים ושפכים מונח בחישוב הכלכלי' },

    // Модуль 1Б (10 полей)
    c1_mc: { origin: 'measured', controversial: true, ru: 'Расход конденсата перед конденсатоотводчиком m_c (спорное: замер расходомером или принятая нагрузка аппарата)', he: 'ספיקת קונדנסט לפני המלכודת m_c (גבולי: מדידה במד ספיקה או עומס מתקן מונח)' },
    c1_p1: { origin: 'measured', controversial: false, ru: 'Показание манометра высокого давления P₁ перед конденсатоотводчиком', he: 'קריאת מד לחץ גבוה P₁ לפני מלכודת הקיטור' },
    c1_p2: { origin: 'measured', controversial: false, ru: 'Показание манометра низкого давления P₂ в ресивере или конденсатопроводе', he: 'קריאת מד לחץ נמוך P₂ במכל האיסוף או בקו הקונדנסט' },
    c1_hf1: { origin: 'reference', controversial: false, ru: 'Табличная энтальпия насыщенной жидкости h_f(P₁) из таблицы насыщенного пара IAPWS-IF97', he: 'אנתלפיית נוזל רווי טבלאית h_f(P₁) מטבלת הקיטור הרווי IAPWS-IF97' },
    c1_hf2: { origin: 'reference', controversial: false, ru: 'Табличная энтальпия насыщенной жидкости h_f(P₂) из таблицы насыщенного пара IAPWS-IF97', he: 'אנתלפיית נוזל רווי טבלאית h_f(P₂) מטבלת הקיטור הרווי IAPWS-IF97' },
    c1_hfg2: { origin: 'reference', controversial: false, ru: 'Табличная удельная теплота парообразования h_fg(P₂) из таблицы насыщенного пара IAPWS-IF97', he: 'חום כמוס סגולי טבלאי h_fg(P₂) מטבלת הקיטור הרווי IAPWS-IF97' },
    c1_dop: { origin: 'measured', controversial: true, ru: 'Внутренний диаметр подводящего коллектора D_op (спорное: обмер существующей трубы на объекте или табличный DN)', he: 'קוטר פנימי של קו הכניסה D_op (גבולי: מדידת הצנרת הקיימת באתר או קוטר DN טבלאי)' },
    c1b_t_year: { origin: 'assumed', controversial: false, ru: 'Принятое число часов работы паровой линии в год (ч/год)', he: 'שעות עבודה שנתיות מונחות של קו הקיטור (שעות/שנה)' },
    c1b_eta: { origin: 'assumed', controversial: false, ru: 'Принятый КПД парового котла η_b (%)', he: 'נצילות מונחת של דוד הקיטור η_b (%)' },
    c1b_tariff_gj: { origin: 'assumed', controversial: false, ru: 'Принятый тариф на тепловую энергию/топливо', he: 'תעריף מונח לאנרגיית חום/דלק' },

    // Модуль 2 (12 полей)
    c2_fluid: { origin: 'assumed', controversial: false, ru: 'Выбор расчётной модели рабочей жидкости (чистая вода или раствор гликоля)', he: 'בחירת סוג נוזל הקירור בחישוב (מים נקיים או תמיסת גליקול)' },
    c2_vw: { origin: 'measured', controversial: false, ru: 'Показание расходомера охлаждаемой жидкости через испаритель V_w', he: 'קריאת מד הספיקה של הנוזל המצונן דרך המאייד V_w' },
    c2_rho: { origin: 'assumed', controversial: true, ru: 'Принятая плотность хладоносителя ρ (по правилу п. 2.1c отнесено к assumed; для гликоля выбирается по таблицам концентрации)', he: 'צפיפות מונחת של נוזל הקירור ρ (לפי כלל 2.1c מסווג כ-assumed; עבור גליקול נלקח גם מטבלאות ריכוז)' },
    c2_cp: { origin: 'assumed', controversial: true, ru: 'Принятая удельная теплоёмкость хладоносителя c_p (по правилу п. 2.1c отнесено к assumed)', he: 'קיבול חום סגולי מונח של נוזל הקירור c_p (לפי כלל 2.1c מסווג כ-assumed)' },
    c2_tin: { origin: 'measured', controversial: false, ru: 'Измеренная датчиком температура входа отеплённой воды в испаритель T_evap,in', he: 'טמפרטורת כניסת המים למאייד T_evap,in הנמדדת ברגש' },
    c2_tout: { origin: 'measured', controversial: false, ru: 'Измеренная датчиком температура выхода охлаждённой воды из испарителя T_evap,out', he: 'טמפרטורת יציאת המים המצוננים מהמאייד T_evap,out הנמדדת ברגש' },
    c2_pel: { origin: 'measured', controversial: false, ru: 'Измеренная электросчётчиком или анализатором активная электрическая мощность чиллера P_el', he: 'הספק חשמלי פעיל של הצ׳ילר P_el הנמדד במונה חשמל או בנתח רשת' },
    c2_tsat_ev: { origin: 'measured', controversial: false, ru: 'Показание температуры кипения (насыщения) хладагента в испарителе T_sat,evap с панели чиллера', he: 'קריאת טמפרטורת הרתיחה (הרוויה) של הקרר במאייד T_sat,evap מלוח הבקרה של הצ׳ילר' },
    c2_tcond_out: { origin: 'measured', controversial: false, ru: 'Измеренная температура охлаждающей воды на выходе конденсатора T_cond,out', he: 'טמפרטורת מי הקירור ביציאה מהמעבה T_cond,out הנמדדת ברגש' },
    c2_tsat_cd: { origin: 'measured', controversial: false, ru: 'Показание температуры конденсации хладагента в конденсаторе T_sat,cond с панели чиллера', he: 'קריאת טמפרטורת העיבוי של הקרר במעבה T_sat,cond מלוח הבקרה של הצ׳ילר' },
    c2_t_year: { origin: 'assumed', controversial: false, ru: 'Принятое число часов работы чиллера в год (ч/год)', he: 'שעות עבודה שנתיות מונחות של הצ׳ילר (שעות/שנה)' },
    c2_tariff_kwh: { origin: 'assumed', controversial: false, ru: 'Принятый тариф на электроэнергию', he: 'תעריף חשמל מונח לחישוב' },

    // Модуль 3А (9 полей)
    c3a_q1: { origin: 'measured', controversial: true, ru: 'Исходный объёмный расход воздуха Q₁ (спорное: показание расходомера или паспортное значение в стандартных условиях для пересчёта)', he: 'ספיקת אוויר התחלתית Q₁ (גבולי: קריאת מד ספיקה או ערך קטלוגי בתנאי תקן להמרה)' },
    c3a_p1: { origin: 'measured', controversial: true, ru: 'Абсолютное давление начального состояния P₁ (спорное: замер давления в точке 1 или стандартное справочное 1.01325 бар абс.)', he: 'לחץ מוחלט במצב ההתחלתי P₁ (גבולי: מדידת לחץ בנקודה 1 או לחץ תקני 1.01325 bar a)' },
    c3a_t1: { origin: 'measured', controversial: true, ru: 'Температура начального состояния T₁ (спорное: замер термометром или стандартная температура 0/20 °C)', he: 'טמפרטורה במצב ההתחלתי T₁ (גבולי: מדידה במדחום או טמפרטורת תקן 0/20 °C)' },
    c3a_rh1: { origin: 'measured', controversial: false, ru: 'Относительная влажность воздуха в начальном состоянии φ₁ (0% для сухого стандартного воздуха или замер гигрометром)', he: 'לחות יחסית במצב ההתחלתי φ₁ (0% לאוויר יבש תקני או מדידה במד לחות)' },
    c3a_psat1: { origin: 'reference', controversial: false, ru: 'Табличное давление насыщенного водяного пара p_sat(T₁) по психрометрическим/паровым таблицам', he: 'לחץ אדים רוויים טבלאי p_sat(T₁) מטבלאות קיטור ולחות' },
    c3a_p2: { origin: 'measured', controversial: false, ru: 'Измеренное абсолютное барометрическое давление на всасе компрессора P₂', he: 'לחץ ברומטרי מוחלט הנמדד ביניקת המדחס P₂' },
    c3a_t2: { origin: 'measured', controversial: false, ru: 'Измеренная термометром температура воздуха на всасе компрессора T₂', he: 'טמפרטורת האוויר ביניקת המדחס T₂ הנמדדת במדחום' },
    c3a_rh2: { origin: 'measured', controversial: false, ru: 'Измеренная гигрометром относительная влажность воздуха на всасе компрессора φ₂', he: 'לחות יחסית של האוויר ביניקת המדחס φ₂ הנמדדת במד לחות' },
    c3a_psat2: { origin: 'reference', controversial: false, ru: 'Табличное давление насыщенного водяного пара p_sat(T₂) при температуре всаса', he: 'לחץ אדים רוויים טבלאי p_sat(T₂) בטמפרטורת היניקה' },

    // Модуль 3Б (12 полей)
    c3b_method: { origin: 'assumed', controversial: false, ru: 'Выбор методики проведения теста утечек сжатого воздуха', he: 'בחירת שיטת הבדיקה להערכת דליפות אוויר דחוס' },
    c3b_vr: { origin: 'assumed', controversial: true, ru: 'Принятый суммарный объём воздухосборников и магистралей V_r (спорное: паспорт ресивера + инженерная оценка объёма трубопроводов)', he: 'נפח כולל מונח של מכלי האגירה והצנרת V_r (גבולי: נפח המכל מהדרכון + הערכת נפח הצנרת)' },
    c3b_pstart: { origin: 'measured', controversial: false, ru: 'Измеренное манометром начальное давление в ресивере в момент останова компрессора P₁', he: 'לחץ התחלתי במכל P₁ הנמדד במד הלחץ ברגע עצירת המדחס' },
    c3b_pend: { origin: 'measured', controversial: false, ru: 'Измеренное манометром конечное давление в ресивере в конце замера P₂', he: 'לחץ סופי במכל P₂ הנמדד במד הלחץ בסיום המדידה' },
    c3b_tdecay: { origin: 'measured', controversial: false, ru: 'Замеренное по секундомеру время падения давления от P₁ до P₂', he: 'זמן ירידת הלחץ מ-P₁ ל-P₂ הנמדד בשעון עצר' },
    c3b_patm: { origin: 'reference', controversial: false, ru: 'Справочное атмосферное давление приведения P_atm (по правилу п. 2.1c отнесено к reference)', he: 'לחץ אטמוספרי ייחוס P_atm (לפי כלל 2.1c מסווג כ-reference)' },
    c3b_tload: { origin: 'measured', controversial: false, ru: 'Замеренное по секундомеру суммарное время работы компрессора под нагрузкой t_load', he: 'זמן עבודה מצטבר של המדחס בהעמסה t_load הנמדד בשעון עצר' },
    c3b_tunload: { origin: 'measured', controversial: false, ru: 'Замеренное по секундомеру время холостого хода / паузы t_unload', he: 'זמן סרק / הפסקה של המדחס t_unload הנמדד בשעון עצר' },
    c3b_qcomp: { origin: 'reference', controversial: true, ru: 'Паспортная номинальная производительность компрессора Q_comp по шильдику/каталогу (спорное: таблично-паспортное или принятое значение)', he: 'תפוקה נומינלית של המדחס Q_comp מלוחית הזיהוי/הקטלוג (גבולי: ערך קטלוגי או מונח)' },
    c3b_spec_power: { origin: 'assumed', controversial: false, ru: 'Принятая удельная мощность компрессора w_spec (по правилу п. 2.1c отнесено к assumed)', he: 'הספק סגולי מונח של המדחס w_spec (לפי כלל 2.1c מסווג כ-assumed)' },
    c3b_t_year: { origin: 'assumed', controversial: false, ru: 'Принятое число часов работы пневмосети под давлением в год (ч/год)', he: 'שעות עבודה שנתיות מונחות של רשת האוויר תחת לחץ (שעות/שנה)' },
    c3b_tariff_kwh: { origin: 'assumed', controversial: false, ru: 'Принятый тариф на электроэнергию', he: 'תעריף חשמל מונח לחישוב' },

    // Модуль 3В (7 полей)
    c3_qc: { origin: 'measured', controversial: true, ru: 'Объёмная подача компрессора на всасе q_c (спорное: замер расходомером FAD или паспортная подача)', he: 'ספיקת יניקה של המדחס q_c (גבולי: מדידה במד ספיקה FAD או תפוקת דרכון)' },
    c3_rh: { origin: 'measured', controversial: false, ru: 'Измеренная гигрометром относительная влажность всасываемого воздуха RH (в долях единицы)', he: 'לחות יחסית של האוויר ביניקה RH הנמדדת במד לחות (כשבר עשרוני)' },
    c3_rho_in: { origin: 'reference', controversial: false, ru: 'Табличная плотность насыщенного водяного пара ρ_in(T_amb) из справочных таблиц [S13]', he: 'צפיפות אדי מים רוויים טבלאית ρ_in(T_amb) מטבלאות הייחוס [S13]' },
    c3_tamb: { origin: 'measured', controversial: false, ru: 'Измеренная абсолютная температура атмосферного воздуха на всасе T_amb (К)', he: 'טמפרטורה מוחלטת של האוויר ביניקה T_amb הנמדדת במדחום (K)' },
    c3_pafter: { origin: 'measured', controversial: false, ru: 'Измеренное абсолютное давление сжатого воздуха после сжатия p_after (бар абс.)', he: 'לחץ מוחלט של האוויר הדחוס לאחר הדחיסה p_after הנמדד במד לחץ (bar a)' },
    c3_tafter: { origin: 'measured', controversial: false, ru: 'Измеренная абсолютная температура сжатого воздуха после охладителя/осушителя T_after (К)', he: 'טמפרטורה מוחלטת של האוויר הדחוס אחרי המצנן/המייבש T_after הנמדדת ברגש (K)' },
    c3_rho_out: { origin: 'reference', controversial: false, ru: 'Табличная плотность насыщенного водяного пара ρ_out(T_after) из справочных таблиц [S13]', he: 'צפיפות אדי מים רוויים טבלאית ρ_out(T_after) מטבלאות הייחוס [S13]' },

    // Модуль 4А (9 полей)
    c4a_qp: { origin: 'measured', controversial: false, ru: 'Показание расходомера пермеата (очищенной воды) Q_p', he: 'קריאת מד ספיקת התוצר (הפרמיאט) Q_p' },
    c4a_qc: { origin: 'measured', controversial: false, ru: 'Показание расходомера концентрата (сброса рассола) Q_c', he: 'קריאת מד ספיקת הרכז Q_c' },
    c4a_qf_meas: { origin: 'measured', controversial: false, ru: 'Показание независимого расходомера питательной воды на входе Q_f,meas', he: 'קריאת מד ספיקה עצמאי של מי ההזנה בכניסה Q_f,meas' },
    c4a_ecf: { origin: 'measured', controversial: false, ru: 'Показание поточного или лабораторного кондуктометра питательной воды EC_f', he: 'קריאת מד מוליכות של מי ההזנה EC_f' },
    c4a_ecp: { origin: 'measured', controversial: false, ru: 'Показание кондуктометра пермеата EC_p', he: 'קריאת מד מוליכות של התוצר (הפרמיאט) EC_p' },
    c4a_ecc: { origin: 'measured', controversial: false, ru: 'Показание кондуктометра концентрата EC_c', he: 'קריאת מד מוליכות של הרכז EC_c' },
    c4a_tdsf: { origin: 'measured', controversial: false, ru: 'Лабораторно измеренная массовая концентрация растворённых солей входа TDS_f (мг/л)', he: 'ריכוז מלחים מומסים במי ההזנה TDS_f הנמדד במעבדה (mg/L)' },
    c4a_tdsp: { origin: 'measured', controversial: false, ru: 'Лабораторно измеренная массовая концентрация растворённых солей пермеата TDS_p (мг/л)', he: 'ריכוז מלחים מומסים בפרמיאט TDS_p הנמדד במעבדה (mg/L)' },
    c4a_tdsc: { origin: 'measured', controversial: false, ru: 'Лабораторно измеренная массовая концентрация растворённых солей концентрата TDS_c (мг/л)', he: 'ריכוז מלחים מומסים ברכז TDS_c הנמדד במעבדה (mg/L)' },

    // Модуль 4Б (8 полей)
    c4_qp: { origin: 'measured', controversial: false, ru: 'Текущее показание расходомера пермеата Q_po в момент обхода', he: 'קריאה נוכחית של מד ספיקת התוצר Q_po בעת הסיור' },
    c4_qc: { origin: 'measured', controversial: false, ru: 'Текущее показание расходомера концентрата Q_co в момент обхода', he: 'קריאה נוכחית של מד ספיקת הרכז Q_co בעת הסיור' },
    c4_qbase: { origin: 'assumed', controversial: true, ru: 'Базовый расход пермеата Q_ps из протокола пуска (спорное: зафиксированный при пуске замер, используемый дальше как принятая база)', he: 'ספיקת תוצר בסיסית Q_ps מפרוטוקול ההרצה (גבולי: מדידה מתועדת מההרצה המשמשת כבסיס ייחוס מונח)' },
    c4_ndps: { origin: 'assumed', controversial: false, ru: 'Принятая базовая чистая движущая сила NDP_s при пуске (по правилу п. 2.1c базовые NDP/TCF отнесены к assumed)', he: 'כוח מניע נטו בסיסי בהרצה NDP_s (לפי כלל 2.1c ערכי הבסיס של NDP/TCF מסווגים כ-assumed)' },
    c4_ndpo: { origin: 'measured', controversial: false, ru: 'Текущая чистая движущая сила NDP_o по текущим показаниям манометров и осмотического давления', he: 'כוח מניע נטו נוכחי NDP_o לפי קריאות מדי הלחץ והלחץ האוסמוטי הנוכחיים' },
    c4_tcfs: { origin: 'assumed', controversial: false, ru: 'Принятый базовый температурный коэффициент TCF_s при пуске (по правилу п. 2.1c отнесено к assumed)', he: 'מקדם טמפרטורה בסיסי בהרצה TCF_s (לפי כלל 2.1c מסווג כ-assumed)' },
    c4_tcfo: { origin: 'reference', controversial: true, ru: 'Текущий температурный поправочный коэффициент TCF_o по формуле/таблице FilmTec Eq. 73–74 от измеренной температуры воды (спорное: таблично-расчётный от замера T)', he: 'מקדם תיקון טמפרטורה נוכחי TCF_o לפי נוסחת/טבלת FilmTec Eq. 73–74 מהטמפרטורה הנמדדת (גבולי)' },
    c4_pp: { origin: 'measured', controversial: false, ru: 'Измеренная манометрами разность давлений между линией пермеата и выходом концентрата P_p − P_c', he: 'הפרש לחצים הנמדד במדי הלחץ בין קו התוצר ליציאת הרכז P_p − P_c' },

    // Модуль 5А (4 поля)
    c5a_mode: { origin: 'assumed', controversial: false, ru: 'Выбор направления перевода давления (избыточное ⇄ абсолютное)', he: 'בחירת כיוון המרת הלחץ (לחץ מד ⇄ לחץ מוחלט)' },
    c5a_unit: { origin: 'assumed', controversial: false, ru: 'Выбор единицы измерения входного давления в конвертере 5А', he: 'בחירת יחידת המידה של לחץ הקלט בממיר 5א' },
    c5a_pval: { origin: 'measured', controversial: false, ru: 'Показание манометра или датчика абсолютного давления пара P_in', he: 'קריאת מד הלחץ או רגש הלחץ של הקיטור P_in' },
    c5a_patm: { origin: 'reference', controversial: false, ru: 'Справочное атмосферное давление P_atm (по правилу п. 2.1c отнесено к reference)', he: 'לחץ אטמוספרי ייחוס P_atm (לפי כלל 2.1c מסווג כ-reference)' },

    // Модуль 5Б (17 полей)
    c5_load_mode: { origin: 'assumed', controversial: false, ru: 'Выбор способа задания тепловой нагрузки паропотребителя', he: 'בחירת אופן הגדרת עומס החום של צרכן הקיטור' },
    c5_steam_preset: { origin: 'reference', controversial: false, ru: 'Выбор табличной точки насыщенного пара из справочной таблицы IAPWS-IF97', he: 'בחירת נקודת קיטור רווי מטבלת הייחוס IAPWS-IF97' },
    c5_qkw: { origin: 'assumed', controversial: true, ru: 'Тепловая нагрузка аппарата Q_load (спорное: паспортная/расчётная мощность теплообменника или показание теплосчётчика)', he: 'עומס החום של המתקן Q_load (גבולי: הספק מתוכנן/קטלוגי של מחליף החום או קריאת מד חום)' },
    c5_mp: { origin: 'measured', controversial: false, ru: 'Измеренный расходомером массовый расход нагреваемого продукта m_p', he: 'ספיקה מסתית של המוצר המתחמם m_p הנמדדת במד ספיקה' },
    c5_cp: { origin: 'assumed', controversial: false, ru: 'Принятая удельная теплоёмкость нагреваемого продукта c_p (по правилу п. 2.1c отнесено к assumed)', he: 'קיבול חום סגולי מונח של המוצר c_p (לפי כלל 2.1c מסווג כ-assumed)' },
    c5_tin: { origin: 'measured', controversial: false, ru: 'Измеренная датчиком начальная температура продукта на входе T_in', he: 'טמפרטורת כניסה של המוצר T_in הנמדדת ברגש' },
    c5_tout: { origin: 'measured', controversial: true, ru: 'Конечная температура продукта на выходе T_out (спорное: фактическое показание термометра на выходе или заданная технологическая уставка)', he: 'טמפרטורת יציאה של המוצר T_out (גבולי: קריאת מדחום בפועל ביציאה או נקודת עבודה נדרשת)' },
    c5_hg: { origin: 'reference', controversial: false, ru: 'Табличная энтальпия сухого насыщенного пара h_g из таблицы насыщения IAPWS-IF97', he: 'אנתלפיית קיטור רווי יבש טבלאית h_g מטבלת הרוויה IAPWS-IF97' },
    c5_hf: { origin: 'reference', controversial: false, ru: 'Табличная энтальпия насыщенной жидкости h_f из таблицы насыщения IAPWS-IF97', he: 'אנתלפיית נוזל רווי טבלאית h_f מטבלת הרוויה IAPWS-IF97' },
    c5_hfg: { origin: 'reference', controversial: false, ru: 'Табличная удельная теплота парообразования h_fg из таблицы насыщения IAPWS-IF97', he: 'חום כמוס סגולי טבלאי h_fg מטבלת הרוויה IAPWS-IF97' },
    c5_x: { origin: 'assumed', controversial: false, ru: 'Принятая расчётная степень сухости пара x перед аппаратом (по правилу п. 2.1c отнесено к assumed)', he: 'דרגת יובש מונחת של הקיטור x לפני המתקן (לפי כלל 2.1c מסווג כ-assumed)' },
    c5_sf: { origin: 'assumed', controversial: false, ru: 'Принятый коэффициент запаса пропускной способности конденсатоотводчика SF (по правилу п. 2.1c отнесено к assumed)', he: 'מקדם ביטחון מונח לבחירת מלכודת הקיטור SF (לפי כלל 2.1c מסווג כ-assumed)' },
    c5_tdsfw: { origin: 'measured', controversial: false, ru: 'Измеренное кондуктометром/лабораторией солесодержание питательной воды котла TDS_fw (ppm)', he: 'מליחות/מוליכות מי ההזנה לדוד TDS_fw הנמדדת במד מוליכות או במעבדה (ppm)' },
    c5_tdsmax: { origin: 'assumed', controversial: true, ru: 'Принятый предельно допустимый уровень TDS котловой воды TDS_max по водно-химическому режиму (спорное: регламент производителя котла или принятая уставка)', he: 'ערך מרבי מותר של מליחות מי הדוד TDS_max לפי משטר המים (גבולי: דרישת יצרן הדוד או נקודת עבודה מונחת)' },
    c5_t_year: { origin: 'assumed', controversial: false, ru: 'Принятое число часов работы технологического аппарата в год (ч/год)', he: 'שעות עבודה שנתיות מונחות של המתקן (שעות/שנה)' },
    c5_eta: { origin: 'assumed', controversial: false, ru: 'Принятый КПД парового котла η_b (%)', he: 'נצילות מונחת של דוד הקיטור η_b (%)' },
    c5_tariff_gj: { origin: 'assumed', controversial: false, ru: 'Принятый тариф на тепловую энергию/топливо', he: 'תעריף מונח לאנרגיית חום/דלק' }
  });

  const FIELD_ORIGIN = Object.freeze(
    Object.fromEntries(
      Object.entries(FIELD_ORIGIN_META).map(([id, meta]) => [id, meta.origin])
    )
  );

  // ---------------------------------------------------------------------------
  // 2.1d. UI — двуязычные строки интерфейса опытов, карточек и сравнения
  // ---------------------------------------------------------------------------
  const UI = Object.freeze({
    ru: {
      experimentsTitle: 'Опыты',
      experimentsSummaryPrefix: '🔬 Опыты: проверьте инженерную интуицию на расчётном ядре',
      experimentIndexOf: 'Опыт {n} из {m}',
      myHypothesis: 'Моё предположение',
      btnCheckByCalc: 'Проверить расчётом',
      verdictCorrect: 'Верно',
      verdictWrong: 'Неверно',
      beforeAfterLabel: 'Было → стало',
      beforeWord: 'Было',
      afterWord: 'стало',
      whySoLabel: 'Почему так',
      formulaLabel: 'Формула',
      sourceLabel: 'Источник',
      openInGuideLink: 'Открыть в учебнике',
      btnResetExperiments: 'Пройти заново',
      selectHypothesisHint: 'Пожалуйста, выберите один из вариантов предположения перед запуском проверочного расчёта.',
      compareTitle: 'Сравнение двух наборов (А / Б)',
      setALabel: 'Набор А',
      setBLabel: 'Набор Б',
      paramLabel: 'Параметр',
      diffLabel: 'Разница',
      diffUnitSystemsNotice: 'Наборы сохранены в разных системах единиц — значения показаны в текущей системе',
      diffCurrenciesWarning: 'Разные валюты — денежные строки не сравниваются',
      btnCompareWithSaved: '⚖️ Сравнить с сохранённым →',
      compareNeedSaveHint: 'ℹ️ Чтобы сравнить текущий расчёт с сохранённым, сначала нажмите «💾 Сохранить расчёт».',
      whatItMeansTitle: 'Что это значит',
      applicabilityLimitsTitle: 'Границы применимости',
      originTagMeasured: 'измерено',
      originTagAssumed: 'принято',
      originTagReference: 'справочно',
      originTooltipMeasured: 'Показание прибора или лабораторного замера (расход, температура, давление, проводимость, время, эл. мощность)',
      originTooltipAssumed: 'Принятое инженером значение или режим (свойства среды, КПД, часы работы, тариф, сухость пара, запас SF, базовая точка)',
      originTooltipReference: 'Табличная или справочная величина (энтальпии пара h_f / h_fg / h_g, давление насыщения p_sat, плотность пара, P_atm)'
    },
    he: {
      experimentsTitle: 'ניסויים',
      experimentsSummaryPrefix: '🔬 ניסויים: בדקו את האינטואיציה ההנדסית מול ליבת החישוב',
      experimentIndexOf: 'ניסוי {n} מתוך {m}',
      myHypothesis: 'ההשערה שלי',
      btnCheckByCalc: 'בדיקה באמצעות חישוב',
      verdictCorrect: 'נכון',
      verdictWrong: 'לא נכון',
      beforeAfterLabel: 'לפני ← אחרי',
      beforeWord: 'לפני',
      afterWord: 'אחרי',
      whySoLabel: 'מדוע זה קורה',
      formulaLabel: 'נוסחה',
      sourceLabel: 'מקור',
      openInGuideLink: 'פתיחה בספר הלימוד',
      btnResetExperiments: 'התחלה מחדש',
      selectHypothesisHint: 'אנא בחרו אחת מאפשרויות ההשערה לפני הפעלת חישוב הבדיקה.',
      compareTitle: 'השוואת שתי ערכות (א׳ / ב׳)',
      setALabel: 'ערכה א׳',
      setBLabel: 'ערכה ב׳',
      paramLabel: 'פרמטר',
      diffLabel: 'הפרש',
      diffUnitSystemsNotice: 'הערכות נשמרו במערכות יחידות שונות — הערכים מוצגים במערכת היחידות הפעילה כעת',
      diffCurrenciesWarning: 'מטבעות שונים — שורות כספיות אינן מושוות',
      btnCompareWithSaved: '⚖️ השוואה עם חישוב שמור ←',
      compareNeedSaveHint: 'ℹ️ כדי להשוות את החישוב הנוכחי עם חישוב שמור, לחצו תחילה על "💾 שמירת חישוב".',
      whatItMeansTitle: 'מה משמעות התוצאה',
      applicabilityLimitsTitle: 'גבולות גזרה ותחום תקפות',
      originTagMeasured: 'נמדד',
      originTagAssumed: 'מונח',
      originTagReference: 'טבלאי',
      originTooltipMeasured: 'קריאת מכשיר מדידה או בדיקת מעבדה (ספיקה, טמפרטורה, לחץ, מוליכות, זמן, הספק חשמלי)',
      originTooltipAssumed: 'ערך או מצב שהונח על-ידי המהנדס (תכונות זורם, נצילות, שעות עבודה, תעריף, דרגת יובש, מקדם ביטחון SF, נקודת ייחוס)',
      originTooltipReference: 'ערך טבלאי או ספרותי (אנתלפיות קיטור h_f / h_fg / h_g, לחץ רוויה p_sat, צפיפות אדים, P_atm)'
    }
  });

  return Object.freeze({
    EXPERIMENTS,
    MODULE_MEANING,
    FIELD_ORIGIN,
    FIELD_ORIGIN_META,
    UI
  });
});
