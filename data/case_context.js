/**
 * 06_web_project/data/case_context.js — Контекст случаев тренажёра:
 * привязка к узлу схемы и показания шага 1 (CASES), статусы утверждений по 6 шагам (STEP_STATUS),
 * дословная выдержка о процедуре LOTO из учебника (PROCEDURE_NOTE) и двуязычные строки интерфейса (UI)
 * (Поручение v15.5, раздел 2.1).
 *
 * Правила:
 * 1. Никаких новых фактов, норм, чисел и причин: все числа в readings взяты из шага 1 случая,
 *    confirmedCause и causeSource — из шага 6 того же случая, PROCEDURE_NOTE — дословная подстрока
 *    блока boundaries учебника (RU из html.ru, HE из html.he).
 * 2. UMD-обёртка: в Node — module.exports, в браузере — window.CASE_CONTEXT.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CASE_CONTEXT = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function () {
  'use strict';

  const CASES = Object.freeze({
    'case-1-1': Object.freeze({
      nodeId: 'steam-node-10',
      readings: Object.freeze([
        Object.freeze({
          label: Object.freeze({
            ru: 'Температура продукта в пастеризаторе (уставка 85 °C)',
            he: 'טמפרטורת המוצר במפסטר (יעד 85 °C)'
          }),
          value: '74 °C (setpoint 85 °C)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Давление в коллекторе P₁ / после редукционного клапана P₂',
            he: 'לחץ במאסף הראשי P₁ / אחרי מפחת הלחץ P₂'
          }),
          value: '6.0 bar g / 3.0 bar g'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Давление пара в рубашке P₃ (при T_sat ≈ 123 °C)',
            he: 'לחץ קיטור במעטפת P₃ (ב-T_sat ≈ 123 °C)'
          }),
          value: '1.2 bar g (123 °C)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Температура сливного патрубка перед КО (при TCV = 100 %)',
            he: 'טמפרטורת צינור היציאה לפני מלכודת הקיטור (ב-TCV = 100 %)'
          }),
          value: '78 °C (TCV = 100 %)'
        })
      ]),
      confirmedCause: Object.freeze({
        ru: 'Полное забивание сетчатого фильтра-грязевика перед поплавковым конденсатоотводчиком Armstrong J окалиной (при положительном перепаде ΔP = 1.2 − 0.3 = 0.9 бар > 0), что вызвало затопление паровой рубашки переохлаждённым конденсатом (78 °C) и гидроудары.',
        he: 'סתימה מלאה של מסנן הרשת לפני מלכודת המצוף Armstrong J בחלודה (במפל לחץ חיובי ΔP = 1.2 − 0.3 = 0.9 bar > 0), שגרמה להצפת מעטפת הקיטור בעיבוי מקורר-יתר (78 °C) ולהלמי מים.'
      }),
      causeSource: 'S02, PDF pp. 1–7'
    }),

    'case-1-2': Object.freeze({
      nodeId: 'steam-node-2',
      readings: Object.freeze([
        Object.freeze({
          label: Object.freeze({
            ru: 'Входное давление в паропроводе P₁',
            he: 'לחץ כניסה בקו הקיטור הראשי P₁'
          }),
          value: '6.5 bar g'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Противодавление в общем коллекторе P_back (норма 1.5 бар изб.)',
            he: 'לחץ נגדי במאסף העיבוי P_back (נורמה 1.5 bar g)'
          }),
          value: '5.5 bar g (vs 1.5 bar g)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Частота щелчков диска TDC (штатно 1 раз в 10–20 с)',
            he: 'קצב נקישות הדיסק ב-TDC (תקין 1 ל-10–20 s)'
          }),
          value: '3–4 / s (vs 1 / 10–20 s)'
        })
      ]),
      confirmedCause: Object.freeze({
        ru: 'Превышение паспортного предела противодавления 80 % для термодинамического КО Spirax Sarco TDC (P_back / P₁ = 6.513 / 7.513 = 86.69 % по абс. давлению) из-за открытого продувочного байпаса высокого давления на соседней линии.',
        he: 'חריגה ממגבלת הלחץ הנגדי המרבי של 80% במלכודת התרמודינמית Spirax Sarco TDC (יחס לחצים מוחלטים 6.513 / 7.513 = 86.69%) עקב ברז מעקף שנשאר פתוח בקו לחץ גבוה שכן.'
      }),
      causeSource: 'S04, PDF pp. 1–2'
    }),

    'case-2-1': Object.freeze({
      nodeId: 'cond-node-5',
      readings: Object.freeze([
        Object.freeze({
          label: Object.freeze({
            ru: 'Поступление конденсата в ресивер m_c',
            he: 'ספיקת עיבוי נכנסת למכל האיסוף m_c'
          }),
          value: '1500 kg/h'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Сброс давления конденсата P₁ → P₂ в ресивер',
            he: 'ירידת לחץ העיבוי למכל האיסוף P₁ → P₂'
          }),
          value: '5.0 bar g → 0.0 bar g'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Давление рабочего пара P_m (вентиль [Vm] открыт)',
            he: 'לחץ קיטור מניע P_m (ברז [Vm] פתוח)'
          }),
          value: '6.0 bar g'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Уровень в водоуказательном стекле насоса GT10 (вентиль [Ve] закрыт)',
            he: 'מפלס בזכוכית משאבת GT10 (ברז האיזון [Ve] סגור)'
          }),
          value: '100 % ([Ve] closed)'
        })
      ]),
      confirmedCause: Object.freeze({
        ru: 'Закрытый после ТО вентиль выравнивающей линии [Ve] заблокировал выход пара из верхней части корпуса насоса TLV PowerTrap GT10 в ресивер и создал паровую подушку (Vapour Lock), остановившую цикл наполнения.',
        he: 'ברז צינור האיזון [Ve] שנשאר סגור לאחר טיפול אחזקה חסם את שחרור האדים מראש משאבת TLV PowerTrap GT10 אל מכל האיסוף ויצר נעילת אדים (Vapour Lock) שעצרה את מחזור המילוי.'
      }),
      causeSource: 'S07, PDF pp. 14–15, 19–21'
    }),

    'case-2-2': Object.freeze({
      nodeId: 'cond-node-9',
      readings: Object.freeze([
        Object.freeze({
          label: Object.freeze({
            ru: 'Электропроводность возвратного конденсата EC (норма 22, уставка 120)',
            he: 'מוליכות חשמלית של העיבוי החוזר EC (נורמה 22, סף 120)'
          }),
          value: '680 µS/cm (vs 22 / 120 µS/cm)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Расход переведённого в дренаж потока V_c',
            he: 'ספיקת זרם העיבוי המופנה לניקוז V_c'
          }),
          value: '6.0 L/min (0.36 m³/h)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Температура сливаемого конденсата T_cond / подпитки T_makeup',
            he: 'טמפרטורת העיבוי המנוקז T_cond / מי התוספת T_makeup'
          }),
          value: '50 °C / 20 °C'
        })
      ]),
      confirmedCause: Object.freeze({
        ru: 'Щелочной проскок раствора каустика из дефектного подогревателя CIP (pH 10.4, EC = 680 мкСм/см), локализованный отбором охлаждённых до 25 °C проб по индивидуальным веткам.',
        he: 'חדירת תמיסת סודה קאוסטית ממחמם CIP פגוע (pH 10.4, EC = 680 µS/cm), שאותרה באמצעות נטילת דגימות מקוררות ל-25 °C מכל ענף בנפרד.'
      }),
      causeSource: 'S01, PDF pp. 26–27, 34, 37; S21, p. 1'
    }),

    'case-3-1': Object.freeze({
      nodeId: 'chiller-node-5',
      readings: Object.freeze([
        Object.freeze({
          label: Object.freeze({
            ru: 'Оборотная вода конденсатора T_cw,in → T_cw,out (ΔT_w,cond)',
            he: 'מי הקירור במעבה T_cw,in → T_cw,out (ΔT_w,cond)'
          }),
          value: '29.5 °C → 34.5 °C (ΔT = 5.0 °C)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Температура конденсации фреона T_sat,cond (после чистки 37.0 °C)',
            he: 'טמפרטורת עיבוי הקרר T_sat,cond (לאחר ניקוי 37.0 °C)'
          }),
          value: '44.5 °C (vs 37.0 °C)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Мощность компрессора W_elec и токовая загрузка RLA',
            he: 'הספק המדחס W_elec ושיעור הזרם RLA'
          }),
          value: '128 kW (99 % RLA)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Холодопроизводительность испарителя Q_evap (расход воды V_w)',
            he: 'תפוקת הקירור במאייד Q_evap (ספיקת מים V_w)'
          }),
          value: '500 kW (85.6 m³/h)'
        })
      ]),
      confirmedCause: Object.freeze({
        ru: 'Слой карбонатно-биологических отложений в трубках конденсатора из-за отказа дозирования биоцида и продувки градирни, увеличивший температурный подход конденсатора до ΔT_app,cond = 44.5 − 34.5 = 10.0 °C (18 °F > порога 10 °F / 5.6 °C).',
        he: 'שכבת משקעי אבנית וביופילם בצינורות המעבה עקב כשל במינון הביוציד ובניקוז מגדל הקירור, שהעלתה את הפרש הגישה במעבה ל-ΔT_app,cond = 44.5 − 34.5 = 10.0 °C (18 °F מעל סף הניקוי 10 °F / 5.6 °C).'
      }),
      causeSource: 'S08, PDF pp. 65–66, 88'
    }),

    'case-3-2': Object.freeze({
      nodeId: 'chiller-node-2',
      readings: Object.freeze([
        Object.freeze({
          label: Object.freeze({
            ru: 'Температура воды испарителя T_in → T_out (перепад ΔT_w)',
            he: 'טמפרטורת המים במאייד T_in → T_out (הפרש ΔT_w)'
          }),
          value: '13.2 °C → 3.6 °C (ΔT = 9.6 °C)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Температура кипения фреона в испарителе T_sat,evap',
            he: 'טמפרטורת רתיחת הקרר במאייד T_sat,evap'
          }),
          value: '+0.8 °C'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Перепад давления на сетчатом фильтре ΔP_strainer (норма 0.15 бар)',
            he: 'מפל לחץ על מסנן הרשת ΔP_strainer (נורמה 0.15 bar)'
          }),
          value: '1.40 bar (vs 0.15 bar)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Гидравлический перепад воды на испарителе ΔP_evap (норма 0.50 бар)',
            he: 'מפל לחץ המים על המאייד ΔP_evap (נורמה 0.50 bar)'
          }),
          value: '0.14 bar (vs 0.50 bar)'
        })
      ]),
      confirmedCause: Object.freeze({
        ru: 'Засорение сетчатого фильтра (Strainer) перед испарителем (ΔP_strainer вырос с 0.15 до 1.40 бар), снизившее расход охлаждаемой воды с 86.03 до 44.81 м³/ч (−47.9 %) и вызвавшее срабатывание защиты от заморозки.',
        he: 'סתימת מסנן הרשת (Strainer) לפני המאייד (עליית ΔP_strainer מ-0.15 ל-1.40 bar), שהקטינה את ספיקת המים מ-86.03 ל-44.81 m³/h (−47.9%) והפעילה את הגנת הקיפאון.'
      }),
      causeSource: 'S08, PDF pp. 16, 35, 41, 82–83, 88'
    }),

    'case-4-1': Object.freeze({
      nodeId: 'air-node-6',
      readings: Object.freeze([
        Object.freeze({
          label: Object.freeze({
            ru: 'Показание датчика точки росы под давлением за осушителем',
            he: 'קריאת חיישן נקודת הטל בלחץ אחרי המייבש'
          }),
          value: 'PDP ↑ (°C)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Температура входа в осушитель и давление в коллекторе в пик нагрузки',
            he: 'טמפרטורת הכניסה למייבש ולחץ הסעפת בשיא הצריכה'
          }),
          value: 'T_in ↑ (°C), P_net ↓ (bar g)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Индикатор перепада давления на коалесцентном фильтре',
            he: 'מחוון מפל הלחץ על המסנן המתלכד'
          }),
          value: 'ΔP_filter: yellow-red zone'
        })
      ]),
      confirmedCause: Object.freeze({
        ru: 'Тепловая и гидравлическая перегрузка осушителя сжатого воздуха в жаркую смену (повышенная температура входа из-за загрязнённого концевого охладителя и просадка давления при сбое отвода конденсата дренажами).',
        he: 'עומס-יתר תרמי והידראולי על מייבש האוויר הדחוס במשמרת חמה (טמפרטורת כניסה גבוהה עקב מצנן סיום מלוכלך וירידת לחץ בשילוב כשל בניקוז העיבוי).'
      }),
      causeSource: 'S13, PDF p. 47–59, 122; S15, PDF p. 3–7'
    }),

    'case-4-2': Object.freeze({
      nodeId: 'air-node-9',
      readings: Object.freeze([
        Object.freeze({
          label: Object.freeze({
            ru: 'Производительность винтового компрессора Q_comp (FAD)',
            he: 'ספיקת המדחס הבורגי Q_comp (FAD)'
          }),
          value: '10 m³/min (FAD)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Время работы под нагрузкой / в разгрузке при остановленном цехе',
            he: 'זמן עבודה בהעמסה / בפריקה כאשר קווי הייצור מושבתים'
          }),
          value: '90 s Load / 210 s Unload'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Падение давления в ресивере и магистрали за 5 минут останова',
            he: 'ירידת הלחץ במקלט ובקו הראשי ב-5 דקות עצירה'
          }),
          value: '7.0 bar g → 6.1 bar g (5 min)'
        })
      ]),
      confirmedCause: Object.freeze({
        ru: 'Непроизводительные утечки сжатого воздуха в цеховой сети и дренажах в объёме 30 % выработки компрессора (90 / 300 с × 10 м³/мин = 3.0 м³/мин), вызывавшие дневную просадку давления без реального дефицита мощности.',
        he: 'דליפות אוויר דחוס בלתי-יצרניות ברשת ובמנקזים בהיקף של 30% מתפוקת המדחס (90 / 300 s × 10 m³/min = 3.0 m³/min), שגרמו לנפילת לחץ ביום ללא מחסור אמיתי בהספק המדחס.'
      }),
      causeSource: 'S12, PDF p. 53–54; S13, p. 124'
    }),

    'case-5-1': Object.freeze({
      nodeId: 'ro-node-8',
      readings: Object.freeze([
        Object.freeze({
          label: Object.freeze({
            ru: 'Наблюдаемый расход пермеата Q_p зимой (летом 12.0 м³/ч)',
            he: 'ספיקת תוצר נצפית Q_p בחורף (בקיץ 12.0 m³/h)'
          }),
          value: '9.2 m³/h (vs 12.0 m³/h)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Температура исходной воды T и поправочный коэффициент TCF',
            he: 'טמפרטורת מי ההזנה T ומקדם תיקון הטמפרטורה TCF'
          }),
          value: '12 °C, TCF ≈ 0.68 (vs 25 °C, 1.00)'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Чистое движущее давление NDP (базовое при пуске NDP₀)',
            he: 'לחץ מניע נטו תפעולי NDP (בסיס בהרצה NDP₀)'
          }),
          value: '11.4 bar (vs 10.5 bar)'
        })
      ]),
      confirmedCause: Object.freeze({
        ru: 'Естественное повышение вязкости холодной воды зимой (T = 12 °C, TCF ≈ 0.68): нормализованный к 25 °C расход пермеата по Eq. 72 составляет 12.46 м³/ч (103.8 % от базовых 12.0 м³/ч), мембраны чистые и внеплановая мойка CIP не требуется.',
        he: 'עלייה טבעית בצמיגות המים הקרים בחורף (T = 12 °C, TCF ≈ 0.68): ספיקת התוצר המנורמלת ל-25 °C לפי משוואה 72 היא 12.46 m³/h (103.8% מערך הבסיס 12.0 m³/h), הממברנות נקיות ואין צורך בשטיפת CIP.'
      }),
      causeSource: 'S16, PDF p. 131–133; S19, p. 4–8'
    }),

    'case-5-2': Object.freeze({
      nodeId: 'ro-node-4',
      readings: Object.freeze([
        Object.freeze({
          label: Object.freeze({
            ru: 'Давление в коллекторе пермеата P_p при переключении баков',
            he: 'לחץ בסעפת התוצר P_p בעת מיתוג המיכלים'
          }),
          value: '1.2 bar'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Давление концентрата на выходе 2-й ступени P_c,out',
            he: 'לחץ הרכז ביציאת הדרגה ה-2 P_c,out'
          }),
          value: '0.8 bar'
        }),
        Object.freeze({
          label: Object.freeze({
            ru: 'Запись ручного теста хлора DPD при сигнале высокого ОВП (ORP)',
            he: 'רישום בדיקת כלור ידנית DPD בעת התראת ORP גבוה'
          }),
          value: 'DPD = 0 (LoD not recorded)'
        })
      ]),
      confirmedCause: Object.freeze({
        ru: 'Сочетание некорректно задокументированного контроля дехлорирования (запись «DPD = 0» без указания модели прибора и его предела обнаружения LoD при высоком ORP) и опасного обратного подпора пермеата (P_p = 1.2 бар > P_c,out = 0.8 бар на +0.4 бар > предела 0.3 бар / 5 psi).',
        he: 'שילוב של בקרת נטרול כלור מתועדת באופן לקוי (רישום "DPD = 0" ללא ציון דגם המכשיר וגבול הגילוי LoD שלו בעת התראת ORP גבוה) ולחץ נגדי מסוכן בקו התוצר (P_p = 1.2 bar > P_c,out = 0.8 bar ב-+0.4 bar מעל המגבלה 0.3 bar / 5 psi).'
      }),
      causeSource: 'S16, PDF p. 66, 106, 165; S17, p. 1–3'
    })
  });

  const STEP_STATUS = Object.freeze({
    1: Object.freeze({
      ru: 'Наблюдение',
      he: 'תצפית בשטח'
    }),
    2: Object.freeze({
      ru: 'Проверка вывода: что можно утверждать',
      he: 'בחינת מסקנה: מה ניתן לקבוע בוודאות'
    }),
    3: Object.freeze({
      ru: 'Недостающий замер',
      he: 'מדידה חסרה נדרשת'
    }),
    4: Object.freeze({
      ru: 'Гипотеза (не подтверждена)',
      he: 'השערה (טרם אומתה)'
    }),
    5: Object.freeze({
      ru: 'Действия: оператор / допущенный персонал',
      he: 'פעולות: מפעיל / צוות מוסמך (LOTO)'
    }),
    6: Object.freeze({
      ru: 'Подтверждённая причина',
      he: 'סיבה מאומתת'
    })
  });

  // Дословная подстрока блока boundaries системы condensate (RU из html.ru, HE из html.he)
  const PROCEDURE_NOTE = Object.freeze({
    ru: 'Полная изоляция узла, достоверный сброс внутреннего давления до атмосферного (в частности, через сливную пробку drain plug) и охлаждение агрегата до комнатной температуры перед любым вскрытием выполняются обученным персоналом строго по инструкции оборудования [Ист. S07, с. 2–3, 18, 21, 25 (PDF с. 3–4, 19, 22, 26)] и местному регламенту предприятия (LOTO).',
    he: 'בידוד מלא של המכלול, שחרור ודאי של הלחץ הפנימי ללחץ אטמוספרי (בפרט דרך פקק הניקוז drain plug) וקירור היחידה לטמפרטורת החדר לפני כל פתיחה מבוצעים על ידי צוות מיומן בקפדנות לפי הוראות הציוד [מקור S07, עמ\' 2–3, 18, 21, 25 (PDF עמ\' 3–4, 19, 22, 26)] והנוהל המקומי של המפעל (LOTO).',
    sourceSys: 'condensate',
    sourceBlock: 'boundaries',
    source: 'S07, PDF pp. 3–4, 19, 22, 26'
  });

  const UI = Object.freeze({
    ru: Object.freeze({
      readingsBoxTitle: 'Схема и показания',
      showNodeOnDiagramBtn: 'Показать узел на схеме',
      readingsListTitle: 'Показания при осмотре',
      stepStatusLabel: 'Статус утверждения',
      conclusionBoxTitle: 'Вывод',
      confirmedCauseLabel: 'Подтверждённая причина',
      sourceLabel: 'Источник',
      otherOptionsSummary: 'Почему остальные варианты неверны',
      restartCaseBtn: 'Пройти заново',
      localProgressNotice: 'Прогресс и ответы хранятся только в этом браузере на этом устройстве',
      selectOptionAlert: 'Выберите вариант перед проверкой',
      procedureLinkLabel: 'Границы вмешательства и процедура LOTO в учебнике'
    }),
    he: Object.freeze({
      readingsBoxTitle: 'תרשים וקריאות בשטח',
      showNodeOnDiagramBtn: 'הצג צומת בתרשים',
      readingsListTitle: 'קריאות בעת הבדיקה',
      stepStatusLabel: 'מעמד הקביעה',
      conclusionBoxTitle: 'מסקנה מסכמת',
      confirmedCauseLabel: 'סיבה מאומתת',
      sourceLabel: 'מקור',
      otherOptionsSummary: 'מדוע שאר האפשרויות שגויות',
      restartCaseBtn: 'התחל מחדש',
      localProgressNotice: 'ההתקדמות והתשובות נשמרות בדפדפן זה ובמכשיר זה בלבד',
      selectOptionAlert: 'בחרו אפשרות לפני הבדיקה',
      procedureLinkLabel: 'גבולות התערבות ונוהל LOTO בספר הלימוד'
    })
  });

  return Object.freeze({
    CASES,
    STEP_STATUS,
    PROCEDURE_NOTE,
    UI
  });
});
