/**
 * data/trust_labels.js — Ярлыки достоверности и применимости (Редакция v15.6).
 * Разделяет три вида утверждений:
 *   - example (●): учебный пример (числа подобраны для обучения, это не норма предприятия);
 *   - principle (■): общий физический закон или баланс (справедлив при названных допущениях);
 *   - manufacturer (▲): требование конкретного документа производителя/модели.
 *
 * Экспортирует: { KINDS, FORMULAS, MODULES, CASES, EXPERIMENTS, UI, formatSourceForLang }
 * Браузер: window.TRUST_LABELS
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TRUST_LABELS = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KINDS = {
    example: {
      id: 'example',
      symbol: '●',
      label: {
        ru: 'Учебный пример',
        he: 'דוגמה לימודית'
      },
      explanation: {
        ru: 'Числа подобраны для обучения, это не норма предприятия.',
        he: 'המספרים נבחרו לצורכי לימוד ואינם מהווים תקן מפעלי.'
      }
    },
    principle: {
      id: 'principle',
      symbol: '■',
      label: {
        ru: 'Общий принцип',
        he: 'עיקרון כללי'
      },
      explanation: {
        ru: 'Физический закон или баланс, справедлив при названных допущениях.',
        he: 'חוק פיזיקלי או מאזן, תקף בכפוף להנחות המצוינות.'
      }
    },
    manufacturer: {
      id: 'manufacturer',
      symbol: '▲',
      label: {
        ru: 'Требование производителя / модели',
        he: 'דרישת יצרן / דגם'
      },
      explanation: {
        ru: 'Предел или правило конкретного документа производителя, применимо к названной модели или серии.',
        he: 'מגבלה או כלל מתוך מסמך של יצרן מסוים, תקף לדגם או לסדרה המצוינים.'
      }
    }
  };

  var UI = {
    ru: {
      badgeTitle: 'Ярлык достоверности',
      legendSummary: 'Что означают ярлыки',
      legendIntro: 'Каждая формула, расчётный модуль, случай и опыт помечены ярлыком вида утверждения и ссылкой на источник:',
      sourceLabel: 'Источник',
      assumptionLabel: 'Допущение',
      exampleDisclaimer: 'Учебный пример — не норма предприятия',
      whereInTextbook: 'Где в учебнике'
    },
    he: {
      badgeTitle: 'תווית מהימנות',
      legendSummary: 'מה משמעות התוויות',
      legendIntro: 'לכל נוסחה, מודול חישוב, מקרה תרגול וניסוי מוצמדת תווית המציינת את סוג הטענה וקישור למקור:',
      sourceLabel: 'מקור',
      assumptionLabel: 'הנחה',
      exampleDisclaimer: 'דוגמה לימודית — אינה תקן מפעלי',
      whereInTextbook: 'איפה בספר הלימוד'
    }
  };

  /**
   * 27 заголовков блоков formulas (15 h4 + 12 h5):
   * steam (5): h4-1, h5-1, h5-2, h4-2, h5-3
   * condensate (5): h4-1, h5-1, h5-2, h4-2, h5-3
   * chillers (3): h4-1, h4-2, h5-1
   * air (4): h4-1, h4-2, h4-3, h4-4
   * ro (10): h4-1, h5-1, h4-2, h5-2, h4-3, h5-3, h4-4, h5-4, h4-5, h5-5
   */
  var FORMULAS = [
    // --- STEAM (5) ---
    {
      anchor: 'guide-steam-formulas-h4-1',
      kind: 'principle',
      source: 'S22, с. 1–2 (PDF с. 1–2); S01, с. 52 (PDF с. 58)',
      noteRu: 'В установившемся режиме (если пренебречь уносом солей с паром)',
      noteHe: 'במשטר עבודה יציב (אם מזניחים סחיפת מלחים עם הקיטור)'
    },
    {
      anchor: 'guide-steam-formulas-h5-1',
      kind: 'example',
      source: 'S22, с. 1–2 (PDF с. 1–2)',
      parentAnchor: 'guide-steam-formulas-h4-1',
      noteRu: 'учебные числа',
      noteHe: 'נתונים לימודיים',
      disputed: true,
      citedSources: 'S22, с. 1–2 (PDF с. 1–2); S01, с. 52 (PDF с. 58) (в родительском разделе h4-1)',
      disputeReason: {
        ru: 'В подпункте h5-1 («Учебный пример 1А») прямо указано «(учебные числа)» без повторной ссылки #source-Sxx; формулы и обозначения принадлежат родительскому разделу «Формула 1» (guide-steam-formulas-h4-1) и соседнему примеру 1Б (h5-2), где процитирован S22, с. 1–2 (PDF с. 1–2).',
        he: 'בתת-סעיף h5-1 («דוגמה לימודית 1א») מצוין במפורש «(נתונים לימודיים)» ללא קישור חוזר #source-Sxx; הנוסחאות שייכות לסעיף האב «נוסחה 1» (guide-steam-formulas-h4-1) ולדוגמה הסמוכה 1ב (h5-2), שבהם מצוטט S22, p. 1–2.'
      }
    },
    {
      anchor: 'guide-steam-formulas-h5-2',
      kind: 'example',
      source: 'S22, с. 1 (PDF с. 1)'
    },
    {
      anchor: 'guide-steam-formulas-h4-2',
      kind: 'principle',
      source: 'S01, с. 2–3, 53, 55 (PDF с. 8–9, 59, 61)',
      noteRu: 'Когда сухой насыщенный пар конденсируется в теплообменнике и конденсат отводится конденсатоотводчиком при температуре насыщения',
      noteHe: 'כאשר קיטור רווי יבש מתעבה במחליף חום והקונדנסט מפונה על ידי מלכודת קיטור בטמפרטורת הרוויה'
    },
    {
      anchor: 'guide-steam-formulas-h5-3',
      kind: 'example',
      source: 'S01, с. 11 (PDF с. 17)'
    },

    // --- CONDENSATE (5) ---
    {
      anchor: 'guide-condensate-formulas-h4-1',
      kind: 'principle',
      source: 'S07, с. 13 (PDF с. 14)',
      noteRu: 'По уравнению теплового баланса дросселирования насыщенного конденсата',
      noteHe: 'לפי משוואת מאזן החום של מצערת קונדנסט רווי',
      disputed: true,
      citedSources: 'S07, с. 13 (PDF с. 14)',
      disputeReason: {
        ru: 'Формула доли вторичного пара вскипания выражает общий термодинамический баланс энтальпий при дросселировании насыщенного конденсата, однако во фрагменте она процитирована по руководству производителя TLV PowerTrap (S07, с. 13 / PDF с. 14). По правилу 2.1b поставлен вид principle.',
        he: 'נוסחת שיעור קיטור ההבזקה מבטאת מאזן אנתלפיה תרמודינמי כללי, אך בקטע היא מצוטטת מתוך מדריך היצרן TLV PowerTrap (S07, p. 13 / PDF p. 14). לפי כלל 2.1b נקבע הסוג principle.'
      }
    },
    {
      anchor: 'guide-condensate-formulas-h5-1',
      kind: 'example',
      source: 'S07, с. 13–14 (PDF с. 14–15)'
    },
    {
      anchor: 'guide-condensate-formulas-h5-2',
      kind: 'example',
      source: 'S23, с. 1 (PDF с. 1)'
    },
    {
      anchor: 'guide-condensate-formulas-h4-2',
      kind: 'principle',
      source: 'S21, с. 1 (PDF с. 1); S07, с. 19 (PDF с. 20)',
      disputed: true,
      citedSources: 'S21, с. 1 (PDF с. 1); S07, с. 19 (PDF с. 20)',
      disputeReason: {
        ru: 'Фрагмент описывает общий тепловой баланс возврата конденсата и одновременно цитирует как общий отраслевой источник US DOE (S21, с. 1), так и руководство производителя TLV (S07, с. 19 / PDF с. 20). По правилу 2.1b поставлен вид principle.',
        he: 'הקטע מתאר מאזן חום כללי של השבת קונדנסט ומצטט במקביל מקור כללי של US DOE (S21, p. 1) ומדריך יצרן של TLV (S07, p. 19 / PDF p. 20). לפי כלל 2.1b נקבע הסוג principle.'
      }
    },
    {
      anchor: 'guide-condensate-formulas-h5-3',
      kind: 'example',
      source: 'S21, с. 1 (PDF с. 1)'
    },

    // --- CHILLERS (3) ---
    {
      anchor: 'guide-chillers-formulas-h4-1',
      kind: 'principle',
      source: 'S08, с. 66 (PDF с. 66)',
      noteRu: 'Для чистой воды',
      noteHe: 'עבור מים נקיים',
      disputed: true,
      citedSources: 'S08, с. 66 (PDF с. 66)',
      disputeReason: {
        ru: 'Формула холодопроизводительности по водяному контуру является общим уравнением теплового баланса (Q = m * c_p * ΔT), но во фрагменте процитировано руководство производителя Trane (S08, с. 66) со стандартными условиями AHRI (2,4 и 3,0 GPM/ton). По правилу 2.1b поставлен вид principle.',
        he: 'נוסחת תפוקת הקירור במעגל המים היא משוואת מאזן חום כללית, אך בקטע מצוטט מדריך היצרן Trane (S08, p. 66) עם תנאי AHRI. לפי כלל 2.1b נקבע הסוג principle.'
      }
    },
    {
      anchor: 'guide-chillers-formulas-h4-2',
      kind: 'principle',
      source: 'S08, с. 66, 96 (PDF с. 66, 96); S10, с. 45 (PDF с. 45)',
      noteRu: 'Энергетический баланс чиллера (для компрессора с охлаждением всасываемым газом)',
      noteHe: 'מאזן האנרגיה של הצ\'ילר (למדחס המקורר בגז היניקה)',
      disputed: true,
      citedSources: 'S08, с. 66, 96 (PDF с. 66, 96); S10, с. 45 (PDF с. 45); S01, с. 19 (PDF с. 25); S10, с. 44 (PDF с. 44)',
      disputeReason: {
        ru: 'Определения температурных напоров (Approach), энергобаланса чиллера, COP и kW/Ton являются общими физическими соотношениями, но во фрагменте процитированы вместе общий источник US DOE (S01) и руководства производителей Trane (S08) и Carrier (S10). По правилу 2.1b поставлен вид principle.',
        he: 'הגדרות מפלי הטמפרטורה (Approach), מאזן האנרגיה, COP ו-kW/Ton הן יחסים פיזיקליים כלליים, אך בקטע מצוטטים יחד מקור כללי US DOE (S01) ומדריכי היצרנים Trane (S08) ו-Carrier (S10). לפי כלל 2.1b נקבע הסוג principle.'
      }
    },
    {
      anchor: 'guide-chillers-formulas-h5-1',
      kind: 'example',
      source: 'S08 с. 66; S10, с. 45'
    },

    // --- AIR (4) ---
    {
      anchor: 'guide-air-formulas-h4-1',
      kind: 'principle',
      source: 'S13, Section 1.2.6, печ. стр. 13 / PDF стр. 15',
      disputed: true,
      citedSources: 'S13, Section 1.2.6, печ. стр. 13 / PDF стр. 15; S13, Section 5.3, печ. стр. 116–117 / PDF стр. 118–119',
      disputeReason: {
        ru: 'Пересчёт расхода газа между нормальными условиями и условиями всасывания (FAD) основан на общем уравнении состояния идеального газа, однако процитирован по справочнику производителя Atlas Copco (S13) и включает внутри фрагмента учебный пример в блоке цитаты. По правилу 2.1b поставлен вид principle.',
        he: 'המרת ספיקת גז בין תנאים תקניים לתנאי יניקה (FAD) מבוססת על משוואת הגז האידיאלי הכללית, אך מצוטטת מתוך מדריך היצרן Atlas Copco (S13) וכוללת בתוך הקטע דוגמה לימודית. לפי כלל 2.1b נקבע הסוג principle.'
      }
    },
    {
      anchor: 'guide-air-formulas-h4-2',
      kind: 'principle',
      source: 'S12, Fact Sheet 3, печ. стр. 27 / PDF стр. 31',
      noteRu: 'По времени цикла компрессора в нерабочую смену (когда все потребители в цеху остановлены)',
      noteHe: 'לפי זמן המחזור של המדחס במשמרת ללא ייצור (כאשר כל הצרכנים באולם הייצור מושבתים)',
      disputed: true,
      citedSources: 'S12, Fact Sheet 3, печ. стр. 27–28 / PDF стр. 31–32; Fact Sheet 10, печ. стр. 62–63 / PDF стр. 66–67',
      disputeReason: {
        ru: 'Первая формула выражает общее отношение времени нагрузки к длительности цикла, а вторая (Pump-Down Test) включает эмпирический поправочный множитель 1,25 из методики US DOE/CAC (S12, печ. стр. 28 / PDF стр. 32) и встроенный учебный пример. По правилу 2.1b поставлен вид principle.',
        he: 'הנוסחה הראשונה מבטאת יחס זמני מחזור כללי, והשנייה (Pump-Down Test) כוללת מקדם תיקון אמפירי 1.25 מתוך מתודולוגיית US DOE/CAC (S12) ודוגמה לימודית משולבת. לפי כלל 2.1b נקבע הסוג principle.'
      }
    },
    {
      anchor: 'guide-air-formulas-h4-3',
      kind: 'principle',
      source: 'S13, Section 3.6.1.1, печ. стр. 91 / PDF стр. 93; S12, Fact Sheet 6, печ. стр. 42 / PDF стр. 46',
      disputed: true,
      citedSources: 'S13, Section 3.6.1.1, печ. стр. 91 / PDF стр. 93; S13, Section 5.3.3, печ. стр. 118 / PDF стр. 120; S12, Fact Sheet 6, печ. стр. 42 / PDF стр. 46; S13, Section 5.6, печ. стр. 122 / PDF стр. 124',
      disputeReason: {
        ru: 'Во фрагменте объединены две формулы подбора ресивера (по частоте циклов с допуском Atlas Copco f_max = 1/30 с⁻¹ из S13 и по покрытию пикового расхода из общего источника US DOE/CAC S12 и S13) и два учебных примера. По правилу 2.1b поставлен вид principle.',
        he: 'בקטע משולבות שתי נוסחאות לבחירת מכל אוויר (לפי תדירות מחזורים עם מגבלת Atlas Copco מתוך S13 ולפי כיסוי צריכת שיא מתוך מקור כללי US DOE/CAC S12 ו-S13) ושתי דוגמאות לימודיות. לפי כלל 2.1b נקבע הסוג principle.'
      }
    },
    {
      anchor: 'guide-air-formulas-h4-4',
      kind: 'principle',
      source: 'S13, Section 5.4.1, печ. стр. 120 / PDF стр. 122',
      noteRu: 'поток конденсирующейся влаги равен разности массы водяного пара, входящего с атмосферным воздухом (f_1), и массы пара, остающегося в осушенном сжатом воздухе при точке росы под давлением (f_2)',
      noteHe: 'ספיקת הלחות המתעבה שווה להפרש בין מסת אדי המים הנכנסת עם האוויר האטמוספרי (f_1) לבין מסת האדים הנותרת באוויר הדחוס המיובש בנקודת הטל תחת לחץ (f_2)',
      disputed: true,
      citedSources: 'S13, Section 5.4.1, печ. стр. 120 / PDF стр. 122; S13, Section 6.5, печ. стр. 134 / PDF стр. 136; S13, PDF p. 119',
      disputeReason: {
        ru: 'Расчёт основан на общем материальном балансе водяного пара (f_3 = f_1 − f_2), но использует табличные значения влагосодержания и сквозной числовой пример из справочника производителя Atlas Copco (S13). По правилу 2.1b поставлен вид principle.',
        he: 'החישוב מבוסס על מאזן מסה כללי של אדי מים (f_3 = f_1 − f_2), אך משתמש בערכי טבלה ובדוגמה מתוך מדריך היצרן Atlas Copco (S13). לפי כלל 2.1b נקבע הסוג principle.'
      }
    },

    // --- RO (10) ---
    {
      anchor: 'guide-ro-formulas-h4-1',
      kind: 'principle',
      source: 'S16, Section 1.3, PDF p. 15–16',
      noteRu: 'при допущении 100%-ного задержания солей мембраной, R = 1.0',
      noteHe: 'בהנחה של דחיית מלחים של 100% על ידי הממברנה, R = 1.0',
      disputed: true,
      citedSources: 'S16, Section 1.3, PDF p. 15–16; Section 2.4.1, Eq. 2, PDF p. 35; Section 8.2, Eq. 79, PDF p. 152; Table 27, Eq. 51, PDF p. 102',
      disputeReason: {
        ru: 'Уравнения водного баланса (Q_f = Q_p + Q_c), степени извлечения Y и коэффициента концентрирования CF являются общими балансовыми определениями, но процитированы по техническому руководству производителя мембран DuPont FilmTec (S16). По правилу 2.1b поставлен вид principle.',
        he: 'משוואות מאזן המים, שיעור ההשבה Y ומקדם הריכוז CF הן הגדרות מאזן כלליות, אך מצוטטות מתוך המדריך הטכני של יצרן הממברנות DuPont FilmTec (S16). לפי כלל 2.1b נקבע הסוג principle.'
      }
    },
    {
      anchor: 'guide-ro-formulas-h5-1',
      kind: 'example',
      source: 'S16, Section 2.4.7, PDF p. 51–54; S17, PDF p. 2'
    },
    {
      anchor: 'guide-ro-formulas-h4-2',
      kind: 'principle',
      source: 'S16, Section 3.6, Eq. 33, PDF p. 84',
      disputed: true,
      citedSources: 'S16, Section 3.6, Eq. 33, PDF p. 84; Section 8.2, Eq. 80, PDF p. 152; Section 8.4.5, PDF p. 158; Section 9.1, Eq. 82, PDF p. 177',
      disputeReason: {
        ru: 'Определения проскока солей SP, селективности R и солевого баланса (Q_f·C_f = Q_p·C_p + Q_c·C_c) — общие физические соотношения, однако критерий допустимого отклонения баланса 1,00 ± 0,05 (0,95–1,05) взят из руководства DuPont FilmTec (S16, PDF p. 152). По правилу 2.1b поставлен вид principle.',
        he: 'הגדרות מעבר המלחים SP, דחיית המלחים R ומאזן המלחים הן יחסים פיזיקליים כלליים, אך קריטריון הסטייה המותרת 1.00 ± 0.05 נלקח ממדריך DuPont FilmTec (S16, PDF p. 152). לפי כלל 2.1b נקבע הסוג principle.'
      }
    },
    {
      anchor: 'guide-ro-formulas-h5-2',
      kind: 'example',
      source: 'S16, Section 8.2, PDF p. 152'
    },
    {
      anchor: 'guide-ro-formulas-h4-3',
      kind: 'principle',
      source: 'S16, Section 2.5.1, Eq. 32, PDF p. 58–59',
      noteRu: 'Величина степени забивания фильтра (1 − t_i / t_f) не должна превышать 0.75 (75%).',
      noteHe: 'מידת סתימת המסנן (1 − t_i / t_f) אינה צריכה לעלות על 0.75 (75%).',
      disputed: true,
      citedSources: 'S16, Section 2.5.1, Eq. 32, PDF p. 58–59',
      disputeReason: {
        ru: 'Формула индекса SDI₁₅ определяется общеотраслевым стандартом ASTM D4189, но в учебнике процитирована через техническое руководство производителя DuPont FilmTec (S16, PDF p. 58–59). По правилу 2.1b поставлен вид principle.',
        he: 'נוסחת מדד SDI₁₅ מוגדרת בתקן הכללי ASTM D4189, אך בספר הלימוד היא מצוטטת דרך המדריך הטכני של DuPont FilmTec (S16, PDF p. 58–59). לפי כלל 2.1b נקבע הסוג principle.'
      }
    },
    {
      anchor: 'guide-ro-formulas-h5-3',
      kind: 'example',
      source: 'S16, Section 2.5.1, PDF p. 59; S17, PDF p. 1'
    },
    {
      anchor: 'guide-ro-formulas-h4-4',
      kind: 'manufacturer',
      source: 'S16, Section 5.6.6, Eq. 72–78, Example, PDF p. 131–133',
      noteRu: 'для C_fc < 20 000 мг/л (Eq. 75)',
      noteHe: 'עבור C_fc < 20 000 mg/L (Eq. 75)'
    },
    {
      anchor: 'guide-ro-formulas-h5-4',
      kind: 'example',
      source: 'S16, PDF p. 132–133'
    },
    {
      anchor: 'guide-ro-formulas-h4-5',
      kind: 'principle',
      source: 'S16, Section 2.6.3, PDF p. 66; S18, p. 1',
      disputed: true,
      citedSources: 'S16, Section 2.6.3, PDF p. 66; S18, TSB107.30, p. 1',
      disputeReason: {
        ru: 'Фрагмент сочетает общий стехиометрический расчёт реакции дехлорирования (1,34 мг SMBS на 1,0 мг Cl₂) и эксплуатационные нормы дозирования производителей мембран DuPont FilmTec (3,0 мг/мг, S16) и Hydranautics (1,8–3,0 мг/мг, S18). По правилу 2.1b поставлен вид principle.',
        he: 'הקטע משלב חישוב סטוכיומטרי כללי של תגובת הסרת הכלור (1.34 mg SMBS ל-1.0 mg Cl₂) וכללי מינון תפעוליים של יצרני הממברנות DuPont FilmTec (3.0 mg/mg, S16) ו-Hydranautics (1.8–3.0 mg/mg, S18). לפי כלל 2.1b נקבע הסוג principle.'
      }
    },
    {
      anchor: 'guide-ro-formulas-h5-5',
      kind: 'example',
      source: 'S16, Section 2.6.3, PDF p. 66'
    }
  ];

  /**
   * 10 расчётных модулей:
   * source — только коды и страницы из MODULE_MEANING[mod].source
   * guideAnchor — #guide-<sys>-formulas
   */
  var MODULES = {
    '1A': {
      moduleId: '1A',
      kind: 'principle',
      source: 'S01, PDF p. 37; S21, PDF p. 1',
      guideAnchor: '#guide-steam-formulas',
      disputed: true,
      citedSources: 'S01, PDF p. 37; S21, PDF p. 1',
      disputeReason: {
        ru: 'Модуль 1A использует общий тепловой баланс конденсации пара и методику пересчёта потерь в годовую стоимость топлива из документов US DOE (S01, S21). Поскольку S01 и S21 — отраслевые руководства US DOE, а не документация конкретного производителя/модели, выбран вид principle.',
        he: 'מודול 1A משתמש במאזן חום כללי ובמתודולוגיית חישוב עלות דלק שנתית מתוך מסמכי US DOE (S01, S21). מאחר ש-S01 ו-S21 הם מדריכים ענפיים כלליים ולא מסמכי יצרן/דגם, נקבע הסוג principle.'
      }
    },
    '1B': {
      moduleId: '1B',
      kind: 'principle',
      source: 'S01, PDF p. 33; S07, PDF p. 15',
      guideAnchor: '#guide-steam-formulas',
      disputed: true,
      citedSources: 'S01, PDF p. 33; S07, PDF p. 15',
      disputeReason: {
        ru: 'В MODULE_MEANING["1B"].source процитированы одновременно общий источник US DOE (S01) и руководство производителя TLV (S07), а также указан якорь #guide-steam-formulas (хотя подробный разбор вторичного пара также есть в #guide-condensate-formulas). По п. 2.1c вид модуля 1B — principle.',
        he: 'ב-MODULE_MEANING["1B"].source מצוטטים יחד מקור כללי US DOE (S01) ומדריך היצרן TLV (S07). לפי סעיף 2.1c סוג המודול 1B הוא principle.'
      }
    },
    '2': {
      moduleId: '2',
      kind: 'principle',
      source: 'S08, PDF p. 11, 33; S09, PDF p. 129; S10, PDF p. 44–45',
      guideAnchor: '#guide-chillers-formulas',
      disputed: true,
      citedSources: 'S08, PDF p. 11, 33; S09, PDF p. 129; S10, PDF p. 44–45',
      disputeReason: {
        ru: 'Расчёт теплового баланса испарителя, COP и kW/Ton — общий термодинамический принцип (п. 2.1c), но в MODULE_MEANING["2"].source процитированы руководства производителей Trane (S08, S09) и Carrier (S10).',
        he: 'חישוב מאזן החום של המאייד, COP ו-kW/Ton הוא עיקרון תרמודינמי כללי (סעיף 2.1c), אך ב-MODULE_MEANING["2"].source מצוטטים מדריכי היצרנים Trane (S08, S09) ו-Carrier (S10).'
      }
    },
    '3A': {
      moduleId: '3A',
      kind: 'principle',
      source: 'S13, PDF p. 102–103',
      guideAnchor: '#guide-air-formulas',
      disputed: true,
      citedSources: 'S13, PDF p. 102–103',
      disputeReason: {
        ru: 'Пересчёт объёмного расхода воздуха между FAD и нормальными условиями основан на законе идеального газа (вид principle по п. 2.1c), при этом в MODULE_MEANING["3A"].source процитирован справочник производителя Atlas Copco (S13).',
        he: 'המרת ספיקת אוויר בין FAD לתנאים תקניים מבוססת על חוק הגז האידיאלי (סוג principle לפי סעיף 2.1c), בעוד שב-MODULE_MEANING["3A"].source מצוטט מדריך היצרן Atlas Copco (S13).'
      }
    },
    '3B': {
      moduleId: '3B',
      kind: 'principle',
      source: 'S12, PDF p. 52–53, 84–85; S13, PDF p. 111–112',
      guideAnchor: '#guide-air-formulas',
      disputed: true,
      citedSources: 'S12, PDF p. 52–53, 84–85; S13, PDF p. 111–112',
      disputeReason: {
        ru: 'Модуль 3B объединяет оценку доли утечек по времени цикла/падению давления из общего руководства US DOE/CAC (S12) и подбор объёма ресивера с частотой циклов из справочника Atlas Copco (S13). Поскольку процитированы и общий, и фирменный источники, поставлен вид principle.',
        he: 'מודול 3B משלב הערכת דליפות מתוך המדריך הכללי US DOE/CAC (S12) וחישוב נפח מכל אוויר מתוך מדריך Atlas Copco (S13). מאחר שמצוטטים מקור כללי ומקור יצרן יחד, נקבע הסוג principle.'
      }
    },
    '3C': {
      moduleId: '3C',
      kind: 'principle',
      source: 'S13, Section 5.4.1, PDF p. 102–103',
      guideAnchor: '#guide-air-formulas',
      disputed: true,
      citedSources: 'S13, Section 5.4.1, PDF p. 102–103',
      disputeReason: {
        ru: 'Модуль 3C рассчитывает выпадение влаги по общему материальному балансу водяного пара при сжатии и охлаждении, используя таблицу влагосодержания насыщенного воздуха из справочника Atlas Copco (S13). По правилу 2.1b/2.1c поставлен вид principle.',
        he: 'מודול 3C מחשב התעבות לחות לפי מאזן מסה כללי של אדי מים, תוך שימוש בטבלת לחות רוויה מתוך מדריך Atlas Copco (S13). לפי כלל 2.1b/2.1c נקבע הסוג principle.'
      }
    },
    '4A': {
      moduleId: '4A',
      kind: 'principle',
      source: 'S16, PDF p. 35, 102, 152',
      guideAnchor: '#guide-ro-formulas',
      disputed: true,
      citedSources: 'S16, PDF p. 35, 102, 152',
      disputeReason: {
        ru: 'Модуль 4A реализует общий материальный и солевой баланс обратного осмоса (вид principle по п. 2.1c), а в MODULE_MEANING["4A"].source процитировано руководство производителя мембран DuPont FilmTec (S16).',
        he: 'מודול 4A מממש מאזן מים ומלחים כללי באוסמוזה הפוכה (סוג principle לפי סעיף 2.1c), וב-MODULE_MEANING["4A"].source מצוטט מדריך היצרן DuPont FilmTec (S16).'
      }
    },
    '4B': {
      moduleId: '4B',
      kind: 'manufacturer',
      source: 'S16, PDF p. 106, 131–133, 165',
      guideAnchor: '#guide-ro-formulas'
    },
    '5A': {
      moduleId: '5A',
      kind: 'principle',
      source: 'S01, PDF p. 16',
      guideAnchor: '#guide-steam-formulas'
    },
    '5B': {
      moduleId: '5B',
      kind: 'principle',
      source: 'S01, PDF p. 25, 34; S22, PDF p. 1',
      guideAnchor: '#guide-steam-formulas',
      disputed: true,
      citedSources: 'S01, PDF p. 25, 34; S22, PDF p. 1',
      disputeReason: {
        ru: 'Модуль 5B сочетает общий баланс солей в котле с методикой оценки экономии тепла при снижении продувки по документам US DOE (S01, S22). Так как оба источника — общие отраслевые руководства US DOE, выбран вид principle.',
        he: 'מודול 5B משלב מאזן מלחים כללי בדוד עם מתודולוגיית הערכת חיסכון בחום לפי מסמכי US DOE (S01, S22). מאחר ששני המקורות הם מדריכים כלליים של US DOE, נקבע הסוג principle.'
      }
    }
  };

  /**
   * 10 случаев тренажёра (все kind: 'example', source === CASE_CONTEXT.CASES[id].causeSource)
   */
  var CASES = {
    'case-1-1': { caseId: 'case-1-1', kind: 'example', source: 'S02, PDF pp. 1–7' },
    'case-1-2': { caseId: 'case-1-2', kind: 'example', source: 'S04, PDF pp. 1–2' },
    'case-2-1': { caseId: 'case-2-1', kind: 'example', source: 'S07, PDF pp. 14–15, 19–21' },
    'case-2-2': { caseId: 'case-2-2', kind: 'example', source: 'S01, PDF pp. 26–27, 34, 37; S21, p. 1' },
    'case-3-1': { caseId: 'case-3-1', kind: 'example', source: 'S08, PDF pp. 65–66, 88' },
    'case-3-2': { caseId: 'case-3-2', kind: 'example', source: 'S08, PDF pp. 16, 35, 41, 82–83, 88' },
    'case-4-1': { caseId: 'case-4-1', kind: 'example', source: 'S13, PDF p. 47–59, 122; S15, PDF p. 3–7' },
    'case-4-2': { caseId: 'case-4-2', kind: 'example', source: 'S12, PDF p. 53–54; S13, p. 124' },
    'case-5-1': { caseId: 'case-5-1', kind: 'example', source: 'S16, PDF p. 131–133; S19, p. 4–8' },
    'case-5-2': { caseId: 'case-5-2', kind: 'example', source: 'S16, PDF p. 66, 106, 165; S17, p. 1–3' }
  };

  /**
   * 15 опытов (все kind: 'example', source === EXPERIMENTS[i].source)
   */
  var EXPERIMENTS = {
    '1A-1': { expId: '1A-1', kind: 'example', source: 'S01, PDF p. 37; S21, PDF p. 1' },
    '1A-2': { expId: '1A-2', kind: 'example', source: 'S01, PDF p. 37; S21, PDF p. 1' },
    '2-1':  { expId: '2-1',  kind: 'example', source: 'S08, PDF p. 11, 33; S09, PDF p. 129' },
    '2-2':  { expId: '2-2',  kind: 'example', source: 'S08, PDF p. 11, 33; S09, PDF p. 129' },
    '2-3':  { expId: '2-3',  kind: 'example', source: 'S09, PDF p. 129; S10, PDF p. 44–45' },
    '3B-1': { expId: '3B-1', kind: 'example', source: 'S12, PDF p. 84; S13, PDF p. 111–112' },
    '3B-2': { expId: '3B-2', kind: 'example', source: 'S12, PDF p. 84; S13, PDF p. 111–112' },
    '3B-3': { expId: '3B-3', kind: 'example', source: 'S12, PDF p. 84–85' },
    '4A-1': { expId: '4A-1', kind: 'example', source: 'S16, PDF p. 35, 102, 152' },
    '4A-2': { expId: '4A-2', kind: 'example', source: 'S16, PDF p. 35, 102' },
    '4B-1': { expId: '4B-1', kind: 'example', source: 'S16, PDF p. 131–133, Eq. 72' },
    '4B-2': { expId: '4B-2', kind: 'example', source: 'S16, PDF p. 131–133, Eq. 72' },
    '5B-1': { expId: '5B-1', kind: 'example', source: 'S01, PDF p. 25' },
    '5B-2': { expId: '5B-2', kind: 'example', source: 'S01, PDF p. 25' },
    '5B-3': { expId: '5B-3', kind: 'example', source: 'S01, PDF p. 25, 42; IAPWS-IF97' }
  };

  /**
   * Форматирует строку источника для отображения на выбранном языке
   * (на иврите заменяет русские сокращения страниц «печ. стр.», «PDF стр.», «с.» на латинские «p.» / «PDF p.»
   * во избежание кириллицы в HE-режиме).
   */
  function formatSourceForLang(sourceStr, lang) {
    var s = String(sourceStr || '');
    if (lang === 'he') {
      return s
        .replace(/печ\.\s*стр\./g, 'p.')
        .replace(/PDF\s+стр\./g, 'PDF p.')
        .replace(/PDF\s+с\./g, 'PDF p.')
        .replace(/стр\./g, 'p.')
        .replace(/с\./g, 'p.');
    }
    return s;
  }

  return {
    KINDS: KINDS,
    FORMULAS: FORMULAS,
    MODULES: MODULES,
    CASES: CASES,
    EXPERIMENTS: EXPERIMENTS,
    UI: UI,
    formatSourceForLang: formatSourceForLang
  };
});
