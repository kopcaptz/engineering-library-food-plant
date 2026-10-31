/**
 * 06_web_project/data/term_aliases.js — Словарь словоформ для контекстных ссылок (linkForms)
 * и разговорных синонимов для поиска (searchAliases, BLOCK_ALIASES) (Поручение v15.5, разделы 2.3a и 2.4).
 *
 * UMD-обёртка: в Node — module.exports, в браузере — window.TERM_ALIASES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TERM_ALIASES = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function () {
  'use strict';

  const TERMS = {
    "term-steam": {
        "linkForms": {
            "ru": [
                "водяной пар",
                "водяного пар"
            ],
            "he": [
                "קיטור"
            ]
        },
        "searchAliases": {
            "ru": [
                "пар",
                "водяной пар"
            ],
            "he": [
                "קיטור",
                "אדי מים"
            ],
            "en": [
                "steam",
                "vapor"
            ]
        }
    },
    "term-saturated-steam": {
        "linkForms": {
            "ru": [
                "насыщенный пар",
                "насыщенного пар"
            ],
            "he": [
                "קיטור רווי"
            ]
        },
        "searchAliases": {
            "ru": [
                "насыщенный пар",
                "сухой насыщенный пар"
            ],
            "he": [
                "קיטור רווי"
            ],
            "en": [
                "saturated steam"
            ]
        }
    },
    "term-steam-dryness": {
        "linkForms": {
            "ru": [
                "сухого пар",
                "сухост"
            ],
            "he": [
                "קיטור רטוב",
                "קיטור יבש",
                "דרגת יובש"
            ]
        },
        "searchAliases": {
            "ru": [
                "степень сухости",
                "сухость пара",
                "влажный пар",
                "сухой пар"
            ],
            "he": [
                "קיטור יבש",
                "קיטור רטוב",
                "דרגת יובש"
            ],
            "en": [
                "dryness fraction",
                "steam quality",
                "wet steam"
            ]
        }
    },
    "term-superheated-steam": {
        "linkForms": {
            "ru": [
                "перегретый пар",
                "перегретого пар"
            ],
            "he": [
                "קיטור שחון"
            ]
        },
        "searchAliases": {
            "ru": [
                "перегретый пар"
            ],
            "he": [
                "קיטור שחון"
            ],
            "en": [
                "superheated steam"
            ]
        }
    },
    "term-live-steam": {
        "linkForms": {
            "ru": [
                "острый пар",
                "острого пар",
                "живой пар"
            ],
            "he": [
                "קיטור חי"
            ]
        },
        "searchAliases": {
            "ru": [
                "острый пар",
                "живой пар",
                "свежий пар"
            ],
            "he": [
                "קיטור חי"
            ],
            "en": [
                "live steam",
                "primary steam"
            ]
        }
    },
    "term-latent-heat": {
        "linkForms": {
            "ru": [
                "скрытая теплот",
                "скрытой теплот"
            ],
            "he": [
                "חום כמוס"
            ]
        },
        "searchAliases": {
            "ru": [
                "скрытая теплота",
                "теплота парообразования",
                "теплота конденсации",
                "h_fg"
            ],
            "he": [
                "חום כמוס"
            ],
            "en": [
                "latent heat",
                "enthalpy of evaporation",
                "h_fg"
            ]
        }
    },
    "term-sensible-heat": {
        "linkForms": {
            "ru": [
                "чувствительн"
            ],
            "he": [
                "חום מורגש"
            ]
        },
        "searchAliases": {
            "ru": [
                "явная теплота",
                "чувствительное тепло",
                "энтальпия жидкости",
                "h_f"
            ],
            "he": [
                "חום מורגש"
            ],
            "en": [
                "sensible heat",
                "liquid enthalpy",
                "h_f"
            ]
        }
    },
    "term-steam-boiler": {
        "linkForms": {
            "ru": [
                "паровой кот",
                "парового котл"
            ],
            "he": [
                "דוד קיטור",
                "דוד הקיטור"
            ]
        },
        "searchAliases": {
            "ru": [
                "паровой котел",
                "паровой котёл",
                "котел",
                "котёл"
            ],
            "he": [
                "דוד קיטור",
                "דוד"
            ],
            "en": [
                "steam boiler",
                "boiler"
            ]
        }
    },
    "term-economizer": {
        "linkForms": {
            "ru": [
                "экономайзер"
            ],
            "he": [
                "אקונומייזר"
            ]
        },
        "searchAliases": {
            "ru": [
                "экономайзер"
            ],
            "he": [
                "אקונומייזר"
            ],
            "en": [
                "economizer"
            ]
        }
    },
    "term-deaerator": {
        "linkForms": {
            "ru": [
                "деаэратор"
            ],
            "he": [
                "דאורטור"
            ]
        },
        "searchAliases": {
            "ru": [
                "деаэратор",
                "деаэрация"
            ],
            "he": [
                "דאורטור"
            ],
            "en": [
                "deaerator"
            ]
        }
    },
    "term-boiler-feedwater": {
        "linkForms": {
            "ru": [
                "питательная вод",
                "питательной вод"
            ],
            "he": [
                "מי הזנה",
                "מי ההזנה"
            ]
        },
        "searchAliases": {
            "ru": [
                "питательная вода",
                "питательный бак"
            ],
            "he": [
                "מי הזנה"
            ],
            "en": [
                "boiler feedwater",
                "feedwater"
            ]
        }
    },
    "term-makeup-water": {
        "linkForms": {
            "ru": [
                "подпиточная вод",
                "подпиточной вод",
                "подпитк"
            ],
            "he": [
                "מי תוספת"
            ]
        },
        "searchAliases": {
            "ru": [
                "подпиточная вода",
                "сырая подпитка"
            ],
            "he": [
                "מי תוספת"
            ],
            "en": [
                "makeup water"
            ]
        }
    },
    "term-boiler-blowdown": {
        "linkForms": {
            "ru": [
                "продувки котл",
                "донная продувк"
            ],
            "he": [
                "ניקוז דוד",
                "ניקוז הדוד",
                "ניקוז רציף"
            ]
        },
        "searchAliases": {
            "ru": [
                "продувка",
                "продувка котла",
                "непрерывная продувка",
                "донная продувка",
                "верхняя продувка",
                "поверхностная продувка",
                "кратность упаривания",
                "коэффициент концентрирования котловой воды"
            ],
            "he": [
                "ניקוז דוד",
                "הפרחת דוד",
                "ניקוז רציף"
            ],
            "en": [
                "boiler blowdown",
                "continuous blowdown",
                "surface blowdown",
                "bottom blowdown",
                "cycles of concentration"
            ]
        }
    },
    "term-carryover-foaming": {
        "linkForms": {
            "ru": [
                "вспениван",
                "унос котлов"
            ],
            "he": [
                "סחיפת מים",
                "הקצפה"
            ]
        },
        "searchAliases": {
            "ru": [
                "унос котловой воды",
                "вспенивание"
            ],
            "he": [
                "סחיפת מים",
                "הקצפה"
            ],
            "en": [
                "carryover",
                "priming",
                "foaming"
            ]
        }
    },
    "term-lwco": {
        "linkForms": {
            "ru": [
                "нижнему уровню вод"
            ],
            "he": [
                "מפלס מים נמוך"
            ]
        },
        "searchAliases": {
            "ru": [
                "LWCO",
                "защита по нижнему уровню воды",
                "отсечка по нижнему уровню"
            ],
            "he": [
                "LWCO",
                "הגנת מפלס מים נמוך"
            ],
            "en": [
                "low-water cutoff",
                "LWCO"
            ]
        }
    },
    "term-steam-header": {
        "linkForms": {
            "ru": [
                "паровой коллектор",
                "паровом коллектор"
            ],
            "he": [
                "מרכזת קיטור"
            ]
        },
        "searchAliases": {
            "ru": [
                "паровой коллектор",
                "гребенка",
                "гребёнка"
            ],
            "he": [
                "מרכזת קיטור",
                "מאסף קיטור"
            ],
            "en": [
                "steam header",
                "steam manifold"
            ]
        }
    },
    "term-moisture-separator": {
        "linkForms": {
            "ru": [
                "сепараторы влаг",
                "капельную влаг"
            ],
            "he": [
                "מפריד טיפות",
                "רטיבות טיפתית"
            ]
        },
        "searchAliases": {
            "ru": [
                "сепаратор влаги",
                "паровой сепаратор"
            ],
            "he": [
                "מפריד טיפות",
                "מפריד לחות"
            ],
            "en": [
                "moisture separator",
                "steam separator"
            ]
        }
    },
    "term-drip-leg": {
        "linkForms": {
            "ru": [
                "дренажный карман",
                "дренажного карман",
                "дренажные карман"
            ],
            "he": [
                "כיס ניקוז",
                "כיסי ניקוז"
            ]
        },
        "searchAliases": {
            "ru": [
                "дренажный карман",
                "конденсатный карман"
            ],
            "he": [
                "כיס ניקוז"
            ],
            "en": [
                "drip leg",
                "drain pocket"
            ]
        }
    },
    "term-prv": {
        "linkForms": {
            "ru": [
                "редукционный клапан",
                "редукционного клапан",
                "PRV"
            ],
            "he": [
                "שסתום הפחתת לחץ",
                "PRV"
            ]
        },
        "searchAliases": {
            "ru": [
                "PRV",
                "редукционный клапан",
                "регулятор давления после себя"
            ],
            "he": [
                "PRV",
                "שסתום הפחתת לחץ",
                "מקטין לחץ",
                "מפחת לחץ"
            ],
            "en": [
                "pressure reducing valve",
                "PRV"
            ]
        }
    },
    "term-safety-valve": {
        "linkForms": {
            "ru": [
                "предохранительный клапан",
                "предохранительных клапан"
            ],
            "he": [
                "שסתום ביטחון",
                "שסתומי ביטחון"
            ]
        },
        "searchAliases": {
            "ru": [
                "предохранительный клапан",
                "взрывной клапан",
                "PSV"
            ],
            "he": [
                "שסתום ביטחון",
                "שסתום פורק לחץ"
            ],
            "en": [
                "safety valve",
                "pressure relief valve",
                "PSV"
            ]
        }
    },
    "term-y-strainer": {
        "linkForms": {
            "ru": [
                "грязевик",
                "сетчатый фильтр",
                "сетчатого фильтр"
            ],
            "he": [
                "מסנן רשת"
            ]
        },
        "searchAliases": {
            "ru": [
                "сетчатый фильтр",
                "грязевик",
                "фильтр-грязевик"
            ],
            "he": [
                "מסנן רשת",
                "מסנן Y"
            ],
            "en": [
                "strainer",
                "y-strainer"
            ]
        }
    },
    "term-air-vent": {
        "linkForms": {
            "ru": [
                "воздушник"
            ],
            "he": [
                "משחרר אוויר"
            ]
        },
        "searchAliases": {
            "ru": [
                "автоматический воздушник",
                "термостатический воздушник",
                "воздушник"
            ],
            "he": [
                "משחרר אוויר",
                "משחרר אוויר אוטומטי"
            ],
            "en": [
                "automatic air vent",
                "thermostatic air vent"
            ]
        }
    },
    "term-vacuum-breaker": {
        "linkForms": {
            "ru": [
                "прерыватель вакуум",
                "прерывателя вакуум"
            ],
            "he": [
                "שובר ואקום"
            ]
        },
        "searchAliases": {
            "ru": [
                "прерыватель вакуума"
            ],
            "he": [
                "שובר ואקום"
            ],
            "en": [
                "vacuum breaker"
            ]
        }
    },
    "term-steam-trap": {
        "linkForms": {
            "ru": [
                "конденсатоотводчик",
                "КО"
            ],
            "he": [
                "מלכודת קיטור",
                "מלכודות קיטור"
            ]
        },
        "searchAliases": {
            "ru": [
                "конденсатоотводчик",
                "КО",
                "конденсатоотводчики"
            ],
            "he": [
                "מלכודת קיטור",
                "מלכודות קיטור"
            ],
            "en": [
                "steam trap"
            ]
        }
    },
    "term-ft-trap": {
        "linkForms": {
            "ru": [
                "поплавковый конденсатоотводчик",
                "поплавковых конденсатоотводчик"
            ],
            "he": [
                "מלכודת מצוף",
                "מלכודת קיטור מצוף"
            ]
        },
        "searchAliases": {
            "ru": [
                "поплавковый КО",
                "поплавковый конденсатоотводчик"
            ],
            "he": [
                "מלכודת קיטור מצוף",
                "מלכודת מצוף"
            ],
            "en": [
                "float and thermostatic steam trap",
                "F&T trap"
            ]
        }
    },
    "term-inverted-bucket-trap": {
        "linkForms": {
            "ru": [
                "перевёрнутым стакан"
            ],
            "he": [
                "דלי הפוך"
            ]
        },
        "searchAliases": {
            "ru": [
                "КО с перевернутым стаканом",
                "стаканчиковый КО"
            ],
            "he": [
                "מלכודת קיטור דלי הפוך",
                "דלי הפוך"
            ],
            "en": [
                "inverted bucket steam trap"
            ]
        }
    },
    "term-td-trap": {
        "linkForms": {
            "ru": [
                "термодинамическ",
                "дисковы"
            ],
            "he": [
                "מלכודת קיטור תרמודינמית",
                "תרמודינמי",
                "דיסקית"
            ]
        },
        "searchAliases": {
            "ru": [
                "термодинамический КО",
                "дисковый КО",
                "TDC"
            ],
            "he": [
                "מלכודת קיטור תרמודינמית",
                "מלכודת דיסק"
            ],
            "en": [
                "thermodynamic steam trap",
                "TD trap",
                "TDC"
            ]
        }
    },
    "term-thermostatic-trap": {
        "linkForms": {
            "ru": [
                "термостатическ",
                "биметаллическ"
            ],
            "he": [
                "תרמוסטטי"
            ]
        },
        "searchAliases": {
            "ru": [
                "термостатический КО",
                "капсульный КО",
                "биметаллический КО"
            ],
            "he": [
                "מלכודת קיטור תרמוסטטית",
                "דו-מתכתית"
            ],
            "en": [
                "thermostatic steam trap",
                "bimetallic steam trap"
            ]
        }
    },
    "term-condensate": {
        "linkForms": {
            "ru": [
                "конденсат"
            ],
            "he": [
                "עיבוי",
                "קונדנסט"
            ]
        },
        "searchAliases": {
            "ru": [
                "конденсат",
                "возврат конденсата"
            ],
            "he": [
                "עיבוי",
                "מי עיבוי",
                "קונדנסט"
            ],
            "en": [
                "condensate"
            ]
        }
    },
    "term-flash": {
        "linkForms": {
            "ru": [
                "вторичный пар",
                "вторичного пар",
                "Flash Steam"
            ],
            "he": [
                "קיטור הבזקה",
                "קיטור משני",
                "Flash Steam"
            ]
        },
        "searchAliases": {
            "ru": [
                "вторичный пар",
                "пар вскипания",
                " пар вторичного вскипания"
            ],
            "he": [
                "קיטור הבזקה",
                "קיטור משני"
            ],
            "en": [
                "flash steam"
            ]
        }
    },
    "term-flash-vessel": {
        "linkForms": {
            "ru": [],
            "he": [
                "מיכל הבזקה",
                "מכל הבזקה"
            ]
        },
        "searchAliases": {
            "ru": [
                "сепаратор вторичного пара",
                "расширитель вторичного пара"
            ],
            "he": [
                "מיכל הבזקה",
                "מכל הבזקה"
            ],
            "en": [
                "flash vessel",
                "flash tank"
            ]
        }
    },
    "term-cru": {
        "linkForms": {
            "ru": [
                "Stall"
            ],
            "he": [
                "Stall"
            ]
        },
        "searchAliases": {
            "ru": [
                "столл",
                "запирание теплообменника",
                "гидравлическое запирание",
                "Stall",
                "CRU"
            ],
            "he": [
                "הצפת מחליף חום",
                "נעילה הידראולית",
                "Stall"
            ],
            "en": [
                "stall",
                "stall condition",
                "CRU"
            ]
        }
    },
    "term-pump-trap": {
        "linkForms": {
            "ru": [
                "насос-конденсатоотводчик",
                "насоса-конденсатоотводчик",
                "PowerTrap"
            ],
            "he": [
                "משאבה-מלכודת",
                "PowerTrap"
            ]
        },
        "searchAliases": {
            "ru": [
                "насос-конденсатоотводчик",
                "механический насос конденсата",
                "PowerTrap",
                "GT10"
            ],
            "he": [
                "משאבת עיבוי מופעלת קיטור",
                "משאבה-מלכודת",
                "PowerTrap"
            ],
            "en": [
                "pump-trap",
                "powertrap",
                "condensate pump"
            ]
        }
    },
    "term-water-hammer": {
        "linkForms": {
            "ru": [
                "гидроудар"
            ],
            "he": [
                "הלם מים",
                "הלמי מים"
            ]
        },
        "searchAliases": {
            "ru": [
                "гидроудар",
                "гидравлический удар",
                "гидроудары"
            ],
            "he": [
                "הלם מים",
                "הלמי מים"
            ],
            "en": [
                "water hammer",
                "hydraulic shock"
            ]
        }
    },
    "term-chiller": {
        "linkForms": {
            "ru": [
                "чиллер",
                "Chiller",
                "Chillers"
            ],
            "he": [
                "צ'ילר",
                "Chiller",
                "Chillers"
            ]
        },
        "searchAliases": {
            "ru": [
                "чиллер",
                "водоохлаждающая машина",
                "холодильная машина"
            ],
            "he": [
                "צ'ילר",
                "צ׳ילר"
            ],
            "en": [
                "chiller",
                "liquid chiller"
            ]
        }
    },
    "term-refrigerant": {
        "linkForms": {
            "ru": [
                "хладагент",
                "фреон"
            ],
            "he": [
                "קרר"
            ]
        },
        "searchAliases": {
            "ru": [
                "хладагент",
                "фреон",
                "аммиак"
            ],
            "he": [
                "קרר",
                "פריאון"
            ],
            "en": [
                "refrigerant"
            ]
        }
    },
    "term-chilled-water-glycol": {
        "linkForms": {
            "ru": [
                "холодоносител",
                "гликол"
            ],
            "he": [
                "מים קרים",
                "גליקול"
            ]
        },
        "searchAliases": {
            "ru": [
                "холодоноситель",
                "гликоль",
                "водно-гликолевый раствор",
                "захоложенная вода"
            ],
            "he": [
                "מים קרים",
                "גליקול",
                "מי צ'ילר"
            ],
            "en": [
                "chilled water",
                "glycol",
                "brine"
            ]
        }
    },
    "term-evaporator": {
        "linkForms": {
            "ru": [
                "испарител"
            ],
            "he": [
                "מאייד"
            ]
        },
        "searchAliases": {
            "ru": [
                "испаритель",
                "испаритель чиллера"
            ],
            "he": [
                "מאייד"
            ],
            "en": [
                "evaporator"
            ]
        }
    },
    "term-chiller-compressor": {
        "linkForms": {
            "ru": [
                "холодильного компрессор",
                "пары хладагент"
            ],
            "he": [
                "מדחס צנטריפוגלי",
                "אדי הקרר"
            ]
        },
        "searchAliases": {
            "ru": [
                "холодильный компрессор",
                "компрессор чиллера"
            ],
            "he": [
                "מדחס קירור",
                "מדחס"
            ],
            "en": [
                "chiller compressor",
                "centrifugal compressor"
            ]
        }
    },
    "term-condenser": {
        "linkForms": {
            "ru": [
                "конденсатор"
            ],
            "he": [
                "מעבה"
            ]
        },
        "searchAliases": {
            "ru": [
                "конденсатор",
                "конденсатор чиллера"
            ],
            "he": [
                "מעבה"
            ],
            "en": [
                "condenser"
            ]
        }
    },
    "term-expansion-valve": {
        "linkForms": {
            "ru": [
                "ЭРВ"
            ],
            "he": [
                "שסתום התפשטות"
            ]
        },
        "searchAliases": {
            "ru": [
                "расширительный вентиль",
                "ЭРВ",
                "ТРВ",
                "электронный расширительный вентиль"
            ],
            "he": [
                "שסתום התפשטות"
            ],
            "en": [
                "expansion valve",
                "EXV",
                "TXV"
            ]
        }
    },
    "term-suction-superheat": {
        "linkForms": {
            "ru": [],
            "he": [
                "שחון"
            ]
        },
        "searchAliases": {
            "ru": [
                "перегрев на всасывании",
                "перегрев всасывания"
            ],
            "he": [
                "שחון ביניקה",
                "דרגת שחון"
            ],
            "en": [
                "suction superheat"
            ]
        }
    },
    "term-liquid-subcooling": {
        "linkForms": {
            "ru": [
                "переохлажден"
            ],
            "he": [
                "קירור-יתר",
                "תת-קירור"
            ]
        },
        "searchAliases": {
            "ru": [
                "переохлаждение",
                "переохлаждение жидкости"
            ],
            "he": [
                "קירור-יתר",
                "תת-קירור"
            ],
            "en": [
                "liquid subcooling",
                "subcooling"
            ]
        }
    },
    "term-approach": {
        "linkForms": {
            "ru": [
                "температурный подход",
                "Approach"
            ],
            "he": [
                "הפרש טמפרטורות גישה",
                "אפרוץ'",
                "Approach"
            ]
        },
        "searchAliases": {
            "ru": [
                "температурный подход",
                "подход конденсатора",
                "подход испарителя",
                "сближение",
                "пинч"
            ],
            "he": [
                "הפרש טמפרטורות גישה",
                "הפרש גישה",
                "אפרוץ'"
            ],
            "en": [
                "approach",
                "approach temperature",
                "pinch"
            ]
        }
    },
    "term-cooling-tower": {
        "linkForms": {
            "ru": [
                "градирн"
            ],
            "he": [
                "מגדל קירור",
                "מגדל הקירור"
            ]
        },
        "searchAliases": {
            "ru": [
                "градирня",
                "охладительная башня"
            ],
            "he": [
                "מגדל קירור"
            ],
            "en": [
                "cooling tower"
            ]
        }
    },
    "term-cop": {
        "linkForms": {
            "ru": [
                "холодильный коэффициент",
                "COP"
            ],
            "he": [
                "מקדם יעילות",
                "COP"
            ]
        },
        "searchAliases": {
            "ru": [
                "COP",
                "холодильный коэффициент",
                "КПД чиллера",
                "EER"
            ],
            "he": [
                "COP",
                "מקדם יעילות קירור"
            ],
            "en": [
                "COP",
                "coefficient of performance",
                "EER"
            ]
        }
    },
    "term-ton-refrigeration": {
        "linkForms": {
            "ru": [
                "тонна охлажден"
            ],
            "he": [
                "טון קירור"
            ]
        },
        "searchAliases": {
            "ru": [
                "тонна охлаждения",
                "TR",
                "кВт/TR"
            ],
            "he": [
                "טון קירור",
                "TR"
            ],
            "en": [
                "ton of refrigeration",
                "TR"
            ]
        }
    },
    "term-compressor-surge": {
        "linkForms": {
            "ru": [
                "помпаж"
            ],
            "he": [
                "סרג'",
                "נחשול זרימה"
            ]
        },
        "searchAliases": {
            "ru": [
                "помпаж",
                "помпаж компрессора"
            ],
            "he": [
                "סרג'",
                "נחשול זרימה במדחס"
            ],
            "en": [
                "compressor surge",
                "surge"
            ]
        }
    },
    "term-non-condensables": {
        "linkForms": {
            "ru": [
                "неконденсирующиеся газ"
            ],
            "he": [
                "גזים בלתי מתעבים"
            ]
        },
        "searchAliases": {
            "ru": [
                "неконденсирующиеся газы",
                "воздух в конденсаторе"
            ],
            "he": [
                "גזים בלתי מתעבים",
                "גזים לא-מתעבים"
            ],
            "en": [
                "non-condensable gases",
                "non-condensables"
            ]
        }
    },
    "term-compressed-air": {
        "linkForms": {
            "ru": [
                "сжатый воздух",
                "сжатого воздух",
                "Compressed Air"
            ],
            "he": [
                "אוויר דחוס",
                "Compressed Air"
            ]
        },
        "searchAliases": {
            "ru": [
                "сжатый воздух"
            ],
            "he": [
                "אוויר דחוס"
            ],
            "en": [
                "compressed air"
            ]
        }
    },
    "term-fad": {
        "linkForms": {
            "ru": [
                "FAD"
            ],
            "he": [
                "FAD"
            ]
        },
        "searchAliases": {
            "ru": [
                "FAD",
                "производительность по свободному воздуху",
                "нормальный расход воздуха"
            ],
            "he": [
                "FAD",
                "ספיקת אוויר חופשי"
            ],
            "en": [
                "free air delivery",
                "FAD"
            ]
        }
    },
    "term-screw-compressor": {
        "linkForms": {
            "ru": [
                "винтового компрессор"
            ],
            "he": [
                "מדחס בורגי",
                "מדחס אוויר בורגי"
            ]
        },
        "searchAliases": {
            "ru": [
                "винтовой компрессор",
                "безмасляный компрессор"
            ],
            "he": [
                "מדחס בורגי",
                "מדחס אוויר בורגי"
            ],
            "en": [
                "rotary screw compressor",
                "screw compressor"
            ]
        }
    },
    "term-load-unload": {
        "linkForms": {
            "ru": [
                "Load/Unload",
                "Load / Unload"
            ],
            "he": [
                "Load/Unload",
                "Load / Unload"
            ]
        },
        "searchAliases": {
            "ru": [
                "Load Unload",
                "Load / Unload",
                "Load/Unload",
                "нагрузка холостой ход",
                "разгрузка компрессора"
            ],
            "he": [
                "Load Unload",
                "העמסה / סרק",
                "לואד / אנלואד"
            ],
            "en": [
                "load unload",
                "load / unload control"
            ]
        }
    },
    "term-vsd": {
        "linkForms": {
            "ru": [
                "частотно-регулируем",
                "ЧРП",
                "VSD",
                "VFD"
            ],
            "he": [
                "משנה תדר",
                "ווסת תדר",
                "VSD",
                "VFD"
            ]
        },
        "searchAliases": {
            "ru": [
                "ЧРП",
                "VSD",
                "VFD",
                "частотный привод",
                "инвертор"
            ],
            "he": [
                "משנה תדר",
                "ווסת תדר",
                "אינוורטר",
                "VSD",
                "VFD"
            ],
            "en": [
                "variable speed drive",
                "VSD",
                "VFD"
            ]
        }
    },
    "term-aftercooler": {
        "linkForms": {
            "ru": [
                "концевой охладител",
                "концевого охладител"
            ],
            "he": [
                "מצנן סופי"
            ]
        },
        "searchAliases": {
            "ru": [
                "концевой охладитель",
                "доохладитель"
            ],
            "he": [
                "מצנן סופי",
                "מצנן סיום",
                "אפטר-קולר"
            ],
            "en": [
                "aftercooler"
            ]
        }
    },
    "term-air-receiver": {
        "linkForms": {
            "ru": [
                "воздухосборник",
                "ресивер"
            ],
            "he": [
                "מיכל אוויר",
                "רסיבר"
            ]
        },
        "searchAliases": {
            "ru": [
                "воздухосборник",
                "ресивер",
                "воздушный ресивер"
            ],
            "he": [
                "מיכל אוויר",
                "רסיבר",
                "מקלט אוויר"
            ],
            "en": [
                "air receiver"
            ]
        }
    },
    "term-pdp": {
        "linkForms": {
            "ru": [
                "точка рос",
                "точки рос",
                "точку рос",
                "PDP"
            ],
            "he": [
                "נקודת הטל",
                "נקודת טל",
                "PDP"
            ]
        },
        "searchAliases": {
            "ru": [
                "точка росы",
                "точка росы под давлением",
                "PDP"
            ],
            "he": [
                "נקודת הטל",
                "נקודת טל בלחץ",
                "PDP"
            ],
            "en": [
                "pressure dew point",
                "PDP",
                "dew point"
            ]
        }
    },
    "term-refrigerated-dryer": {
        "linkForms": {
            "ru": [
                "рефрижераторный осушител"
            ],
            "he": [
                "מייבש אוויר קירורי"
            ]
        },
        "searchAliases": {
            "ru": [
                "рефрижераторный осушитель",
                "холодильный осушитель"
            ],
            "he": [
                "מייבש אוויר קירורי",
                "מייבש פריאון"
            ],
            "en": [
                "refrigerated air dryer",
                "refrigerated dryer"
            ]
        }
    },
    "term-desiccant-dryer": {
        "linkForms": {
            "ru": [
                "адсорбционный осушител",
                "адсорбционного осушител"
            ],
            "he": [
                "מייבש אוויר ספיחה",
                "מייבש ספיחה"
            ]
        },
        "searchAliases": {
            "ru": [
                "адсорбционный осушитель",
                "адсорбент"
            ],
            "he": [
                "מייבש אוויר ספיחה",
                "אדסורבציה"
            ],
            "en": [
                "desiccant dryer",
                "adsorption dryer"
            ]
        }
    },
    "term-coalescing-filter": {
        "linkForms": {
            "ru": [
                "коалесцентн"
            ],
            "he": [
                "אירוסול שמן",
                "סיבים עדינים"
            ]
        },
        "searchAliases": {
            "ru": [
                "коалесцирующий фильтр",
                "коалесцентный фильтр",
                "фильтр масляного тумана"
            ],
            "he": [
                "מסנן מתלכד",
                "מסנן אירוסול שמן"
            ],
            "en": [
                "coalescing filter"
            ]
        }
    },
    "term-carbon-filter": {
        "linkForms": {
            "ru": [
                "угольный фильтр",
                "угольного фильтр",
                "активированный угол"
            ],
            "he": [
                "מסנן פחם",
                "פחם פעיל"
            ]
        },
        "searchAliases": {
            "ru": [
                "угольный фильтр",
                "адсорбер паров масла"
            ],
            "he": [
                "מסנן פחם פעיל",
                "מסנן פחם"
            ],
            "en": [
                "activated carbon filter",
                "carbon filter"
            ]
        }
    },
    "term-zero-loss-drain": {
        "linkForms": {
            "ru": [
                "по уровню жидкост"
            ],
            "he": [
                "מנקז"
            ]
        },
        "searchAliases": {
            "ru": [
                "дренаж без потери воздуха",
                "конденсатоотводчик без потери воздуха"
            ],
            "he": [
                "מנקז עיבוי אוטומטי ללא איבוד אוויר"
            ],
            "en": [
                "zero-loss drain",
                "zero-loss condensate drain"
            ]
        }
    },
    "term-oil-water-separator": {
        "linkForms": {
            "ru": [
                "водомасляного сепаратор"
            ],
            "he": [
                "מפריד שמן-מים"
            ]
        },
        "searchAliases": {
            "ru": [
                "масловодяной сепаратор",
                "водомасляный сепаратор"
            ],
            "he": [
                "מפריד שמן-מים"
            ],
            "en": [
                "oil-water separator"
            ]
        }
    },
    "term-reverse-osmosis": {
        "linkForms": {
            "ru": [
                "обратный осмос",
                "обратного осмос"
            ],
            "he": [
                "אוסמוזה הפוכה"
            ]
        },
        "searchAliases": {
            "ru": [
                "обратный осмос",
                "RO",
                "ОО"
            ],
            "he": [
                "אוסמוזה הפוכה",
                "RO"
            ],
            "en": [
                "reverse osmosis",
                "RO"
            ]
        }
    },
    "term-osmotic-pressure": {
        "linkForms": {
            "ru": [
                "осмотическое давлен",
                "осмотического давлен"
            ],
            "he": [
                "לחץ אוסמוטי"
            ]
        },
        "searchAliases": {
            "ru": [
                "осмотическое давление"
            ],
            "he": [
                "לחץ אוסמוטי"
            ],
            "en": [
                "osmotic pressure"
            ]
        }
    },
    "term-crossflow-filtration": {
        "linkForms": {
            "ru": [
                "тангенциальн",
                "перекрестно-поточн"
            ],
            "he": [
                "זרימה צולבת"
            ]
        },
        "searchAliases": {
            "ru": [
                "тангенциальная фильтрация",
                "перекрестно-поточная фильтрация"
            ],
            "he": [
                "סינון זרימה צולבת",
                "זרימה משיקית"
            ],
            "en": [
                "crossflow filtration"
            ]
        }
    },
    "term-ro-feedwater": {
        "linkForms": {
            "ru": [
                "исходная вод",
                "исходной вод",
                "питательной вод"
            ],
            "he": [
                "מי הזנה",
                "קדם-טיפול"
            ]
        },
        "searchAliases": {
            "ru": [
                "исходная вода RO",
                "питательная вода RO"
            ],
            "he": [
                "מים גולמיים",
                "מי הזנה"
            ],
            "en": [
                "feedwater",
                "raw water"
            ]
        }
    },
    "term-permeate": {
        "linkForms": {
            "ru": [
                "пермеат"
            ],
            "he": [
                "תסנין",
                "פרמיאט"
            ]
        },
        "searchAliases": {
            "ru": [
                "пермеат",
                "фильтрат",
                "очищенная вода"
            ],
            "he": [
                "תסנין",
                "פרמיאט",
                "תוצר"
            ],
            "en": [
                "permeate",
                "product water"
            ]
        }
    },
    "term-concentrate": {
        "linkForms": {
            "ru": [
                "концентрат",
                "ретентат"
            ],
            "he": [
                "רכז",
                "תמלחת"
            ]
        },
        "searchAliases": {
            "ru": [
                "концентрат",
                "рассол",
                "ретентат"
            ],
            "he": [
                "רכז",
                "תמלחת"
            ],
            "en": [
                "concentrate",
                "brine",
                "reject",
                "retentate"
            ]
        }
    },
    "term-ro-recovery": {
        "linkForms": {
            "ru": [
                "степень извлечен",
                "Recovery"
            ],
            "he": [
                "אחוז השבה",
                "Recovery"
            ]
        },
        "searchAliases": {
            "ru": [
                "степень извлечения",
                "выход пермеата",
                "конверсия",
                "Recovery"
            ],
            "he": [
                "אחוז השבה",
                "יחס השבה",
                "Recovery"
            ],
            "en": [
                "recovery",
                "conversion ratio"
            ]
        }
    },
    "term-concentration-factor": {
        "linkForms": {
            "ru": [
                "коэффициент концентрирован",
                "кратность концентрирован"
            ],
            "he": [
                "מקדם ריכוז"
            ]
        },
        "searchAliases": {
            "ru": [
                "коэффициент концентрирования",
                "кратность упаривания",
                "CF"
            ],
            "he": [
                "מקדם ריכוז",
                "CF"
            ],
            "en": [
                "concentration factor",
                "CF"
            ]
        }
    },
    "term-salt-rejection-passage": {
        "linkForms": {
            "ru": [
                "солезадержан",
                "проскок сол",
                "селективност"
            ],
            "he": [
                "דחיית מלחים",
                "מעבר מלחים"
            ]
        },
        "searchAliases": {
            "ru": [
                "солезадержание",
                "селективность",
                "проскок солей",
                "солепрохождение",
                "SR",
                "SP"
            ],
            "he": [
                "דחיית מלחים",
                "מעבר מלחים"
            ],
            "en": [
                "salt rejection",
                "salt passage"
            ]
        }
    },
    "term-permeate-flux": {
        "linkForms": {
            "ru": [
                "флакс"
            ],
            "he": [
                "שטף"
            ]
        },
        "searchAliases": {
            "ru": [
                "флакс",
                "удельный поток пермеата",
                "LMH",
                "GFD"
            ],
            "he": [
                "שטף",
                "פלאקס",
                "LMH"
            ],
            "en": [
                "permeate flux",
                "flux",
                "LMH",
                "gfd"
            ]
        }
    },
    "term-electrical-conductivity": {
        "linkForms": {
            "ru": [
                "электропроводност",
                "проводимост",
                "кондуктометр"
            ],
            "he": [
                "מוליכות חשמלית",
                "מד מוליכות"
            ]
        },
        "searchAliases": {
            "ru": [
                "удельная электропроводность",
                "электропроводность",
                "проводимость",
                "EC",
                "мкСм/см"
            ],
            "he": [
                "מוליכות חשמלית",
                "EC"
            ],
            "en": [
                "electrical conductivity",
                "EC"
            ]
        }
    },
    "term-tds": {
        "linkForms": {
            "ru": [
                "солесодержан",
                "TDS"
            ],
            "he": [
                "מוצקים מומסים",
                "TDS"
            ]
        },
        "searchAliases": {
            "ru": [
                "общее солесодержание",
                "солесодержание",
                "TDS"
            ],
            "he": [
                "כלל מוצקים מומסים",
                "TDS"
            ],
            "en": [
                "total dissolved solids",
                "TDS"
            ]
        }
    },
    "term-sdi": {
        "linkForms": {
            "ru": [
                "индекс коллоидного загрязнен",
                "SDI"
            ],
            "he": [
                "מדד צפיפות הסחף",
                "SDI"
            ]
        },
        "searchAliases": {
            "ru": [
                "SDI",
                "индекс коллоидного загрязнения",
                "SDI15"
            ],
            "he": [
                "SDI",
                "מדד צפיפות הסחף"
            ],
            "en": [
                "silt density index",
                "SDI"
            ]
        }
    },
    "term-smbs": {
        "linkForms": {
            "ru": [
                "метабисульфит",
                "бисульфит",
                "дехлорирован",
                "SMBS"
            ],
            "he": [
                "ביסולפיט",
                "סילוק כלור",
                "SMBS"
            ]
        },
        "searchAliases": {
            "ru": [
                "SMBS",
                "метабисульфит натрия",
                "бисульфит натрия",
                "дехлорирование"
            ],
            "he": [
                "SMBS",
                "סודיום מטא-ביסולפיט",
                "סילוק כלור",
                "נטרול כלור"
            ],
            "en": [
                "sodium metabisulfite",
                "SMBS",
                "dechlorination"
            ]
        }
    },
    "term-orp": {
        "linkForms": {
            "ru": [
                "окислительно-восстановительн",
                "ORP"
            ],
            "he": [
                "חמצון-חיזור",
                "ORP"
            ]
        },
        "searchAliases": {
            "ru": [
                "ORP",
                "ОВП",
                "редокс",
                "окислительно-восстановительный потенциал"
            ],
            "he": [
                "ORP",
                "פוטנציאל חמצון-חיזור",
                "רדוץ"
            ],
            "en": [
                "oxidation-reduction potential",
                "ORP",
                "redox"
            ]
        }
    },
    "term-antiscalant": {
        "linkForms": {
            "ru": [
                "антискалант"
            ],
            "he": [
                "אנטיסקלנט",
                "מונע אבנית"
            ]
        },
        "searchAliases": {
            "ru": [
                "антискалант",
                "ингибитор осадкообразования"
            ],
            "he": [
                "אנטיסקלנט",
                "מונע אבנית"
            ],
            "en": [
                "antiscalant",
                "scale inhibitor"
            ]
        }
    },
    "term-scaling-vs-fouling": {
        "linkForms": {
            "ru": [
                "накипеобразован",
                "скейлинг",
                "фоулинг",
                "биофоулинг"
            ],
            "he": [
                "שקיעת אבנית",
                "התאבנות",
                "אילוח"
            ]
        },
        "searchAliases": {
            "ru": [
                "скейлинг",
                "фоулинг",
                "биофоулинг",
                "накипеобразование",
                "загрязнение мембран"
            ],
            "he": [
                "התאבנות",
                "שקיעת אבנית",
                "אילוח"
            ],
            "en": [
                "scaling",
                "fouling",
                "biofouling"
            ]
        }
    },
    "term-vessel-telescoping": {
        "linkForms": {
            "ru": [
                "напорный корпус",
                "телескопирован"
            ],
            "he": [
                "בית ממברנה",
                "בתי ממברנה",
                "טלסקופינג"
            ]
        },
        "searchAliases": {
            "ru": [
                "напорный корпус",
                "телескопирование",
                "корпус мембран"
            ],
            "he": [
                "בית ממברנה",
                "וסל",
                "טלסקופינג"
            ],
            "en": [
                "pressure vessel",
                "telescoping"
            ]
        }
    },
    "term-ro-normalization": {
        "linkForms": {
            "ru": [
                "нормализац"
            ],
            "he": [
                "נרמול נתונים",
                "נרמול"
            ]
        },
        "searchAliases": {
            "ru": [
                "нормализация RO",
                "нормализация данных",
                "ASTM D4516"
            ],
            "he": [
                "נרמול נתונים",
                "נרמול RO"
            ],
            "en": [
                "data normalization",
                "RO normalization",
                "ASTM D4516"
            ]
        }
    },
    "term-profiling-probing": {
        "linkForms": {
            "ru": [
                "профилирован",
                "зондирован"
            ],
            "he": [
                "פרופיילינג",
                "פרובינג"
            ]
        },
        "searchAliases": {
            "ru": [
                "профилирование",
                "зондирование корпуса"
            ],
            "he": [
                "פרופיילינג",
                "פרובינג"
            ],
            "en": [
                "vessel profiling",
                "permeate probing"
            ]
        }
    },
    "term-cip": {
        "linkForms": {
            "ru": [
                "химическая мойк",
                "химической мойк",
                "CIP"
            ],
            "he": [
                "ניקוי כימי",
                "שטיפה כימית",
                "CIP"
            ]
        },
        "searchAliases": {
            "ru": [
                "CIP",
                "химическая мойка",
                "безразборная мойка",
                "химическая промывка"
            ],
            "he": [
                "CIP",
                "ניקוי כימי במקום",
                "שטיפה כימית"
            ],
            "en": [
                "cleaning-in-place",
                "CIP"
            ]
        }
    },
    "term-rla": {
        "linkForms": {
            "ru": [
                "RLA"
            ],
            "he": [
                "RLA"
            ]
        },
        "searchAliases": {
            "ru": [
                "RLA",
                "номинальный рабочий ток компрессора"
            ],
            "he": [
                "RLA",
                "זרם עבודה נקוב"
            ],
            "en": [
                "rated load amps",
                "RLA"
            ]
        }
    },
    "term-lrtc": {
        "linkForms": {
            "ru": [
                "LRTC"
            ],
            "he": [
                "LRTC"
            ]
        },
        "searchAliases": {
            "ru": [
                "LRTC",
                "защита по низкой температуре хладагента"
            ],
            "he": [
                "LRTC",
                "הגנת טמפרטורת קרר נמוכה"
            ],
            "en": [
                "low refrigerant temperature cutout",
                "LRTC"
            ]
        }
    },
    "term-tcv": {
        "linkForms": {
            "ru": [
                "термостатический клапан",
                "масляного контур",
                "маслоохладител"
            ],
            "he": [
                "שסתום תרמוסטטי",
                "מצנן השמן",
                "שמן המדחס"
            ]
        },
        "searchAliases": {
            "ru": [
                "TCV",
                "термостатический клапан"
            ],
            "he": [
                "TCV",
                "שסתום תרמוסטטי"
            ],
            "en": [
                "thermostatic control valve",
                "TCV"
            ]
        }
    },
    "term-ndp": {
        "linkForms": {
            "ru": [
                "чистой движущей сил",
                "NDP"
            ],
            "he": [
                "הכוח המניע הנטו",
                "NDP"
            ]
        },
        "searchAliases": {
            "ru": [
                "NDP",
                "чистое движущее давление",
                "движущий напор осмоса"
            ],
            "he": [
                "NDP",
                "לחץ מניע נטו"
            ],
            "en": [
                "net driving pressure",
                "NDP"
            ]
        }
    },
    "term-tcf": {
        "linkForms": {
            "ru": [
                "температурный поправочный коэффициент",
                "TCF"
            ],
            "he": [
                "מקדם תיקון טמפרטורה",
                "TCF"
            ]
        },
        "searchAliases": {
            "ru": [
                "TCF",
                "температурный поправочный коэффициент"
            ],
            "he": [
                "TCF",
                "מקדם תיקון טמפרטורה"
            ],
            "en": [
                "temperature correction factor",
                "TCF"
            ]
        }
    },
    "term-lod": {
        "linkForms": {
            "ru": [
                "предел обнаружен",
                "LoD",
                "DPD"
            ],
            "he": [
                "גבול גילוי",
                "גבול הגילוי",
                "LoD",
                "DPD"
            ]
        },
        "searchAliases": {
            "ru": [
                "LoD",
                "DPD",
                "предел обнаружения",
                "свободный хлор"
            ],
            "he": [
                "LoD",
                "DPD",
                "גבול גילוי",
                "בדיקת כלור חופשי"
            ],
            "en": [
                "limit of detection",
                "LoD",
                "DPD"
            ]
        }
    },
    "term-loto": {
        "linkForms": {
            "ru": [
                "LOTO"
            ],
            "he": [
                "LOTO"
            ]
        },
        "searchAliases": {
            "ru": [
                "LOTO",
                "блокировка и вывешивание бирок",
                "изоляция энергии"
            ],
            "he": [
                "LOTO",
                "נעילה ותיוג בטיחותי"
            ],
            "en": [
                "lockout tagout",
                "LOTO"
            ]
        }
    }
};

  const BLOCK_ALIASES = {
    "#calc-1a": {
        "ru": [
            "возврат конденсата",
            "потери конденсата",
            "экономия конденсата",
            "слив конденсата в дренаж"
        ],
        "he": [
            "החזרת עיבוי",
            "אובדן עיבוי",
            "החזרת קונדנסט"
        ]
    },
    "#calc-1b": {
        "ru": [
            "вторичный пар",
            "пар вскипания",
            "расширитель вторичного пара",
            "ресивер конденсата TLV"
        ],
        "he": [
            "קיטור הבזקה",
            "קיטור משני",
            "מכל איסוף TLV"
        ]
    },
    "#calc-2": {
        "ru": [
            "чиллер",
            "холодопроизводительность",
            "COP чиллера",
            "температурный подход конденсатора и испарителя",
            "кВт/TR"
        ],
        "he": [
            "צ'ילר",
            "תפוקת קירור",
            "מקדם יעילות COP",
            "הפרש גישה במאייד ובמעבה"
        ]
    },
    "#calc-3a": {
        "ru": [
            "пересчет расхода воздуха",
            "FAD в нормальные кубометры",
            "стандартный расход воздуха Nl/s"
        ],
        "he": [
            "המרת ספיקת אוויר",
            "ספיקת אוויר חופשי FAD"
        ]
    },
    "#calc-3b": {
        "ru": [
            "утечки воздуха",
            "утечки сжатого воздуха",
            "спад давления ресивера",
            "цикл Load Unload",
            "Load/Unload"
        ],
        "he": [
            "דליפות אוויר",
            "דליפות אוויר דחוס",
            "דעיכת לחץ במקלט",
            "מחזור Load Unload",
            "Load/Unload"
        ]
    },
    "#calc-3c": {
        "ru": [
            "конденсация влаги в сжатом воздухе",
            "влага в воздухе после концевого охладителя",
            "осушитель воздуха"
        ],
        "he": [
            "התעבות לחות באוויר דחוס",
            "מים באוויר דחוס"
        ]
    },
    "#calc-4a": {
        "ru": [
            "баланс обратного осмоса",
            "выход пермеата Recovery",
            "селективность мембран RO",
            "сходимость баланса проводимости"
        ],
        "he": [
            "מאזן אוסמוזה הפוכה",
            "אחוז השבה Recovery",
            "דחיית מלחים RO"
        ]
    },
    "#calc-4b": {
        "ru": [
            "нормализация RO",
            "нормализация обратного осмоса",
            "приведенный расход пермеата Eq. 72",
            "противодавление пермеата"
        ],
        "he": [
            "נרמול RO",
            "נרמול אוסמוזה הפוכה",
            "ספיקת תוצר מנורמלת Eq. 72",
            "לחץ נגדי בתוצר"
        ]
    },
    "#calc-5a": {
        "ru": [
            "перевод давления пара",
            "избыточное и абсолютное давление",
            "barg в bara"
        ],
        "he": [
            "המרת לחץ קיטור",
            "לחץ מד ולחץ מוחלט",
            "barg ל-bara"
        ]
    },
    "#calc-5b": {
        "ru": [
            "расход пара по нагрузке",
            "продувка котла",
            "непрерывная продувка по TDS",
            "кратность упаривания котла"
        ],
        "he": [
            "ספיקת קיטור לפי עומס",
            "ניקוז דוד רציף לפי TDS",
            "מחזורי ריכוז בדוד"
        ]
    }
};

  const UI = {
    "ru": {
        "popoverDialogLabel": "Карточка термина словаря",
        "openInGlossaryLink": "В словарь →",
        "toGlossary": "В словарь →",
        "whereInGuideLink": "Где в учебнике →",
        "toGuide": "Где в учебнике →",
        "closeBtnLabel": "Закрыть карточку термина",
        "closePopover": "Закрыть окно термина",
        "searchMatchesFound": "Найдено {count} совпадений",
        "searchMatchesLive": "Найдено {n} совпадений",
        "nodeGroupLabel": "Узлы схем"
    },
    "he": {
        "popoverDialogLabel": "כרטיס מונח מהמילון",
        "openInGlossaryLink": "למילון ←",
        "toGlossary": "למילון ←",
        "whereInGuideLink": "איפה בספר הלימוד ←",
        "toGuide": "איפה בספר הלימוד ←",
        "closeBtnLabel": "סגור כרטיס מונח",
        "closePopover": "סגור חלונית מונח",
        "searchMatchesFound": "נמצאו {count} התאמות",
        "searchMatchesLive": "נמצאו {n} התאמות",
        "nodeGroupLabel": "צמתי תרשים"
    }
};

  return Object.freeze({
    TERMS,
    BLOCK_ALIASES,
    UI
  });
});
