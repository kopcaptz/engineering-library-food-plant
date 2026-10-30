// 06_web_project/data/survey.js
// Поручение v12 — Этап 4: Обход оборудования (конденсатоотводчики и утечки сжатого воздуха) + печать A4
// Хранит все численные значения строго в метрических единицах СИ (бар изб., °C, л/с).
// Денежная оценка утечек воздуха выполняется через EconomicsEngine (data/economics.js).

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    root.EquipmentSurvey = factory(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const STORAGE_KEY_SURVEY = 'eng_lib_v12_survey_v1';
  const SURVEY_FORMAT_VERSION = 'v12.0';

  const TRAP_TYPES = ['float_s02', 'inverted_bucket_s03', 'thermodynamic_s04', 'other'];
  const CHECK_METHODS = ['temperature', 'ultrasound', 'visual'];
  const TRAP_STATUSES = ['good', 'blowing_steam', 'blocked_cold', 'unchecked'];

  const I18N = {
    ru: {
      sectionTitle: 'Обход и замеры: конденсатоотводчики и утечки воздуха (A4)',
      sectionLead: 'Ведомость полевого обхода паровых конденсатоотводчиков [S01–S04] и реестр утечек сжатого воздуха [S12] с автоматической сводкой, сохранением на устройстве, обменом в CSV/JSON и печатью отчёта A4.',
      tabTraps: '1. Конденсатоотводчики',
      tabLeaks: '2. Утечки сжатого воздуха',
      headerTitle: 'Шапка обхода (для ведомости и печати A4)',
      lblDate: 'Дата обхода',
      lblShift: 'Смена',
      lblInspector: 'Проверяющий (ФИО / должность)',
      lblArea: 'Участок / цех',
      placeholderShift: 'Напр., Смена А (08:00–20:00)',
      placeholderInspector: 'Напр., Дежурный инженер ОГМ',
      placeholderArea: 'Напр., Варочный и пастеризационный участок',
      btnLoadSample: '📋 Загрузить пример обхода (12 отводчиков + 8 утечек)',
      btnPrintA4: '🖨️ Печать отчёта обхода (A4)',
      btnExportJson: '⬇️ Выгрузить JSON',
      btnImportJson: '⬆️ Загрузить JSON',
      btnExportCsv: '⬇️ Выгрузить CSV (текущая вкладка)',
      btnImportCsv: '⬆️ Загрузить CSV (текущая вкладка)',
      btnClearAll: '🗑️ Очистить обход',
      confirmDeleteRow: 'Удалить выбранную строку из ведомости обхода?',
      confirmClearAll: 'Очистить все записи обхода (отводчики и утечки)?',
      // Справочная памятка по S01-S04
      trapHintsSummary: '📖 Признаки состояния конденсатоотводчиков по первоисточникам [S01–S04] (с указанием страниц)',
      trapHintsBody:
        '• <strong>Общие признаки отказа [S01, pp. 11–13, 19 / PDF pp. 17–19, 25]:</strong> ' +
        'пропуск живого пара (<em>Blowing steam</em>) повышает противодавление в конденсатопроводе и температуру за отводчиком; ' +
        'блокировка в закрытом положении или воздушная пробка (<em>Blocked / cold</em>) вызывает подтопление теплообменника конденсатом и падение температуры.<br>' +
        '• <strong>Поплавковый отводчик (Float &amp; Thermostatic) [S02, pp. 2–5 / PDF pp. 2–5]:</strong> ' +
        'нормальная работа — непрерывный отвод конденсата при температуре насыщения; износ седла вызывает постоянный пропуск пара, а повреждение поплавка или отказ термостатического воздушника — затопление (холодный отводчик).<br>' +
        '• <strong>С опрокинутым стаканом (Inverted Bucket) [S03, pp. 2–3 / PDF pp. 2–3]:</strong> ' +
        'нормальная работа — циклический выпуск конденсата; потеря гидрозатвора (<em>Water seal</em>) приводит к непрерывному прорыву живого пара, а засорение вентиляционного отверстия в днище стакана — к воздушной блокировке.<br>' +
        '• <strong>Термодинамический дисковый (Thermodynamic) [S04, PDF p. 1]:</strong> ' +
        'нормальная работа — отчётливые периодические щелчки диска (закрытие паром и открытие конденсатом); износ диска/седла или высокое противодавление вызывает частое «пулемётное» срабатывание (<em>Machine-gunning</em>) и пропуск пара.',
      trapNoFormulaNote:
        'ℹ️ <strong>Примечание по расчёту потерь пара:</strong> в первоисточнике <code>[S01]</code> (Armstrong Steam Conservation Guidelines) отсутствует расчётная формула расхода потерь пара через неисправный конденсатоотводчик, поэтому в соответствии с инженерным регламентом выполняется точный подсчёт числа отводчиков по состояниям без домысливания формул.',
      // Форма добавления отводчика
      addTrapTitle: 'Добавить конденсатоотводчик в ведомость',
      colTrapLoc: '№ / Место установки',
      colTrapType: 'Тип отводчика',
      colTrapP: { si: 'Давление P (бар изб.)', us: 'Давление P (psig)' },
      colTrapT1: { si: 'T до (°C)', us: 'T до (°F)' },
      colTrapT2: { si: 'T после (°C)', us: 'T после (°F)' },
      colTrapMethod: 'Метод проверки',
      colTrapStatus: 'Состояние',
      colTrapNote: 'Примечание',
      colActions: 'Действия',
      btnAddTrap: '➕ Добавить отводчик',
      trapTypes: {
        float_s02: 'Поплавковый [S02]',
        inverted_bucket_s03: 'С опрокинутым стаканом [S03]',
        thermodynamic_s04: 'Термодинамический [S04]',
        other: 'Другой'
      },
      checkMethods: {
        temperature: 'Температура',
        ultrasound: 'Ультразвук',
        visual: 'Осмотр'
      },
      trapStatuses: {
        good: 'Исправен',
        blowing_steam: 'Пропускает пар',
        blocked_cold: 'Заблокирован / холодный',
        unchecked: 'Не проверен'
      },
      // Сводка по отводчикам
      trapSummaryTitle: 'Итоги обхода конденсатоотводчиков',
      lblTotalTraps: 'Всего в ведомости',
      // Утечки воздуха
      leakNoTableNote:
        'ℹ️ <strong>Примечание по вводу расхода утечек:</strong> в первоисточнике <code>[S12, Fact Sheet 3, PDF p. 31]</code> приведены только примеры годовых затрат при фиксированном тарифе $0.05/kWh для отверстий 1/16", 1/8", 1/4" без таблицы расхода воздуха (л/с или cfm), поэтому расход каждой утечки вводится оператором напрямую (в л/с или cfm по переключателю единиц).',
      addLeakTitle: 'Добавить утечку сжатого воздуха в ведомость',
      colLeakLoc: 'Место утечки / узел',
      colLeakFlow: { si: 'Расход утечки (л/с)', us: 'Расход утечки (cfm)' },
      colLeakFixed: 'Статус устранения',
      colLeakNote: 'Примечание',
      leakFixedYes: 'Устранена',
      leakFixedNo: 'Не устранена (активна)',
      btnAddLeak: '➕ Добавить утечку',
      // Параметры годовой стоимости утечек
      leakEconTitle: 'Параметры годовой оценки стоимости утечек (через модуль экономики [S12, PDF pp. 52–54])',
      lblLeakSpecPower: 'Уд. мощность компрессора w_spec (кВт/(м³/мин)) [только SI]',
      hintLeakSpecPower: 'При 6.9 бар изб. (100 psig) [S12, Fact Sheet 7, PDF pp. 52–53]: винтовой 1-ступ. 6.36–6.71 (18–19 kW/100 cfm), 2-ступ. 5.65–6.00',
      lblLeakHours: 'Часы работы сети сжатого воздуха в год t_year (ч/год)',
      lblLeakTariff: { $: 'Тариф на электроэнергию ($ за кВт·ч)', '₪': 'Тариф на электроэнергию (₪ за кВт·ч)' },
      leakSummaryTitle: 'Итоги обхода утечек сжатого воздуха',
      lblTotalLeaksCount: 'Всего точек утечек',
      lblActiveLeaksCount: 'Активных (не устранено)',
      lblFixedLeaksCount: 'Устранено',
      lblActiveLeakFlow: 'Суммарный расход неустранённых утечек',
      lblTotalLeakFlow: 'Суммарный расход всех зафиксированных точек',
      lblAnnualCostActive: 'Годовая стоимость неустранённых утечек [инженерная оценка]',
      lblAnnualCostSaved: 'Годовая экономия по устранённым утечкам [инженерная оценка]',
      lblDeleteBtn: 'Удалить',
      emptyTrapsRow: 'В ведомости пока нет записей по конденсатоотводчикам.',
      emptyLeaksRow: 'В ведомости пока нет записей по утечкам сжатого воздуха.',
      emptyTrapsCardTitle: 'Ведомость конденсатоотводчиков пока пуста',
      emptyTrapsCardDesc: 'Заполните поля формы выше и нажмите кнопку «Добавить отводчик», чтобы внести первый замер, или загрузите контрольный пример обхода (12 отводчиков + 8 утечек).',
      emptyLeaksCardTitle: 'Ведомость утечек сжатого воздуха пока пуста',
      emptyLeaksCardDesc: 'Заполните поля формы выше и нажмите кнопку «Добавить утечку», чтобы внести первую точку, или загрузите контрольный пример обхода (12 отводчиков + 8 утечек).'
    },
    he: {
      sectionTitle: 'סיור ציוד ומדידות: מלכודות קיטור ודליפות אוויר דחוס (A4)',
      sectionLead: 'גיליון סיור שטח לבדיקת מלכודות קיטור [S01–S04] ורישום דליפות אוויר דחוס [S12] עם סיכום אוטומטי, שמירה מקומית במכשיר, ייצוא/ייבוא ב-CSV/JSON והדפסת דוח A4.',
      tabTraps: '1. מלכודות קיטור',
      tabLeaks: '2. דליפות אוויר דחוס',
      headerTitle: 'כותרת הסיור (לגיליון ולהדפסת A4)',
      lblDate: 'תאריך הסיור',
      lblShift: 'משמרת',
      lblInspector: 'בודק (שם / תפקיד)',
      lblArea: 'אזור / מחלקה',
      placeholderShift: 'למשל: משמרת א׳ (08:00–20:00)',
      placeholderInspector: 'למשל: מהנדס תורן מחלקת אחזקה',
      placeholderArea: 'למשל: אולם בישול ופסטור',
      btnLoadSample: '📋 טעינת סיור לדוגמה (12 מלכודות + 8 דליפות)',
      btnPrintA4: '🖨️ הדפסת דוח סיור (A4)',
      btnExportJson: '⬇️ ייצוא JSON',
      btnImportJson: '⬆️ ייבוא JSON',
      btnExportCsv: '⬇️ ייצוא CSV (לשונית נוכחית)',
      btnImportCsv: '⬆️ ייבוא CSV (לשונית נוכחית)',
      btnClearAll: '🗑️ ניקוי סיור',
      confirmDeleteRow: 'האם למחוק את השורה שנבחרה מגיליון הסיור?',
      confirmClearAll: 'האם למחוק את כל רשומות הסיור (מלכודות ודליפות)?',
      trapHintsSummary: '📖 סימני זיהוי למצב מלכודות קיטור לפי מקורות ראשוניים [S01–S04] (עם מספרי עמודים)',
      trapHintsBody:
        '• <strong>סימני כשל כלליים [<bdi dir="ltr">S01, pp. 11–13, 19 / PDF pp. 17–19, 25</bdi>]:</strong> ' +
        'מעבר קיטור חי (<bdi dir="ltr">Blowing steam</bdi>) מעלה את הלחץ הנגדי בקו הקונדנסט ואת הטמפרטורה ביציאה; ' +
        'חסימה במצב סגור או נעילת אוויר (<bdi dir="ltr">Blocked / cold</bdi>) גורמת להצפת מחליף החום בקונדנסט ולירידת טמפרטורה.<br>' +
        '• <strong>מלכודת מצוף ופורק תרמוסטטי (<bdi dir="ltr">Float &amp; Thermostatic</bdi>) [<bdi dir="ltr">S02, pp. 2–5 / PDF pp. 2–5</bdi>]:</strong> ' +
        'פעולה תקינה — ניקוז רציף בטמפרטורת הרוויה; שחיקת תושבת גורמת למעבר קיטור חי, ואילו פגיעה במצוף או בפורק האוויר התרמוסטטי גורמת להצפה (מלכודת קרה).<br>' +
        '• <strong>מלכודת דלי הפוך (<bdi dir="ltr">Inverted Bucket</bdi>) [<bdi dir="ltr">S03, pp. 2–3 / PDF pp. 2–3</bdi>]:</strong> ' +
        'פעולה תקינה — פריקה מחזורית; איבוד חותם המים (<bdi dir="ltr">Water seal</bdi>) גורם לפריצת קיטור חי רציפה, ואילו סתימת נחיר האוורור בראש הדלי גורמת לנעילת אוויר (מלכודת קרה).<br>' +
        '• <strong>מלכודת תרמודינמית דיסקית (<bdi dir="ltr">Thermodynamic</bdi>) [<bdi dir="ltr">S04, PDF p. 1</bdi>]:</strong> ' +
        'פעולה תקינה — נקישות מחזוריות ברורות של הדיסקית; שחיקת הדיסקית/תושבת או לחץ נגדי גבוה גורמים לנקישות מהירות ("ירי מקלע" / <bdi dir="ltr">Machine-gunning</bdi>) ולמעבר קיטור.',
      trapNoFormulaNote:
        'ℹ️ <strong>הערה לגבי חישוב אובדן קיטור:</strong> במקור הראשוני <code dir="ltr">[S01]</code> (<bdi dir="ltr">Armstrong Steam Conservation Guidelines</bdi>) אין נוסחה לחישוב ספיקת אובדן קיטור דרך מלכודת תקולה, ולכן בהתאם לנוהל ההנדסי מבוצעת ספירה מדויקת לפי מצבי המלכודות ללא המצאת נוסחאות.',
      addTrapTitle: 'הוספת מלכודת קיטור לגיליון',
      colTrapLoc: 'מס׳ / מיקום התקנה',
      colTrapType: 'סוג מלכודת',
      colTrapP: { si: 'לחץ P (barg)', us: 'לחץ P (psig)' },
      colTrapT1: { si: 'T לפני (°C)', us: 'T לפני (°F)' },
      colTrapT2: { si: 'T אחרי (°C)', us: 'T אחרי (°F)' },
      colTrapMethod: 'שיטת בדיקה',
      colTrapStatus: 'מצב תפקودي',
      colTrapNote: 'הערה',
      colActions: 'פעולות',
      btnAddTrap: '➕ הוספת מלכודת',
      trapTypes: {
        float_s02: 'מצוף [S02]',
        inverted_bucket_s03: 'דלי הפוך [S03]',
        thermodynamic_s04: 'תרמודינמית [S04]',
        other: 'אחר'
      },
      checkMethods: {
        temperature: 'טמפרטורה',
        ultrasound: 'אולטרסאונד',
        visual: 'בדיקה חזותית'
      },
      trapStatuses: {
        good: 'תקין',
        blowing_steam: 'מעביר קיטור חי',
        blocked_cold: 'חסום או קר',
        unchecked: 'לא נבדק'
      },
      trapSummaryTitle: 'סיכום סיור מלכודות קיטור',
      lblTotalTraps: 'סה"כ בגיליון',
      leakNoTableNote:
        'ℹ️ <strong>הערה לגבי הזנת ספיקת דליפות:</strong> במקור הראשוני <code dir="ltr">[S12, Fact Sheet 3, PDF p. 31]</code> מופיעות רק דוגמאות עלות שנתית בתעריף קבוע של <bdi dir="ltr">$0.05/kWh</bdi> עבור חרירים בגודל <bdi dir="ltr">1/16", 1/8", 1/4"</bdi> ללא טבלת ספיקת אוויר (<bdi dir="ltr">L/s</bdi> או <bdi dir="ltr">cfm</bdi>), ולכן ספיקת כל דליפה מוזנת ישירות על ידי המפעיל (<bdi dir="ltr">L/s</bdi> או <bdi dir="ltr">cfm</bdi> לפי בורר היחידות).',
      addLeakTitle: 'הוספת דליפת אוויר דחוס לגיליון',
      colLeakLoc: 'מיקום הדליפה / רכיב',
      colLeakFlow: { si: 'ספיקת דליפה (L/s)', us: 'ספיקת דליפה (cfm)' },
      colLeakFixed: 'סטטוס טיפול',
      colLeakNote: 'הערה',
      leakFixedYes: 'טופלה (נסגרה)',
      leakFixedNo: 'לא טופלה (פעילה)',
      btnAddLeak: '➕ הוספת דליפה',
      leakEconTitle: 'פרמטרים להערכת עלות שנתית של דליפות (באמצעות מודול הכלכלה [S12, PDF pp. 52–54])',
      lblLeakSpecPower: 'הספק סגולי של המדחס w_spec (kW/(m³/min)) [SI בלבד]',
      hintLeakSpecPower: 'עבור 6.9 barg (100 psig) [S12, Fact Sheet 7, PDF pp. 52–53]: בורגי חד-שלבי 6.36–6.71 (18–19 kW/100 cfm), דו-שלבי 5.65–6.00',
      lblLeakHours: 'שעות עבודה של רשת האוויר בשנה t_year (שעות/שנה)',
      lblLeakTariff: { $: 'תעריף חשמל ($ ל-kWh)', '₪': 'תעריף חשמל (₪ ל-kWh)' },
      leakSummaryTitle: 'סיכום סיור דליפות אוויר דחוס',
      lblTotalLeaksCount: 'סה"כ נקודות דליפה',
      lblActiveLeaksCount: 'פעילות (לא טופלו)',
      lblFixedLeaksCount: 'טופלו',
      lblActiveLeakFlow: 'ספיקה מצטברת של דליפות פעילות',
      lblTotalLeakFlow: 'ספיקה מצטברת של כל הנקודות שנרשמו',
      lblAnnualCostActive: 'עלות שנתית של דליפות פעילות [הערכה הנדסית]',
      lblAnnualCostSaved: 'חיסכון שנתי מדליפות שטופלו [הערכה הנדסית]',
      lblDeleteBtn: 'מחיקה',
      emptyTrapsRow: 'טרם הוזנו רשומות של מלכודות קיטור בגיליון.',
      emptyLeaksRow: 'טרם הוזנו רשומות של דליפות אוויר דחוס בגיליון.',
      emptyTrapsCardTitle: 'גיליון מלכודות הקיטור ריק כעת',
      emptyTrapsCardDesc: 'מלאו את שדות הטופס למעלה ולחצו על "הוספת מלכודת" כדי להוסיף את הרשומה הראשונה, או טענו את סיור הדוגמה (12 מלכודות + 8 דליפות).',
      emptyLeaksCardTitle: 'גיליון דליפות האוויר הדחוס ריק כעת',
      emptyLeaksCardDesc: 'מלאו את שדות הטופס למעלה ולחצו על "הוספת דליפה" כדי להוסיף את הנקודה הראשונה, או טענו את סיור הדוגמה (12 מלכודות + 8 דליפות).'
    }
  };

  function createDefaultSurveyData() {
    return {
      version: SURVEY_FORMAT_VERSION,
      activeTab: 'traps',
      header: {
        date: '2026-10-29',
        shift: 'A (08:00–20:00)',
        inspector: 'Eng. Duty / OGM',
        area: 'Line 1–3'
      },
      leakEconomics: {
        specPowerKwM3Min: 6.5,
        tYearH: 8000,
        tariffPerKwh: 0.10
      },
      traps: [],
      leaks: []
    };
  }

  function createSample12TrapsAnd8Leaks(lang) {
    const isHe = lang === 'he';
    const mkTrap = (id, locRu, locHe, trap_type, p_barg, t_before_c, t_after_c, check_method, status, noteRu, noteHe) => ({
      id,
      location: isHe ? locHe : locRu,
      locationRu: locRu,
      locationHe: locHe,
      trap_type,
      p_barg,
      t_before_c,
      t_after_c,
      check_method,
      status,
      note: isHe ? noteHe : noteRu,
      noteRu,
      noteHe
    });
    const mkLeak = (id, locRu, locHe, flow_ls, fixed, noteRu, noteHe) => ({
      id,
      location: isHe ? locHe : locRu,
      locationRu: locRu,
      locationHe: locHe,
      flow_ls,
      fixed,
      note: isHe ? noteHe : noteRu,
      noteRu,
      noteHe
    });

    const traps = [
      mkTrap('T-01', 'ST-101 Главный паровой коллектор', 'ST-101 סעפת קיטור ראשית', 'inverted_bucket_s03', 6.0, 164.0, 102.0, 'ultrasound', 'good', 'Циклический сброс в норме [S03, p. 2]', 'פריקה מחזורית תקינה [S03, p. 2]'),
      mkTrap('T-02', 'ST-102 Сепаратор линии А', 'ST-102 מפריד טיפות קו א׳', 'float_s02', 6.0, 163.5, 101.0, 'temperature', 'good', 'Непрерывный отвод в норме [S02, p. 2]', 'ניקוז רציף תקין [S02, p. 2]'),
      mkTrap('T-03', 'ST-103 Теплообменник пастеризатора №1', 'ST-103 מחליף חום פסטור 1', 'float_s02', 2.0, 133.0, 98.0, 'ultrasound', 'good', 'Исправен', 'תקין'),
      mkTrap('T-04', 'ST-104 Теплообменник пастеризатора №2', 'ST-104 מחליף חום פסטור 2', 'float_s02', 2.0, 132.5, 129.0, 'ultrasound', 'blowing_steam', 'Непрерывный свист — пропуск живого пара [S01, p. 19; S02, p. 4]', 'רעש זרימה רציף — מעבר קיטור חי [S01, p. 19; S02, p. 4]'),
      mkTrap('T-05', 'ST-105 Варочный котёл №1', 'ST-105 סיר בישול אצווה 1', 'inverted_bucket_s03', 4.0, 151.0, 103.0, 'temperature', 'good', 'Исправен', 'תקין'),
      mkTrap('T-06', 'ST-106 Варочный котёл №2', 'ST-106 סיר בישול אצווה 2', 'inverted_bucket_s03', 4.0, 68.0, 45.0, 'temperature', 'blocked_cold', 'Холодный отводчик — засорение вент. отверстия стакана [S03, p. 3]', 'מלכודת קרה — חשד לסתימת נחיר אוורור בדלי [S03, p. 3]'),
      mkTrap('T-07', 'ST-107 Пароспутник наружного трубопровода', 'ST-107 קו ליווי קיטור חיצוני', 'thermodynamic_s04', 5.0, 158.0, 104.0, 'ultrasound', 'good', 'Чёткие щелчки диска [S04, p. 1]', 'נקישות דיסקית סדירות [S04, p. 1]'),
      mkTrap('T-08', 'ST-108 Пароспутник парка ёмкостей', 'ST-108 קו ליווי אזור מכלים', 'thermodynamic_s04', 5.0, 157.0, 151.0, 'ultrasound', 'blowing_steam', 'Частое пулемётное срабатывание — износ диска [S04, p. 1]', 'נקישות מהירות (Machine-gunning) — שחיקת דיסקית [S04, p. 1]'),
      mkTrap('T-09', 'ST-109 Центральная станция CIP', 'ST-109 תחנת CIP מרכזית', 'float_s02', 3.0, 143.0, 99.0, 'visual', 'good', 'Контроль через смотровое стекло в норме', 'בדיקת חלון הצצה תקינה'),
      mkTrap('T-10', 'ST-110 Калорифер сушильной камеры', 'ST-110 מחמם אוויר מייבש', 'float_s02', 4.5, 154.0, 101.0, 'temperature', 'good', 'Исправен', 'תקין'),
      mkTrap('T-11', 'ST-111 Бойлер технологической ГВС', 'ST-111 מחמם מים חמים לתהליך', 'other', 3.5, 58.0, 41.0, 'temperature', 'blocked_cold', 'Подтопление конденсатом [S01, p. 17]', 'הצפת קונדנסט [S01, p. 17]'),
      mkTrap('T-12', 'ST-112 Концевой дренаж северной ветки', 'ST-112 קצה שלוחה צפונית (בגובה)', 'thermodynamic_s04', 6.0, 160.0, 102.0, 'visual', 'unchecked', 'Требуется автовышка для безопасного доступа', 'נדרשת במת הרמה לגישה בטוחה')
    ];

    const leaks = [
      mkLeak('L-01', 'AL-01 Быстроразъём (БРС) линии фасовки №1', 'AL-01 חיבור מהיר עמדת אריזה 1', 2.4, true, 'Заменено уплотнение БРС', 'הוחלף אטם בצימוד מהיר'),
      mkLeak('L-02', 'AL-02 Блок подготовки воздуха FRL автомата розлива', 'AL-02 וסת לחץ FRL מכונת מילוי', 3.5, false, 'Трещина колбы фильтра — заказан ЗИП', 'סדק בכוסית הפילטר — הוזמן חלף'),
      mkLeak('L-03', 'AL-03 Пневмоцилиндр конвейера №2', 'AL-03 בוכנה פניאומטית מסוע 2', 4.2, false, 'Пропуск штокового уплотнения', 'דליפה מאטם המוט'),
      mkLeak('L-04', 'AL-04 Электромагнитный клапан картонатора', 'AL-04 שסתום סולנואיד בורר קרטונים', 1.8, true, 'Подтянуто резьбовое соединение', 'הודק חיבור הברגה'),
      mkLeak('L-05', 'AL-05 Гибкий полиуретановый шланг обдува', 'AL-05 צינור גמיש PU אקדח ניקוי', 5.0, false, 'Перетёрта трубка PU 8×5.5', 'שחיקה של הצינור'),
      mkLeak('L-06', 'AL-06 Конденсатоотводчик воздушного ресивера', 'AL-06 מנקז קונדנסט אוטומטי במכל אוויר', 6.5, false, 'Подклинил в приоткрытом положении', 'תקוע פתוח חלקית'),
      mkLeak('L-07', 'AL-07 Фланец на выходе рефрижераторного осушителя', 'AL-07 אוגן יציאה ממייבש קירור', 1.6, true, 'Подтянут по регламенту', 'הודק בתיאום'),
      mkLeak('L-08', 'AL-08 Гребёнка сжатого воздуха паллетайзера', 'AL-08 מפצל אוויר עמדת משטוח', 2.8, false, 'Пропуск по сальнику шарового крана ½"', 'דליפה בשסתום כדורי ½"')
    ];

    return { traps, leaks };
  }

  let memorySurveyData = createDefaultSurveyData();

  function loadSurveyState() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_SURVEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && Array.isArray(parsed.traps) && Array.isArray(parsed.leaks)) {
            memorySurveyData = {
              ...createDefaultSurveyData(),
              ...parsed,
              header: { ...createDefaultSurveyData().header, ...(parsed.header || {}) },
              leakEconomics: { ...createDefaultSurveyData().leakEconomics, ...(parsed.leakEconomics || {}) }
            };
            return memorySurveyData;
          }
        }
      }
    } catch (_) {
      if (typeof root.setStorageAvailabilityForTest === 'function') {
        root.setStorageAvailabilityForTest(false);
      }
    }
    return memorySurveyData;
  }

  function saveSurveyState(state) {
    memorySurveyData = state;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SURVEY, JSON.stringify(state));
      }
    } catch (_) {
      if (typeof root.setStorageAvailabilityForTest === 'function') {
        root.setStorageAvailabilityForTest(false);
      }
    }
  }

  // Compute summary for steam traps (strictly status counts; no invented steam loss formula)
  function summarizeTraps(traps) {
    const list = Array.isArray(traps) ? traps : [];
    const counts = {
      total: list.length,
      good: 0,
      blowing_steam: 0,
      blocked_cold: 0,
      unchecked: 0
    };
    for (const item of list) {
      const st = TRAP_STATUSES.includes(item.status) ? item.status : 'unchecked';
      counts[st] = (counts[st] || 0) + 1;
    }
    return counts;
  }

  // Compute summary for compressed air leaks + annual cost via EconomicsEngine.calcModule3BEconomics
  function summarizeLeaks(leaks, leakEconConfig, currency) {
    const list = Array.isArray(leaks) ? leaks : [];
    let totalFlowLs = 0;
    let activeFlowLs = 0;
    let fixedFlowLs = 0;
    let activeCount = 0;
    let fixedCount = 0;

    for (const item of list) {
      const q = Number(item.flow_ls);
      const validQ = Number.isFinite(q) && q >= 0 ? q : 0;
      totalFlowLs += validQ;
      if (item.fixed) {
        fixedCount++;
        fixedFlowLs += validQ;
      } else {
        activeCount++;
        activeFlowLs += validQ;
      }
    }

    const activeFlowM3Min = (activeFlowLs * 60) / 1000;
    const fixedFlowM3Min = (fixedFlowLs * 60) / 1000;
    const totalFlowM3Min = (totalFlowLs * 60) / 1000;

    const EE = root.EconomicsEngine;
    const cfg = leakEconConfig || {};
    let activeEcon = null;
    let savedEcon = null;

    if (EE && typeof EE.calcModule3BEconomics === 'function') {
      try {
        activeEcon = EE.calcModule3BEconomics(
          { qLeakM3Min: activeFlowM3Min, qLeakLS: activeFlowLs },
          {
            currency: currency || '$',
            spec_power_kw_m3min: cfg.specPowerKwM3Min,
            t_year_h: cfg.tYearH,
            tariff_per_kwh: cfg.tariffPerKwh
          }
        );
        savedEcon = EE.calcModule3BEconomics(
          { qLeakM3Min: fixedFlowM3Min, qLeakLS: fixedFlowLs },
          {
            currency: currency || '$',
            spec_power_kw_m3min: cfg.specPowerKwM3Min,
            t_year_h: cfg.tYearH,
            tariff_per_kwh: cfg.tariffPerKwh
          }
        );
      } catch (_) {
        activeEcon = null;
        savedEcon = null;
      }
    }

    return {
      totalCount: list.length,
      activeCount,
      fixedCount,
      totalFlowLs,
      activeFlowLs,
      fixedFlowLs,
      totalFlowM3Min,
      activeFlowM3Min,
      fixedFlowM3Min,
      activeEcon,
      savedEcon
    };
  }

  // Export / Import JSON
  function exportSurveyToJsonString(state) {
    const s = state || loadSurveyState();
    return JSON.stringify(
      {
        version: SURVEY_FORMAT_VERSION,
        exportedAt: new Date().toISOString(),
        header: s.header,
        leakEconomics: s.leakEconomics,
        traps: s.traps,
        leaks: s.leaks
      },
      null,
      2
    );
  }

  function importSurveyFromJsonString(jsonStr) {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object' || (!Array.isArray(parsed.traps) && !Array.isArray(parsed.leaks))) {
      throw new Error('Invalid survey JSON format');
    }
    const nextState = {
      version: SURVEY_FORMAT_VERSION,
      activeTab: memorySurveyData.activeTab || 'traps',
      header: { ...createDefaultSurveyData().header, ...(parsed.header || {}) },
      leakEconomics: { ...createDefaultSurveyData().leakEconomics, ...(parsed.leakEconomics || {}) },
      traps: (parsed.traps || []).map((t, idx) => ({
        id: String(t.id || `T-${idx + 1}`),
        location: String(t.location || ''),
        locationRu: t.locationRu ? String(t.locationRu) : undefined,
        locationHe: t.locationHe ? String(t.locationHe) : undefined,
        trap_type: TRAP_TYPES.includes(t.trap_type) ? t.trap_type : 'other',
        p_barg: Number(t.p_barg) || 0,
        t_before_c: Number(t.t_before_c) || 0,
        t_after_c: Number(t.t_after_c) || 0,
        check_method: CHECK_METHODS.includes(t.check_method) ? t.check_method : 'temperature',
        status: TRAP_STATUSES.includes(t.status) ? t.status : 'unchecked',
        note: String(t.note || ''),
        noteRu: t.noteRu ? String(t.noteRu) : undefined,
        noteHe: t.noteHe ? String(t.noteHe) : undefined
      })),
      leaks: (parsed.leaks || []).map((l, idx) => ({
        id: String(l.id || `L-${idx + 1}`),
        location: String(l.location || ''),
        locationRu: l.locationRu ? String(l.locationRu) : undefined,
        locationHe: l.locationHe ? String(l.locationHe) : undefined,
        flow_ls: Number(l.flow_ls) || 0,
        fixed: Boolean(l.fixed),
        note: String(l.note || ''),
        noteRu: l.noteRu ? String(l.noteRu) : undefined,
        noteHe: l.noteHe ? String(l.noteHe) : undefined
      }))
    };
    saveSurveyState(nextState);
    return nextState;
  }

  // CSV Escape / Parse helpers
  function csvEscape(val) {
    const s = String(val === null || val === undefined ? '' : val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function parseCsvLine(line) {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  }

  function exportTrapsToCsvString(state) {
    const s = state || loadSurveyState();
    const header = ['id', 'location', 'trap_type', 'p_barg', 't_before_c', 't_after_c', 'check_method', 'status', 'note'];
    const lines = [header.join(',')];
    for (const r of s.traps) {
      lines.push(
        [
          csvEscape(r.id),
          csvEscape(r.location),
          csvEscape(r.trap_type),
          csvEscape(r.p_barg),
          csvEscape(r.t_before_c),
          csvEscape(r.t_after_c),
          csvEscape(r.check_method),
          csvEscape(r.status),
          csvEscape(r.note)
        ].join(',')
      );
    }
    return lines.join('\n');
  }

  function importTrapsFromCsvString(csvText) {
    const lines = String(csvText || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return loadSurveyState();
    const startIdx = lines[0].toLowerCase().includes('trap_type') ? 1 : 0;
    const rows = [];
    for (let i = startIdx; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 7) continue;
      const hasId = cols.length >= 9;
      const off = hasId ? 1 : 0;
      rows.push({
        id: hasId ? cols[0] : `T-${rows.length + 1}`,
        location: cols[off] || '',
        trap_type: TRAP_TYPES.includes(cols[off + 1]) ? cols[off + 1] : 'other',
        p_barg: Number(cols[off + 2]) || 0,
        t_before_c: Number(cols[off + 3]) || 0,
        t_after_c: Number(cols[off + 4]) || 0,
        check_method: CHECK_METHODS.includes(cols[off + 5]) ? cols[off + 5] : 'temperature',
        status: TRAP_STATUSES.includes(cols[off + 6]) ? cols[off + 6] : 'unchecked',
        note: cols[off + 7] || ''
      });
    }
    const st = loadSurveyState();
    st.traps = rows;
    saveSurveyState(st);
    return st;
  }

  function exportLeaksToCsvString(state) {
    const s = state || loadSurveyState();
    const header = ['id', 'location', 'flow_ls', 'fixed', 'note'];
    const lines = [header.join(',')];
    for (const r of s.leaks) {
      lines.push(
        [
          csvEscape(r.id),
          csvEscape(r.location),
          csvEscape(r.flow_ls),
          csvEscape(r.fixed ? 'true' : 'false'),
          csvEscape(r.note)
        ].join(',')
      );
    }
    return lines.join('\n');
  }

  function importLeaksFromCsvString(csvText) {
    const lines = String(csvText || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return loadSurveyState();
    const startIdx = lines[0].toLowerCase().includes('flow_ls') ? 1 : 0;
    const rows = [];
    for (let i = startIdx; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 3) continue;
      const hasId = cols.length >= 5;
      const off = hasId ? 1 : 0;
      rows.push({
        id: hasId ? cols[0] : `L-${rows.length + 1}`,
        location: cols[off] || '',
        flow_ls: Number(cols[off + 1]) || 0,
        fixed: String(cols[off + 2]).toLowerCase() === 'true' || cols[off + 2] === '1',
        note: cols[off + 3] || ''
      });
    }
    const st = loadSurveyState();
    st.leaks = rows;
    saveSurveyState(st);
    return st;
  }

  function escapeHtml(str) {
    return String(str === null || str === undefined ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Render #sec-survey inside #dynamic-survey-container
  function renderSurveySection() {
    if (typeof document === 'undefined') return;
    const box = document.getElementById('dynamic-survey-container');
    if (!box) return;

    const lang = (root.AppState && root.AppState.lang === 'he') ? 'he' : 'ru';
    const isHe = lang === 'he';
    const t = I18N[lang];
    const sys = typeof root.getCalculatorUnitSystem === 'function' ? root.getCalculatorUnitSystem() : 'si';
    const cur = typeof root.getCalculatorCurrency === 'function' ? root.getCalculatorCurrency() : '$';
    const UC = root.UnitConverter;
    const EE = root.EconomicsEngine;

    const state = loadSurveyState();
    const trapCounts = summarizeTraps(state.traps);
    const leakSummary = summarizeLeaks(state.leaks, state.leakEconomics, cur);

    const fmtPress = (pBarg) => {
      if (!UC) return `${Number(pBarg).toFixed(2)} barg`;
      const val = sys === 'us' ? UC.toImperial('pressure_g', Number(pBarg)) : Number(pBarg);
      const unit = sys === 'us' ? 'psig' : (isHe ? 'barg' : 'бар изб.');
      return `${val.toFixed(2)} ${unit}`;
    };

    const fmtTemp = (tC) => {
      if (!UC) return `${Number(tC).toFixed(1)} °C`;
      const val = sys === 'us' ? UC.toImperial('temp', Number(tC)) : Number(tC);
      const unit = sys === 'us' ? '°F' : '°C';
      return `${val.toFixed(1)} ${unit}`;
    };

    const fmtFlow = (qLs) => {
      if (!UC) return `${Number(qLs).toFixed(2)} L/s`;
      const val = sys === 'us' ? UC.toImperial('air_flow_ls', Number(qLs)) : Number(qLs);
      const unit = sys === 'us' ? 'cfm' : (isHe ? 'L/s' : 'л/с');
      return `${val.toFixed(2)} ${unit}`;
    };

    const defaultPDisplay = sys === 'us' && UC ? UC.toImperial('pressure_g', 4.0).toFixed(2) : '4.00';
    const defaultT1Display = sys === 'us' && UC ? UC.toImperial('temp', 151.0).toFixed(1) : '151.0';
    const defaultT2Display = sys === 'us' && UC ? UC.toImperial('temp', 102.0).toFixed(1) : '102.0';
    const defaultLeakDisplay = sys === 'us' && UC ? UC.toImperial('air_flow_ls', 2.5).toFixed(2) : '2.50';

    const trapRowsHtml = state.traps.length === 0
      ? `<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">${t.emptyTrapsRow}</td></tr>`
      : state.traps.map((row, idx) => `
          <tr data-trap-index="${idx}">
            <td><strong>${escapeHtml(isHe ? (row.locationHe || row.location) : (row.locationRu || row.location))}</strong></td>
            <td>${escapeHtml(t.trapTypes[row.trap_type] || row.trap_type)}</td>
            <td dir="ltr">${fmtPress(row.p_barg)}</td>
            <td dir="ltr">${fmtTemp(row.t_before_c)}</td>
            <td dir="ltr">${fmtTemp(row.t_after_c)}</td>
            <td>${escapeHtml(t.checkMethods[row.check_method] || row.check_method)}</td>
            <td><span class="badge ${row.status === 'good' ? 'badge-ok' : (row.status === 'unchecked' ? '' : 'badge-warn')}">${escapeHtml(t.trapStatuses[row.status] || row.status)}</span></td>
            <td>${escapeHtml(isHe ? (row.noteHe || row.note) : (row.noteRu || row.note))}</td>
            <td class="no-print">
              <button type="button" class="btn btn-sm btn-outline survey-delete-trap-btn" onclick="window.deleteSurveyTrapRow(${idx})">🗑️ ${t.lblDeleteBtn}</button>
            </td>
          </tr>
        `).join('');

    const leakRowsHtml = state.leaks.length === 0
      ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">${t.emptyLeaksRow}</td></tr>`
      : state.leaks.map((row, idx) => `
          <tr data-leak-index="${idx}">
            <td><strong>${escapeHtml(isHe ? (row.locationHe || row.location) : (row.locationRu || row.location))}</strong></td>
            <td dir="ltr"><strong>${fmtFlow(row.flow_ls)}</strong></td>
            <td>
              <label style="display:inline-flex; align-items:center; gap:0.35rem; cursor:pointer;">
                <input type="checkbox" class="no-print" ${row.fixed ? 'checked' : ''} onchange="window.toggleSurveyLeakFixed(${idx}, this.checked)">
                <span class="badge ${row.fixed ? 'badge-ok' : 'badge-warn'}">${row.fixed ? t.leakFixedYes : t.leakFixedNo}</span>
              </label>
            </td>
            <td>${escapeHtml(isHe ? (row.noteHe || row.note) : (row.noteRu || row.note))}</td>
            <td class="no-print">
              <button type="button" class="btn btn-sm btn-outline survey-delete-leak-btn" onclick="window.deleteSurveyLeakRow(${idx})">🗑️ ${t.lblDeleteBtn}</button>
            </td>
          </tr>
        `).join('');

    const activeFlowDual = UC
      ? UC.formatDual(leakSummary.activeFlowLs, 'air_flow_ls', lang, sys, { siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 2, usDecSecondary: 2 })
      : `<code dir="ltr">${leakSummary.activeFlowLs.toFixed(2)} L/s</code>`;
    const totalFlowDual = UC
      ? UC.formatDual(leakSummary.totalFlowLs, 'air_flow_ls', lang, sys, { siDecPrimary: 2, siDecSecondary: 2, usDecPrimary: 2, usDecSecondary: 2 })
      : `<code dir="ltr">${leakSummary.totalFlowLs.toFixed(2)} L/s</code>`;

    const activeCostStr = (leakSummary.activeEcon && leakSummary.activeEcon.costTotalYear !== null && EE)
      ? `<code dir="ltr"><strong>${EE.formatMoney(leakSummary.activeEcon.costTotalYear, cur, 2)}/${isHe ? 'שנה' : 'год'}</strong> (${UC ? UC.formatWithSpaces(leakSummary.activeEcon.eLeakYearKwh, 1) : leakSummary.activeEcon.eLeakYearKwh.toFixed(1)} kWh/${isHe ? 'שנה' : 'год'})</code>`
      : '—';
    const savedCostStr = (leakSummary.savedEcon && leakSummary.savedEcon.costTotalYear !== null && EE)
      ? `<code dir="ltr"><strong>${EE.formatMoney(leakSummary.savedEcon.costTotalYear, cur, 2)}/${isHe ? 'שנה' : 'год'}</strong> (${UC ? UC.formatWithSpaces(leakSummary.savedEcon.eLeakYearKwh, 1) : leakSummary.savedEcon.eLeakYearKwh.toFixed(1)} kWh/${isHe ? 'שנה' : 'год'})</code>`
      : '—';

    box.innerHTML = `
      <div class="section-header no-print">
        <div>
          <h2>${t.sectionTitle}</h2>
          <p class="section-lead">${t.sectionLead}</p>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
          <button type="button" class="btn btn-secondary btn-sm" id="survey-btn-sample" onclick="window.loadSurveySampleData()">${t.btnLoadSample}</button>
          <button type="button" class="btn btn-primary btn-sm" id="survey-btn-print" onclick="window.printSurveyReportA4()">${t.btnPrintA4}</button>
        </div>
      </div>

      <!-- Панель обмена JSON / CSV -->
      <div class="no-print" style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-block-end:1rem;">
        <button type="button" class="btn btn-outline btn-sm" id="survey-btn-export-json" onclick="window.downloadSurveyJson()">${t.btnExportJson}</button>
        <label class="btn btn-outline btn-sm" style="margin:0; cursor:pointer;">
          ${t.btnImportJson}
          <input type="file" id="survey-input-import-json" accept=".json,application/json" style="display:none;" onchange="window.handleSurveyJsonFile(this)">
        </label>
        <button type="button" class="btn btn-outline btn-sm" id="survey-btn-export-csv" onclick="window.downloadSurveyCsv()">${t.btnExportCsv}</button>
        <label class="btn btn-outline btn-sm" style="margin:0; cursor:pointer;">
          ${t.btnImportCsv}
          <input type="file" id="survey-input-import-csv" accept=".csv,text/csv" style="display:none;" onchange="window.handleSurveyCsvFile(this)">
        </label>
        <button type="button" class="btn btn-outline btn-sm" id="survey-btn-clear" onclick="window.clearAllSurveyData()">${t.btnClearAll}</button>
      </div>

      <!-- Шапка обхода (видна на экране и в печати A4) -->
      <div class="survey-print-sheet" id="survey-print-sheet">
        <div class="survey-sheet-header" style="border:1.5px solid var(--border-strong); border-radius:var(--radius-sm); padding:0.85rem 1rem; margin-block-end:1rem; background:var(--bg-subtle);">
          <h3 style="margin:0 0 0.6rem; font-size:1.05rem;">${t.headerTitle}</h3>
          <div class="calc-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:0.65rem;">
            <div class="field">
              <label for="survey-hdr-date">${t.lblDate}</label>
              <input type="date" id="survey-hdr-date" value="${escapeHtml(state.header.date)}" onchange="window.updateSurveyHeaderField('date', this.value)">
            </div>
            <div class="field">
              <label for="survey-hdr-shift">${t.lblShift}</label>
              <input type="text" id="survey-hdr-shift" value="${escapeHtml(state.header.shift)}" placeholder="${escapeHtml(t.placeholderShift)}" onchange="window.updateSurveyHeaderField('shift', this.value)">
            </div>
            <div class="field">
              <label for="survey-hdr-inspector">${t.lblInspector}</label>
              <input type="text" id="survey-hdr-inspector" value="${escapeHtml(state.header.inspector)}" placeholder="${escapeHtml(t.placeholderInspector)}" onchange="window.updateSurveyHeaderField('inspector', this.value)">
            </div>
            <div class="field">
              <label for="survey-hdr-area">${t.lblArea}</label>
              <input type="text" id="survey-hdr-area" value="${escapeHtml(state.header.area)}" placeholder="${escapeHtml(t.placeholderArea)}" onchange="window.updateSurveyHeaderField('area', this.value)">
            </div>
          </div>
        </div>

        <!-- Вкладки переключения на экране -->
        <div class="calc-tabs no-print" role="tablist" style="margin-block-end:1rem;">
          <button type="button" class="calc-tab-btn ${state.activeTab === 'traps' ? 'active' : ''}" id="survey-tab-traps" role="tab" aria-selected="${state.activeTab === 'traps'}" onclick="window.setSurveyActiveTab('traps')">
            ${t.tabTraps} (<span dir="ltr">${trapCounts.total}</span>)
          </button>
          <button type="button" class="calc-tab-btn ${state.activeTab === 'leaks' ? 'active' : ''}" id="survey-tab-leaks" role="tab" aria-selected="${state.activeTab === 'leaks'}" onclick="window.setSurveyActiveTab('leaks')">
            ${t.tabLeaks} (<span dir="ltr">${leakSummary.totalCount}</span>)
          </button>
        </div>

        <!-- ВКЛАДКА 1: КОНДЕНСАТООТВОДЧИКИ -->
        <div class="survey-tab-panel ${state.activeTab === 'traps' ? 'active' : ''}" id="survey-panel-traps" style="${state.activeTab === 'traps' ? '' : 'display:none;'}">
          <details class="engineer-layer no-print" style="margin-block-end:0.85rem;" open>
            <summary>${t.trapHintsSummary}</summary>
            <div style="margin-block-start:0.5rem; font-size:0.9rem; line-height:1.45;">
              ${t.trapHintsBody}
            </div>
          </details>
          <div class="operator-box no-print" style="margin-block-end:0.85rem; font-size:0.88rem;">
            ${t.trapNoFormulaNote}
          </div>

          <!-- Форма добавления отводчика -->
          <div class="no-print" style="border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.85rem; margin-block-end:1rem;">
            <h4 style="margin:0 0 0.65rem;">${t.addTrapTitle}</h4>
            <div class="calc-grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:0.6rem;">
              <div class="field">
                <label for="survey-trap-loc">${t.colTrapLoc}</label>
                <input type="text" id="survey-trap-loc" placeholder="ST-113">
              </div>
              <div class="field">
                <label for="survey-trap-type">${t.colTrapType}</label>
                <select id="survey-trap-type">
                  <option value="float_s02">${t.trapTypes.float_s02}</option>
                  <option value="inverted_bucket_s03">${t.trapTypes.inverted_bucket_s03}</option>
                  <option value="thermodynamic_s04">${t.trapTypes.thermodynamic_s04}</option>
                  <option value="other">${t.trapTypes.other}</option>
                </select>
              </div>
              <div class="field">
                <label for="survey-trap-p">${t.colTrapP[sys]}</label>
                <input type="number" id="survey-trap-p" step="any" value="${defaultPDisplay}">
              </div>
              <div class="field">
                <label for="survey-trap-t1">${t.colTrapT1[sys]}</label>
                <input type="number" id="survey-trap-t1" step="any" value="${defaultT1Display}">
              </div>
              <div class="field">
                <label for="survey-trap-t2">${t.colTrapT2[sys]}</label>
                <input type="number" id="survey-trap-t2" step="any" value="${defaultT2Display}">
              </div>
              <div class="field">
                <label for="survey-trap-method">${t.colTrapMethod}</label>
                <select id="survey-trap-method">
                  <option value="temperature">${t.checkMethods.temperature}</option>
                  <option value="ultrasound">${t.checkMethods.ultrasound}</option>
                  <option value="visual">${t.checkMethods.visual}</option>
                </select>
              </div>
              <div class="field">
                <label for="survey-trap-status">${t.colTrapStatus}</label>
                <select id="survey-trap-status">
                  <option value="good">${t.trapStatuses.good}</option>
                  <option value="blowing_steam">${t.trapStatuses.blowing_steam}</option>
                  <option value="blocked_cold">${t.trapStatuses.blocked_cold}</option>
                  <option value="unchecked">${t.trapStatuses.unchecked}</option>
                </select>
              </div>
              <div class="field">
                <label for="survey-trap-note">${t.colTrapNote}</label>
                <input type="text" id="survey-trap-note" placeholder="">
              </div>
            </div>
            <div style="margin-block-start:0.65rem;">
              <button type="button" class="btn btn-primary btn-sm" id="survey-btn-add-trap" onclick="window.addSurveyTrapFromForm()">${t.btnAddTrap}</button>
            </div>
          </div>

          <h3 style="margin:0.5rem 0;">${t.tabTraps}</h3>
          ${state.traps.length === 0 ? `
            <div class="empty-state-card no-print" id="survey-traps-empty-card">
              <h4>${t.emptyTrapsCardTitle}</h4>
              <p>${t.emptyTrapsCardDesc}</p>
              <div class="empty-state-actions">
                <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('survey-trap-loc')?.focus()">${t.btnAddTrap}</button>
                <button type="button" class="btn btn-outline btn-sm" onclick="window.loadSurveySampleData()">${t.btnLoadSample}</button>
              </div>
            </div>
          ` : ''}
          <div class="table-wrapper" tabindex="0" role="region" aria-label="${escapeHtml(t.tabTraps)}">
            <table id="survey-traps-table">
              <thead>
                <tr>
                  <th>${t.colTrapLoc}</th>
                  <th>${t.colTrapType}</th>
                  <th>${t.colTrapP[sys]}</th>
                  <th>${t.colTrapT1[sys]}</th>
                  <th>${t.colTrapT2[sys]}</th>
                  <th>${t.colTrapMethod}</th>
                  <th>${t.colTrapStatus}</th>
                  <th>${t.colTrapNote}</th>
                  <th class="no-print">${t.colActions}</th>
                </tr>
              </thead>
              <tbody>
                ${trapRowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Итоги по конденсатоотводчикам -->
          <div class="operator-box" id="survey-traps-summary" style="margin-block-start:0.85rem;">
            <strong>${t.trapSummaryTitle}:</strong>
            <span style="margin-inline-start:0.6rem;">${t.lblTotalTraps}: <code dir="ltr"><strong>${trapCounts.total}</strong></code></span> |
            <span>${t.trapStatuses.good}: <code dir="ltr"><strong>${trapCounts.good}</strong></code></span> |
            <span>${t.trapStatuses.blowing_steam}: <code dir="ltr"><strong>${trapCounts.blowing_steam}</strong></code></span> |
            <span>${t.trapStatuses.blocked_cold}: <code dir="ltr"><strong>${trapCounts.blocked_cold}</strong></code></span> |
            <span>${t.trapStatuses.unchecked}: <code dir="ltr"><strong>${trapCounts.unchecked}</strong></code></span>
          </div>
        </div>

        <!-- ВКЛАДКА 2: УТЕЧКИ СЖАТОГО ВОЗДУХА -->
        <div class="survey-tab-panel ${state.activeTab === 'leaks' ? 'active' : ''}" id="survey-panel-leaks" style="${state.activeTab === 'leaks' ? '' : 'display:none;'}">
          <div class="operator-box no-print" style="margin-block-end:0.85rem; font-size:0.88rem;">
            ${t.leakNoTableNote}
          </div>

          <!-- Форма добавления утечки -->
          <div class="no-print" style="border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.85rem; margin-block-end:1rem;">
            <h4 style="margin:0 0 0.65rem;">${t.addLeakTitle}</h4>
            <div class="calc-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:0.6rem;">
              <div class="field">
                <label for="survey-leak-loc">${t.colLeakLoc}</label>
                <input type="text" id="survey-leak-loc" placeholder="AL-09">
              </div>
              <div class="field">
                <label for="survey-leak-flow">${t.colLeakFlow[sys]}</label>
                <input type="number" id="survey-leak-flow" step="any" min="0" value="${defaultLeakDisplay}">
              </div>
              <div class="field">
                <label for="survey-leak-fixed">${t.colLeakFixed}</label>
                <select id="survey-leak-fixed">
                  <option value="false">${t.leakFixedNo}</option>
                  <option value="true">${t.leakFixedYes}</option>
                </select>
              </div>
              <div class="field">
                <label for="survey-leak-note">${t.colLeakNote}</label>
                <input type="text" id="survey-leak-note" placeholder="">
              </div>
            </div>
            <div style="margin-block-start:0.65rem;">
              <button type="button" class="btn btn-primary btn-sm" id="survey-btn-add-leak" onclick="window.addSurveyLeakFromForm()">${t.btnAddLeak}</button>
            </div>
          </div>

          <!-- Настройки расчёта годовой стоимости утечек через EconomicsEngine -->
          <div class="no-print" style="border:1px dashed var(--border-strong); border-radius:var(--radius-sm); padding:0.8rem; margin-block-end:1rem; background:var(--bg-subtle);">
            <h4 style="margin:0 0 0.5rem; font-size:0.95rem;">${t.leakEconTitle}</h4>
            <div class="calc-grid" style="grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap:0.6rem;">
              <div class="field">
                <label for="survey-econ-spec">${t.lblLeakSpecPower}</label>
                <span class="hint">${t.hintLeakSpecPower}</span>
                <input type="number" id="survey-econ-spec" step="any" min="0.1" value="${state.leakEconomics.specPowerKwM3Min}" onchange="window.updateSurveyLeakEconomics()">
              </div>
              <div class="field">
                <label for="survey-econ-hours">${t.lblLeakHours}</label>
                <input type="number" id="survey-econ-hours" step="any" min="1" max="8784" value="${state.leakEconomics.tYearH}" onchange="window.updateSurveyLeakEconomics()">
              </div>
              <div class="field">
                <label for="survey-econ-tariff">${t.lblLeakTariff[cur] || t.lblLeakTariff.$}</label>
                <input type="number" id="survey-econ-tariff" step="any" min="0" value="${state.leakEconomics.tariffPerKwh}" onchange="window.updateSurveyLeakEconomics()">
              </div>
            </div>
          </div>

          <h3 style="margin:0.5rem 0;">${t.tabLeaks}</h3>
          ${state.leaks.length === 0 ? `
            <div class="empty-state-card no-print" id="survey-leaks-empty-card">
              <h4>${t.emptyLeaksCardTitle}</h4>
              <p>${t.emptyLeaksCardDesc}</p>
              <div class="empty-state-actions">
                <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('survey-leak-loc')?.focus()">${t.btnAddLeak}</button>
                <button type="button" class="btn btn-outline btn-sm" onclick="window.loadSurveySampleData()">${t.btnLoadSample}</button>
              </div>
            </div>
          ` : ''}
          <div class="table-wrapper" tabindex="0" role="region" aria-label="${escapeHtml(t.tabLeaks)}">
            <table id="survey-leaks-table">
              <thead>
                <tr>
                  <th>${t.colLeakLoc}</th>
                  <th>${t.colLeakFlow[sys]}</th>
                  <th>${t.colLeakFixed}</th>
                  <th>${t.colLeakNote}</th>
                  <th class="no-print">${t.colActions}</th>
                </tr>
              </thead>
              <tbody>
                ${leakRowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Итоги по утечкам воздуха -->
          <div class="operator-box" id="survey-leaks-summary" style="margin-block-start:0.85rem;">
            <div>
              <strong>${t.leakSummaryTitle}:</strong>
              <span style="margin-inline-start:0.6rem;">${t.lblTotalLeaksCount}: <code dir="ltr"><strong>${leakSummary.totalCount}</strong></code></span> |
              <span>${t.lblActiveLeaksCount}: <code dir="ltr"><strong>${leakSummary.activeCount}</strong></code></span> |
              <span>${t.lblFixedLeaksCount}: <code dir="ltr"><strong>${leakSummary.fixedCount}</strong></code></span>
            </div>
            <div style="margin-block-start:0.35rem;">
              • ${t.lblActiveLeakFlow}: ${activeFlowDual} | ${t.lblTotalLeakFlow}: ${totalFlowDual}
            </div>
            <div style="margin-block-start:0.35rem;">
              • 💰 ${t.lblAnnualCostActive}: ${activeCostStr}<br>
              • 💰 ${t.lblAnnualCostSaved}: ${savedCostStr}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Interactive DOM handlers exposed on window
  if (typeof root !== 'undefined') {
    root.renderSurveySection = renderSurveySection;

    root.setSurveyActiveTab = function (tabName) {
      const st = loadSurveyState();
      st.activeTab = tabName === 'leaks' ? 'leaks' : 'traps';
      saveSurveyState(st);
      renderSurveySection();
    };

    root.updateSurveyHeaderField = function (field, val) {
      const st = loadSurveyState();
      st.header[field] = String(val || '');
      saveSurveyState(st);
    };

    root.updateSurveyLeakEconomics = function () {
      const st = loadSurveyState();
      const specEl = document.getElementById('survey-econ-spec');
      const hrsEl = document.getElementById('survey-econ-hours');
      const tarEl = document.getElementById('survey-econ-tariff');
      if (specEl) st.leakEconomics.specPowerKwM3Min = Number(specEl.value) || 0;
      if (hrsEl) st.leakEconomics.tYearH = Number(hrsEl.value) || 0;
      if (tarEl) st.leakEconomics.tariffPerKwh = Number(tarEl.value) || 0;
      saveSurveyState(st);
      renderSurveySection();
    };

    root.addSurveyTrapFromForm = function () {
      const st = loadSurveyState();
      const sys = typeof root.getCalculatorUnitSystem === 'function' ? root.getCalculatorUnitSystem() : 'si';
      const UC = root.UnitConverter;

      const loc = (document.getElementById('survey-trap-loc') || {}).value || `ST-${st.traps.length + 1}`;
      const trapType = (document.getElementById('survey-trap-type') || {}).value || 'float_s02';
      const rawP = Number((document.getElementById('survey-trap-p') || {}).value) || 0;
      const rawT1 = Number((document.getElementById('survey-trap-t1') || {}).value) || 0;
      const rawT2 = Number((document.getElementById('survey-trap-t2') || {}).value) || 0;
      const method = (document.getElementById('survey-trap-method') || {}).value || 'temperature';
      const status = (document.getElementById('survey-trap-status') || {}).value || 'good';
      const note = (document.getElementById('survey-trap-note') || {}).value || '';

      const pBarg = sys === 'us' && UC ? UC.toMetric('pressure_g', rawP) : rawP;
      const t1C = sys === 'us' && UC ? UC.toMetric('temp', rawT1) : rawT1;
      const t2C = sys === 'us' && UC ? UC.toMetric('temp', rawT2) : rawT2;

      st.traps.push({
        id: `T-${st.traps.length + 1}`,
        location: loc.trim() || `ST-${st.traps.length + 1}`,
        trap_type: trapType,
        p_barg: pBarg,
        t_before_c: t1C,
        t_after_c: t2C,
        check_method: method,
        status,
        note: note.trim()
      });
      saveSurveyState(st);
      renderSurveySection();
    };

    root.deleteSurveyTrapRow = function (idx) {
      const lang = (root.AppState && root.AppState.lang === 'he') ? 'he' : 'ru';
      const msg = I18N[lang].confirmDeleteRow;
      if (typeof root.confirm === 'function' && !root.confirm(msg)) {
        return false;
      }
      const st = loadSurveyState();
      if (idx >= 0 && idx < st.traps.length) {
        st.traps.splice(idx, 1);
        saveSurveyState(st);
        renderSurveySection();
        return true;
      }
      return false;
    };

    root.addSurveyLeakFromForm = function () {
      const st = loadSurveyState();
      const sys = typeof root.getCalculatorUnitSystem === 'function' ? root.getCalculatorUnitSystem() : 'si';
      const UC = root.UnitConverter;

      const loc = (document.getElementById('survey-leak-loc') || {}).value || `AL-${st.leaks.length + 1}`;
      const rawFlow = Number((document.getElementById('survey-leak-flow') || {}).value) || 0;
      const fixedStr = (document.getElementById('survey-leak-fixed') || {}).value || 'false';
      const note = (document.getElementById('survey-leak-note') || {}).value || '';

      const flowLs = sys === 'us' && UC ? UC.toMetric('air_flow_ls', rawFlow) : rawFlow;

      st.leaks.push({
        id: `L-${st.leaks.length + 1}`,
        location: loc.trim() || `AL-${st.leaks.length + 1}`,
        flow_ls: Math.max(0, flowLs),
        fixed: fixedStr === 'true',
        note: note.trim()
      });
      saveSurveyState(st);
      renderSurveySection();
    };

    root.toggleSurveyLeakFixed = function (idx, isFixed) {
      const st = loadSurveyState();
      if (idx >= 0 && idx < st.leaks.length) {
        st.leaks[idx].fixed = Boolean(isFixed);
        saveSurveyState(st);
        renderSurveySection();
      }
    };

    root.deleteSurveyLeakRow = function (idx) {
      const lang = (root.AppState && root.AppState.lang === 'he') ? 'he' : 'ru';
      const msg = I18N[lang].confirmDeleteRow;
      if (typeof root.confirm === 'function' && !root.confirm(msg)) {
        return false;
      }
      const st = loadSurveyState();
      if (idx >= 0 && idx < st.leaks.length) {
        st.leaks.splice(idx, 1);
        saveSurveyState(st);
        renderSurveySection();
        return true;
      }
      return false;
    };

    root.loadSurveySampleData = function () {
      const lang = (root.AppState && root.AppState.lang === 'he') ? 'he' : 'ru';
      const sample = createSample12TrapsAnd8Leaks(lang);
      const st = loadSurveyState();
      st.traps = sample.traps;
      st.leaks = sample.leaks;
      saveSurveyState(st);
      renderSurveySection();
      return st;
    };

    root.clearAllSurveyData = function (skipConfirmForTest) {
      const lang = (root.AppState && root.AppState.lang === 'he') ? 'he' : 'ru';
      if (!skipConfirmForTest && typeof root.confirm === 'function' && !root.confirm(I18N[lang].confirmClearAll)) {
        return false;
      }
      const st = loadSurveyState();
      st.traps = [];
      st.leaks = [];
      saveSurveyState(st);
      renderSurveySection();
      return true;
    };

    root.downloadSurveyJson = function () {
      const jsonStr = exportSurveyToJsonString();
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_${loadSurveyState().header.date || 'export'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return jsonStr;
    };

    root.handleSurveyJsonFile = function (inputEl) {
      const file = inputEl && inputEl.files && inputEl.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          importSurveyFromJsonString(String(e.target.result || ''));
          renderSurveySection();
        } catch (_) {}
      };
      reader.readAsText(file);
    };

    root.downloadSurveyCsv = function () {
      const st = loadSurveyState();
      const isLeaks = st.activeTab === 'leaks';
      const csvStr = isLeaks ? exportLeaksToCsvString(st) : exportTrapsToCsvString(st);
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_${isLeaks ? 'leaks' : 'traps'}_${st.header.date || 'export'}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return csvStr;
    };

    root.handleSurveyCsvFile = function (inputEl) {
      const file = inputEl && inputEl.files && inputEl.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        const text = String(e.target.result || '');
        const st = loadSurveyState();
        if (st.activeTab === 'leaks') {
          importLeaksFromCsvString(text);
        } else {
          importTrapsFromCsvString(text);
        }
        renderSurveySection();
      };
      reader.readAsText(file);
    };

    root.printSurveyReportA4 = function () {
      document.body.setAttribute('data-print-mode', 'survey');
      if (typeof root.print === 'function') {
        root.print();
      }
      setTimeout(() => {
        if (document.body.getAttribute('data-print-mode') === 'survey') {
          document.body.removeAttribute('data-print-mode');
        }
      }, 600);
    };
  }

  return {
    STORAGE_KEY_SURVEY,
    SURVEY_FORMAT_VERSION,
    TRAP_TYPES,
    CHECK_METHODS,
    TRAP_STATUSES,
    I18N,
    createDefaultSurveyData,
    createSample12TrapsAnd8Leaks,
    loadSurveyState,
    saveSurveyState,
    summarizeTraps,
    summarizeLeaks,
    exportSurveyToJsonString,
    importSurveyFromJsonString,
    exportTrapsToCsvString,
    importTrapsFromCsvString,
    exportLeaksToCsvString,
    importLeaksFromCsvString,
    renderSurveySection
  };
});
