// 06_web_project/app.js
// Bilingual (RU LTR / HE RTL) Interactive Engineering Application Engine (v10.0)

(function (root) {
  'use strict';

  const APP_VERSION = root.APP_VERSION = {
    edition: 'v15.2',
    date: '2026-10-30',
    core: 'v10.0'
  };

  const STORAGE_KEY_LANG = 'eng_lib_v9_lang';
  const STORAGE_KEY_SEC_TERMS = 'eng_lib_v9_sec_terms';
  const STORAGE_KEY_TRAINER = 'eng_lib_v9_trainer_progress';
  const STORAGE_KEY_LOGS = 'eng_lib_v9_shift_drafts';
  const STORAGE_KEY_LAST_PLACE = 'eng_lib_v13_last_place';
  const STORAGE_KEY_FIRST_VISIT = 'eng_lib_v13_first_visit_done';
  const STORAGE_KEY_GUIDE_DEPTH = 'eng_lib_v15_guide_depth';

  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let storageAvailable = true;
  let lastDialogTriggerEl = null;

  function detectStorageAvailable() {
    try {
      if (typeof localStorage === 'undefined') return false;
      const testKey = '__eng_lib_storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (_) {
      return false;
    }
  }
  storageAvailable = detectStorageAvailable();

  function loadJson(key, fallback) {
    try {
      if (!storageAvailable) return fallback;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      storageAvailable = false;
      updateStorageFallbackBanner();
      return fallback;
    }
  }

  function saveJson(key, val) {
    try {
      if (!storageAvailable) {
        updateStorageFallbackBanner();
        return;
      }
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) {
      storageAvailable = false;
      updateStorageFallbackBanner();
    }
  }

  function getInitialLang() {
    try {
      if (!storageAvailable) return 'ru';
      return localStorage.getItem(STORAGE_KEY_LANG) || 'ru';
    } catch (_) {
      storageAvailable = false;
      return 'ru';
    }
  }

  const AppState = {
    lang: getInitialLang(),
    currency: '$',
    guideDepth: loadJson(STORAGE_KEY_GUIDE_DEPTH, 'simple') === 'detailed' ? 'detailed' : 'simple',
    showSecTerms: loadJson(STORAGE_KEY_SEC_TERMS, true),
    firstVisitDismissed: Boolean(loadJson(STORAGE_KEY_FIRST_VISIT, false)),
    activeView: 'home',
    activeToolId: 'sec-survey',
    activeSystemId: 'chillers',
    activeCaseId: 'case-3-1',
    activeCalcPanelId: 'calc-panel-2',
    activeShiftLogId: 'shift-log-chillers',
    showExtendedLog: false,
    diagramZoom: 100,
    diagramFlowAnim: !prefersReducedMotion,
    trainerProgress: loadJson(STORAGE_KEY_TRAINER, {}),
    shiftLogDrafts: loadJson(STORAGE_KEY_LOGS, {})
  };
  root.AppState = AppState;

  root.setGuideDepth = function (depth) {
    const nextDepth = depth === 'detailed' ? 'detailed' : 'simple';
    AppState.guideDepth = nextDepth;
    saveJson(STORAGE_KEY_GUIDE_DEPTH, nextDepth);
    if (typeof document !== 'undefined') {
      document.querySelectorAll('article.system-article').forEach((art) => {
        art.setAttribute('data-guide-depth', nextDepth);
      });
      document.querySelectorAll('details.guide-depth-details').forEach((det) => {
        det.open = nextDepth === 'detailed';
      });
      document.querySelectorAll('.guide-depth-btn').forEach((btn) => {
        const btnDepth = btn.getAttribute('data-depth');
        btn.setAttribute('aria-pressed', btnDepth === nextDepth ? 'true' : 'false');
        btn.classList.toggle('active', btnDepth === nextDepth);
      });
    }
  };

  function updateStorageFallbackBanner() {
    const banner = typeof document !== 'undefined' && document.getElementById('storage-fallback-banner');
    if (!banner) return;
    if (storageAvailable) {
      banner.style.display = 'none';
      banner.innerHTML = '';
      return;
    }
    const isHe = AppState.lang === 'he';
    banner.style.display = 'block';
    banner.innerHTML = isHe
      ? 'ℹ️ <strong>מצב ללא אחסון מקומי (localStorage חסום או מוגבל):</strong> כל המחשבונים, התרשימים והסימולטור פועלים במלואם בסשן הנוכחי, אך טיוטות יומני המשמרת וההתקדמות לא יישמרו לאחר סגירת הלשונית.'
      : 'ℹ️ <strong>Режим без сохранения в браузере (localStorage недоступен или ограничен):</strong> все калькуляторы, схемы и тренажёр работают в полном объёме в текущей сессии, но черновики сменных журналов и прогресс не сохранятся после закрытия вкладки.';
  }

  root.setStorageAvailabilityForTest = function (isAvail) {
    storageAvailable = Boolean(isAvail);
    updateStorageFallbackBanner();
    renderHomeDashboard();
  };

  root.dismissFirstVisitBanner = function () {
    AppState.firstVisitDismissed = true;
    saveJson(STORAGE_KEY_FIRST_VISIT, true);
    renderHomeDashboard();
  };

  root.recordLastPlace = function (entry) {
    if (!entry || !storageAvailable) return;
    saveJson(STORAGE_KEY_LAST_PLACE, entry);
  };

  function getSystemVisualMeta(sysId) {
    const map = {
      steam: {
        bg: 'var(--sys-steam-bg, #fee2e2)',
        fg: 'var(--sys-steam-accent, #b91c1c)',
        svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8 20c-2-2-2-5 0-7s2-5 0-7M12 20c-2-2-2-5 0-7s2-5 0-7M16 20c-2-2-2-5 0-7s2-5 0-7"></path></svg>',
        shortTitle: { ru: 'Пар', he: 'קיטור' },
        oneLine: { ru: 'Котёл, редуцирование, конденсатоотводчики', he: 'דוד, הפחתת לחץ, מלכודות עיבוי' },
        calcPrefix: 'calc_5'
      },
      condensate: {
        bg: 'var(--sys-condensate-bg, #fef3c7)',
        fg: 'var(--sys-condensate-accent, #b45309)',
        svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"></path></svg>',
        shortTitle: { ru: 'Конденсат', he: 'עיבוי' },
        oneLine: { ru: 'Возврат, вторичный пар, ресиверы', he: 'השבת עיבוי, קיטור משני, מכלים' },
        calcPrefix: 'calc_1'
      },
      chillers: {
        bg: 'var(--sys-chillers-bg, #e0f2fe)',
        fg: 'var(--sys-chillers-accent, #0369a1)',
        svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 2v20M4 7l16 10M20 7L4 17"></path></svg>',
        shortTitle: { ru: 'Чиллеры', he: 'צ\'ילרים' },
        oneLine: { ru: 'Холод, вода и гликоль, подход, COP', he: 'קירור, מים וגליקול, Approach ו-COP' },
        calcPrefix: 'calc_2'
      },
      air: {
        bg: 'var(--sys-air-bg, #ccfbf1)',
        fg: 'var(--sys-air-accent, #0f766e)',
        svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"></path></svg>',
        shortTitle: { ru: 'Сжатый воздух', he: 'אוויר דחוס' },
        oneLine: { ru: 'Утечки, осушка, точка росы', he: 'דליפות, ייבוש, נקודת טל' },
        calcPrefix: 'calc_3'
      },
      ro: {
        bg: 'var(--sys-ro-bg, #ede9fe)',
        fg: 'var(--sys-ro-accent, #6d28d9)',
        svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16l-6 8v6l-4 2v-8z"></path></svg>',
        shortTitle: { ru: 'Обратный осмос', he: 'אוסמוזה הפוכה' },
        oneLine: { ru: 'Мембраны, пермеат, хлор, TCF', he: 'ממברנות, תסנין, כלור ו-TCF' },
        calcPrefix: 'calc_4'
      }
    };
    return map[sysId] || map.steam;
  }
  root.getSystemVisualMeta = getSystemVisualMeta;

  function getSystemsMap() {
    return {
      steam: root.SYSTEM_STEAM,
      condensate: root.SYSTEM_CONDENSATE,
      chillers: root.SYSTEM_CHILLERS,
      air: root.SYSTEM_AIR,
      ro: root.SYSTEM_RO
    };
  }

  function getSystemsList() {
    const m = getSystemsMap();
    return [m.steam, m.condensate, m.chillers, m.air, m.ro].filter(Boolean);
  }

  function getAllCases() {
    const p1 = root.TRAINER_CASES_PART1 || [];
    const p2 = root.TRAINER_CASES_PART2 || [];
    return [...p1, ...p2];
  }

  // Normalize schema differences between Part 1 and Part 2 trainer cases
  function normalizeCase(c, lang) {
    if (!c) return null;
    const isHe = lang === 'he';
    const pick = (obj) => (obj && typeof obj === 'object' ? (obj[lang] || obj.ru || '') : (obj || ''));

    // Step 1
    let obsHtml = '';
    if (c.step1_observations) {
      const raw = c.step1_observations[lang] || c.step1_observations.ru;
      if (Array.isArray(raw)) {
        obsHtml = `<ul>${raw.map((item) => `<li>${item}</li>`).join('')}</ul>`;
      } else {
        obsHtml = raw;
      }
    }

    const normOptions = (opts) => (opts || []).map((o) => ({
      id: o.id,
      isCorrect: Boolean(o.isCorrect !== undefined ? o.isCorrect : o.correct),
      text: pick(o.text || o.label),
      feedback: pick(o.feedback)
    }));

    // Step 2
    const s2 = c.step2_premature || c.step2_conclusions || {};
    let s2IntroHtml = '';
    if (s2.canConclude || s2.cannotConclude) {
      const lblCan = isHe ? 'מה ניתן להסיק מיד:' : 'Что можно утверждать сразу:';
      const lblCannot = isHe ? 'מה אסור להסיק ללא בדיקה נוספת:' : 'Чего нельзя утверждать без доп. проверки:';
      s2IntroHtml = `
        <div class="trainer-conclusions-box">
          <div><strong>✓ ${lblCan}</strong> ${pick(s2.canConclude)}</div>
          <div><strong>⚠️ ${lblCannot}</strong> ${pick(s2.cannotConclude)}</div>
        </div>
      `;
    }

    // Step 3
    const s3 = c.step3_missing_data || c.step3_nextCheck || {};
    // Step 4
    const s4 = c.step4_hypotheses || {};
    // Step 5
    const s5 = c.step5_loto || c.step5_actions || {};
    let s5IntroHtml = '';
    if (s5.operatorSafe || s5.lotoRequired) {
      const opArr = (s5.operatorSafe && (s5.operatorSafe[lang] || s5.operatorSafe.ru)) || [];
      const lotoArr = (s5.lotoRequired && (s5.lotoRequired[lang] || s5.lotoRequired.ru)) || [];
      const lblOp = isHe ? '🟢 פעולות מפעיל בטוחות:' : '🟢 Безопасные действия оператора:';
      const lblLo = isHe ? '🔒 עבודות צוות מוסמך תחת LOTO:' : '🔒 Работы допущенного персонала по LOTO:';
      s5IntroHtml = `
        <div class="trainer-loto-split">
          <div class="operator-safe-card"><strong>${lblOp}</strong><ul>${opArr.map((x) => `<li>${x}</li>`).join('')}</ul></div>
          <div class="loto-req-card"><strong>${lblLo}</strong><ul>${lotoArr.map((x) => `<li>${x}</li>`).join('')}</ul></div>
        </div>
      `;
    }

    // Step 6
    let s6Html = '';
    if (c.step6_solutionHtml) {
      s6Html = pick(c.step6_solutionHtml);
    } else if (c.step6_solution) {
      const exp = pick(c.step6_solution.explanation);
      const srcs = (c.step6_solution.sources || []).map((s) => `<li><code>[${s.code}]</code> <span dir="ltr">${s.ref}</span></li>`).join('');
      const lblSrc = isHe ? 'מקורות ראשוניים מאומתים:' : 'Проверенные первоисточники:';
      s6Html = `
        <div class="operator-box">
          <p>${exp}</p>
          <div><strong>${lblSrc}</strong><ul>${srcs}</ul></div>
        </div>
      `;
    }

    const calcTargetMap = {
      steam: 'calc-panel-5',
      condensate: 'calc-panel-1',
      chillers: 'calc-panel-2',
      air: 'calc-panel-3',
      ro: 'calc-panel-4'
    };

    return {
      id: c.id,
      code: c.code,
      systemId: c.systemId,
      calcTabId: c.calcTabId || calcTargetMap[c.systemId] || 'calc-panel-2',
      title: pick(c.title),
      steps: [
        {
          num: 1,
          type: 'info',
          title: isHe ? 'שלב 1: תצפיות ונתוני פתיחה [דוגמה לימודית]' : 'Шаг 1: Наблюдения и исходные данные [Учебный пример]',
          contentHtml: obsHtml
        },
        {
          num: 2,
          type: 'quiz',
          title: isHe ? 'שלב 2: מה ניתן ומה אסור להסיק מיד (זיהוי מסקנה מוקדמת שגויה)' : 'Шаг 2: Что можно и чего нельзя утверждать сразу (поиск ошибки)',
          introHtml: s2IntroHtml,
          question: pick(s2.question),
          hint: pick(s2.hint),
          options: normOptions(s2.options)
        },
        {
          num: 3,
          type: 'quiz',
          title: isHe ? 'שלב 3: אילו נתונים חסרים ואיזו בדיקה לבצע כעת' : 'Шаг 3: Каких данных не хватает (выбор следующей проверки)',
          introHtml: '',
          question: pick(s3.question),
          hint: pick(s3.hint),
          options: normOptions(s3.options)
        },
        {
          num: 4,
          type: 'quiz',
          title: isHe ? 'שלב 4: השערות הנדסיות סבירות (ללא ניחוש סיבה יחידה)' : 'Шаг 4: Правдоподобные гипотезы (без угадывания одной причины)',
          introHtml: '',
          question: pick(s4.question),
          hint: pick(s4.hint),
          options: normOptions(s4.options)
        },
        {
          num: 5,
          type: 'quiz',
          title: isHe ? 'שלב 5: פעולות מפעיל בטוחות מול עבודות תחת LOTO' : 'Шаг 5: Безопасные действия оператора vs работы по LOTO',
          introHtml: s5IntroHtml,
          question: pick(s5.question),
          hint: pick(s5.hint),
          options: normOptions(s5.options)
        },
        {
          num: 6,
          type: 'solution',
          title: isHe ? 'שלב 6: פתרון הנדסי מלא ואימות מול מקורות S01–S23' : 'Шаг 6: Полный инженерный разбор и ссылки на источники S01–S23',
          contentHtml: s6Html
        }
      ]
    };
  }

  function getCaseProgress(caseId) {
    if (!AppState.trainerProgress[caseId]) {
      AppState.trainerProgress[caseId] = {
        currentStep: 1,
        selected: {},
        checked: {},
        showHint: {},
        showFullSolution: false,
        completed: false
      };
    }
    return AppState.trainerProgress[caseId];
  }

  function saveTrainerProgress() {
    saveJson(STORAGE_KEY_TRAINER, AppState.trainerProgress);
  }

  // =========================================================================
  // RENDERING: HOME DASHBOARD (v13: 3 Doors, 2-Min Example, 5 Systems, 6 Tools)
  // =========================================================================
  function renderHomeDashboard() {
    const lang = AppState.lang;
    const isHe = lang === 'he';
    const box = document.getElementById('dynamic-home-dashboard');
    if (!box) return;

    const systems = getSystemsList();
    const allCases = getAllCases();
    const completedCount = allCases.filter((c) => AppState.trainerProgress[c.id] && AppState.trainerProgress[c.id].completed).length;

    // 1. First-visit compact banner (hidden once dismissed)
    let firstVisitHtml = '';
    if (!AppState.firstVisitDismissed) {
      firstVisitHtml = `
        <div class="first-visit-banner" id="first-visit-banner" role="region" aria-label="${isHe ? 'ברוכים הבאים' : 'Первый визит'}">
          <div class="first-visit-items">
            <span class="first-visit-step"><strong>1.</strong> ${isHe ? 'לאתר את סיבת התקלה' : 'Найти причину неисправности'}</span>
            <span class="first-visit-sep" aria-hidden="true">·</span>
            <span class="first-visit-step"><strong>2.</strong> ${isHe ? 'לחשב הפסדים ב-$ או ב-₪' : 'Посчитать потери в $ или ₪'}</span>
            <span class="first-visit-sep" aria-hidden="true">·</span>
            <span class="first-visit-step"><strong>3.</strong> ${isHe ? 'לתעד ביומן המשמרת' : 'Записать в журнал смены'}</span>
          </div>
          <button type="button" class="btn btn-sm btn-primary first-visit-dismiss-btn" id="first-visit-dismiss-btn" onclick="window.dismissFirstVisitBanner()">
            ${isHe ? 'הבנתי' : 'Понятно'}
          </button>
        </div>
      `;
    }

    // 2. "Continue from where you left off" pill (only when storageAvailable and saved place exists)
    let continuePillHtml = '';
    if (storageAvailable) {
      const lastPlace = loadJson(STORAGE_KEY_LAST_PLACE, null);
      let pillHref = '';
      let pillText = '';
      if (lastPlace && lastPlace.type === 'case' && lastPlace.caseId) {
        const foundC = allCases.find((c) => c.id === lastPlace.caseId);
        const progC = AppState.trainerProgress[lastPlace.caseId];
        if (foundC && (!progC || !progC.completed)) {
          const stepNum = (progC && progC.currentStep) || lastPlace.step || 1;
          pillHref = `#${foundC.id}`;
          pillText = isHe
            ? `המשך מהמקום שבו עצרת: אירוע ${foundC.code} · שלב ${stepNum} ←`
            : `Продолжить с места: Случай ${foundC.code} · шаг ${stepNum} →`;
        }
      } else if (lastPlace && lastPlace.type === 'calc' && lastPlace.modCode) {
        pillHref = `#calc-${String(lastPlace.modCode).toLowerCase()}`;
        pillText = isHe
          ? `המשך מהמקום שבו עצרת: חישוב ${lastPlace.modCode} ←`
          : `Продолжить с места: Расчёт ${lastPlace.modCode} →`;
      } else {
        // Fallback: check if any case in trainerProgress has currentStep > 1 and !completed
        const inProgCase = allCases.find((c) => {
          const p = AppState.trainerProgress[c.id];
          return p && !p.completed && (p.currentStep > 1 || Object.keys(p.selected || {}).length > 0);
        });
        if (inProgCase) {
          const stepNum = AppState.trainerProgress[inProgCase.id].currentStep || 1;
          pillHref = `#${inProgCase.id}`;
          pillText = isHe
            ? `המשך מהמקום שבו עצרת: אירוע ${inProgCase.code} · שלב ${stepNum} ←`
            : `Продолжить с места: Случай ${inProgCase.code} · шаг ${stepNum} →`;
        }
      }

      if (pillHref && pillText) {
        continuePillHtml = `
          <div class="home-continue-row">
            <a href="${pillHref}" class="home-continue-pill" id="home-continue-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>${pillText}</span>
            </a>
          </div>
        `;
      }
    }

    // 3. Compute 2-minute example savings using EconomicsEngine.calcModule2Economics
    let storedCurr = null;
    try {
      if (storageAvailable && typeof localStorage !== 'undefined') {
        storedCurr = localStorage.getItem('eng_lib_v12_currency');
      }
    } catch (_) {}
    const activeCurr = (AppState.currency === '₪' || (isHe && !storedCurr)) ? '₪' : (AppState.currency || storedCurr || '$');
    const exampleTariff = activeCurr === '₪' ? 0.50 : 0.12;
    const exampleHours = 6000;
    const deltaKw = 128 - 98; // 30 kW
    let savingsFormatted = activeCurr === '₪' ? '₪90 000' : '$21 600';
    if (root.EconomicsEngine && typeof root.EconomicsEngine.calcModule2Economics === 'function') {
      try {
        const econRes = root.EconomicsEngine.calcModule2Economics(
          { pEl: deltaKw },
          { currency: activeCurr, t_year_h: exampleHours, tariff_per_kwh: exampleTariff }
        );
        if (econRes && econRes.hasCost) {
          savingsFormatted = root.EconomicsEngine.formatMoney(econRes.costTotalYear, activeCurr, 0);
        }
      } catch (_) {}
    }

    // 4. Count cases and calculators per system dynamically from data (by systemId in I18N_UI.CALC_METADATA)
    const calcMetaEntries = (root.I18N_UI && root.I18N_UI.CALC_METADATA) ? Object.values(root.I18N_UI.CALC_METADATA) : [];
    const formatRuCount = (n, one, few, many) => {
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`;
      return `${n} ${many}`;
    };

    const lMap = root.LEARNING_MAP || {};
    const learnPrefix = (lMap.ui && lMap.ui.cardLearnPrefix && (lMap.ui.cardLearnPrefix[lang] || lMap.ui.cardLearnPrefix.ru)) || (isHe ? 'תבינו:' : 'Поймёте:');
    const prereqPrefix = (lMap.ui && lMap.ui.cardPrereqPrefix && (lMap.ui.cardPrereqPrefix[lang] || lMap.ui.cardPrereqPrefix.ru)) || (isHe ? 'נדרש מראש:' : 'Заранее:');

    const sysCardsHtml = systems.map((sys) => {
      const vMeta = getSystemVisualMeta(sys.id);
      const caseCount = allCases.filter((c) => c.systemId === sys.id).length || (sys.caseIds ? sys.caseIds.length : 2);
      const calcCount = calcMetaEntries.filter((m) => m && m.systemId === sys.id).length;
      const calcPart = isHe
        ? (calcCount === 0 ? 'אין חישובים' : (calcCount === 1 ? 'חישוב 1' : `${calcCount} חישובים`))
        : (calcCount === 0 ? 'расчётов нет' : formatRuCount(calcCount, 'расчёт', 'расчёта', 'расчётов'));
      const countLine = isHe
        ? `${caseCount} אירועים · ${calcPart}`
        : `${formatRuCount(caseCount, 'случай', 'случая', 'случаев')} · ${calcPart}`;
      const topicMeta = (lMap.topics && lMap.topics[sys.id]) || {};
      const learnTxt = (topicMeta.willUnderstand && (topicMeta.willUnderstand[lang] || topicMeta.willUnderstand.ru)) || '';
      const prereqTxt = (topicMeta.needFirst && (topicMeta.needFirst[lang] || topicMeta.needFirst.ru)) || '';
      return `
        <a href="#system-${sys.id}" class="home-v13-sys-card" data-sys-card="${sys.id}">
          <span class="home-v13-sys-icon" style="background:${vMeta.bg}; color:${vMeta.fg};">
            ${vMeta.svg}
          </span>
          <span class="home-v13-sys-title">${vMeta.shortTitle[lang] || vMeta.shortTitle.ru}</span>
          <span class="home-v13-sys-desc">${vMeta.oneLine[lang] || vMeta.oneLine.ru}</span>
          <div class="home-v13-sys-learn"><strong>${learnPrefix}</strong> ${learnTxt}</div>
          <div class="home-v13-sys-prereq"><strong>${prereqPrefix}</strong> ${prereqTxt}</div>
          <span class="home-v13-sys-counts">${countLine}</span>
        </a>
      `;
    }).join('');

    const purposeText = (lMap.purpose && (lMap.purpose[lang] || lMap.purpose.ru)) || '';
    const purposeHeading = (lMap.ui && lMap.ui.purposeHeading && (lMap.ui.purposeHeading[lang] || lMap.ui.purposeHeading.ru)) || (isHe ? 'מהי הספרייה הזו' : 'Что это за библиотека');
    const routeHeading = (lMap.ui && lMap.ui.routeHeading && (lMap.ui.routeHeading[lang] || lMap.ui.routeHeading.ru)) || (isHe ? 'מאיפה להתחיל' : 'С чего начать');
    const expLineHtml = (lMap.ui && lMap.ui.experiencedHtml && (lMap.ui.experiencedHtml[lang] || lMap.ui.experiencedHtml.ru)) || '';
    const routeItemsHtml = ((lMap.route && Array.isArray(lMap.route)) ? lMap.route : []).map((st) => `
      <li class="home-route-item">
        <a href="${st.href}" class="home-route-step">
          <span class="home-route-step-num">${st.n}</span>
          <span class="home-route-step-body">
            <strong class="home-route-step-label">${(st.label && (st.label[lang] || st.label.ru)) || ''}</strong>
            <span class="home-route-step-hint">${(st.hint && (st.hint[lang] || st.hint.ru)) || ''}</span>
          </span>
        </a>
      </li>
    `).join('');

    // 5. Shift tools (6 compact tiles)
    const shiftTools = [
      {
        href: '#sec-survey',
        svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f4c81" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M9 4h6v3H9zM6 5.5H5v15h14v-15h-1M8 12l2.5 2.5L16 10"></path></svg>',
        title: isHe ? 'סיור ציוד ומדידות' : 'Обход и замеры',
        sub: isHe ? 'מלכודות ודליפות, דוח A4' : 'Отводчики и утечки, отчёт A4'
      },
      {
        href: '#sec-shift-log',
        svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f4c81" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6zM9 11h7M9 15h7M9 7h3"></path></svg>',
        title: isHe ? 'יומן משמרת' : 'Сменный журнал',
        sub: isHe ? 'טופס A4 לכל מערכת' : 'Бланк A4 по каждой системе'
      },
      {
        href: '#sec-saved',
        svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f4c81" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"></path></svg>',
        title: isHe ? 'החישובים שלי' : 'Мои расчёты',
        sub: isHe ? 'שמירה והשוואה' : 'Сохранить и сравнить'
      },
      {
        href: '#sec-steam-table',
        svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f4c81" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 10h18M9 10v10"></path></svg>',
        title: isHe ? 'טבלת קיטור' : 'Таблица пара',
        sub: isHe ? '11 נקודות מאומתות' : '11 проверенных точек'
      },
      {
        href: '#sec-glossary',
        svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f4c81" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 5h7v14H4zM13 5h7v14h-7M7 9h1M16 9h1"></path></svg>',
        title: isHe ? 'מילון RU · HE · EN' : 'Словарь RU · HE · EN',
        sub: isHe ? 'מונחים וקיצורים' : 'Термины и сокращения'
      },
      {
        href: '#sec-copyright',
        svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f4c81" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 4h10l4 4v12H5zM9 12h6M9 16h4"></path></svg>',
        title: isHe ? 'מקורות S01–S23' : 'Источники S01–S23',
        sub: isHe ? 'מקורו של כל מספר' : 'Откуда взято каждое число'
      }
    ];

    box.innerHTML = `
      <div class="home-v13-wrapper">
        <!-- Первый экран: один вопрос и три двери -->
        <section class="home-v13-hero">
          ${firstVisitHtml}
          <div class="home-v13-hero-head">
            <p class="home-v13-overline">${isHe ? 'קיטור · עיבוי · צ\'ילרים · אוויר דחוס · אוסמוזה הפוכה' : 'Пар · Конденсат · Чиллеры · Сжатый воздух · Обратный осмос'}</p>
            <h1 class="home-v13-h1" tabindex="-1">${isHe ? 'עם מה הגעתם היום?' : 'С чем вы пришли сегодня?'}</h1>
            <p class="home-v13-lead">${isHe ? 'לאתר את סיבת התקלה, לחשב כמה היא עולה למפעל, ולתעד את התוצאה ביומן המשמרת — בעברית וברוסית.' : 'Найти причину неисправности, посчитать, сколько она стоит заводу, и записать результат в журнал смены — на русском и иврите.'}</p>
          </div>

          ${continuePillHtml}

          <div class="home-v13-doors-grid">
            <a href="#problem" class="home-v13-door home-v13-door-primary" id="home-door-problem">
              <span class="home-v13-door-icon home-v13-door-icon-primary">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9 16H3z"></path><path d="M12 10v4M12 17h.01"></path></svg>
              </span>
              <span class="home-v13-door-title">${isHe ? 'משהו לא תקין בציוד' : 'Что-то не так на оборудовании'}</span>
              <span class="home-v13-door-desc">${isHe ? 'בחרו מערכת ותסמין — ייפתח אירוע דומה עם ניתוח שלב-אחר-שלב ובדיקה במחשבון.' : 'Выберите систему и признак — откроется похожий случай с разбором по шагам и проверкой расчётом.'}</span>
              <span class="home-v13-door-cta">${isHe ? 'לאיתור הסיבה ←' : 'Найти причину →'}</span>
            </a>

            <a href="#calc" class="home-v13-door" id="home-door-calc">
              <span class="home-v13-door-icon" style="background:#e0f2fe; color:#0f4c81;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0f4c81" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2"></rect><path d="M8 6.5h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18.5h8"></path></svg>
              </span>
              <span class="home-v13-door-title">${isHe ? 'לחשב' : 'Посчитать'}</span>
              <span class="home-v13-door-desc">${isHe ? '10 חישובים: הפסדי עיבוי, קיטור משני, צ\'ילר, דליפות אוויר, אוסמוזה וספיקת קיטור. סיכום שנתי ב-$ או ב-₪.' : '10 расчётов: потери конденсата, вторичный пар, чиллер, утечки воздуха, осмос, расход пара. Итог — в $ или ₪ за год.'}</span>
              <span class="home-v13-door-cta" style="color:#0f4c81;">${isHe ? 'לפתיחת המחשבונים ←' : 'Открыть расчёты →'}</span>
            </a>

            <a href="#learn" class="home-v13-door" id="home-door-learn">
              <span class="home-v13-door-icon" style="background:#dcfce7; color:#15803d;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 5.5C5 4 8.5 4 12 6c3.5-2 7-2 10-.5V19c-3-1.5-6.5-1.5-10 .5-3.5-2-7-2-10-.5z"></path><path d="M12 6v13.5"></path></svg>
              </span>
              <span class="home-v13-door-title">${isHe ? 'להבין את המערכת' : 'Разобраться в системе'}</span>
              <span class="home-v13-door-desc">${isHe ? '5 מערכות בשפה פשוטה: איך זה עובד, תרשים, מה למדוד ואילו טעויות נפוצות ביותר.' : '5 систем простым языком: как работает, схема, что измерять и какие ошибки делают чаще всего.'}</span>
              <span class="home-v13-door-cta" style="color:#15803d;">${isHe ? 'להתחלת הלימוד ←' : 'Начать учёбу →'}</span>
            </a>
          </div>
        </section>

        <!-- Назначение библиотеки и маршрут «С чего начать» (v15.2) -->
        <section class="home-purpose" aria-labelledby="home-purpose-title">
          <h2 id="home-purpose-title" class="home-purpose-h2">${purposeHeading}</h2>
          <p class="home-purpose-text">${purposeText}</p>
          <h3 class="home-route-h3">${routeHeading}</h3>
          <ol class="home-route">
            ${routeItemsHtml}
          </ol>
          <p class="home-route-experienced">${expLineHtml}</p>
        </section>

        <!-- Пример на 2 минуты (Случай 3.1) -->
        <section class="home-v13-example-card" aria-labelledby="home-ex-title">
          <div class="home-v13-example-left">
            <span class="home-v13-example-badge">${isHe ? 'התחילו כאן · 2 דקות' : 'Начните отсюда · 2 минуты'}</span>
            <h2 id="home-ex-title" class="home-v13-example-h2">${isHe ? 'הצ\'ילר מתריע "High Condenser Pressure". מה עושים?' : 'Чиллер пишет «High Condenser Pressure». Что делать?'}</h2>
            <p class="home-v13-example-desc">${isHe ? 'הפרש טמפרטורות המים במגדל הקירור תקין, אך ה-Approach של המעבה עלה ל-10.0 °C. נתחו את האירוע בשלושה צעדים ובדקו כמה עולה למפעל מעבה מלוכלך.' : 'Перепад воды градирни в норме, но подход конденсатора вырос до 10.0 °C. Разберите случай за три шага и посмотрите, во что заводу обходится грязный конденсатор.'}</p>
            <div class="home-v13-example-actions">
              <a href="#case-3-1" class="btn btn-primary home-v13-ex-btn-primary">${isHe ? 'לניתוח אירוע 3.1' : 'Разобрать случай 3.1'}</a>
              <a href="#calc-2" class="btn btn-outline home-v13-ex-btn-outline">${isHe ? 'מיד לחישוב' : 'Сразу к расчёту'}</a>
            </div>
          </div>

          <div class="home-v13-example-tiles">
            <div class="home-v13-ex-tile">
              <span class="home-v13-ex-tile-label">${isHe ? '1. Approach מעבה' : '1. Подход конденсатора'}</span>
              <span class="home-v13-ex-tile-val" style="color:#b91c1c;" dir="ltr">10.0 °C</span>
              <span class="home-v13-ex-tile-note">${isHe ? 'ניקוי נדרש מעל <bdi dir="ltr">5.6 °C</bdi> <bdi dir="ltr">[S08, p. 66]</bdi>' : 'чистка нужна от 5.6 °C [S08, с. 66]'}</span>
            </div>
            <div class="home-v13-ex-tile">
              <span class="home-v13-ex-tile-label">${isHe ? '2. לאחר ניקוי' : '2. После чистки'}</span>
              <span class="home-v13-ex-tile-val" style="color:#15803d;">${isHe ? '<bdi dir="ltr">128 → 98 kW</bdi>' : '128 → 98 кВт'}</span>
              <span class="home-v13-ex-tile-note">${isHe ? 'הספק המדחס' : 'мощность компрессора'}</span>
            </div>
            <div class="home-v13-ex-tile" id="home-ex-savings-tile">
              <span class="home-v13-ex-tile-label">${isHe ? '3. חיסכון שנתי' : '3. Экономия за год'}</span>
              <span class="home-v13-ex-tile-val" id="home-ex-savings-val" style="color:#0f4c81;" dir="ltr">${savingsFormatted}</span>
              <span class="home-v13-ex-tile-note" id="home-ex-savings-note">${isHe
                ? `דוגמה: 6000 שעות, <bdi dir="ltr">${activeCurr}${exampleTariff.toFixed(2)}/kWh</bdi> — הזינו ערכים משלכם`
                : `пример: 6000 ч, ${activeCurr}${exampleTariff.toFixed(2)}/кВт·ч — подставьте свои`}</span>
            </div>
          </div>
        </section>

        <!-- Пять систем -->
        <section class="home-v13-systems-sec" aria-labelledby="home-sys-title">
          <div class="home-v13-systems-head">
            <h2 id="home-sys-title" class="home-v13-sec-h2">${isHe ? 'או בחרו את המערכת שלכם' : 'Или выберите свою систему'}</h2>
            <span class="home-v13-progress-text" id="home-cases-progress">${isHe ? `אירועים שנותחו: ${completedCount} מתוך ${allCases.length}` : `Разобрано случаев: ${completedCount} из ${allCases.length}`}</span>
          </div>
          <div class="home-v13-systems-grid">
            ${sysCardsHtml}
          </div>
        </section>

        <!-- Инструменты смены -->
        <section class="home-v13-tools-sec" aria-labelledby="home-tools-title">
          <h2 id="home-tools-title" class="home-v13-tools-h2">${isHe ? 'כלי משמרת' : 'Инструменты смены'}</h2>
          <div class="home-v13-tools-grid">
            ${shiftTools.map((t) => `
              <a href="${t.href}" class="home-v13-tool-tile">
                <span class="home-v13-tool-svg">${t.svg}</span>
                <span>
                  <strong class="home-v13-tool-title">${t.title}</strong>
                  <span class="home-v13-tool-sub">${t.sub}</span>
                </span>
              </a>
            `).join('')}
          </div>
        </section>

        <!-- Двухстрочный подвал главной -->
        <div class="home-v13-footer-note">
          <span>${isHe ? 'כלי לימודי. בכל סתירה קובעים נהלי המפעל, ספרות היצרן (OEM) ונוהל LOTO.' : 'Учебный инструмент. При расхождении главнее инструкции завода, паспорт оборудования и LOTO.'}</span>
          <span>${isHe ? 'הנתונים נשמרים על מכשיר זה בלבד.' : 'Данные хранятся только на этом устройстве.'}</span>
          <a href="#about">${isHe ? 'פירוט על המהדורה' : 'Подробнее о редакции'}</a>
        </div>
      </div>
    `;
  }
  root.renderHomeDashboard = renderHomeDashboard;

  // =========================================================================
  // RENDERING: PROBLEM SYMPTOM FINDER SCREEN (#problem, v13 Stage 4)
  // =========================================================================
  AppState.problemSystemId = 'chillers';
  AppState.problemCaseId = 'case-3-1';

  function renderProblemScreen() {
    const lang = AppState.lang;
    const isHe = lang === 'he';
    const box = document.getElementById('dynamic-problem-container');
    if (!box) return;

    const systems = [
      { id: 'steam', ru: 'Пар', he: 'קיטור' },
      { id: 'condensate', ru: 'Конденсат', he: 'עיבוי' },
      { id: 'chillers', ru: 'Чиллеры', he: 'צ\'ילרים' },
      { id: 'air', ru: 'Сжатый воздух', he: 'אוויר דחוס' },
      { id: 'ro', ru: 'Обратный осмос', he: 'אוסמוזה הפוכה' }
    ];

    const probSysId = AppState.problemSystemId || 'chillers';
    const allSymptoms = (root.SYMPTOMS_LIST && Array.isArray(root.SYMPTOMS_LIST)) ? root.SYMPTOMS_LIST : [];
    const sysSymptoms = allSymptoms.filter((s) => s.systemId === probSysId);
    const selSymptom = sysSymptoms.find((s) => s.caseId === AppState.problemCaseId) || sysSymptoms[0] || allSymptoms[0];
    if (!selSymptom) return;
    AppState.problemCaseId = selSymptom.caseId;

    const sysPillsHtml = systems.map((s) => {
      const isAct = s.id === probSysId;
      const vMeta = getSystemVisualMeta(s.id);
      return `
        <button type="button" class="problem-sys-pill ${isAct ? 'active' : ''}"
          data-problem-sys="${s.id}"
          aria-pressed="${isAct ? 'true' : 'false'}"
          onclick="window.selectProblemSystem('${s.id}')">
          <span class="problem-sys-pill-icon" style="color:${isAct ? '#ffffff' : vMeta.fg};">${vMeta.svg}</span>
          <span>${isHe ? s.he : s.ru}</span>
        </button>
      `;
    }).join('');

    const probVMeta = getSystemVisualMeta(probSysId);
    const cardsHtml = sysSymptoms.map((item) => {
      const isSel = item.caseId === selSymptom.caseId;
      const caseLbl = isHe ? `אירוע ${item.code}` : `Случай ${item.code}`;
      const sympTxt = (item.shortSymptom && (item.shortSymptom[lang] || item.shortSymptom.ru)) || '';
      const obsTxt = (item.observedDetails && (item.observedDetails[lang] || item.observedDetails.ru)) || '';
      const whereTxt = (item.whereVisible && (item.whereVisible[lang] || item.whereVisible.ru)) || '';
      return `
        <button type="button" class="problem-symptom-card ${isSel ? 'active' : ''}"
          id="problem-${item.caseId}"
          data-problem-case="${item.caseId}"
          aria-pressed="${isSel ? 'true' : 'false'}"
          onclick="window.selectProblemCase('${item.caseId}')">
          <span class="problem-card-badge" style="background:${probVMeta.bg}; color:${probVMeta.fg};">${caseLbl}</span>
          <span class="problem-card-headline">${sympTxt}</span>
          <span class="problem-card-details">${obsTxt}</span>
          <span class="problem-card-where">${whereTxt}</span>
        </button>
      `;
    }).join('');

    // Check CASE_CALC_CONFIG for selected case
    const caseCalcCfg = root.CASE_CALC_CONFIG && root.CASE_CALC_CONFIG[selSymptom.caseId];
    let calcBlockHtml = '';
    if (caseCalcCfg && caseCalcCfg.applicable) {
      const modLbl = (selSymptom.calcModuleLabel && (selSymptom.calcModuleLabel[lang] || selSymptom.calcModuleLabel.ru)) || '';
      const btnLbl = isHe
        ? `לבדיקה במחשבון (${modLbl})`
        : `Проверить расчётом (${modLbl})`;
      calcBlockHtml = `
        <button type="button" class="btn btn-outline problem-aside-calc-btn" id="problem-verify-calc-btn"
          onclick="window.verifyCaseInCalculator('${selSymptom.caseId}', 1)">
          ${btnLbl}
        </button>
      `;
    } else if (caseCalcCfg && !caseCalcCfg.applicable) {
      const noCalcMsg = (caseCalcCfg.notApplicableMsg && (caseCalcCfg.notApplicableMsg[lang] || caseCalcCfg.notApplicableMsg.ru)) ||
        (isHe ? 'חישוב אינו ישים לאירוע זה: בתנאי האירוע אין נתונים מספריים לחישוב.' : 'Расчёт к этому случаю не применяется: в условии нет нужных чисел.');
      calcBlockHtml = `
        <div class="problem-aside-no-calc" id="problem-calc-not-applicable">
          ${noCalcMsg}
        </div>
      `;
    }

    const selSymptomHeadline = (selSymptom.shortSymptom && (selSymptom.shortSymptom[lang] || selSymptom.shortSymptom.ru)) || '';

    box.innerHTML = `
      <div class="problem-v13-wrapper">
        <div class="problem-v13-header">
          <a href="#home" class="problem-back-link">${isHe ? 'חזרה לדף הבית →' : '← На главную'}</a>
          <h1 class="problem-v13-h1" tabindex="-1">${isHe ? 'מה קורה בשטח?' : 'Что происходит?'}</h1>
          <p class="problem-v13-lead">${isHe ? 'שני צעדים: מערכת ותסמין. בהמשך — אירוע דומה עם ניתוח מלא.' : 'Два шага: система и признак. Дальше — похожий случай с разбором.'}</p>
        </div>

        <section aria-labelledby="problem-step1-h2" class="problem-step1-sec">
          <h2 id="problem-step1-h2" class="problem-step-h2">${isHe ? 'שלב 1. איזו מערכת?' : 'Шаг 1. Какая система?'}</h2>
          <div class="problem-sys-pills-row">
            ${sysPillsHtml}
          </div>
        </section>

        <div class="problem-main-split">
          <section aria-labelledby="problem-step2-h2" class="problem-step2-sec">
            <h2 id="problem-step2-h2" class="problem-step-h2">${isHe ? 'שלב 2. מה אתם רואים או שומעים?' : 'Шаг 2. Что вы видите?'}</h2>
            <div class="problem-cards-stack">
              ${cardsHtml}
            </div>
            <a href="#params-table-${probSysId}" class="problem-missing-symptom-link" id="problem-missing-symptom-link">
              ${isHe ? 'התסמין שלי לא מופיע — מה למדוד במערכת זו ←' : 'Моего признака нет — что измерить в этой системе →'}
            </a>
          </section>

          <aside aria-labelledby="problem-aside-h2" class="problem-aside-card" id="problem-aside-card">
            <span class="problem-aside-badge" style="background:${probVMeta.bg}; color:${probVMeta.fg};">${isHe ? `אירוע דומה ${selSymptom.code}` : `Похожий случай ${selSymptom.code}`}</span>
            <h2 id="problem-aside-h2" class="problem-aside-h2" tabindex="-1">${selSymptomHeadline}</h2>
            <p class="problem-aside-desc">${isHe
              ? 'הניתוח מתבצע שלב-אחר-שלב: מה רואים במשמרת, אילו מסקנות מוקדמות שגויות, מה לבדוק, איך לבצע נעילה בטוחה (LOTO) ומה הפתרון ההנדסי.'
              : 'Разбор идёт по шагам: что видно на смене, какие выводы ошибочны, что проверить, как безопасно отключить (LOTO) и чем всё закончилось.'}</p>
            <ol class="problem-aside-steps">
              <li>${isHe ? 'תצפיות המשמרת' : 'Наблюдения смены'}</li>
              <li>${isHe ? 'מסקנות מוקדמות שגויות' : 'Ложные выводы'}</li>
              <li>${isHe ? 'מה לבדוק כעת' : 'Что проверить'}</li>
              <li>${isHe ? 'השערות הנדסיות סבירות' : 'Решение и гипотезы'}</li>
              <li>${isHe ? 'בטיחות ונוהל LOTO' : 'LOTO'}</li>
              <li>${isHe ? 'פתרון הנדסי מלא' : 'Полный разбор'}</li>
            </ol>
            <div class="problem-aside-actions">
              <button type="button" class="btn btn-primary problem-aside-open-btn" id="problem-open-case-btn"
                onclick="window.openProblemCaseStep1('${selSymptom.caseId}')">
                ${isHe ? 'לפתיחת הניתוח' : 'Открыть разбор'}
              </button>
              ${calcBlockHtml}
              <a href="#shift-log-${selSymptom.systemId}" class="problem-aside-log-btn" id="problem-shift-log-link">
                ${isHe ? 'לתיעוד ביומן המשמרת' : 'Записать в журнал смены'}
              </a>
            </div>
          </aside>
        </div>
      </div>
    `;
  }
  root.renderProblemScreen = renderProblemScreen;

  root.selectProblemSystem = function (sysId) {
    AppState.problemSystemId = sysId;
    const allSymptoms = (root.SYMPTOMS_LIST && Array.isArray(root.SYMPTOMS_LIST)) ? root.SYMPTOMS_LIST : [];
    const first = allSymptoms.find((s) => s.systemId === sysId);
    if (first) {
      AppState.problemCaseId = first.caseId;
    }
    renderProblemScreen();
  };

  root.selectProblemCase = function (caseId, skipMobileScroll) {
    AppState.problemCaseId = caseId;
    const allSymptoms = (root.SYMPTOMS_LIST && Array.isArray(root.SYMPTOMS_LIST)) ? root.SYMPTOMS_LIST : [];
    const found = allSymptoms.find((s) => s.caseId === caseId);
    if (found) {
      AppState.problemSystemId = found.systemId;
    }
    renderProblemScreen();
    if (!skipMobileScroll && typeof window !== 'undefined') {
      const isMobileOrTablet = (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) || window.innerWidth <= 768;
      if (isMobileOrTablet) {
        const asideCard = document.getElementById('problem-aside-card');
        const asideH2 = document.getElementById('problem-aside-h2');
        if (typeof root.scrollAndFocusBlock === 'function') {
          root.scrollAndFocusBlock(asideCard, asideH2, { smooth: true });
        }
      }
    }
  };

  root.openProblemCaseStep1 = function (caseId) {
    const p = getCaseProgress(caseId);
    p.currentStep = 1;
    saveTrainerProgress();
    root.navigateToHash('#' + caseId);
  };

  // =========================================================================
  // RENDERING: ALL 5 ENGINEERING SYSTEMS + INTERACTIVE DIAGRAMS (50 NODES)
  // =========================================================================
  // =========================================================================
  // v14 STAGE 1.2 & STAGE 2: LATEX-TO-TEXT CONVERTER & TEXTBOOK RENDERING
  // =========================================================================
  function escapeGuideHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  root.latexToText = function (src) {
    let s = String(src || '').trim();
    s = s.replace(/\\left(?![A-Za-z])/g, '').replace(/\\right(?![A-Za-z])/g, '');
    s = s
      .replace(/\\,/g, ' ')
      .replace(/\\;/g, ' ')
      .replace(/\\quad(?![A-Za-z])/g, ' ')
      .replace(/\\qquad(?![A-Za-z])/g, ' ');
    s = s.replace(/\{,\}/g, ',');
    s = s.replace(/\\%/g, '%').replace(/\\\$/g, '$');

    const symMap = [
      [/\\Longleftrightarrow(?![A-Za-z])/g, '⇔'],
      [/\\leftrightarrow(?![A-Za-z])/g, '↔'],
      [/\\rightarrow(?![A-Za-z])/g, '→'],
      [/\\uparrow(?![A-Za-z])/g, '↑'],
      [/\\downarrow(?![A-Za-z])/g, '↓'],
      [/\\Delta(?![A-Za-z])/g, 'Δ'],
      [/\\varphi(?![A-Za-z])/g, 'φ'],
      [/\\varnothing(?![A-Za-z])/g, '∅'],
      [/\\approx(?![A-Za-z])/g, '≈'],
      [/\\times(?![A-Za-z])/g, ' × '],
      [/\\cdot(?![A-Za-z])/g, ' · '],
      [/\\dots(?![A-Za-z])/g, '…'],
      [/\^\s*\{\\circ\}|\^\s*\\circ|\\circ(?![A-Za-z])/g, '°'],
      [/\\le(?![A-Za-z])/g, '≤'],
      [/\\ge(?![A-Za-z])/g, '≥'],
      [/\\pm(?![A-Za-z])/g, '±'],
      [/\\pi(?![A-Za-z])/g, 'π'],
      [/\\rho(?![A-Za-z])/g, 'ρ'],
      [/\\eta(?![A-Za-z])/g, 'η'],
      [/\\exp(?![A-Za-z])/g, 'exp'],
      [/\\ln(?![A-Za-z])/g, 'ln'],
      [/\\max(?![A-Za-z])/g, 'max']
    ];
    for (const [re, rep] of symMap) {
      s = s.replace(re, rep);
    }
    // v14.0.1: «\Delta T» → «ΔT» (пробел после Δ перед буквой/индексом убирается)
    s = s.replace(/Δ\s+(?=[A-Za-zА-Яа-я\\_])/g, 'Δ');

    const needsParens = (expr) => {
      const t = expr.trim();
      if (!t) return false;
      return /[+\-−×·/=]/.test(t);
    };

    let prev;
    do {
      prev = s;
      s = s.replace(/\\(?:text|mathbf)\{([^{}]*)\}/g, '$1');
      s = s.replace(/\\dot\{([^{}]*)\}/g, '$1\u0307');
      s = s.replace(/_\{([^{}]*)\}/g, '_$1');
      s = s.replace(/\^\{([^{}]*)\}/g, (_, exp) => (exp === '°' || exp.startsWith('°') ? exp : '^' + exp));
      s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => {
        const ca = a.trim();
        const cb = b.trim();
        const lhs = needsParens(ca) ? `(${ca})` : ca;
        const rhs = needsParens(cb) ? `(${cb})` : cb;
        return `${lhs} / ${rhs}`;
      });
      s = s.replace(/(?<![\\A-Za-z_^}])\{([^{}]*)\}(?!\s*\{)/g, '$1');
    } while (s !== prev);

    s = s.replace(/\\dot\s+([A-Za-zА-Яа-я])/g, '$1\u0307');
    s = s.replace(/\^°/g, '°');
    s = s.replace(/[ \t]+/g, ' ').trim();
    return s;
  };

  // Карта замены русских токенов внутри \text{…} и \mathbf{…} при рендере в режиме иврита (v14.1, часть Б)
  const HE_FORMULA_TEXT_MAP = [
    ['тонна охлаждения (Ton of Refrigeration — TR)', 'Ton of Refrigeration (TR)'],
    ['в округлённой подстановке примера DuPont:', "in DuPont's rounded example:"],
    ['в графике источника округлённо указано', 'source chart shows approx.'],
    ['в округленном примере DuPont:', "in DuPont's rounded example:"],
    ['Удельный расход', 'Specific consumption'],
    ['в долях единицы', 'as a fraction'],
    ['тест корректен', 'test valid'],
    ['цикл в минуту', 'cycle per minute'],
    ['округлено до', 'rounded to'],
    ['бар изб.', 'barg'],
    ['бар абс.', 'bara'],
    ['в тексте', 'in text'],
    ['за 24 ч', 'per 24 h'],
    ['бар(и)', 'barg'],
    ['бар(а)', 'bara'],
    ['минуты', 'min'],
    ['минуту', 'min'],
    ['секунд', 's'],
    ['об/мин', 'rpm'],
    ['дюймов', 'in'],
    ['округл', 'rounded'],
    ['минут', 'min'],
    ['неокр', 'unrounded'],
    ['прибл', 'approx'],
    ['мкСм', 'µS'],
    ['комп', 'comp'],
    ['колл', 'coll'],
    ['цикл', 'cycle'],
    ['раза', 'times'],
    ['точн', 'exact'],
    ['бар', 'bar'],
    ['изб', 'g'],
    ['абс', 'abs'],
    ['мин', 'min'],
    ['сут', 'day'],
    ['год', 'yr'],
    ['мкм', 'µm'],
    ['кДж', 'kJ'],
    ['кВт', 'kW'],
    ['вых', 'out'],
    ['выx', 'out'],
    ['или', 'or'],
    ['где', 'where'],
    ['раз', 'times'],
    ['кг', 'kg'],
    ['мг', 'mg'],
    ['мл', 'mL'],
    ['Нл', 'Nl'],
    ['Нм', 'Nm'],
    ['см', 'cm'],
    ['мм', 'mm'],
    ['Па', 'Pa'],
    ['Ом', 'Ω'],
    ['вх', 'in'],
    ['эл', 'el'],
    ['г', 'g'],
    ['ч', 'h'],
    ['с', 's'],
    ['л', 'L'],
    ['м', 'm'],
    ['В', 'V'],
    ['К', 'K']
  ];
  root.HE_FORMULA_TEXT_MAP = HE_FORMULA_TEXT_MAP;

  const HE_FORMULA_TEXT_REGEXES = HE_FORMULA_TEXT_MAP.map(([ruTok, repl]) => [
    new RegExp(`(?<![А-Яа-яЁё])${ruTok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![А-Яа-яЁё])`, 'g'),
    repl
  ]);

  function replaceFormulaTextForHe(expr) {
    return String(expr || '').replace(/\\(text|mathbf)\{((?:[^{}]|\{[^{}]*\})*)\}/g, (_, cmd, inner) => {
      let out = inner;
      for (let i = 0; i < HE_FORMULA_TEXT_REGEXES.length; i++) {
        out = out.replace(HE_FORMULA_TEXT_REGEXES[i][0], HE_FORMULA_TEXT_REGEXES[i][1]);
      }
      return `\\${cmd}{${out}}`;
    });
  }

  root.renderGuideMathHtml = function (rawHtml, lang) {
    let s = String(rawHtml || '');
    const mapExpr = lang === 'he'
      ? (expr) => root.latexToText(replaceFormulaTextForHe(expr))
      : (expr) => root.latexToText(expr);
    // Unwrap <div class="guide-display-math">$$...$$</div> into <div class="formula-box" dir="ltr">...</div>
    s = s.replace(/<div class="guide-display-math">\s*\$\$([\s\S]*?)\$\$\s*<\/div>/g, (_, expr) => {
      return `<div class="formula-box" dir="ltr">${escapeGuideHtml(mapExpr(expr))}</div>`;
    });
    // Replace any remaining $$...$$ or $...$
    s = s.replace(/\$\$([\s\S]*?)\$\$|\$((?:\\.|[^$\\\n])+)\$/g, (_, dispExpr, inlExpr) => {
      if (dispExpr !== undefined) {
        return `<div class="formula-box" dir="ltr">${escapeGuideHtml(mapExpr(dispExpr))}</div>`;
      }
      return `<span class="ltr-math" dir="ltr">${escapeGuideHtml(mapExpr(inlExpr))}</span>`;
    });
    return s;
  };

  const GUIDE_TOC_META = {
    summary: {
      ru: 'Коротко',
      he: 'בקצרה',
      fullRu: 'Кратко о системе и назначение',
      fullHe: 'בקצרה: ייעוד המערכת וכללי בטיחות'
    },
    how: {
      ru: 'Как работает',
      he: 'איך זה עובד',
      fullRu: '1. Простое объяснение: как работает система',
      fullHe: '1. הסבר פשוט: איך המערכת עובדת'
    },
    nodes: {
      ru: 'Узлы и схема',
      he: 'רכיבים ותרשים',
      fullRu: '2. Основные узлы и их назначение',
      fullHe: '2. רכיבי המערכת ותפקידם (תרשים וצמתים)'
    },
    iso: {
      ru: 'ISO 8573',
      he: 'ISO 8573',
      fullRu: '3. Классы чистоты воздуха по ISO 8573-1:2010',
      fullHe: '3. דרגות ניקיון אוויר לפי ISO 8573-1:2010'
    },
    logbook: {
      ru: 'Журнал',
      he: 'יומן',
      fullRu: 'Что оператор наблюдает и записывает в сменном журнале',
      fullHe: 'מה המפעיל בודק ורושם ביומן המשמרת'
    },
    relations: {
      ru: 'Показатели',
      he: 'מדדים',
      fullRu: 'Какие показатели связаны между собой',
      fullHe: 'קשרים פיזיקליים בין המדדים וטבלת פרמטרים'
    },
    symptoms: {
      ru: 'Признаки',
      he: 'תסמינים',
      fullRu: 'Типичные симптомы, возможные причины и как их различить',
      fullHe: 'תסמינים אופייניים, סיבות אפשריות ואירועים'
    },
    boundaries: {
      ru: 'Границы',
      he: 'גבולות',
      fullRu: 'Границы самостоятельной проверки оператора и когда нужен специалист',
      fullHe: 'גבולות בדיקה עצמית של המפעיל ומתי נדרש מומחה (LOTO)'
    },
    formulas: {
      ru: 'Формулы',
      he: 'נוסחאות',
      fullRu: 'Основные формулы с единицами и проверяемыми учебными примерами',
      fullHe: 'נוסחאות יסוד, דוגמאות חישוב ורובד הנדסי'
    },
    selfcheck: {
      ru: 'Проверь себя',
      he: 'בחן את עצמך',
      fullRu: 'Вопросы для самопроверки',
      fullHe: 'שאלות ותשובות לבחינה עצמית'
    },
    sources: {
      ru: 'Источники',
      he: 'מקורות',
      fullRu: 'Источники раздела',
      fullHe: 'ריכוז מקורות ראשוניים לפרק זה'
    }
  };
  root.GUIDE_TOC_META = GUIDE_TOC_META;

  let guideTocObserver = null;
  let guideTocScrollHandler = null;

  const GUIDE_BLOCK_TO_STEPS = {
    summary: [],
    how: ['principle'],
    nodes: ['diagram', 'equipment'],
    iso: ['equipment'],
    logbook: ['parameters'],
    relations: ['parameters'],
    symptoms: ['case'],
    boundaries: [],
    formulas: ['calculation'],
    selfcheck: ['selfcheck'],
    sources: ['sources']
  };

  root.setActiveGuideTocKey = function (sysId, blockKey) {
    const tocBar = document.getElementById(`guide-toc-${sysId}`);
    if (tocBar) {
      tocBar.querySelectorAll('.guide-toc-btn').forEach((btn) => {
        const isMatch = btn.getAttribute('data-toc-key') === blockKey;
        btn.classList.toggle('active', isMatch);
        if (isMatch) {
          btn.setAttribute('aria-current', 'true');
        } else {
          btn.removeAttribute('aria-current');
        }
      });
    }
    const stepsNav = document.getElementById(`guide-steps-${sysId}`);
    if (stepsNav) {
      const activeStepKeys = GUIDE_BLOCK_TO_STEPS[blockKey] || [];
      stepsNav.querySelectorAll('li.guide-step').forEach((li) => {
        const stepKey = li.getAttribute('data-step-key');
        const isStepActive = activeStepKeys.includes(stepKey);
        li.classList.toggle('active', isStepActive);
        if (isStepActive) {
          li.setAttribute('aria-current', 'step');
        } else {
          li.removeAttribute('aria-current');
        }
      });
    }
  };

  function setupGuideTocObserver() {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    if (guideTocObserver) {
      guideTocObserver.disconnect();
      guideTocObserver = null;
    }
    const sysId = AppState.activeSystemId || 'chillers';
    const blocks = document.querySelectorAll(`#system-${sysId} .guide-textbook-block`);
    if (!blocks.length) return;
    // v14.0.1: линия выбора активного раздела — сразу под липкой шапкой и липким оглавлением,
    // иначе после перехода по ссылке подсвечивался предыдущий раздел.
    const tocOffset = syncGuideTocOffset();
    const tocBarEl = document.getElementById(`guide-toc-${sysId}`);
    // При первом открытии «с холода» экран «Учёба» ещё скрыт и оглавление имеет высоту 0 —
    // тогда берётся его штатная высота 56 px.
    const measuredTocHeight = tocBarEl ? Math.ceil(tocBarEl.getBoundingClientRect().height) : 0;
    const tocBarHeight = measuredTocHeight > 0 ? measuredTocHeight : 56;
    const topMargin = tocOffset + tocBarHeight + 8;

    // v14.0.1: активный раздел определяется по текущей геометрии всех блоков, а не только по
    // изменившимся записям наблюдателя: иначе при плавной прокрутке (в том числе браузерной
    // при открытии ссылки «с холода») мог остаться подсвеченным предыдущий раздел.
    // Линия выбора — чуть ниже места посадки блока после перехода (оглавление + 12 px).
    const updateActiveGuideToc = () => {
      if (AppState.activeView !== 'learn') return;
      const line = topMargin + 12;
      let current = null;
      let above = null;
      let aboveTop = -Infinity;
      blocks.forEach((b) => {
        const r = b.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) current = b;
        if (r.top <= line && r.top > aboveTop) {
          aboveTop = r.top;
          above = b;
        }
      });
      const topEl = current || above || blocks[0];
      const bKey = topEl.getAttribute('data-guide-key');
      if (bKey) {
        root.setActiveGuideTocKey(sysId, bKey);
      }
    };

    guideTocObserver = new IntersectionObserver(
      () => updateActiveGuideToc(),
      {
        root: null,
        rootMargin: `-${topMargin}px 0px -60% 0px`,
        threshold: 0
      }
    );
    blocks.forEach((b) => guideTocObserver.observe(b));

    if (guideTocScrollHandler) {
      window.removeEventListener('scroll', guideTocScrollHandler);
    }
    let tocTicking = false;
    guideTocScrollHandler = () => {
      if (tocTicking) return;
      tocTicking = true;
      window.requestAnimationFrame(() => {
        tocTicking = false;
        updateActiveGuideToc();
      });
    };
    window.addEventListener('scroll', guideTocScrollHandler, { passive: true });
    window.requestAnimationFrame(() => updateActiveGuideToc());
  }

  root.syncSelfCheckToggleBtn = function (sysId) {
    const blockEl = document.getElementById(`guide-${sysId}-selfcheck`);
    const btnEl = document.getElementById(`selfcheck-toggle-btn-${sysId}`);
    if (!blockEl || !btnEl) return;
    const detailsList = Array.from(blockEl.querySelectorAll('details.selfcheck-answer'));
    const allOpen = detailsList.length > 0 && detailsList.every((d) => d.open);
    const isHe = AppState.lang === 'he';
    btnEl.setAttribute('data-all-open', allOpen ? 'true' : 'false');
    btnEl.textContent = allOpen
      ? (isHe ? 'הסתר את כל התשובות' : 'Скрыть все ответы')
      : (isHe ? 'הצג את כל התשובות' : 'Показать все ответы');
  };

  root.toggleAllSelfCheckAnswers = function (sysId, btnEl) {
    const blockEl = document.getElementById(`guide-${sysId}-selfcheck`);
    if (!blockEl) return;
    const detailsList = Array.from(blockEl.querySelectorAll('details.selfcheck-answer'));
    const allOpen = detailsList.length > 0 && detailsList.every((d) => d.open);
    const nextOpen = !allOpen;
    detailsList.forEach((d) => {
      d.open = nextOpen;
    });
    root.syncSelfCheckToggleBtn(sysId);
  };

  function renderSystemsSection() {
    const lang = AppState.lang;
    const isHe = lang === 'he';
    const container = document.getElementById('dynamic-systems-container');
    if (!container) return;

    const systems = getSystemsList();
    const tabsHtml = `
      <div class="system-selector-bar no-print" id="systems-selector-bar" role="tablist" aria-label="${isHe ? 'בחירת מערכת הנדסית' : 'Выбор инженерной системы'}">
        ${systems.map((sys) => {
          const active = sys.id === AppState.activeSystemId;
          const vMeta = getSystemVisualMeta(sys.id);
          const shortLbl = (vMeta.shortTitle && (vMeta.shortTitle[lang] || vMeta.shortTitle.ru)) || sys.id;
          const btnStyle = active
            ? `background:#0f4c81; color:#ffffff; border-color:#0f4c81;`
            : `background:${vMeta.bg}; color:${vMeta.fg}; border-color:${vMeta.fg};`;
          return `
            <button type="button" role="tab" aria-selected="${active ? 'true' : 'false'}"
              class="system-tab-btn ${active ? 'active' : ''}"
              data-sys-tab="${sys.id}"
              style="${btnStyle}"
              onclick="window.selectSystem('${sys.id}')">
              <span class="system-tab-svg" style="color:${active ? '#ffffff' : vMeta.fg};">${vMeta.svg}</span>
              <span>${shortLbl}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Render all 5 system sections with uniform 10-block textbook structure (11 blocks for air with iso)
    const sectionsHtml = systems.map((sys) => {
      const isCurrent = sys.id === AppState.activeSystemId;
      const title = sys.title[lang] || sys.title.ru;
      const secTitle = sys.secTermTitle ? (sys.secTermTitle[lang] || '') : '';
      const purpose = sys.purposeHtml[lang] || sys.purposeHtml.ru;
      const principle = sys.principleHtml[lang] || sys.principleHtml.ru;
      const diag = sys.diagram;
      const svgSrc = isHe ? (diag.svgPathHe || diag.svgPath) : (diag.svgPathRu || diag.svgPath);
      const diagCap = diag.caption[lang] || diag.caption.ru;
      const chartCap = diag.chartCaption[lang] || diag.chartCaption.ru;
      const legendItems = (diag.legend && (diag.legend[lang] || diag.legend.ru)) || [];
      const nodes = diag.nodes || [];

      const pt = sys.paramsTable;
      const ptCap = pt.caption[lang] || pt.caption.ru;
      const ptHeaders = pt.headers[lang] || pt.headers.ru;
      const ptRows = pt.rows[lang] || pt.rows.ru;

      const engDetails = sys.engineerLayers || sys.engineerDetails || [];
      const sysCases = getAllCases().filter((c) => c.systemId === sys.id);

      const guideData = (root.GUIDE_SECTIONS && root.GUIDE_SECTIONS[sys.id]) || { blocks: [] };
      const guideBlockMap = {};
      (guideData.blocks || []).forEach((b) => {
        guideBlockMap[b.key] = b;
      });

      const ruOnlyNoticeText = (root.I18N_UI && root.I18N_UI.UI_STRINGS && root.I18N_UI.UI_STRINGS[lang] && root.I18N_UI.UI_STRINGS[lang].guideRuOnlyNotice)
        || 'חומר הלימוד של הפרק הזה זמין כעת ברוסית. התרגום לעברית — בגרסה v14.1.';

      function renderBlockHeadingText(key) {
        const meta = GUIDE_TOC_META[key] || { fullRu: key, fullHe: key };
        const gb = guideBlockMap[key];
        if (!gb) {
          return isHe ? meta.fullHe : meta.fullRu;
        }
        const ruTitle = root.renderGuideMathHtml(gb.title?.ru || meta.fullRu);
        if (!isHe) {
          return ruTitle;
        }
        if (gb.title && gb.title.he) {
          return root.renderGuideMathHtml(gb.title.he, 'he');
        }
        return `${meta.fullHe} <span class="sec-term" dir="ltr" lang="ru">(${ruTitle})</span>`;
      }

      function renderGuideBlockBodyHtml(key) {
        const gb = guideBlockMap[key];
        if (!gb || !gb.html) return '';
        const bodyIdAttr = key === 'nodes' ? ` id="guide-body-${sys.id}-nodes"` : '';
        if (!isHe) {
          return `<div class="guide-block-body"${bodyIdAttr}>${root.renderGuideMathHtml(gb.html.ru || '')}</div>`;
        }
        if (gb.html.he) {
          return `<div class="guide-block-body"${bodyIdAttr}>${root.renderGuideMathHtml(gb.html.he, 'he')}</div>`;
        }
        return `
          <div class="guide-ru-only-notice" dir="rtl">${ruOnlyNoticeText}</div>
          <div class="sec-term guide-ru-fallback"${bodyIdAttr} dir="ltr" lang="ru">${root.renderGuideMathHtml(gb.html.ru || '')}</div>
        `;
      }

      const blockLineNumbers = [];
      (guideData.blocks || []).forEach((b) => {
        if (typeof b.sourceLineStart === 'number') blockLineNumbers.push(b.sourceLineStart);
        if (typeof b.sourceLineEnd === 'number') blockLineNumbers.push(b.sourceLineEnd);
        if (Array.isArray(b.sourceLines)) {
          b.sourceLines.forEach((n) => {
            if (typeof n === 'number') blockLineNumbers.push(n);
          });
        }
      });
      const minLine = blockLineNumbers.length ? Math.min(...blockLineNumbers) : 1;
      const maxLine = blockLineNumbers.length ? Math.max(...blockLineNumbers) : 1;
      const articleMetaText = isHe
        ? `מהדורה ${APP_VERSION.edition} · ${APP_VERSION.date} · ליבת חישוב ${APP_VERSION.core} · מקור הטקסט: <code dir="ltr">data/he/guide_${sys.id}.he.json</code>`
        : `Редакция ${APP_VERSION.edition} · ${APP_VERSION.date} · расчётное ядро ${APP_VERSION.core} · текст учебника: <code dir="ltr">${guideData.sourceFile || ''}</code>, строки ${minLine}–${maxLine}`;

      const lMap = root.LEARNING_MAP || {};
      const lUi = lMap.ui || {};
      const depthLabels = lMap.depthLabels || {};
      const isDetailedDepth = AppState.guideDepth === 'detailed';
      const depthGroupAria = (depthLabels.groupAriaLabel && (depthLabels.groupAriaLabel[lang] || depthLabels.groupAriaLabel.ru))
        || (isHe ? 'רמת הפירוט של ספר הלימוד' : 'Уровень подробности учебника');
      const depthSimpleLbl = (depthLabels.simple && (depthLabels.simple[lang] || depthLabels.simple.ru))
        || (isHe ? 'פשוט' : 'Просто');
      const depthDetailedLbl = (depthLabels.detailed && (depthLabels.detailed[lang] || depthLabels.detailed.ru))
        || (isHe ? 'מפורט' : 'Подробно');
      const depthHintLbl = (depthLabels.explanation && (depthLabels.explanation[lang] || depthLabels.explanation.ru))
        || (isHe ? 'מפורט: נוסחאות, הנחות יסוד וגבולות ישימות' : 'Подробно: формулы, допущения и границы применимости');
      const boundariesSummaryLbl = (depthLabels.boundariesSummary && (depthLabels.boundariesSummary[lang] || depthLabels.boundariesSummary.ru))
        || (isHe ? 'גבולות ישימות והנחות יסוד — רמת פירוט מלאה' : 'Границы применимости и допущения — подробный уровень');
      const formulasSummaryLbl = (depthLabels.formulasSummary && (depthLabels.formulasSummary[lang] || depthLabels.formulasSummary.ru))
        || (isHe ? 'נוסחאות ודוגמאות מספריות — רמת פירוט מלאה' : 'Формулы и численные примеры — подробный уровень');
      const stepsAriaLabel = (lUi.stepsAriaLabel && (lUi.stepsAriaLabel[lang] || lUi.stepsAriaLabel.ru))
        || (isHe ? 'רצף הלימוד בנושא' : 'Последовательность изучения');
      const firstCaseId = (sys.caseIds && sys.caseIds[0]) || (sysCases[0] && sysCases[0].id) || 'case-3-1';
      const stepPrimaryHrefMap = {
        principle: `#guide-${sys.id}-how`,
        diagram: `#diag-card-${sys.id}`,
        equipment: `#guide-body-${sys.id}-nodes`,
        parameters: `#guide-${sys.id}-logbook`,
        calculation: `#guide-${sys.id}-formulas`,
        case: `#guide-${sys.id}-symptoms`,
        selfcheck: `#guide-${sys.id}-selfcheck`,
        sources: `#guide-${sys.id}-sources`
      };
      const guideStepsArr = Array.isArray(lMap.steps) ? lMap.steps : [];
      const guideStepsHtml = guideStepsArr.map((st, idx) => {
        const stLabel = (st.label && (st.label[lang] || st.label.ru)) || st.key;
        let stCaption = (st.caption && (st.caption[lang] || st.caption.ru)) || '';
        if (st.key === 'equipment' && sys.id === 'air' && lUi.airIsoCaptionSuffix) {
          const suffix = lUi.airIsoCaptionSuffix[lang] || lUi.airIsoCaptionSuffix.ru || '';
          if (suffix) stCaption = `${stCaption} ${suffix}`;
        }
        const stHref = stepPrimaryHrefMap[st.key] || `#guide-${sys.id}-summary`;
        let secondLinkHtml = '';
        if (st.key === 'equipment' && sys.id === 'air') {
          const secLbl = (lUi.airIsoSecondLink && (lUi.airIsoSecondLink[lang] || lUi.airIsoSecondLink.ru)) || (isHe ? 'דרגות ISO 8573 ←' : 'Классы ISO 8573 →');
          secondLinkHtml = `<a class="guide-step-sublink" href="#guide-air-iso" onclick="window.navigateToHash('#guide-air-iso'); return false;">${secLbl}</a>`;
        } else if (st.key === 'calculation') {
          const secLbl = (lUi.calcSecondLink && (lUi.calcSecondLink[lang] || lUi.calcSecondLink.ru)) || (isHe ? 'פתיחת מחשבון ←' : 'Открыть калькулятор →');
          secondLinkHtml = `<a class="guide-step-sublink" href="#calc-${sys.id}" onclick="window.navigateToHash('#calc-${sys.id}'); return false;">${secLbl}</a>`;
        } else if (st.key === 'case') {
          const secLbl = (lUi.caseSecondLink && (lUi.caseSecondLink[lang] || lUi.caseSecondLink.ru)) || (isHe ? 'האירוע הראשון בנושא ←' : 'Первый случай темы →');
          secondLinkHtml = `<a class="guide-step-sublink" href="#${firstCaseId}" onclick="window.navigateToHash('#${firstCaseId}'); return false;">${secLbl}</a>`;
        }
        return `
          <li class="guide-step" data-step-key="${st.key}">
            <a class="guide-step-link" href="${stHref}" onclick="window.navigateToHash('${stHref}'); return false;">
              <span class="guide-step-top">
                <span class="guide-step-num">${st.n || (idx + 1)}</span>
                <span class="guide-step-label">${stLabel}</span>
              </span>
              <span class="guide-step-caption">${stCaption}</span>
            </a>
            ${secondLinkHtml}
          </li>
        `;
      }).join('');

      const sysSummary3Lines = {
        steam: {
          ru: [
            `<strong>Что за система:</strong> ${sys.shortSummary.ru}`,
            `<strong>Зачем нужна:</strong> Передача продукту скрытой теплоты конденсации (<span class="ltr-math">h_fg = h_g − h_f</span>) при постоянной температуре насыщения <span class="ltr-math">T_sat(P_abs)</span>.`,
            `<strong>Главная опасность и граница расчёта:</strong> В таблицы пара подставляется только абсолютное давление <span class="ltr-math">P_bara = P_barg + 1.013 бар</span>; без переохлаждения конденсата полезное тепло равно <span class="ltr-math">x · h_fg</span> (при переохлаждении на <span class="ltr-math">ΔT_sub</span> добавляется <span class="ltr-math">c_p,f · ΔT_sub</span>). При гидроударах резкое открытие вентилей запрещено — вскрытие только по <code>LOTO</code> при <code>0 бар изб.</code>`
          ],
          he: [
            `<strong>מהי המערכת:</strong> ${sys.shortSummary.he}`,
            `<strong>למה היא משמשת:</strong> מסירת חום כמוס של עיבוי (<span class="ltr-math">h_fg = h_g − h_f</span>) למוצר בטמפרטורת רוויה קבועה <span class="ltr-math">T_sat(P_abs)</span>.`,
            `<strong>סכנה עיקרית וגבול חישוב:</strong> בטבלאות קיטור מציבים תמיד לחץ מוחלט <span class="ltr-math">P_bara = P_barg + 1.013 bar</span>; ללא קירור-יתר החום השימושי הוא <span class="ltr-math">x · h_fg</span> (בקירור-יתר של <span class="ltr-math">ΔT_sub</span> נוסף <span class="ltr-math">c_p,f · ΔT_sub</span>). בהופעת הלמי מים אסור לפתוח מגופים בפתאומיות — עבודה רק תחת <code>LOTO</code> ב-<code>0 barg</code>.`
          ]
        },
        condensate: {
          ru: [
            `<strong>Что за система:</strong> ${sys.shortSummary.ru}`,
            `<strong>Зачем нужна:</strong> Непрерывный отвод конденсата из аппаратов без проскока пара и возврат горячей чистой воды и тепла в котельную.`,
            `<strong>Главная опасность и граница расчёта:</strong> При сбросе конденсата из <span class="ltr-math">P₁</span> в <span class="ltr-math">P₂ &lt; P₁</span> часть массы мгновенно вскипает во вторичный пар (<span class="ltr-math">x_flash</span>); двухфазный поток вызывает гидроудары — ревизия КО и насосов только по <code>LOTO</code>.`
          ],
          he: [
            `<strong>מהי המערכת:</strong> ${sys.shortSummary.he}`,
            `<strong>למה היא משמשת:</strong> פינוי רציף של עיבוי ממתקני החימום ללא בריחת קיטור חי והחזרת מים חמים ונקיים לדוד.`,
            `<strong>סכנה עיקרית וגבול חישוב:</strong> בפריקת עיבוי מ-<span class="ltr-math">P₁</span> ל-<span class="ltr-math">P₂ &lt; P₁</span> חלק מהמסה הופך מיד לקיטור הבזקה (<span class="ltr-math">x_flash</span>); זרימה דו-פאזית גורמת להלמי מים — פירוק מלכודות ומשאבות רק תחת <code>LOTO</code>.`
          ]
        },
        chillers: {
          ru: [
            `<strong>Что за система:</strong> ${sys.shortSummary.ru}`,
            `<strong>Зачем нужна:</strong> Отвод тепла от технологических линий и поддержание уставки <span class="ltr-math">Cool LWT</span> (<span class="ltr-math">+7 °C</span> на воде или ниже <span class="ltr-math">0 °C</span> на гликоле).`,
            `<strong>Главная опасность и граница расчёта:</strong> Падение протока через испаритель грозит заморозкой и разрывом трубок, а рост подхода конденсатора <span class="ltr-math">ΔT_app,cond</span> ведёт к аварии по высокому давлению; химчистка и электроработы — строго по <code>LOTO</code>.`
          ],
          he: [
            `<strong>מהי המערכת:</strong> ${sys.shortSummary.he}`,
            `<strong>למה היא משמשת:</strong> סילוק חום מקווי הייצור ושמירה על טמפרטורת יציאה יציבה <span class="ltr-math">Cool LWT</span> (<span class="ltr-math">+7 °C</span> במים או מתחת ל-<span class="ltr-math">0 °C</span> בגליקול).`,
            `<strong>סכנה עיקרית וגבול חישוב:</strong> צניחת ספיקה במאייד עלולה להקפיא ולבקע צינורות, ועליית <span class="ltr-math">ΔT_app,cond</span> במעבה גורמת לניתוק בלחץ ראש גבוה; ניקוי כימי ועבודות חשמל רק תחת <code>LOTO</code>.`
          ]
        },
        air: {
          ru: [
            `<strong>Что за система:</strong> ${sys.shortSummary.ru}`,
            `<strong>Зачем нужна:</strong> Снабжение пневмоклапанов, цилиндров и автоматов фасовки сухим и чистым сжатым воздухом (<span class="ltr-math">7 бар изб.</span>).`,
            `<strong>Главная опасность и граница расчёта:</strong> Байпас осушителя или отказ дренажа заливает автоматику водой, а утечки сжигают 20–30% электроэнергии компрессорной; отсоединение пневмолиний под давлением запрещено (<code>LOTO</code>).`
          ],
          he: [
            `<strong>מהי המערכת:</strong> ${sys.shortSummary.he}`,
            `<strong>למה היא משמשת:</strong> אספקת אוויר דחוס יבש ונקי (<span class="ltr-math">7 barg</span>) לשסתומים פנאומטיים, בוכנות ומכונות אריזה.`,
            `<strong>סכנה עיקרית וגבול חישוב:</strong> מעקף מייבש או תקלה בניקוז מציפים את הפיקוד במים, ודליפות ברשת מבזבזות 20–30% מחשמל המדחסים; פירוק צנרת תחת לחץ אסור בהחלט (<code>LOTO</code>).`
          ]
        },
        ro: {
          ru: [
            `<strong>Что за система:</strong> ${sys.shortSummary.ru}`,
            `<strong>Зачем нужна:</strong> Глубокое обессоливание воды (<span class="ltr-math">Recovery Y ≈ 75%</span>, селективность <span class="ltr-math">&gt; 98%</span>) для паровых котлов и технологических нужд.`,
            `<strong>Главная опасность и граница расчёта:</strong> Превышение давления пермеата над концентратом (<span class="ltr-math">P_p − P_c &gt; 0.3 бар</span>) расслаивает мембраны, а решение о CIP-мойке принимается только после нормализации NPF по <code>Eq. 72</code>; работа с реагентами и насосом ВД — по <code>LOTO</code>.`
          ],
          he: [
            `<strong>מהי המערכת:</strong> ${sys.shortSummary.he}`,
            `<strong>למה היא משמשת:</strong> התפלת מים עמוקה (<span class="ltr-math">Recovery Y ≈ 75%</span>, דחיית מלחים <span class="ltr-math">&gt; 98%</span>) להזנת דודי קיטור ולתהליכי ייצור.`,
            `<strong>סכנה עיקרית וגבול חישוב:</strong> לחץ נגדי של פרמיאט מעל הרכז (<span class="ltr-math">P_p − P_c &gt; 0.3 bar</span>) הורס את הממברנות, והחלטה על שטיפת CIP מתקבלת רק לאחר נרמול NPF לפי <code>Eq. 72</code>; עבודה עם כימיקלים ומשאבת לחץ גבוה רק תחת <code>LOTO</code>.`
          ]
        }
      };
      const lines3 = (sysSummary3Lines[sys.id] && (sysSummary3Lines[sys.id][lang] || sysSummary3Lines[sys.id].ru)) || [];

      const tocKeys = sys.id === 'air'
        ? ['summary', 'how', 'nodes', 'iso', 'logbook', 'relations', 'symptoms', 'boundaries', 'formulas', 'selfcheck', 'sources']
        : ['summary', 'how', 'nodes', 'logbook', 'relations', 'symptoms', 'boundaries', 'formulas', 'selfcheck', 'sources'];

      const modLinksMap = {
        steam: [
          { hash: '#calc-5a', ru: '🧮 Модуль 5А: Перевод давления (изб. ⇄ абс.)', he: '🧮 מודול 5א: המרת לחץ (יחסי ⇄ מוחלט)' },
          { hash: '#calc-5b', ru: '🧮 Модуль 5Б: Расход пара по тепловой нагрузке', he: '🧮 מודול 5ב: ספיקת קיטור לפי עומס חום' }
        ],
        condensate: [
          { hash: '#calc-1a', ru: '🧮 Модуль 1А: Потери и возврат конденсата', he: '🧮 מודול 1א: הפסדים והחזרת עיבוי' },
          { hash: '#calc-1b', ru: '🧮 Модуль 1Б: Вторичный пар вскипания и ресивер TLV', he: '🧮 מודול 1ב: קיטור משני ומכל TLV' }
        ],
        chillers: [
          { hash: '#calc-2', ru: '🧮 Модуль 2: Чиллеры (Вода / Гликоль • Approach • COP)', he: '🧮 מודול 2: צ\'ילרים (מים / גליקול • Approach • COP)' }
        ],
        air: [
          { hash: '#calc-3a', ru: '🧮 Модуль 3А: Пересчёт расхода воздуха (Nl/s ⇄ FAD)', he: '🧮 מודול 3א: המרת ספיקת אוויר (NL/s ⇄ FAD)' },
          { hash: '#calc-3b', ru: '🧮 Модуль 3Б: Оценка утечек сжатого воздуха', he: '🧮 מודול 3ב: הערכת דליפות אוויר דחוס' },
          { hash: '#calc-3c', ru: '🧮 Модуль 3В: Выпадение влаги при сжатии и осушке', he: '🧮 מודול 3ג: התעבות לחות בדחיסה ובייבוש' }
        ],
        ro: [
          { hash: '#calc-4a', ru: '🧮 Модуль 4А: Баланс потоков и селективность RO', he: '🧮 מודול 4א: מאזן ספיקות ודחיית מלחים RO' },
          { hash: '#calc-4b', ru: '🧮 Модуль 4Б: Нормализация пермеата RO по Eq. 72', he: '🧮 מודול 4ב: נרמול ספיקת פרמיאט לפי Eq. 72' }
        ]
      };

      const scBlock = guideBlockMap.selfcheck;
      const scQuestions = (scBlock && scBlock.questions) || [];
      const scAllHe = scQuestions.length > 0 && scQuestions.every((qItem) =>
        qItem.q && qItem.q.he && qItem.q.he.trim() && qItem.a && qItem.a.he && qItem.a.he.trim()
      );
      const selfCheckListHtml = scQuestions.map((qItem) => {
        const qHtml = (qItem.q && (qItem.q[lang] || qItem.q.ru)) || '';
        const aHtml = (qItem.a && (qItem.a[lang] || qItem.a.ru)) || '';
        const scMathLang = isHe && scAllHe ? 'he' : 'ru';
        return `
        <div class="selfcheck-question-card" data-question-num="${qItem.n}">
          <div class="selfcheck-q-text"><strong>${qItem.n}.</strong> ${root.renderGuideMathHtml(qHtml, scMathLang)}</div>
          <details class="selfcheck-answer" ontoggle="window.syncSelfCheckToggleBtn('${sys.id}')">
            <summary>${isHe ? 'הצג תשובה' : 'Показать ответ'}</summary>
            <div class="selfcheck-a-text">${root.renderGuideMathHtml(aHtml, scMathLang)}</div>
          </details>
        </div>
      `;
      }).join('');

      return `
        <article class="section-card system-article searchable-block ${isCurrent ? 'active-system-article' : ''}"
          id="system-${sys.id}" data-guide-depth="${AppState.guideDepth}" data-legacy-anchor="${sys.legacyAnchor}" data-keywords="${sys.keywords || ''}">
          <span id="sys-${sys.id}" class="legacy-anchor-target"></span>
          ${sys.id === 'steam' ? '<span id="sec-steam-condensate" class="legacy-anchor-target"></span>' : ''}
          ${sys.id === 'chillers' ? '<span id="sec-chillers" class="legacy-anchor-target"></span>' : ''}
          ${sys.id === 'air' ? '<span id="sec-air" class="legacy-anchor-target"></span>' : ''}
          ${sys.id === 'ro' ? '<span id="sec-ro" class="legacy-anchor-target"></span>' : ''}

          <div class="system-article-header">
            <div style="display:flex; align-items:flex-start; gap:0.75rem;">
              <span class="system-article-svg-badge" style="background:${getSystemVisualMeta(sys.id).bg}; color:${getSystemVisualMeta(sys.id).fg};">
                ${getSystemVisualMeta(sys.id).svg}
              </span>
              <div style="flex:1; min-width:0;">
                <h2 id="system-heading-${sys.id}" tabindex="-1">${title}</h2>
                <div class="sec-term system-sec-subtitle" dir="${isHe ? 'ltr' : 'rtl'}">${secTitle}</div>
                <p class="system-article-meta">${articleMetaText}</p>
              </div>
            </div>
            <div class="guide-depth-toggle no-print" role="group" aria-label="${depthGroupAria}">
              <div class="guide-depth-btn-row">
                <button type="button" class="guide-depth-btn ${!isDetailedDepth ? 'active' : ''}" data-depth="simple" aria-pressed="${!isDetailedDepth ? 'true' : 'false'}" onclick="window.setGuideDepth('simple')">${depthSimpleLbl}</button>
                <button type="button" class="guide-depth-btn ${isDetailedDepth ? 'active' : ''}" data-depth="detailed" aria-pressed="${isDetailedDepth ? 'true' : 'false'}" onclick="window.setGuideDepth('detailed')">${depthDetailedLbl}</button>
              </div>
              <span class="guide-depth-hint">${depthHintLbl}</span>
            </div>
          </div>

          <nav class="guide-steps-strip no-print" id="guide-steps-${sys.id}" aria-label="${stepsAriaLabel}">
            <ol class="guide-steps-list">
              ${guideStepsHtml}
            </ol>
          </nav>

          <!-- ЛИПКОЕ ОГЛАВЛЕНИЕ СИСТЕМЫ (10 ПУНКТОВ, ВОЗДУХ — 11 С ISO 8573) -->
          <nav class="guide-toc-bar no-print" id="guide-toc-${sys.id}" aria-label="${isHe ? 'תוכן עניינים של המערכת' : 'Оглавление системы'}">
            ${tocKeys.map((k, idx) => {
              const meta = GUIDE_TOC_META[k] || { ru: k, he: k };
              return `
                <button type="button"
                  class="guide-toc-btn ${idx === 0 ? 'active' : ''}"
                  data-toc-sys="${sys.id}"
                  data-toc-key="${k}"
                  ${idx === 0 ? 'aria-current="true"' : ''}
                  onclick="window.navigateToHash('#guide-${sys.id}-${k}')">
                  ${isHe ? meta.he : meta.ru}
                </button>
              `;
            }).join('')}
          </nav>

          <!-- БЛОК 1: summary (Коротко: shortSummary + purposeHtml) -->
          <section class="guide-textbook-block" id="guide-${sys.id}-summary" data-guide-key="summary">
            <h2 class="guide-block-h2" id="guide-heading-${sys.id}-summary" tabindex="-1">${renderBlockHeadingText('summary')}</h2>
            <div class="system-short-summary-box">
              ${lines3.map((line) => `<p class="system-short-summary-line">${line}</p>`).join('')}
            </div>
            <div class="system-purpose-block" id="details-purpose-${sys.id}">
              <h3>${isHe ? 'א. ייעוד המערכת בשפה פשוטה וכללי בטיחות קריטיים' : 'А. Назначение системы простым языком и правила безопасности'}</h3>
              ${purpose}
            </div>
          </section>

          <!-- БЛОК 2: how (Как работает: principleHtml + гайд how) -->
          <section class="guide-textbook-block" id="guide-${sys.id}-how" data-guide-key="how">
            <h2 class="guide-block-h2" id="guide-heading-${sys.id}-how" tabindex="-1">${renderBlockHeadingText('how')}</h2>
            <div class="system-principle-block" id="details-principle-${sys.id}">
              <h3>${isHe ? 'ב. עקרון פעולה ומסלול הזרימה מנקודה לנקודה' : 'Б. Принцип работы и путь рабочей среды от входа до выхода'}</h3>
              ${principle}
            </div>
            ${renderGuideBlockBodyHtml('how')}
          </section>

          <!-- БЛОК 3: nodes (Узлы и схема: #diag-card-<sysId> + гайд nodes) -->
          <section class="guide-textbook-block" id="guide-${sys.id}-nodes" data-guide-key="nodes">
            <h2 class="guide-block-h2" id="guide-heading-${sys.id}-nodes" tabindex="-1">${renderBlockHeadingText('nodes')}</h2>
            <div class="interactive-diagram-card" id="diag-card-${sys.id}">
              <div class="diagram-toolbar no-print">
                <strong>${isHe ? 'ג. תרשים זרימה אינטראקטיבי (לחצו על צומת 1–10 לפתיחת כרטיס הסבר):' : 'В. Интерактивная технологическая схема (нажмите на узел 1–10 для открытия карточки):'}</strong>
                <div class="diagram-controls">
                  <button type="button" class="btn btn-outline btn-sm" onclick="window.adjustDiagramZoom('${sys.id}', -15)" aria-label="${isHe ? 'הקטנת תרשים' : 'Уменьшить схему'}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg> −</button>
                  <button type="button" class="btn btn-outline btn-sm" onclick="window.adjustDiagramZoom('${sys.id}', 0)">100%</button>
                  <button type="button" class="btn btn-outline btn-sm" onclick="window.adjustDiagramZoom('${sys.id}', 15)" aria-label="${isHe ? 'הגדלת תרשים' : 'Увеличить схему'}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg> +</button>
                  <button type="button" class="btn btn-outline btn-sm" onclick="window.toggleDiagramFlow('${sys.id}')">
                    ${AppState.diagramFlowAnim
                      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> ${isHe ? 'עצירת אנימציית זרימה' : 'Стоп анимации потока'}`
                      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="vertical-align:-2px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> ${isHe ? 'הפעלת אנימציית זרימה' : 'Анимация потока'}`}
                  </button>
                  <button type="button" class="btn btn-primary btn-sm" onclick="window.openFullscreenDiagram('${sys.id}', this)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg> ${isHe ? 'מסך מלא' : 'На весь экран'}
                  </button>
                </div>
              </div>

              <div class="diagram-legend">
                ${legendItems.map((l) => {
                  const cleanLabel = String(l.label || '').replace(/^(?:[\u{1F534}-\u{1F537}\u{1F7E0}-\u{1F7EB}\u26AA\u26AB]\s*)+/u, '').trim();
                  return `
                  <span class="legend-item">
                    <span class="legend-swatch" style="background:${l.color};"></span>
                    <span>${cleanLabel}</span>
                  </span>
                  `;
                }).join('')}
              </div>

              <div class="diagram-viewport ${AppState.diagramFlowAnim ? 'flow-anim-on' : ''}" id="diag-viewport-${sys.id}">
                <div class="diagram-canvas-inner" id="diag-inner-${sys.id}" style="width:${AppState.diagramZoom}%;" dir="ltr">
                  <img src="${svgSrc}" alt="${diagCap}" class="diagram-svg-img" loading="lazy" />
                  <div class="diagram-hotspots-layer" dir="ltr">
                    ${nodes.map((n) => {
                      const rawPinTitle = (n.title[lang] || n.title.ru);
                      const cleanPinTitle = (isHe ? rawPinTitle.replace(/\s*\/\s*[А-Яа-яЁё][^)]*/g, '') : rawPinTitle).replace(/"/g, '&quot;');
                      return `
                      <button type="button" class="diagram-node-pin"
                        id="${n.id}"
                        data-node-id="${n.id}"
                        style="left:${n.xPct}%; top:${n.yPct}%;"
                        onclick="window.openDiagramNodeModal('${sys.id}', '${n.id}', this)"
                        aria-label="${cleanPinTitle}"
                        title="${cleanPinTitle}">
                        <span>${n.num}</span>
                      </button>
                    `;
                    }).join('')}
                  </div>
                </div>
              </div>
              <p class="diagram-caption">${diagCap}</p>

              <div class="diagram-nodes-seq-box">
                <h4>${isHe ? 'רשימת 10 צמתי המערכת (גישה מהירה מהנייד ומהמקלדת — לחצו לפתיחת כרטיס הצומת):' : 'Последовательный список 10 узлов схемы (удобно для телефона и клавиатуры — нажмите для карточки узла):'}</h4>
                <div class="diagram-nodes-grid">
                  ${nodes.map((n) => {
                    const rawNodeTitle = (n.title[lang] || n.title.ru).replace(/^\d+\.\s*/, '');
                    const formattedNodeTitle = isHe
                      ? rawNodeTitle.replace(/\s*\/\s*([А-Яа-яЁё][^)]*)\)/g, '<span class="sec-term"> / $1</span>)')
                      : rawNodeTitle;
                    return `
                    <button type="button" class="diagram-node-list-btn"
                      onclick="window.openDiagramNodeModal('${sys.id}', '${n.id}', this)">
                      <span class="node-badge-num">${n.num}</span>
                      <span class="node-badge-title">${formattedNodeTitle}</span>
                    </button>
                    `;
                  }).join('')}
                </div>
              </div>

              ${diag.chartPath ? `
                <details class="diagram-chart-details">
                  <summary>${isHe ? 'פתיחת גרף הנדסי משלים למערכת זו' : 'Показать сопутствующий инженерный график процесса'}</summary>
                  <div class="chart-box">
                    <img src="${diag.chartPath}" alt="${chartCap}" class="diagram-svg-img" loading="lazy" />
                    <p class="diagram-caption">${chartCap}</p>
                  </div>
                </details>
              ` : ''}
            </div>
            ${renderGuideBlockBodyHtml('nodes')}
          </section>

          ${sys.id === 'air' ? `
          <!-- БЛОК 3а: iso (только воздух: Классы чистоты воздуха ISO 8573-1) -->
          <section class="guide-textbook-block" id="guide-air-iso" data-guide-key="iso">
            <h2 class="guide-block-h2" id="guide-heading-air-iso" tabindex="-1">${renderBlockHeadingText('iso')}</h2>
            ${renderGuideBlockBodyHtml('iso')}
          </section>
          ` : ''}

          <!-- БЛОК 4: logbook (Что записывать в журнал + кнопка к #<logId>) -->
          <section class="guide-textbook-block" id="guide-${sys.id}-logbook" data-guide-key="logbook">
            <h2 class="guide-block-h2" id="guide-heading-${sys.id}-logbook" tabindex="-1">${renderBlockHeadingText('logbook')}</h2>
            ${renderGuideBlockBodyHtml('logbook')}
            <div class="guide-block-actions no-print">
              <a class="btn btn-primary btn-sm" href="#${sys.logId}">${isHe ? 'יומן משמרת A4 ←' : 'Перейти к сменному журналу A4 →'}</a>
            </div>
          </section>

          <!-- БЛОК 5: relations (Как связаны показатели + таблица параметров #params-table-<sysId>) -->
          <section class="guide-textbook-block" id="guide-${sys.id}-relations" data-guide-key="relations">
            <h2 class="guide-block-h2" id="guide-heading-${sys.id}-relations" tabindex="-1">${renderBlockHeadingText('relations')}</h2>
            ${renderGuideBlockBodyHtml('relations')}
            <div class="system-params-open-wrap" id="details-params-${sys.id}">
              <div class="system-table-section" id="params-table-${sys.id}">
                <h3 id="params-heading-${sys.id}" tabindex="-1">${isHe ? 'ד. מה המפעיל רואה בשטח, טעויות מדידה נפוצות והפרדת סמכויות (LOTO)' : 'Г. Таблица наблюдаемых параметров, типичные ошибки измерения и разграничение (Оператор vs LOTO)'}</h3>
                <div class="table-wrapper" tabindex="0" role="region" aria-label="${ptCap}">
                  <table>
                    <caption>${ptCap}</caption>
                    <thead>
                      <tr>
                        ${ptHeaders.map((h) => `<th>${h}</th>`).join('')}
                      </tr>
                    </thead>
                    <tbody>
                      ${ptRows.map((row) => `
                        <tr>
                          ${row.map((cell, idx) => idx === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`).join('')}
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <!-- БЛОК 6: symptoms (Признаки и причины + ссылки на caseIds + кнопка «Описать признак →» на #problem) -->
          <section class="guide-textbook-block" id="guide-${sys.id}-symptoms" data-guide-key="symptoms">
            <h2 class="guide-block-h2" id="guide-heading-${sys.id}-symptoms" tabindex="-1">${renderBlockHeadingText('symptoms')}</h2>
            ${renderGuideBlockBodyHtml('symptoms')}
            <div class="system-linked-resources no-print">
              <h3>${isHe ? 'אירועי אמת לתרגול במערכת זו:' : 'Производственные случаи для тренировки по этой системе:'}</h3>
              <div class="system-cases-preview-grid">
                ${sysCases.map((rawCase) => {
                  const nc = normalizeCase(rawCase, lang);
                  const prog = getCaseProgress(nc.id);
                  const cMeta = getSystemVisualMeta(sys.id);
                  return `
                    <div class="case-preview-card">
                      <div class="case-preview-top">
                        <span class="case-code-badge" style="background:${cMeta.bg}; color:${cMeta.fg};">${isHe ? `אירוע ${nc.code}` : `Случай ${nc.code}`}</span>
                        <span class="case-status-badge ${prog.completed ? 'done' : ''}">
                          ${prog.completed ? (isHe ? '✓ הושלם' : '✓ Разобрано') : (isHe ? '6 שלבים אינטראקטיביים' : '6 интерактивных шагов')}
                        </span>
                      </div>
                      <h4>${nc.title}</h4>
                      <a class="btn btn-primary btn-sm" href="#${nc.id}">
                        ${isHe ? `פתיחת אירוע ${nc.code} בסימולטור ←` : `Разобрать случай ${nc.code} в тренажёре →`}
                      </a>
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="guide-block-actions" style="margin-block-start:0.85rem;">
                <a class="btn btn-outline btn-sm" href="#problem">${isHe ? 'תיאור תסמין ←' : 'Описать признак →'}</a>
              </div>
            </div>
          </section>

          <!-- БЛОК 7: boundaries (Что можно оператору, когда звать специалиста) -->
          <section class="guide-textbook-block" id="guide-${sys.id}-boundaries" data-guide-key="boundaries">
            <h2 class="guide-block-h2" id="guide-heading-${sys.id}-boundaries" tabindex="-1">${renderBlockHeadingText('boundaries')}</h2>
            <details class="guide-depth-details" id="depth-${sys.id}-boundaries"${isDetailedDepth ? ' open' : ''}>
              <summary class="guide-depth-summary">${boundariesSummaryLbl}</summary>
              ${renderGuideBlockBodyHtml('boundaries')}
            </details>
          </section>

          <!-- БЛОК 8: formulas (Формулы на учебных примерах + engineerLayers <details> + кнопка к #calc-<sysId>) -->
          <section class="guide-textbook-block" id="guide-${sys.id}-formulas" data-guide-key="formulas">
            <h2 class="guide-block-h2" id="guide-heading-${sys.id}-formulas" tabindex="-1">${renderBlockHeadingText('formulas')}</h2>
            <div class="guide-block-actions no-print" style="margin-block-start:0.5rem;">
              <a class="btn btn-primary btn-sm" href="#calc-${sys.id}">${isHe ? 'מחשבון המערכת ←' : 'Перейти к расчёту системы →'}</a>
            </div>
            <div class="system-calc-modules-bar no-print" style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-block-start:0.65rem; margin-block-end:0.75rem;">
              ${(modLinksMap[sys.id] || []).map((m) => `
                <a class="btn btn-outline btn-sm system-calc-module-link" href="${m.hash}">${isHe ? m.he : m.ru}</a>
              `).join('')}
            </div>
            <details class="guide-depth-details" id="depth-${sys.id}-formulas"${isDetailedDepth ? ' open' : ''}>
              <summary class="guide-depth-summary">${formulasSummaryLbl}</summary>
              ${renderGuideBlockBodyHtml('formulas')}
              <div class="system-engineer-layer">
                <h3>${isHe ? 'ו. רובד הנדסי מעמיק: נוסחאות, גבולות ישימות ומקורות ראשוניים מאומתים' : 'Е. Инженерный уровень: расчётные формулы, допущения и первоисточники с номерами страниц'}</h3>
                ${engDetails.map((ed, edIdx) => {
                  const sumObj = ed.title || ed.summary || {};
                  const bodyObj = ed.bodyHtml || ed.contentHtml || {};
                  const safeEdId = ed.id || (engDetails.length === 1 ? `engineer-details-${sys.id}` : `engineer-details-${sys.id}-${edIdx}`);
                  return `
                    <details class="engineer-details" id="${safeEdId}">
                      <summary>🔬 ${sumObj[lang] || sumObj.ru || ''}</summary>
                      <div class="engineer-details-body">
                        ${bodyObj[lang] || bodyObj.ru || ''}
                      </div>
                    </details>
                  `;
                }).join('')}
              </div>
            </details>
          </section>

          <!-- БЛОК 9: selfcheck (Проверь себя: вопросы и ответы в <details class="selfcheck-answer">) -->
          <section class="guide-textbook-block" id="guide-${sys.id}-selfcheck" data-guide-key="selfcheck">
            <h2 class="guide-block-h2" id="guide-heading-${sys.id}-selfcheck" tabindex="-1">${renderBlockHeadingText('selfcheck')}</h2>
            <div class="selfcheck-toolbar no-print">
              <button type="button" class="btn btn-outline btn-sm selfcheck-toggle-all-btn"
                id="selfcheck-toggle-btn-${sys.id}"
                data-sys-id="${sys.id}"
                data-all-open="false"
                onclick="window.toggleAllSelfCheckAnswers('${sys.id}', this)">
                ${isHe ? 'הצג את כל התשובות' : 'Показать все ответы'}
              </button>
            </div>
            ${isHe && !scAllHe ? `
              <div class="guide-ru-only-notice" dir="rtl">${ruOnlyNoticeText}</div>
              <div class="sec-term guide-ru-fallback selfcheck-questions-list" dir="ltr" lang="ru">
                ${selfCheckListHtml}
              </div>
            ` : `
              <div class="selfcheck-questions-list">
                ${selfCheckListHtml}
              </div>
            `}
          </section>

          <!-- БЛОК 10: sources (Источники раздела + ссылки #source-Sдд) -->
          <section class="guide-textbook-block" id="guide-${sys.id}-sources" data-guide-key="sources">
            <h2 class="guide-block-h2" id="guide-heading-${sys.id}-sources" tabindex="-1">${renderBlockHeadingText('sources')}</h2>
            ${renderGuideBlockBodyHtml('sources')}
          </section>
        </article>
      `;
    }).join('');

    container.innerHTML = tabsHtml + sectionsHtml;
    systems.forEach((sys) => {
      root.setActiveGuideTocKey(sys.id, 'summary');
    });
    setupGuideTocObserver();
  }

  // =========================================================================
  // INTERACTIVE DIAGRAM MODAL & CONTROLS
  // =========================================================================
  root.adjustDiagramZoom = function (sysId, delta) {
    if (delta === 0) {
      AppState.diagramZoom = 100;
    } else {
      AppState.diagramZoom = Math.max(70, Math.min(190, AppState.diagramZoom + delta));
    }
    const inner = document.getElementById(`diag-inner-${sysId}`);
    if (inner) inner.style.width = `${AppState.diagramZoom}%`;
  };

  root.toggleDiagramFlow = function (sysId) {
    AppState.diagramFlowAnim = !AppState.diagramFlowAnim;
    renderSystemsSection();
  };

  root.openDiagramNodeModal = function (sysId, nodeId, triggerEl, fromFullscreen) {
    const lang = AppState.lang;
    const isHe = lang === 'he';
    const sys = getSystemsMap()[sysId];
    if (!sys || !sys.diagram || !sys.diagram.nodes) return;
    const node = sys.diagram.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const dlg = document.getElementById('diagram-node-dialog');
    const content = document.getElementById('diagram-node-dialog-body') || document.getElementById('node-dialog-body');
    const titleEl = document.getElementById('node-dialog-title');
    const closeBtn = document.getElementById('node-dialog-close-btn');
    if (!dlg || !content) return;

    const candTrigger = triggerEl || document.activeElement;
    if (candTrigger && !dlg.contains(candTrigger)) {
      lastDialogTriggerEl = candTrigger;
    }

    const pick = (o) => (o && (o[lang] || o.ru)) || '';
    if (titleEl) titleEl.textContent = `${node.num}. ${pick(node.title).replace(/^\d+\.\s*/, '')}`;
    if (closeBtn) closeBtn.textContent = isHe ? 'סגירה ✕' : 'Закрыть ✕';
    content.innerHTML = `
      <div class="node-modal-grid">
        <div class="node-field-box">
          <strong>1. ${isHe ? 'מהו הרכיב:' : 'Что это за узел:'}</strong>
          <p>${pick(node.whatIs)}</p>
        </div>
        <div class="node-field-box">
          <strong>2. ${isHe ? 'תפקיד הרכיב במערכת:' : 'Зачем он нужен в системе:'}</strong>
          <p>${pick(node.purpose)}</p>
        </div>
        <div class="node-field-box">
          <strong>3. ${isHe ? 'מה המפעיל בודק במשמרת:' : 'За чем наблюдает оператор:'}</strong>
          <p>${pick(node.operatorWatches)}</p>
        </div>
        <div class="node-field-box">
          <strong>4. ${isHe ? 'פרמטרים ויחידות מידה קשורים:' : 'Связанные параметры и единицы измерения:'}</strong>
          <p>${pick(node.paramsUnits)}</p>
        </div>
        <div class="node-field-box node-safety-box">
          <strong>5. ${isHe ? 'בטיחות ונוהל LOTO:' : 'Безопасность и процедура LOTO:'}</strong>
          <p>${pick(node.safetyLoto)}</p>
        </div>
      </div>
      <div class="node-modal-actions">
        ${fromFullscreen ? `<button type="button" class="btn btn-outline btn-sm" onclick="window.openFullscreenDiagram('${sys.id}')">⛶ ${isHe ? 'חזרה לתרשים מסך מלא' : 'Назад к полноэкранной схеме'}</button>` : ''}
        ${node.caseId ? `<a class="btn btn-primary btn-sm" href="#${node.caseId}" onclick="document.getElementById('diagram-node-dialog').close()">${isHe ? 'מעבר לאירוע קשור' : 'Перейти к связанному случаю'}</a>` : ''}
        <a class="btn btn-outline btn-sm" href="#calc-${sys.id}" onclick="document.getElementById('diagram-node-dialog').close()">${isHe ? 'פתיחת מחשבון המערכת' : 'Открыть калькулятор раздела'}</a>
        <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('diagram-node-dialog').close()">✕ ${isHe ? 'סגירה' : 'Закрыть'}</button>
      </div>
    `;
    if (!dlg.open) {
      if (typeof dlg.showModal === 'function') {
        dlg.showModal();
      } else {
        dlg.setAttribute('open', '');
      }
    }
  };

  root.openFullscreenDiagram = function (sysId, triggerEl) {
    const lang = AppState.lang;
    const isHe = lang === 'he';
    const sys = getSystemsMap()[sysId];
    if (!sys || !sys.diagram) return;
    const dlg = document.getElementById('diagram-node-dialog');
    const content = document.getElementById('diagram-node-dialog-body') || document.getElementById('node-dialog-body');
    const titleEl = document.getElementById('node-dialog-title');
    const closeBtn = document.getElementById('node-dialog-close-btn');
    if (!dlg || !content) return;

    const candTrigger = triggerEl || document.activeElement;
    if (candTrigger && !dlg.contains(candTrigger)) {
      lastDialogTriggerEl = candTrigger;
    }

    const diag = sys.diagram;
    const svgSrc = isHe ? (diag.svgPathHe || diag.svgPath) : (diag.svgPathRu || diag.svgPath);
    const cap = diag.caption[lang] || diag.caption.ru;
    const nodes = diag.nodes || [];
    if (titleEl) titleEl.textContent = sys.title[lang] || sys.title.ru;
    if (closeBtn) closeBtn.textContent = isHe ? 'סגירה ✕' : 'Закрыть ✕';

    content.innerHTML = `
      <div class="diagram-viewport" style="max-block-size:74vh;">
        <div class="diagram-canvas-inner" id="diag-fullscreen-inner-${sys.id}" style="width:100%;" dir="ltr">
          <img src="${svgSrc}" alt="${cap}" class="diagram-svg-img" />
          <div class="diagram-hotspots-layer" dir="ltr">
            ${nodes.map((n) => `
              <button type="button" class="diagram-node-pin"
                data-node-id="${n.id}"
                style="left:${n.xPct}%; top:${n.yPct}%;"
                onclick="window.openDiagramNodeModal('${sys.id}', '${n.id}', this, true)"
                aria-label="${(n.title[lang] || n.title.ru).replace(/"/g, '&quot;')}"
                title="${(n.title[lang] || n.title.ru).replace(/"/g, '&quot;')}">
                <span>${n.num}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
      <p class="diagram-caption">${cap}</p>
      <div class="node-modal-actions">
        <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('diagram-node-dialog').close()">✕ ${isHe ? 'סגירת מסך מלא' : 'Закрыть полноэкранный режим'}</button>
      </div>
    `;
    if (!dlg.open) {
      if (typeof dlg.showModal === 'function') {
        dlg.showModal();
      } else {
        dlg.setAttribute('open', '');
      }
    }
  };

  // =========================================================================
  // RENDERING: 6-STEP INTERACTIVE DIAGNOSTIC TRAINER (10 CASES)
  // =========================================================================
  function renderTrainerSection() {
    const lang = AppState.lang;
    const isHe = lang === 'he';
    const container = document.getElementById('dynamic-trainer-container');
    if (!container) return;

    const allCases = getAllCases();
    const rawCurrent = allCases.find((c) => c.id === AppState.activeCaseId) || allCases[0];
    if (!rawCurrent) return;
    const nc = normalizeCase(rawCurrent, lang);
    const prog = getCaseProgress(nc.id);
    const curStepNum = Math.max(1, Math.min(6, prog.currentStep || 1));
    const stepObj = nc.steps[curStepNum - 1];

    const completedCount = allCases.filter((c) => AppState.trainerProgress[c.id] && AppState.trainerProgress[c.id].completed).length;

    const casePillsHtml = allCases.map((c) => {
      const p = getCaseProgress(c.id);
      const isAct = c.id === nc.id;
      const cMeta = getSystemVisualMeta(c.systemId);
      const pillStyle = isAct ? '' : `background:${cMeta.bg}; color:${cMeta.fg}; border-color:transparent;`;
      return `
        <button type="button" class="trainer-case-pill ${isAct ? 'active' : ''} ${p.completed ? 'completed' : ''}"
          data-case-sys="${c.systemId}"
          style="${pillStyle}"
          onclick="window.selectTrainerCase('${c.id}')">
          <span>${isHe ? `אירוע ${c.code}` : `Случай ${c.code}`}</span>
          ${p.completed ? ' ✓' : ''}
        </button>
      `;
    }).join('');

    const stepShortTitles = {
      1: { ru: 'Симптом', he: 'תסמין' },
      2: { ru: 'Что утверждать', he: 'מה להסיק' },
      3: { ru: 'Замеры', he: 'מדידות' },
      4: { ru: 'Гипотезы', he: 'השערות' },
      5: { ru: 'LOTO', he: 'LOTO' },
      6: { ru: 'Полный разбор', he: 'פתרון מלא' }
    };

    const stepDotsHtml = nc.steps.map((s) => {
      const isCur = s.num === curStepNum;
      const isDone = s.num === 1 || (s.type === 'quiz' && prog.checked[s.num] === 'correct') || (s.num === 6 && prog.completed);
      const sLbl = (stepShortTitles[s.num] && (stepShortTitles[s.num][lang] || stepShortTitles[s.num].ru)) || '';
      return `
        <button type="button" class="trainer-step-dot ${isCur ? 'current' : ''} ${isDone ? 'done' : ''}"
          aria-current="${isCur ? 'step' : 'false'}"
          onclick="window.goToTrainerStep('${nc.id}', ${s.num})">
          <span class="trainer-step-num">${isHe ? `שלב ${s.num}` : `Шаг ${s.num}`} ${isDone ? '✓' : ''}</span>
          <span class="trainer-step-short">${sLbl}</span>
        </button>
      `;
    }).join('');

    const symObj = (root.SYMPTOMS_BY_CASE && root.SYMPTOMS_BY_CASE[nc.id]) || null;
    const symHeadline = symObj && symObj.shortSymptom ? (symObj.shortSymptom[lang] || symObj.shortSymptom.ru) : nc.title;
    const symDetail = symObj && symObj.observedDetails ? (symObj.observedDetails[lang] || symObj.observedDetails.ru) : '';
    const symLocation = symObj && symObj.whereVisible ? (symObj.whereVisible[lang] || symObj.whereVisible.ru) : '';

    let stepBodyHtml = '';
    if (stepObj.type === 'info') {
      stepBodyHtml = `
        <div class="trainer-step-content">
          ${stepObj.contentHtml}
          <div class="trainer-step-actions">
            <button type="button" class="btn btn-primary" onclick="window.goToTrainerStep('${nc.id}', 2)">
              ${isHe ? 'המשך לשלב 2: מה ניתן להסיק ←' : 'Перейти к Шагу 2: Что можно и нельзя утверждать →'}
            </button>
            <button type="button" class="btn btn-outline" onclick="window.revealFullCaseSolution('${nc.id}')">
              📖 ${isHe ? 'הצג פתרון מלא מיד' : 'Показать полное решение сразу'}
            </button>
          </div>
        </div>
      `;
    } else if (stepObj.type === 'quiz') {
      const selId = prog.selected[stepObj.num] || '';
      const chkState = prog.checked[stepObj.num] || null;
      const hintOpen = Boolean(prog.showHint[stepObj.num]);
      const chosenOpt = stepObj.options.find((o) => o.id === selId);

      stepBodyHtml = `
        <div class="trainer-step-content">
          ${stepObj.introHtml || ''}
          <p class="trainer-question-text"><strong>❓ ${stepObj.question}</strong></p>
          <div class="trainer-options-list" role="radiogroup">
            ${stepObj.options.map((opt) => {
              const isSelected = selId === opt.id;
              let statusCls = '';
              if (chkState && isSelected) {
                statusCls = opt.isCorrect ? 'opt-correct' : 'opt-wrong';
              }
              return `
                <label class="trainer-option-card ${isSelected ? 'selected' : ''} ${statusCls}">
                  <input type="radio" name="trainer_q_${nc.id}_${stepObj.num}" value="${opt.id}"
                    ${isSelected ? 'checked' : ''}
                    onchange="window.selectTrainerOption('${nc.id}', ${stepObj.num}, '${opt.id}')" />
                  <span>${opt.text}</span>
                </label>
              `;
            }).join('')}
          </div>

          ${hintOpen ? `<div class="trainer-hint-box">💡 <strong>${isHe ? 'רמז הנדסי:' : 'Инженерная подсказка:'}</strong> ${stepObj.hint}</div>` : ''}

          ${chkState && chosenOpt ? `
            <div class="trainer-feedback-box ${chosenOpt.isCorrect ? 'feedback-ok' : 'feedback-err'}">
              <strong>${chosenOpt.isCorrect ? (isHe ? '✓ תשובה נכונה!' : '✓ Верный инженерный вывод!') : (isHe ? '⚠️ שימו לב לכשל בטיחותי/מתודולוגי:' : '⚠️ Обратите внимание на ошибку в рассуждении:')}</strong>
              <p style="margin-block:0.35rem 0;">${chosenOpt.feedback}</p>
            </div>
          ` : ''}

          <div class="trainer-step-actions">
            ${curStepNum > 1 ? `
              <button type="button" class="btn btn-outline" onclick="window.goToTrainerStep('${nc.id}', ${curStepNum - 1})">
                ${isHe ? `→ שלב קודם (${curStepNum - 1}/6)` : `← Предыдущий шаг (${curStepNum - 1}/6)`}
              </button>
            ` : ''}
            <button type="button" class="btn btn-primary" onclick="window.checkTrainerAnswer('${nc.id}', ${stepObj.num})">
              ✓ ${isHe ? 'בדיקת תשובה' : 'Проверить ответ'}
            </button>
            <button type="button" class="btn btn-outline" onclick="window.toggleTrainerHint('${nc.id}', ${stepObj.num})">
              💡 ${isHe ? 'רמז' : 'Подсказка'}
            </button>
            ${chkState ? `
              <button type="button" class="btn btn-outline" onclick="window.retryTrainerStep('${nc.id}', ${stepObj.num})">
                ↺ ${isHe ? 'ניסיון חוזר בשלב זה' : 'Попробовать шаг заново'}
              </button>
            ` : ''}
            ${curStepNum < 6 ? `
              <button type="button" class="btn btn-outline" onclick="window.goToTrainerStep('${nc.id}', ${curStepNum + 1})">
                ${isHe ? `שלב הבא (${curStepNum + 1}/6) ←` : `Следующий шаг (${curStepNum + 1}/6) →`}
              </button>
            ` : ''}
            <button type="button" class="btn btn-outline" onclick="window.revealFullCaseSolution('${nc.id}')">
              📖 ${isHe ? 'הצג פתרון מלא' : 'Показать полное решение'}
            </button>
          </div>
        </div>
      `;
    } else {
      // Step 6: Full solution
      const caseCalcCfg = root.CASE_CALC_CONFIG && root.CASE_CALC_CONFIG[nc.id];
      let calcActionHtml = '';
      if (caseCalcCfg && caseCalcCfg.applicable) {
        const btnText = (caseCalcCfg.btnLabel && (caseCalcCfg.btnLabel[lang] || caseCalcCfg.btnLabel.ru)) ||
          (isHe ? '🧮 בדיקה במחשבון' : '🧮 Проверить расчётом');
        calcActionHtml = `
          <button type="button" class="btn btn-primary trainer-verify-calc-btn" onclick="window.verifyCaseInCalculator('${nc.id}', 6)">
            ${btnText}
          </button>
        `;
      } else if (caseCalcCfg && !caseCalcCfg.applicable) {
        const msgHtml = (caseCalcCfg.notApplicableMsg && (caseCalcCfg.notApplicableMsg[lang] || caseCalcCfg.notApplicableMsg.ru)) ||
          (isHe ? 'ℹ️ חישוב אינו ישים לאירוע זה.' : 'ℹ️ Расчёт к этому случаю не применяется.');
        calcActionHtml = `
          <div class="trainer-calc-not-applicable" style="padding:0.65rem 0.85rem; border-radius:0.5rem; background:var(--surface-muted, #f8fafc); border:1px solid var(--border-color); font-size:0.92rem; width:100%;">
            ${msgHtml}
          </div>
        `;
      }
      stepBodyHtml = `
        <div class="trainer-step-content">
          ${calcActionHtml ? `<div class="trainer-step-calc-top" style="margin-block-end:0.85rem;">${calcActionHtml}</div>` : ''}
          ${stepObj.contentHtml}
          <div class="trainer-step-actions" style="flex-wrap:wrap;">
            <button type="button" class="btn btn-outline" onclick="window.goToTrainerStep('${nc.id}', 5)">
              ${isHe ? '→ שלב קודם (5/6)' : '← Предыдущий шаг (5/6)'}
            </button>
            <button type="button" class="btn btn-outline" onclick="window.resetSingleCase('${nc.id}')">
              ↺ ${isHe ? 'איפוס אירוע זה והתחלה מחדש' : 'Сбросить этот случай и пройти заново'}
            </button>
          </div>
        </div>
      `;
    }

    const activeCaseMeta = getSystemVisualMeta(nc.systemId);
    container.innerHTML = `
      <div class="trainer-header-bar">
        <div>
          <h2>${isHe ? 'סימולטור אינטראקטיבי לניתוח 10 אירועי שטח (6 שלבים)' : 'Интерактивный тренажёр: разбор 10 производственных случаев (6 шагов)'}</h2>
          <p class="trainer-subtitle">
            ${isHe
              ? `הושלמו ${completedCount} מתוך ${allCases.length} אירועים. כל ההתקדמות נשמרת בדפדפן גם בעת מעבר בין רוסית לעברית.`
              : `Разобрано ${completedCount} из ${allCases.length} случаев. Прогресс сохраняется локально в браузере и не теряется при переключении языка.`}
          </p>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <a href="#problem" class="btn btn-outline btn-sm">${isHe ? '← חזרה לבחירת תסמין' : '← К выбору признака'}</a>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.resetAllTrainerProgress()">
            ${isHe ? 'איפוס כל ההתקדמות' : 'Сбросить весь прогресс'}
          </button>
        </div>
      </div>

      <div class="trainer-cases-bar" role="tablist">
        ${casePillsHtml}
      </div>

      <div class="trainer-active-card" id="trainer-card-${nc.id}">
        <div id="${nc.id}" class="trainer-case-anchor-wrap">
        <div class="trainer-symptom-header-card">
          <div class="trainer-case-title-row">
            <div>
              <div class="trainer-symptom-badges">
                <span class="case-code-badge" style="background:${activeCaseMeta.bg}; color:${activeCaseMeta.fg};">${isHe ? `אירוע ${nc.code}` : `Случай ${nc.code}`}</span>
                ${symLocation ? `<span class="problem-symptom-loc">${symLocation}</span>` : ''}
              </div>
              <h3 id="case-heading-${nc.id}" tabindex="-1">${nc.title}</h3>
            </div>
            <a class="btn btn-outline btn-sm" href="#system-${nc.systemId}">
              ${isHe ? 'חזרה לתיאוריית המערכת ולתרשים' : 'К устройству и схеме системы'}
            </a>
          </div>
          <div class="trainer-symptom-summary">
            <strong>${isHe ? 'תסמין בשטח:' : 'Признак на оборудовании:'}</strong> ${symHeadline}
            ${symDetail ? `<div class="trainer-symptom-detail">${symDetail}</div>` : ''}
          </div>
        </div>

        <div class="trainer-steps-nav" role="navigation" aria-label="${isHe ? 'שלבי הניתוח' : 'Шаги разбора'}">
          ${stepDotsHtml}
        </div>

        <div class="trainer-step-box">
          <h4>${stepObj.title}</h4>
          ${stepBodyHtml}
        </div>
        </div>
      </div>
    `;
  }

  root.selectTrainerCase = function (caseId) {
    AppState.activeCaseId = caseId;
    const p = getCaseProgress(caseId);
    root.recordLastPlace({ type: 'case', caseId, step: p.currentStep || 1 });
    renderTrainerSection();
    renderHomeDashboard();
    root.switchView('case', { scrollTop: false, focusHeading: false });
  };

  root.goToTrainerStep = function (caseId, stepNum) {
    const p = getCaseProgress(caseId);
    p.currentStep = stepNum;
    if (stepNum === 6) p.completed = true;
    saveTrainerProgress();
    root.recordLastPlace({ type: 'case', caseId, step: stepNum });
    renderTrainerSection();
    renderHomeDashboard();
  };

  root.selectTrainerOption = function (caseId, stepNum, optId) {
    const p = getCaseProgress(caseId);
    p.selected[stepNum] = optId;
    delete p.checked[stepNum];
    saveTrainerProgress();
    renderTrainerSection();
  };

  root.checkTrainerAnswer = function (caseId, stepNum) {
    const allCases = getAllCases();
    const raw = allCases.find((c) => c.id === caseId);
    if (!raw) return;
    const nc = normalizeCase(raw, AppState.lang);
    const stepObj = nc.steps[stepNum - 1];
    const p = getCaseProgress(caseId);
    const selId = p.selected[stepNum];
    if (!selId) {
      // Auto-select first option if user clicked Check immediately so feedback is always shown
      if (stepObj.options && stepObj.options[0]) {
        p.selected[stepNum] = stepObj.options[0].id;
      }
    }
    const chosen = (stepObj.options || []).find((o) => o.id === p.selected[stepNum]);
    if (chosen) {
      p.checked[stepNum] = chosen.isCorrect ? 'correct' : 'wrong';
      if ([2, 3, 4, 5].every((n) => p.checked[n] === 'correct')) {
        p.completed = true;
      }
    }
    saveTrainerProgress();
    renderTrainerSection();
    renderHomeDashboard();
  };

  root.toggleTrainerHint = function (caseId, stepNum) {
    const p = getCaseProgress(caseId);
    p.showHint[stepNum] = !p.showHint[stepNum];
    saveTrainerProgress();
    renderTrainerSection();
  };

  root.retryTrainerStep = function (caseId, stepNum) {
    const p = getCaseProgress(caseId);
    delete p.selected[stepNum];
    delete p.checked[stepNum];
    saveTrainerProgress();
    renderTrainerSection();
  };

  root.revealFullCaseSolution = function (caseId) {
    const p = getCaseProgress(caseId);
    p.currentStep = 6;
    p.completed = true;
    saveTrainerProgress();
    renderTrainerSection();
    renderHomeDashboard();
  };

  root.resetSingleCase = function (caseId) {
    AppState.trainerProgress[caseId] = {
      currentStep: 1,
      selected: {},
      checked: {},
      showHint: {},
      showFullSolution: false,
      completed: false
    };
    saveTrainerProgress();
    renderTrainerSection();
    renderHomeDashboard();
  };

  root.resetAllTrainerProgress = function () {
    AppState.trainerProgress = {};
    saveTrainerProgress();
    renderTrainerSection();
    renderHomeDashboard();
  };

  // =========================================================================
  // RENDERING: BILINGUAL SHIFT LOGS (A4 PRINTABLE + BROWSER EDITABLE)
  // =========================================================================
  function renderShiftLogsSection() {
    const lang = AppState.lang;
    const isHe = lang === 'he';
    const container = document.getElementById('dynamic-shift-logs-container');
    if (!container || !root.SHIFT_LOGS_DATA) return;

    const logs = root.SHIFT_LOGS_DATA;
    const activeLog = logs.find((l) => l.id === AppState.activeShiftLogId) || logs[0];
    const draft = AppState.shiftLogDrafts[activeLog.id] || { meta: {}, cells: {} };

    const selectorHtml = logs.map((l) => {
      const isAct = l.id === activeLog.id;
      return `
        <button type="button" class="shift-log-tab-btn ${isAct ? 'active' : ''}"
          onclick="window.selectShiftLog('${l.id}')">
          📋 ${l.code}: ${(l.title[lang] || l.title.ru).replace(/^.*?:\s*/, '')}
        </button>
      `;
    }).join('');

    const rowsToRender = AppState.showExtendedLog
      ? [...activeLog.mainRows, ...(activeLog.extendedRows || [])]
      : activeLog.mainRows;

    const checklistItems = (activeLog.checklist && (activeLog.checklist[lang] || activeLog.checklist.ru)) || [];

    container.innerHTML = `
      <div class="shift-logs-toolbar no-print">
        <div>
          <h2>${isHe ? 'יומני משמרת להדפסה בפורמט A4 ולמילוי מקומי בדפדפן' : 'Сменные журналы оператора и инженера (печать A4 + заполнение в браузере)'}</h2>
          <p style="margin-block:0.25rem 0; font-size:0.9rem; color:var(--text-muted);">
            ${isHe
              ? 'בחרו גיליון משמרת (1 עד 5 או משולב 1–2). ניתן להדפיס גיליון משמרת ראשי בעמוד A4 אחד בדיוק או למלא ערכים בדפדפן ולייצא לקובץ CSV/JSON.'
              : 'Выберите сменный журнал (отдельно для каждой из 5 систем или сводный №1–2). Доступна печать на 1 листе A4, локальное заполнение в браузере и экспорт.'}
          </p>
        </div>
        <div class="shift-log-selector-row">
          ${selectorHtml}
        </div>
        <div class="shift-log-actions-row">
          <button type="button" class="btn btn-primary" onclick="window.printShiftLog('${activeLog.id}')">
            🖨️ ${isHe ? `הדפסת גיליון A4 (${activeLog.code})` : `Печать бланка A4 (${activeLog.code})`}
          </button>
          <button type="button" class="btn btn-outline" onclick="window.toggleExtendedShiftLog()">
            ${AppState.showExtendedLog
              ? (isHe ? '📄 הצג גיליון A4 ראשי בלבד (עמוד 1)' : '📄 Только основной сменный лист (1 стр. A4)')
              : (isHe ? '➕ הוסף שורות הנדסיות מורחבות' : '➕ Показать расширенный инженерный лист')}
          </button>
          <button type="button" class="btn btn-outline" onclick="window.exportShiftLogCsv('${activeLog.id}')">
            💾 ${isHe ? 'ייצוא נתוני משמרת (CSV)' : 'Экспорт заполненной смены (CSV)'}
          </button>
          <button type="button" class="btn btn-outline" onclick="window.clearShiftLogDraft('${activeLog.id}')">
            🧹 ${isHe ? 'ניקוי טופס המשמרת' : 'Очистить бланк'}
          </button>
        </div>
      </div>

      <!-- ПЕЧАТНАЯ ОБЛАСТЬ A4 -->
      <div class="shift-log-print-area active-print-target" id="${activeLog.id}">
        <div class="shift-log-sheet-header">
          <div>
            <h3>${activeLog.title[lang] || activeLog.title.ru}</h3>
            <p class="shift-log-subtitle">${activeLog.subtitle[lang] || activeLog.subtitle.ru}</p>
          </div>
          <div class="shift-log-meta-fields">
            <label>${isHe ? 'תאריך:' : 'Дата:'}
              <input type="text" class="shift-meta-input" placeholder="____-__-__"
                value="${draft.meta.date || ''}"
                oninput="window.updateShiftLogMeta('${activeLog.id}', 'date', this.value)" />
            </label>
            <label>${isHe ? 'משמרת:' : 'Смена:'}
              <input type="text" class="shift-meta-input" placeholder="A / B / C"
                value="${draft.meta.shift || ''}"
                oninput="window.updateShiftLogMeta('${activeLog.id}', 'shift', this.value)" />
            </label>
            <label>${isHe ? 'מפעיל / מהנדס:' : 'Оператор / Инженер:'}
              <input type="text" class="shift-meta-input" placeholder="________________"
                value="${draft.meta.operator || ''}"
                oninput="window.updateShiftLogMeta('${activeLog.id}', 'operator', this.value)" />
            </label>
          </div>
        </div>

        <div class="table-wrapper shift-log-table-wrap">
          <table class="shift-log-table">
            <thead>
              <tr>
                <th style="width:28%;">${isHe ? 'פרמטר מבוקר' : 'Контролируемый параметр'}</th>
                <th style="width:18%;">${isHe ? 'נקודת מדידה / מכשיר' : 'Точка замера / прибор'}</th>
                <th style="width:9%;">${isHe ? 'יחידות' : 'Ед. изм.'}</th>
                <th style="width:13%;">${isHe ? 'נורמה מקומית' : 'Норма цеха'}</th>
                <th style="width:6.5%;">08:00</th>
                <th style="width:6.5%;">12:00</th>
                <th style="width:6.5%;">16:00</th>
                <th style="width:6.5%;">20:00</th>
                <th style="width:6%;">${isHe ? 'הערה' : 'Прим.'}</th>
              </tr>
            </thead>
            <tbody>
              ${rowsToRender.map((r, idx) => {
                const c08 = (draft.cells[`${idx}_08`] || '');
                const c12 = (draft.cells[`${idx}_12`] || '');
                const c16 = (draft.cells[`${idx}_16`] || '');
                const c20 = (draft.cells[`${idx}_20`] || '');
                const cNote = (draft.cells[`${idx}_note`] || '');
                const defaultNorm = typeof r.norm === 'object' ? (r.norm[lang] || r.norm.ru) : r.norm;
                const unitStr = typeof r.unit === 'object' ? (r.unit[lang] || r.unit.ru) : r.unit;
                const normVal = draft.cells[`${idx}_norm`] !== undefined ? draft.cells[`${idx}_norm`] : defaultNorm;
                return `
                  <tr>
                    <th>${r.param[lang] || r.param.ru}</th>
                    <td>${r.point[lang] || r.point.ru}</td>
                    <td><code dir="ltr">${unitStr}</code></td>
                    <td>
                      <input type="text" class="shift-cell-input" dir="ltr" value="${normVal}"
                        aria-label="${isHe ? 'נורמה' : 'Норма'} ${idx + 1}"
                        oninput="window.updateShiftLogCell('${activeLog.id}', '${idx}_norm', this.value)" />
                    </td>
                    <td><input type="text" class="shift-cell-input" dir="ltr" value="${c08}" aria-label="08:00 ${idx + 1}" oninput="window.updateShiftLogCell('${activeLog.id}', '${idx}_08', this.value)" /></td>
                    <td><input type="text" class="shift-cell-input" dir="ltr" value="${c12}" aria-label="12:00 ${idx + 1}" oninput="window.updateShiftLogCell('${activeLog.id}', '${idx}_12', this.value)" /></td>
                    <td><input type="text" class="shift-cell-input" dir="ltr" value="${c16}" aria-label="16:00 ${idx + 1}" oninput="window.updateShiftLogCell('${activeLog.id}', '${idx}_16', this.value)" /></td>
                    <td><input type="text" class="shift-cell-input" dir="ltr" value="${c20}" aria-label="20:00 ${idx + 1}" oninput="window.updateShiftLogCell('${activeLog.id}', '${idx}_20', this.value)" /></td>
                    <td><input type="text" class="shift-cell-input" value="${cNote}" aria-label="${isHe ? 'הערה' : 'Примечание'} ${idx + 1}" oninput="window.updateShiftLogCell('${activeLog.id}', '${idx}_note', this.value)" /></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="shift-log-checklist">
          <strong>✓ ${isHe ? 'בדיקות חזותיות ובטיחות במשמרת:' : 'Обязательный визуальный и метрологический контроль смены:'}</strong>
          <ul>
            ${checklistItems.map((item) => `<li>☐ ${item}</li>`).join('')}
          </ul>
        </div>

        <div class="shift-log-footer">
          <p>${activeLog.footerNotes[lang] || activeLog.footerNotes.ru}</p>
          <div class="shift-log-signatures">
            <span>${isHe ? 'חתימת מוסר המשמרת: ___________________' : 'Смену сдал (подпись): ___________________'}</span>
            <span>${isHe ? 'חתימת מקבל המשמרת: ___________________' : 'Смену принял (подпись): ___________________'}</span>
          </div>
        </div>
      </div>
    `;
  }

  root.selectShiftLog = function (logId) {
    AppState.activeShiftLogId = logId;
    renderShiftLogsSection();
  };

  root.toggleExtendedShiftLog = function () {
    AppState.showExtendedLog = !AppState.showExtendedLog;
    renderShiftLogsSection();
  };

  root.updateShiftLogMeta = function (logId, field, value) {
    if (!AppState.shiftLogDrafts[logId]) AppState.shiftLogDrafts[logId] = { meta: {}, cells: {} };
    AppState.shiftLogDrafts[logId].meta[field] = value;
    saveJson(STORAGE_KEY_LOGS, AppState.shiftLogDrafts);
  };

  root.updateShiftLogCell = function (logId, cellKey, value) {
    if (!AppState.shiftLogDrafts[logId]) AppState.shiftLogDrafts[logId] = { meta: {}, cells: {} };
    AppState.shiftLogDrafts[logId].cells[cellKey] = value;
    saveJson(STORAGE_KEY_LOGS, AppState.shiftLogDrafts);
  };

  root.clearShiftLogDraft = function (logId) {
    delete AppState.shiftLogDrafts[logId];
    saveJson(STORAGE_KEY_LOGS, AppState.shiftLogDrafts);
    renderShiftLogsSection();
  };

  root.exportShiftLogCsv = function (logId) {
    const lang = AppState.lang;
    const isHe = lang === 'he';
    const logs = root.SHIFT_LOGS_DATA || [];
    const activeLog = logs.find((l) => l.id === logId) || logs[0];
    if (!activeLog) return '';
    const draft = AppState.shiftLogDrafts[activeLog.id] || { meta: {}, cells: {} };
    const rows = AppState.showExtendedLog
      ? [...activeLog.mainRows, ...(activeLog.extendedRows || [])]
      : activeLog.mainRows;
    const headerRow = isHe
      ? ['פרמטר מבוקר', 'נקודת מדידה / מכשיר', 'יחידות', 'נורמה מקומית', '08:00', '12:00', '16:00', '20:00', 'הערה']
      : ['Контролируемый параметр', 'Точка замера / прибор', 'Ед. изм.', 'Норма цеха', '08:00', '12:00', '16:00', '20:00', 'Прим.'];
    const csvLines = [headerRow.map((h) => `"${h}"`).join(',')];
    rows.forEach((r, idx) => {
      const unitStr = typeof r.unit === 'object' ? (r.unit[lang] || r.unit.ru) : r.unit;
      const defaultNorm = typeof r.norm === 'object' ? (r.norm[lang] || r.norm.ru) : r.norm;
      const line = [
        `"${(r.param[lang] || r.param.ru).replace(/"/g, '""')}"`,
        `"${(r.point[lang] || r.point.ru).replace(/"/g, '""')}"`,
        `"${unitStr}"`,
        `"${(draft.cells[`${idx}_norm`] || defaultNorm).replace(/"/g, '""')}"`,
        `"${(draft.cells[`${idx}_08`] || '').replace(/"/g, '""')}"`,
        `"${(draft.cells[`${idx}_12`] || '').replace(/"/g, '""')}"`,
        `"${(draft.cells[`${idx}_16`] || '').replace(/"/g, '""')}"`,
        `"${(draft.cells[`${idx}_20`] || '').replace(/"/g, '""')}"`,
        `"${(draft.cells[`${idx}_note`] || '').replace(/"/g, '""')}"`
      ];
      csvLines.push(line.join(','));
    });
    const fullCsv = '\uFEFF' + csvLines.join('\n');
    root.__lastExportedShiftLogCsv = fullCsv;
    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeLog.id}_${lang}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return fullCsv;
  };

  root.printShiftLog = function (logId) {
    if (logId && logId !== AppState.activeShiftLogId) {
      AppState.activeShiftLogId = logId;
      renderShiftLogsSection();
    }
    document.body.dataset.printMode = 'shift-log';
    const sec = document.getElementById('sec-shift-log');
    if (sec) sec.classList.add('has-active-print-log');
    window.print();
  };

  // =========================================================================
  // RENDERING: GLOSSARY & VERIFIED SOURCES S01-S23 + NOTEBOOKLM GUIDE
  // =========================================================================
  AppState.glossaryFilterSys = 'all';
  AppState.glossaryFilterQuery = '';

  const GLOSSARY_SECTIONS_META = [
    {
      id: 'sec-1-2',
      ru: 'Раздел 1 и 2. Паровые системы, котельная и возврат конденсата (Steam & Condensate)',
      he: 'פרק 1 ו-2. מערכות קיטור, בית דוודים והחזרת עיבוי (Steam & Condensate)'
    },
    {
      id: 'sec-3',
      ru: 'Раздел 3. Чиллеры и холодильные установки (Chillers & Refrigeration)',
      he: 'פרק 3. צ\'ילרים ומערכות קירור (Chillers & Refrigeration)'
    },
    {
      id: 'sec-4',
      ru: 'Раздел 4. Сжатый воздух и пневмосистемы (Compressed Air)',
      he: 'פרק 4. אוויר דחוס ומערכות פניאומטיות (Compressed Air)'
    },
    {
      id: 'sec-5',
      ru: 'Раздел 5. Обратный осмос (RO) и водоподготовка (Reverse Osmosis & Water Treatment)',
      he: 'פרק 5. אוסמוזה הפוכה (RO) וטיפול במים (Reverse Osmosis & Water Treatment)'
    }
  ];

  function applyGlossaryDomFilters() {
    const sysFilter = AppState.glossaryFilterSys || 'all';
    const qNorm = String(AppState.glossaryFilterQuery || '').trim().toLowerCase();
    const rows = document.querySelectorAll('#dynamic-glossary-container tr.glossary-term-row');
    const secVisibleCounts = {};
    rows.forEach((tr) => {
      const rowSys = tr.getAttribute('data-sys-id') || '';
      const rowSec = tr.getAttribute('data-sec-id') || '';
      const rowSearch = (tr.getAttribute('data-search-text') || '').toLowerCase();
      const matchSys = sysFilter === 'all' || rowSys === sysFilter;
      const matchQ = !qNorm || rowSearch.includes(qNorm);
      const vis = matchSys && matchQ;
      tr.style.display = vis ? '' : 'none';
      if (vis) {
        secVisibleCounts[rowSec] = (secVisibleCounts[rowSec] || 0) + 1;
      }
    });
    document.querySelectorAll('#dynamic-glossary-container tr.glossary-section-group-row').forEach((secTr) => {
      const secId = secTr.getAttribute('data-sec-group') || '';
      secTr.style.display = secVisibleCounts[secId] > 0 ? '' : 'none';
    });
    document.querySelectorAll('#dynamic-glossary-container .glossary-sys-chip').forEach((btn) => {
      const isAct = btn.getAttribute('data-glossary-sys') === sysFilter;
      btn.classList.toggle('active', isAct);
      btn.setAttribute('aria-pressed', isAct ? 'true' : 'false');
    });
  }

  root.filterGlossaryBySystem = function (sysId) {
    AppState.glossaryFilterSys = sysId || 'all';
    applyGlossaryDomFilters();
  };

  root.filterGlossaryByQuery = function (q) {
    AppState.glossaryFilterQuery = String(q || '');
    applyGlossaryDomFilters();
  };

  root.resetGlossaryFilters = function () {
    AppState.glossaryFilterSys = 'all';
    AppState.glossaryFilterQuery = '';
    const inp = document.getElementById('glossary-quick-search-input');
    if (inp) inp.value = '';
    applyGlossaryDomFilters();
  };

  function renderGlossaryAndSources() {
    const lang = AppState.lang;
    const isHe = lang === 'he';
    const uiDict = (root.I18N_UI && root.I18N_UI.UI_STRINGS && root.I18N_UI.UI_STRINGS[lang]) || {};
    const ruOnlyNoticeText = uiDict.guideRuOnlyNotice ||
      (isHe
        ? 'הטקסט המלא של פרק זה זמין ברוסית. הכותרות, תרשימי המערכת, טבלת הפרמטרים, האירועים והמחשבונים מתורגמים לעברית.'
        : 'Полный текст этого подраздела пока на русском языке.');

    const glBox = document.getElementById('dynamic-glossary-container');
    if (glBox && root.GLOSSARY_ITEMS) {
      const items = root.GLOSSARY_ITEMS;
      const sysChips = [
        { id: 'all', ru: `Все (${items.length})`, he: `הכול (${items.length})` },
        { id: 'steam', ru: 'Пар', he: 'קיטור' },
        { id: 'condensate', ru: 'Конденсат', he: 'עיבוי' },
        { id: 'chillers', ru: 'Чиллеры', he: 'צ\'ילרים' },
        { id: 'air', ru: 'Сжатый воздух', he: 'אוויר דחוס' },
        { id: 'ro', ru: 'Обратный осмос', he: 'אוסמוזה הפוכה' }
      ];

      const renderTermRow = (g) => {
        const safeEnHtml = escapeGuideHtml(g.en || '').replace(
          /([А-Яа-яЁё]+(?:\s+[А-Яа-яЁё]+)*)/g,
          '<span class="sec-term">$1</span>'
        );
        const abbrHtml = g.abbr ? `<code dir="ltr">${escapeGuideHtml(g.abbr)}</code><br>` : '';
        const colTermPrimary = isHe ? g.he : g.ru;
        const colTermSecondaryHtml = isHe
          ? `<span class="sec-term">${escapeGuideHtml(g.ru)}${g.heVariants && g.heVariants !== g.he ? ` — ${escapeGuideHtml(g.heVariants)}` : ''}</span>`
          : `<strong>${escapeGuideHtml(g.he)}</strong>${g.heVariants && g.heVariants !== g.he ? `<span class="sec-term" dir="ltr" style="display:block; margin-block-start:4px;">${escapeGuideHtml(g.heVariants)}</span>` : ''}`;

        let defCellHtml = '';
        if (!isHe) {
          defCellHtml = `<div>${escapeGuideHtml(g.def.ru)}</div>`;
        } else if (g.def && g.def.he) {
          defCellHtml = `<div>${escapeGuideHtml(g.def.he)}</div>`;
        } else {
          defCellHtml = `
            <div class="guide-ru-only-notice" dir="rtl">${escapeGuideHtml(ruOnlyNoticeText)}</div>
            <div class="sec-term guide-ru-fallback" dir="ltr" lang="ru">${escapeGuideHtml(g.def.ru)}</div>
          `;
        }

        const relHtml = g.relatedId
          ? `<div style="margin-block-start:0.25rem;"><a href="#${g.relatedId}" class="glossary-related-link">${isHe ? `מונח קשור: #${g.relatedId}` : `См. также: #${g.relatedId}`}</a></div>`
          : '';
        const searchBlob = [g.id, g.abbr || '', g.en || '', g.ru || '', g.he || '', g.heVariants || '', (g.def && g.def.ru) || '', (g.def && g.def.he) || '']
          .join(' ')
          .replace(/"/g, '&quot;');

        return `
          <tr id="${g.id}" class="glossary-term-row" data-sys-id="${g.systemId || 'steam'}" data-sec-id="${g.sectionId || 'sec-1-2'}" data-search-text="${searchBlob}">
            <th id="${g.id}-heading" tabindex="-1">${abbrHtml}<small dir="ltr">${safeEnHtml}</small></th>
            <td><strong>${escapeGuideHtml(colTermPrimary)}</strong></td>
            <td dir="${isHe ? 'ltr' : 'rtl'}">${colTermSecondaryHtml}</td>
            <td>
              ${defCellHtml}
              ${relHtml}
              <div style="margin-block-start:0.25rem;">
                <a href="${g.link}" class="glossary-jump-link">${isHe ? 'מעבר לחישוב / לפרק ←' : 'Перейти к разделу / расчёту →'}</a>
              </div>
            </td>
          </tr>
        `;
      };

      const groupedBodyHtml = GLOSSARY_SECTIONS_META.map((sec) => {
        const secItems = items.filter((g) => (g.sectionId || 'sec-1-2') === sec.id);
        if (!secItems.length) return '';
        return `
          <tr class="glossary-section-group-row" data-sec-group="${sec.id}">
            <th colspan="4">${escapeGuideHtml(isHe ? sec.he : sec.ru)} (${secItems.length})</th>
          </tr>
          ${secItems.map(renderTermRow).join('')}
        `;
      }).join('');

      glBox.innerHTML = `
        <h2>${isHe ? 'מילון מונחים הנדסי דו-לשוני וקיצורים (RU / עברית / EN)' : 'Словарь инженерных терминов и аббревиатур (RU / עברית / EN)'}</h2>
        <div class="glossary-filter-bar" role="region" aria-label="${isHe ? 'סינון מילון מונחים' : 'Фильтр словаря терминов'}">
          <div class="glossary-sys-chips">
            ${sysChips.map((ch) => {
              const isAct = (AppState.glossaryFilterSys || 'all') === ch.id;
              return `
                <button type="button" class="glossary-sys-chip ${isAct ? 'active' : ''}"
                  data-glossary-sys="${ch.id}"
                  aria-pressed="${isAct ? 'true' : 'false'}"
                  onclick="window.filterGlossaryBySystem('${ch.id}')">
                  ${escapeGuideHtml(isHe ? ch.he : ch.ru)}
                </button>
              `;
            }).join('')}
          </div>
          <input type="search" id="glossary-quick-search-input" class="glossary-quick-search"
            value="${escapeGuideHtml(AppState.glossaryFilterQuery || '')}"
            placeholder="${isHe ? 'סינון מהיר במילון (עברית / RU / EN)...' : 'Быстрый фильтр по словарю (RU / עברית / EN)...'}"
            aria-label="${isHe ? 'סינון מהיר במילון' : 'Быстрый фильтр по словарю'}"
            oninput="window.filterGlossaryByQuery(this.value)" />
        </div>
        <div class="table-wrapper" tabindex="0" role="region" aria-label="${isHe ? 'מילון מונחים' : 'Словарь терминов'}">
          <table>
            <thead>
              <tr>
                <th>${isHe ? 'קיצור / EN' : 'Код / EN'}</th>
                <th>${isHe ? 'מונח בעברית' : 'Русский термин'}</th>
                <th>${isHe ? 'מונח ברוסית' : 'Иврит (עברית)'}</th>
                <th>${isHe ? 'הסבר מעשי וקישור לפרק' : 'Практическое пояснение и переход'}</th>
              </tr>
            </thead>
            <tbody>
              ${groupedBodyHtml}
            </tbody>
          </table>
        </div>
      `;
      applyGlossaryDomFilters();
    }

    const srcBox = document.getElementById('dynamic-sources-container');
    if (srcBox && root.SOURCES_REGISTRY && root.NOTEBOOKLM_GUIDE) {
      const nlm = root.NOTEBOOKLM_GUIDE[lang] || root.NOTEBOOKLM_GUIDE.ru;
      srcBox.innerHTML = `
        <h2>${isHe ? 'מדיניות בטיחות, זכויות יוצרים ורישום 23 המקורות הראשוניים (S01–S23)' : 'Политика безопасности, авторских прав и реестр 23 первоисточников (S01–S23)'}</h2>
        <div class="loto-box">
          <strong>${isHe ? 'כלל בטיחות תעשייתית (LOTO):' : 'Правило промышленной безопасности (LOTO):'}</strong>
          ${isHe
            ? 'כל חומרי האתר מיועדים ללימוד ולניתוח הנדסי. כל פתיחת צנרת, בידוד ציוד, פריקת לחץ שארי או עבודה בחשמל/קיטור/אוויר דחוס/כימיקלים יבוצעו אך ורק על-ידי צוות מוסמך לפי נוהל LOTO ונהלי המפעל.'
            : 'Материалы сайта предназначены для обучения и инженерного анализа. Любые переключения арматуры, вывод оборудования в ремонт, изоляция и проверка отсутствия остаточного давления выполняются только допущенным персоналом по процедуре LOTO и местному регламенту предприятия.'}
        </div>

        <div class="notebooklm-guide-box">
          <h3>${nlm.title}</h3>
          <p>${nlm.distinction}</p>
          <strong>${isHe ? 'דוגמאות לשאלות אימות מול המקורות:' : 'Примеры контрольных вопросов для проверки по первоисточникам:'}</strong>
          <ul>
            ${nlm.samplePrompts.map((p) => `<li>${p}</li>`).join('')}
          </ul>
        </div>

        <div class="table-wrapper" tabindex="0" role="region" aria-label="S01-S23">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>${isHe ? 'יצרן / תקן וכותרת המסמך' : 'Производитель / стандарт и код документа'}</th>
                <th>${isHe ? 'עמודים מאומתים (Printed / PDF)' : 'Проверенные страницы (printed / PDF)'}</th>
                <th>${isHe ? 'נושא והקשר באתר' : 'Содержание и применение в расчётах'}</th>
                <th>${isHe ? 'קישור רשמי' : 'Официальная ссылка'}</th>
              </tr>
            </thead>
            <tbody>
              ${root.SOURCES_REGISTRY.map((s) => `
                <tr id="source-${s.code}">
                  <th id="source-${s.code}-heading" tabindex="-1"><code dir="ltr">${s.code}</code></th>
                  <td dir="ltr">${s.title}</td>
                  <td><code dir="ltr">${s.pages}</code></td>
                  <td>${s.note[lang] || s.note.ru}</td>
                  <td dir="ltr"><a href="${s.url}" target="_blank" rel="noopener">PDF ↗</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  // =========================================================================
  // LANGUAGE & SECONDARY TERMS SWITCHING (PRESERVING STATE)
  // =========================================================================
  root.setAppLanguage = function (lang) {
    AppState.lang = lang === 'he' ? 'he' : 'ru';
    try { localStorage.setItem(STORAGE_KEY_LANG, AppState.lang); } catch (_) {}

    const htmlEl = document.documentElement;
    htmlEl.setAttribute('lang', AppState.lang);
    htmlEl.setAttribute('dir', AppState.lang === 'he' ? 'rtl' : 'ltr');
    document.body.classList.toggle('hide-sec-terms', !AppState.showSecTerms);

    // Update static UI strings from I18N_UI.UI_STRINGS
    if (root.I18N_UI && root.I18N_UI.UI_STRINGS) {
      const dict = root.I18N_UI.UI_STRINGS[AppState.lang] || root.I18N_UI.UI_STRINGS.ru;
      document.title = dict.pageTitle || document.title;
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) el.setAttribute('placeholder', dict[key]);
      });
    }

    // Update language buttons active state
    document.querySelectorAll('[data-lang-switch]').forEach((btn) => {
      const isAct = btn.getAttribute('data-lang-switch') === AppState.lang;
      btn.classList.toggle('active', isAct);
      btn.setAttribute('aria-pressed', isAct ? 'true' : 'false');
    });

    renderHomeDashboard();
    renderSystemsSection();
    renderTrainerSection();
    renderShiftLogsSection();
    renderGlossaryAndSources();
    renderToolsSubnavAndSettingsAndAbout();
    if (typeof root.renderCalcOverview === 'function') {
      root.renderCalcOverview();
    }
    if (typeof root.renderProblemScreen === 'function') {
      root.renderProblemScreen();
    } else {
      const probBox = document.getElementById('dynamic-problem-container');
      if (probBox) {
        const isHe = AppState.lang === 'he';
        probBox.innerHTML = `<section class="section-card"><h2>${isHe ? 'משהו לא תקין בציוד' : 'Что-то не так на оборудовании'}</h2></section>`;
      }
    }

    if (typeof root.applyCalculatorTranslations === 'function') {
      root.applyCalculatorTranslations(AppState.lang);
    }
    if (typeof root.renderSurveySection === 'function') {
      root.renderSurveySection();
    }
    if (typeof root.renderSavedCalcsSection === 'function') {
      root.renderSavedCalcsSection();
    }
    if (typeof root.renderSteamTableSection === 'function') {
      root.renderSteamTableSection();
    }

    // Update top header and navigation pills for RU / HE
    const isHe = AppState.lang === 'he';
    const setTxt = (id, ruTxt, heTxt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = isHe ? heTxt : ruTxt;
    };
    setTxt('skip-link-el', 'Перейти к основному содержанию', 'דלג לתוכן הראשי');
    syncHeaderTitleByViewport();
    setTxt('site-badge-el', `RU / HE • ${APP_VERSION.edition}`, `עברית / RU • ${APP_VERSION.edition}`);
    setTxt('site-subtitle-el',
      'Пар • Конденсат • Чиллеры • Сжатый воздух • Обратный осмос (RO) — эксплуатация, диагностика, расчёты, сменные журналы и первоисточники S01–S23',
      'קיטור • עיבוי • צ\'ילרים • אוויר דחוס • אוסמוזה הפוכה (RO) — תפעול, אבחון תקלות, חישובים, יומני משמרת ומקורות S01–S23');
    setTxt('quick-print-btn', 'Печать бланка смены (A4)', 'הדפסת יומן משמרת (A4)');
    setTxt('nav-home', 'Главная', 'דף הבית');
    setTxt('nav-problem', 'Что-то не так', 'משהו לא תקין');
    setTxt('nav-calculators', 'Расчёты', 'מחשבונים');
    setTxt('nav-learn', 'Учёба', 'לימוד');
    setTxt('nav-tools', 'Инструменты', 'כלים');
    setTxt('mob-nav-home-label', 'Главная', 'דף הבית');
    setTxt('mob-nav-problem-label', 'Проблема', 'תקלה');
    setTxt('mob-nav-calc-label', 'Расчёты', 'מחשבונים');
    setTxt('mob-nav-learn-label', 'Учёба', 'לימוד');
    setTxt('mob-nav-tools-label', 'Ещё', 'עוד');
    setTxt('lang-btn-ru', 'RU', 'RU');
    setTxt('lang-btn-he', 'עב', 'עב');
    const deskNav = document.getElementById('desktop-main-nav');
    if (deskNav) deskNav.setAttribute('aria-label', isHe ? 'תפריט ראשי' : 'Основное меню');
    const mobNav = document.getElementById('mobile-bottom-nav');
    if (mobNav) mobNav.setAttribute('aria-label', isHe ? 'ניווט נייד' : 'Мобильная навигация');
    const sToggleBtn = document.getElementById('search-toggle-btn');
    if (sToggleBtn) sToggleBtn.setAttribute('aria-label', isHe ? 'חיפוש' : 'Поиск');
    const sCloseBtn = document.getElementById('search-drawer-close-btn');
    if (sCloseBtn) sCloseBtn.setAttribute('aria-label', isHe ? 'סגירת חיפוש' : 'Закрыть поиск');
    // v15.1 (п. 1.4): поле поиска и панель вкладок калькуляторов — доступное имя по языку
    const gSearchInput = document.getElementById('global-search');
    if (gSearchInput) gSearchInput.setAttribute('aria-label', isHe ? 'חיפוש בספרייה ההנדסית' : 'Поиск по инженерной библиотеке');
    const calcTabsBar = document.getElementById('calc-tabs-bar');
    if (calcTabsBar) calcTabsBar.setAttribute('aria-label', isHe ? 'בחירת מחשבון' : 'Выбор калькулятора');
    setTxt('btn-clear-search', 'Сбросить фильтр ✕', 'ניקוי חיפוש ✕');
    setTxt('calc-section-title',
      'Инженерные калькуляторы (прозрачный расчёт и расчётная карточка)',
      'מחשבונים הנדסיים (חישוב שקוף וכרטיס חישוב להדפסה)');
    setTxt('calc-section-lead',
      'Все 5 калькуляторов (10 расчётных модулей) работают локально в браузере, показывают пошаговую подстановку в формулу с размерностями, проверяют физические ограничения и формируют готовую Расчётную карточку на русском и иврите.',
      'כל 5 המחשבונים (10 מודולי חישוב) פועלים מקומית בדפדפן, מציגים הצבה שלב-אחר-שלב בנוסחה עם יחידות מידה, אוכפים גבולות פיזיקליים ומפיקים כרטיס חישוב מוכן להעתקה ולהדפסה בעברית וברוסית.');
    setTxt('tab-btn-calc-1',
      '1. Конденсат (1А: Потери и возврат • 1Б: Вторичный пар TLV)',
      '1. עיבוי (1א: מים וחום • 1ב: קיטור משני ומכל TLV)');
    setTxt('tab-btn-calc-2',
      '2. Чиллеры (Вода / Гликоль • Approach • COP)',
      '2. צ\'ילרים (מים / גליקול • Approach • COP)');
    setTxt('tab-btn-calc-3',
      '3. Сжатый воздух (3А: Пересчёт расхода • 3Б: Утечки • 3В: Влага)',
      '3. אוויר דחוס (3א: המרת ספיקה • 3ב: דליפות • 3ג: לחות)');
    setTxt('tab-btn-calc-4',
      '4. Обратный осмос RO (4А: Баланс и селективность • 4Б: Нормализация Eq. 72)',
      '4. אוסמוזה הפוכה RO (4א: מאזן ודחיית מלחים • 4ב: נרמול Eq. 72)');
    setTxt('tab-btn-calc-5',
      '5. Пар (5А: Перевод давления • 5Б: Расход пара по нагрузке)',
      '5. קיטור (5א: המרת לחץ • 5ב: ספיקת קיטור לפי עומס)');
    setTxt('site-footer-el',
      `Инженерная библиотека пищевого предприятия (RU / HE, редакция ${APP_VERSION.edition} (${APP_VERSION.date}), расчётное ядро ${APP_VERSION.core}) • Все утверждения верифицированы по первоисточникам S01–S23.`,
      `ספריית ההנדסה למפעל מזון (עברית / RU, מהדורה ${APP_VERSION.edition} (${APP_VERSION.date}), ליבת חישוב ${APP_VERSION.core}) • כל הנתונים והנוסחאות מאומתים מול המקורות הראשוניים S01–S23.`);
    const gSearch = document.getElementById('global-search');
    if (gSearch) {
      gSearch.placeholder = isHe
        ? 'חיפוש (עברית / RU / EN: צ\'ילר, אוסמוזה, COP, FAD, NDP, DPD, S08...)'
        : 'Поиск (RU / עברית / EN: чиллер, אוסמוזה, COP, FAD, NDP, DPD, S08...)';
    }
    const secBtn = document.getElementById('sec-terms-toggle-btn');
    if (secBtn) {
      secBtn.setAttribute('aria-pressed', AppState.showSecTerms ? 'true' : 'false');
      secBtn.textContent = isHe
        ? (AppState.showSecTerms ? '✓ מונחי שפה שנייה: מוצגים' : '+ הצג מונחי שפה שנייה')
        : (AppState.showSecTerms ? '✓ 2-й язык терминов: вкл.' : '+ 2-й язык терминов');
    }
    const helpBtnUnits = document.getElementById('help-btn-units');
    if (helpBtnUnits) {
      helpBtnUnits.setAttribute('aria-label', isHe ? 'עזרה לגבי יחידות מידה' : 'Справка по единицам измерения');
    }
    const helpPopUnits = document.getElementById('help-popover-units');
    if (helpPopUnits) {
      helpPopUnits.textContent = isHe
        ? 'ממיר קלט ופלט בין יחידות מטריות (bar, °C, kg/h, m³/h) ליחידות אמריקאיות (psig, °F, lb/h, gpm, cfm). ליבת החישוב מחשבת תמיד ב-SI ללא איבוד דיוק.'
        : 'Переключает ввод и вывод между метрическими (бар, °C, кг/ч, м³/ч) и американскими единицами (psig, °F, lb/h, gpm, cfm). Само расчётное ядро всегда считает в СИ без потери точности.';
    }
    const helpBtnCurr = document.getElementById('help-btn-currency');
    if (helpBtnCurr) {
      helpBtnCurr.setAttribute('aria-label', isHe ? 'עזרה לגבי מטבע' : 'Справка по валюте');
    }
    const helpPopCurr = document.getElementById('help-popover-currency');
    if (helpPopCurr) {
      helpPopCurr.textContent = isHe
        ? 'משנה רק את סמל המטבע ($ או ₪) בהערכת העלות השנתית של אנרגיה ומים. ערך התעריף אינו מומר לפי שער חליפין — הזינו את התעריף שלכם במטבע שנבחר.'
        : 'Меняет только знак валюты ($ или ₪) в годовой оценке стоимости энергии и воды. Число тарифа не пересчитывается по курсу — введите свой тариф в выбранной валюте.';
    }
    updateStorageFallbackBanner();
    if (typeof root.rebuildSearchIndex === 'function') {
      root.rebuildSearchIndex(AppState.lang);
    }
    if (gSearch && gSearch.value.trim()) {
      gSearch.dispatchEvent(new Event('input'));
    }
  };

  function syncHeaderTitleByViewport() {
    const el = document.getElementById('site-title-el');
    if (!el) return;
    const isHe = AppState.lang === 'he';
    const dict = (root.I18N_UI && root.I18N_UI.UI_STRINGS && root.I18N_UI.UI_STRINGS[AppState.lang]) || {};
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    // v13.1.1: короткое название на телефоне (<= 480 px) и на планшете (768–1023 px),
    // где рядом с названием стоит полное меню и длинное название обрезается до «Инж…».
    const isNarrow = w <= 480 || (w >= 768 && w < 1024);
    if (isNarrow) {
      el.textContent = dict.siteTitleShort || (isHe ? 'ספריית המפעל' : 'Библиотека завода');
    } else {
      el.textContent = dict.siteTitleFull || (isHe ? 'ספריית ההנדסה של המפעל' : 'Инженерная библиотека завода');
    }
    syncGuideTocOffset();
  }
  root.syncHeaderTitleByViewport = syncHeaderTitleByViewport;

  // v14.0.1 (приёмка): липкое оглавление учебника встаёт ровно под липкой шапкой
  // (высота шапки 86–90 px на планшете/десктопе); на телефоне шапка не липкая — отступ 0.
  // Возвращает фактический отступ в px.
  function syncGuideTocOffset() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return 0;
    const headerEl = document.querySelector('.site-header');
    let offset = 0;
    if (headerEl) {
      const pos = window.getComputedStyle(headerEl).position;
      if (pos === 'sticky' || pos === 'fixed') {
        offset = Math.ceil(headerEl.getBoundingClientRect().height);
      }
    }
    document.documentElement.style.setProperty('--guide-toc-top', `${offset}px`);
    return offset;
  }
  root.syncGuideTocOffset = syncGuideTocOffset;

  root.scrollAndFocusBlock = function (targetEl, focusEl, options = {}) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const headerEl = document.querySelector('.site-header');
    const headerHeight = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 64;
    const padTop = options.padTop !== undefined ? options.padTop : 12;
    const elToScroll = targetEl || focusEl;
    if (elToScroll) {
      const rect = elToScroll.getBoundingClientRect();
      const targetTop = Math.max(0, Math.round(window.scrollY + rect.top - (headerHeight + padTop)));
      window.scrollTo({ top: targetTop, behavior: 'instant' });
      if (options.smooth) {
        const prefersReduced = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        elToScroll.dataset.lastScrollBehavior = prefersReduced ? 'instant' : 'smooth';
        if (!prefersReduced) {
          try {
            window.scrollTo({ top: targetTop, behavior: 'smooth' });
          } catch (_) {}
        }
      }
    }
    const elToFocus = focusEl || (elToScroll && elToScroll.querySelector('h1, h2, h3, h4, th')) || elToScroll;
    if (elToFocus && typeof elToFocus.focus === 'function') {
      if (!elToFocus.hasAttribute('tabindex')) {
        elToFocus.setAttribute('tabindex', '-1');
      }
      try {
        elToFocus.focus({ preventScroll: true });
      } catch (_) {
        try { elToFocus.focus(); } catch (_2) {}
      }
    }
  };

  root.toggleHelpPopover = function (key) {
    const map = {
      units: { btn: 'help-btn-units', pop: 'help-popover-units' },
      currency: { btn: 'help-btn-currency', pop: 'help-popover-currency' },
      'sec-terms': { btn: 'help-btn-sec-terms', pop: 'help-popover-sec-terms' }
    };
    const item = map[key];
    if (!item) return;
    const btnEl = document.getElementById(item.btn);
    const popEl = document.getElementById(item.pop);
    if (!popEl) return;
    const isHidden = popEl.hasAttribute('hidden');
    if (isHidden) {
      popEl.removeAttribute('hidden');
      if (btnEl) btnEl.setAttribute('aria-expanded', 'true');
    } else {
      popEl.setAttribute('hidden', '');
      if (btnEl) btnEl.setAttribute('aria-expanded', 'false');
    }
  };

  root.closeHelpPopovers = function () {
    const pairs = [
      { btn: 'help-btn-units', pop: 'help-popover-units' },
      { btn: 'help-btn-currency', pop: 'help-popover-currency' },
      { btn: 'help-btn-sec-terms', pop: 'help-popover-sec-terms' }
    ];
    for (const p of pairs) {
      const popEl = document.getElementById(p.pop);
      const btnEl = document.getElementById(p.btn);
      if (popEl && !popEl.hasAttribute('hidden')) {
        popEl.setAttribute('hidden', '');
      }
      if (btnEl) btnEl.setAttribute('aria-expanded', 'false');
    }
  };

  function renderToolsSubnavAndSettingsAndAbout() {
    const lang = AppState.lang;
    const isHe = lang === 'he';

    const toolsSubnav = document.getElementById('tools-subnav-bar');
    if (toolsSubnav) {
      const toolTabs = [
        { id: 'sec-survey', ru: 'Обход и замеры (A4)', he: 'סיור ציוד ומדידות (A4)' },
        { id: 'sec-shift-log', ru: 'Сменный журнал (A4)', he: 'יומן משמרת (A4)' },
        { id: 'sec-saved', ru: 'Мои расчёты', he: 'החישובים שלי' },
        { id: 'sec-steam-table', ru: 'Таблица пара', he: 'טבלת קיטור' },
        { id: 'sec-glossary', ru: 'Словарь RU/HE/EN', he: 'מילון RU/HE/EN' },
        { id: 'sec-copyright', ru: 'Источники S01–S23', he: 'מקורות S01–S23' },
        { id: 'sec-settings', ru: 'Настройки и печать', he: 'הגדרות והדפסה' }
      ];
      toolsSubnav.setAttribute('aria-label', isHe ? 'כלי משמרת' : 'Инструменты смены');
      toolsSubnav.innerHTML = toolTabs.map((t) => {
        const isAct = AppState.activeToolId === t.id;
        return `
          <a href="#${t.id}" class="tools-subnav-btn ${isAct ? 'active' : ''}" data-tool-tab="${t.id}" aria-selected="${isAct ? 'true' : 'false'}">
            ${isHe ? t.he : t.ru}
          </a>
        `;
      }).join('');
    }

    const settingsBox = document.getElementById('dynamic-settings-container');
    if (settingsBox) {
      const secTermsStateTxt = isHe
        ? (AppState.showSecTerms ? '✓ מונחי שפה שנייה: מוצגים' : '+ הצג מונחי שפה שנייה')
        : (AppState.showSecTerms ? '✓ 2-й язык терминов: вкл.' : '+ 2-й язык терминов');
      settingsBox.innerHTML = `
        <h2>${isHe ? 'הגדרות תצוגה והדפסת גיליונות משמרת (A4)' : 'Настройки отображения и быстрая печать (A4)'}</h2>
        <p style="color:var(--text-secondary); margin-block-end:1rem;">
          ${isHe
            ? 'כאן ניתן להפעיל או להסתיר מונחי שפה שנייה (רוסית/עברית) בכותרות הפרקים ולהדפיס במהירות את גיליון המשמרת הנוכחי בפורמט A4.'
            : 'Здесь можно включить или скрыть подписи терминов на втором языке (RU/HE) и перейти к печати сменного бланка A4.'}
        </p>
        <div style="display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center;">
          <button type="button" class="btn btn-secondary" id="sec-terms-toggle-btn" aria-pressed="${AppState.showSecTerms ? 'true' : 'false'}" onclick="window.toggleSecondaryTerms()">
            ${secTermsStateTxt}
          </button>
          <button type="button" class="help-tip-btn" id="help-btn-sec-terms" aria-expanded="false" aria-controls="help-popover-sec-terms" aria-label="${isHe ? 'עזרה לגבי מונחי שפה שנייה' : 'Справка по терминам 2-го языка'}" onclick="window.toggleHelpPopover('sec-terms')">?</button>
          <button type="button" class="btn btn-primary" id="quick-print-btn" onclick="window.navigateToHash('#sec-shift-log')">
            ${isHe ? 'הדפסת יומן משמרת (A4)' : 'Печать бланка смены (A4)'}
          </button>
        </div>
        <div class="help-tip-popover" id="help-popover-sec-terms" role="region" hidden>
          ${isHe
            ? 'מציג או מסתיר מונחים הנדסיים מקבילים בשפה השנייה (רוסית בעת קריאה בעברית ולהפך) בכותרות הפרקים ובטבלאות הפרמטרים.'
            : 'Показывает или скрывает параллельные инженерные термины на втором языке (иврит при чтении на русском и наоборот) в заголовках и таблицах параметров.'}
        </div>
      `;
    }

    const aboutBox = document.getElementById('dynamic-about-container');
    if (aboutBox) {
      aboutBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-block-end:0.85rem;">
          <h2 style="margin:0;">${isHe ? 'אודות המהדורה וכללי בטיחות' : 'О редакции и правила безопасности'}</h2>
          <a href="#home" class="btn btn-outline btn-sm">${isHe ? 'חזרה לדף הבית →' : '← На главную'}</a>
        </div>
        <div class="metadata-disclaimer-card" id="project-metadata-disclaimer" style="margin-block-start:0;">
          <div class="metadata-disclaimer-header">
            <strong>${isHe ? `מהדורה ${APP_VERSION.edition} · ליבת חישוב ${APP_VERSION.core}` : `Редакция ${APP_VERSION.edition} · расчётное ядро ${APP_VERSION.core}`}</strong>
            <span class="badge-sub" dir="ltr">${isHe ? `Rev. ${APP_VERSION.edition} • Core ${APP_VERSION.core} • ${APP_VERSION.date} • RU / HE` : `Ред. ${APP_VERSION.edition} • Ядро ${APP_VERSION.core} • ${APP_VERSION.date} • RU / HE`}</span>
          </div>
          <ul class="metadata-disclaimer-list">
            <li><strong>${isHe ? 'אופי לימודי-הנדסי:' : 'Учебно-расчётный характер:'}</strong> ${isHe ? 'החומרים באתר מיועדים להדרכת מפעילים ומהנדסים, אבחון תקלות וחישובי בקרה הנדסיים במפעל מזון.' : 'материалы сайта предназначены для инженерно-технического обучения, оперативной диагностики и проверочных расчётов персонала пищевого предприятия.'}</li>
            <li><strong>${isHe ? 'גבולות ישימות המחשבונים:' : 'Границы применимости калькуляторов:'}</strong> ${isHe ? 'מודולי החישוב מבוססים על נוסחאות מאומתות ממקורות S01–S23 בתחומי הלחץ, הטמפרטורה ומצבי הצבירה המצוינים בכל כרטיס, ואינם מחליפים תכנון הנדסי מפורט או מדידה מסחרית מכוילת.' : 'расчётные модули работают в явно указанных диапазонах давлений, температур и фазовых состояний (согласно S01–S23) и не заменяют проектный теплогидравлический расчёт или коммерческий учёт.'}</li>
            <li><strong>${isHe ? 'קדימות נהלי מפעל, ספרות יצרן (OEM) ונוהל LOTO:' : 'Приоритет заводских регламентов, OEM и LOTO:'}</strong> ${isHe ? 'בכל מקרה של סתירה, קדימות מוחלטת ניתנת לנהלי המפעל המחייבים, לספרות היצרן של הציוד המותקן בפועל (OEM) ולנוהל נעילה ותיוג LOTO.' : 'при любых расхождениях безусловный приоритет имеют действующие производственные инструкции предприятия, паспорта установленного оборудования (OEM) и процедура блокировки/маркировки LOTO.'}</li>
            <li><strong>${isHe ? 'אחסון מקומי בלבד בדפדפן (localStorage):' : 'Локальное хранение данных (localStorage):'}</strong> ${isHe ? 'טיוטות יומני המשמרת, שפת הממשק וההתקדמות בסימולטור נשמרים מקומית בלבד בדפדפן המכשיר שלכם ואינם נשלחים לשרת חיצוני.' : 'черновики сменных журналов, выбранный язык и прогресс прохождения тренажёра сохраняются только локально в браузере вашего устройства и не передаются на внешние серверы.'}</li>
          </ul>
        </div>
      `;
    }
  }

  root.switchView = function (viewName, options = {}) {
    const validViews = ['home', 'problem', 'learn', 'case', 'calc', 'tools', 'about'];
    const targetView = validViews.includes(viewName) ? viewName : 'home';
    AppState.activeView = targetView;

    document.querySelectorAll('.app-view').forEach((el) => {
      const isMatch = el.getAttribute('data-view') === targetView;
      el.classList.toggle('active-view', isMatch);
    });

    // Update active state on header and mobile nav links
    const navViewForHighlight = targetView === 'case' ? 'problem' : (targetView === 'about' ? 'home' : targetView);
    document.querySelectorAll('[data-nav-view]').forEach((el) => {
      const isAct = el.getAttribute('data-nav-view') === navViewForHighlight;
      el.classList.toggle('active', isAct);
      if (isAct) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });

    if (options.scrollTop !== false && typeof window !== 'undefined') {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (_) {
        window.scrollTo(0, 0);
      }
    }

    if (options.focusHeading !== false && typeof document !== 'undefined') {
      const activeContainer = document.querySelector(`.app-view[data-view="${targetView}"]`);
      if (activeContainer) {
        let heading = null;
        if (targetView === 'learn') {
          heading = activeContainer.querySelector('.active-system-article h2, h2, h1');
        } else if (targetView === 'tools') {
          heading = activeContainer.querySelector('.active-tool-subview h2, h2, h1');
        } else {
          heading = activeContainer.querySelector('h1, h2');
        }
        if (heading) {
          if (!heading.hasAttribute('tabindex')) {
            heading.setAttribute('tabindex', '-1');
          }
          try {
            heading.focus({ preventScroll: true });
          } catch (_) {}
        }
      }
    }
  };

  root.showToolSubview = function (toolId, options = {}) {
    const validTools = ['sec-survey', 'sec-shift-log', 'sec-saved', 'sec-steam-table', 'sec-glossary', 'sec-copyright', 'sec-settings'];
    const targetTool = validTools.includes(toolId) ? toolId : 'sec-survey';
    AppState.activeToolId = targetTool;

    document.querySelectorAll('.tool-subview').forEach((sec) => {
      sec.classList.toggle('active-tool-subview', sec.getAttribute('data-tool-id') === targetTool);
    });
    document.querySelectorAll('[data-tool-tab]').forEach((btn) => {
      const isAct = btn.getAttribute('data-tool-tab') === targetTool;
      btn.classList.toggle('active', isAct);
      btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
    });

    root.switchView('tools', options);
  };

  let suppressNextHashChangeFor = null;
  root.navigateToHash = function (hash) {
    if (window.location.hash === hash) {
      handleHashRoute();
    } else {
      suppressNextHashChangeFor = hash;
      window.location.hash = hash;
      handleHashRoute();
    }
  };

  root.toggleHeaderSearch = function (forceState) {
    const drawer = document.getElementById('header-search-drawer');
    const toggleBtn = document.getElementById('search-toggle-btn');
    const searchInput = document.getElementById('global-search');
    if (!drawer) return;
    const isCurrentlyOpen = !drawer.hasAttribute('hidden');
    const nextOpen = typeof forceState === 'boolean' ? forceState : !isCurrentlyOpen;
    if (nextOpen) {
      drawer.removeAttribute('hidden');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
      if (searchInput) {
        try {
          searchInput.focus();
        } catch (_) {}
      }
    } else {
      drawer.setAttribute('hidden', '');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    }
  };

  root.clearSearch = function () {
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
    }
  };

  root.activateCalculatorTab = function (panelId) {
    root.openCalculatorTab(panelId, false);
  };

  root.toggleSecondaryTerms = function () {
    AppState.showSecTerms = !AppState.showSecTerms;
    saveJson(STORAGE_KEY_SEC_TERMS, AppState.showSecTerms);
    document.body.classList.toggle('hide-sec-terms', !AppState.showSecTerms);
    root.setAppLanguage(AppState.lang);
  };

  root.selectSystem = function (sysId, scrollToArticle) {
    if (!getSystemsMap()[sysId]) return;
    const isSameSysAndRendered = AppState.activeSystemId === sysId && Boolean(document.getElementById(`system-${sysId}`));
    AppState.activeSystemId = sysId;
    renderHomeDashboard();
    if (!isSameSysAndRendered) {
      renderSystemsSection();
    } else {
      document.querySelectorAll('.system-tab-btn').forEach((btn) => {
        const isAct = btn.getAttribute('data-sys-tab') === sysId;
        btn.classList.toggle('active', isAct);
        btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
      });
      document.querySelectorAll('.system-article').forEach((art) => {
        art.classList.toggle('active-system-article', art.id === `system-${sysId}`);
      });
      setupGuideTocObserver();
    }
    root.switchView('learn', {
      scrollTop: scrollToArticle !== false,
      focusHeading: scrollToArticle !== false
    });
  };

  const CALC_OVERVIEW_GROUPS = root.CALC_OVERVIEW_GROUPS = [
    {
      sysId: 'steam',
      title: { ru: '1. Паровая система', he: '1. מערכת קיטור' },
      modules: [
        {
          modId: '5a',
          code: '5А',
          codeHe: '5א',
          panelId: 'calc-panel-5',
          hash: '#calc-5a',
          title: { ru: 'Модуль 5А: Перевод давления (изб. ⇄ абс.)', he: 'מודול 5א: המרת לחץ (יחסי ⇄ מוחלט)' },
          what: {
            ru: 'Переводит показание манометра P_gauge в абсолютное давление P_abs для таблиц насыщенного пара и обратно.',
            he: 'ממיר קריאת מד לחץ יחסית P_gauge ללחץ מוחלט P_abs עבור טבלאות קיטור רווי ולהפך.'
          },
          inputs: {
            ru: 'P_вх (бар / psi / кПа), P_atm',
            he: 'P_in (bar / psi / kPa), P_atm'
          }
        },
        {
          modId: '5b',
          code: '5Б',
          codeHe: '5ב',
          panelId: 'calc-panel-5',
          hash: '#calc-5b',
          title: { ru: 'Модуль 5Б: Расход пара по тепловой нагрузке', he: 'מודול 5ב: ספיקת קיטור לפי עומס חום' },
          what: {
            ru: 'Считает часовой расход пара m_s по тепловой мощности или нагреву продукта, оценку КО и продувку котла.',
            he: 'מחשב ספיקת קיטור שעתית m_s לפי הספק חום או חימום מוצר, אומדן מלכודת וניקוז דוד.'
          },
          inputs: {
            ru: 'Q_load или m_p·c_p·ΔT, h_fg, сухость x',
            he: 'Q_load או m_p·c_p·ΔT, h_fg, יובש x'
          }
        }
      ]
    },
    {
      sysId: 'condensate',
      title: { ru: '2. Возврат конденсата', he: '2. החזרת עיבוי' },
      modules: [
        {
          modId: '1a',
          code: '1А',
          codeHe: '1א',
          panelId: 'calc-panel-1',
          hash: '#calc-1a',
          title: { ru: 'Модуль 1А: Потери и возврат конденсата', he: 'מודול 1א: הפסדים והחזרת עיבוי' },
          what: {
            ru: 'Оценивает потери горячей воды, физического тепла, топлива котла и денег за смену и за год.',
            he: 'מעריך הפסדי מים חמים, חום מורגש, דלק בדוד ועלות כספית למשמרת ולשנה.'
          },
          inputs: {
            ru: 'V_c или m_c, T_cond, T_makeup, t_year',
            he: 'V_c או m_c, T_cond, T_makeup, t_year'
          }
        },
        {
          modId: '1b',
          code: '1Б',
          codeHe: '1ב',
          panelId: 'calc-panel-1',
          hash: '#calc-1b',
          title: { ru: 'Модуль 1Б: Вторичный пар вскипания и ресивер TLV', he: 'מודול 1ב: קיטור הבזקה משני ומכל TLV' },
          what: {
            ru: 'Определяет долю и расход вторичного пара x_flash при сбросе давления и диаметр ресивера/выхлопа по таблицам TLV.',
            he: 'מחשב אחוז וספיקת קיטור הבזקה x_flash בפריקת לחץ וקוטר מכל/ארובה לפי טבלאות TLV.'
          },
          inputs: {
            ru: 'm_c, P₁ → P₂, h_f1, h_f2, h_fg2, D_op',
            he: 'm_c, P₁ → P₂, h_f1, h_f2, h_fg2, D_op'
          }
        }
      ]
    },
    {
      sysId: 'chillers',
      title: { ru: '3. Чиллеры и охлаждение', he: '3. צ\'ילרים וקירור' },
      modules: [
        {
          modId: '2',
          code: '2',
          codeHe: '2',
          panelId: 'calc-panel-2',
          hash: '#calc-2',
          title: { ru: 'Модуль 2: Чиллеры (Холодопроизводительность, Approach, COP)', he: 'מודול 2: צ\'ילרים (תפוקת קירור, Approach, COP)' },
          what: {
            ru: 'Считает тепловую нагрузку испарителя Q_evap (вода/гликоль), COP, кВт/TR и температурные подходы ΔT_app.',
            he: 'מחשב עומס קירור במאייד Q_evap (מים/גליקול), COP, kW/TR והפרשי גישה ΔT_app.'
          },
          inputs: {
            ru: 'V_w, T_evap,in → T_evap,out, W_elec, T_cond,out, T_sat,cond',
            he: 'V_w, T_evap,in → T_evap,out, W_elec, T_cond,out, T_sat,cond'
          }
        }
      ]
    },
    {
      sysId: 'air',
      title: { ru: '4. Сжатый воздух', he: '4. אוויר דחוס' },
      modules: [
        {
          modId: '3a',
          code: '3А',
          codeHe: '3א',
          panelId: 'calc-panel-3',
          hash: '#calc-3a',
          title: { ru: 'Модуль 3А: Пересчёт расхода воздуха (Nl/s ⇄ FAD)', he: 'מודול 3א: המרת ספיקת אוויר (NL/s ⇄ FAD)' },
          what: {
            ru: 'Переводит расход между нормальными условиями (Nl/s) и реальными условиями всаса компрессора (FAD).',
            he: 'ממיר ספיקת אוויר בין תנאים תקניים (NL/s) לתנאי יניקה בפועל של המדחס (FAD).'
          },
          inputs: {
            ru: 'Q₁, P₁_abs, T₁, P₂_abs, T₂, влажность φ',
            he: 'Q₁, P₁_abs, T₁, P₂_abs, T₂, לחות φ'
          }
        },
        {
          modId: '3b',
          code: '3Б',
          codeHe: '3ב',
          panelId: 'calc-panel-3',
          hash: '#calc-3b',
          title: { ru: 'Модуль 3Б: Оценка утечек сжатого воздуха', he: 'מודול 3ב: הערכת דליפות אוויר דחוס' },
          what: {
            ru: 'Считает расход и процент утечек сети по спаду давления в ресивере или по циклу Load/Unload.',
            he: 'מחשב ספיקה ואחוז דליפות ברשת לפי נפילת לחץ במכל או לפי מחזור Load/Unload.'
          },
          inputs: {
            ru: 'V_r, P₁ → P₂, t (или t_load, t_unload), Q_comp',
            he: 'V_r, P₁ → P₂, t (או t_load, t_unload), Q_comp'
          }
        },
        {
          modId: '3c',
          code: '3В',
          codeHe: '3ג',
          panelId: 'calc-panel-3',
          hash: '#calc-3c',
          title: { ru: 'Модуль 3В: Выпадение влаги при сжатии и осушке', he: 'מודול 3ג: התעבות לחות בדחיסה ובייבוש' },
          what: {
            ru: 'Рассчитывает часовую массу конденсата влаги в концевом охладителе и рефрижераторном осушителе по S13.',
            he: 'מחשב כמות מים מתעבים בשעה במצנן הקצה ובמייבש הקירור לפי S13.'
          },
          inputs: {
            ru: 'q_c (FAD), RH, T_amb, p_after, T_after',
            he: 'q_c (FAD), RH, T_amb, p_after, T_after'
          }
        }
      ]
    },
    {
      sysId: 'ro',
      title: { ru: '5. Обратный осмос (RO)', he: '5. אוסמוזה הפוכה (RO)' },
      modules: [
        {
          modId: '4a',
          code: '4А',
          codeHe: '4א',
          panelId: 'calc-panel-4',
          hash: '#calc-4a',
          title: { ru: 'Модуль 4А: Баланс потоков и селективность RO', he: 'מודול 4א: מאזן ספיקות ודחיית מלחים RO' },
          what: {
            ru: 'Проверяет выход пермеата Recovery Y, селективность по EC/TDS, фактор концентрирования CF и сходимость баланса.',
            he: 'בודק אחוז השבה Recovery Y, דחיית מלחים לפי EC/TDS, מקדם ריכוז CF ומאזן מוליכות.'
          },
          inputs: {
            ru: 'Q_p, Q_c, EC_f, EC_p, EC_c',
            he: 'Q_p, Q_c, EC_f, EC_p, EC_c'
          }
        },
        {
          modId: '4b',
          code: '4Б',
          codeHe: '4ב',
          panelId: 'calc-panel-4',
          hash: '#calc-4b',
          title: { ru: 'Модуль 4Б: Нормализация пермеата RO по Eq. 72', he: 'מודול 4ב: נרמול ספיקת פרמיאט לפי Eq. 72' },
          what: {
            ru: 'Приводит текущий расход пермеата к базовым условиям пуска (NDP и TCF) и проверяет защиту от обратного давления.',
            he: 'מנרמל את ספיקת הפרמיאט לתנאי ההרצה (NDP ו-TCF) ובודק הגנה מפני לחץ נגדי.'
          },
          inputs: {
            ru: 'Q_po, Q_co, Q_ps, NDP_s/o, TCF_s/o, P_p − P_c',
            he: 'Q_po, Q_co, Q_ps, NDP_s/o, TCF_s/o, P_p − P_c'
          }
        }
      ]
    }
  ];

  root.renderCalcOverview = function () {
    const lang = AppState.lang;
    const isHe = lang === 'he';
    const backBtn = document.getElementById('calc-back-overview-btn');
    if (backBtn) {
      backBtn.textContent = isHe ? 'כל המחשבונים (10 מודולים) →' : '← Все расчёты (10 модулей)';
    }
    const badgeEl = document.getElementById('calc-active-module-badge');
    if (badgeEl && AppState.activeSubmoduleId) {
      let foundMod = null;
      CALC_OVERVIEW_GROUPS.forEach((g) => {
        g.modules.forEach((m) => {
          if (m.modId === AppState.activeSubmoduleId) foundMod = m;
        });
      });
      badgeEl.textContent = foundMod ? (foundMod.title[lang] || foundMod.title.ru) : '';
    } else if (badgeEl) {
      badgeEl.textContent = '';
    }

    const box = document.getElementById('calc-overview-container');
    if (!box) return;
    box.innerHTML = `
      <div class="calc-overview-intro">
        <p>${isHe
          ? 'בחרו אחד מ-10 מודולי החישוב ההנדסיים לפי מערכת. כל מודול נפתח בנפרד עם שדות קלט, ערכות דוגמה (Presets), תוצאה מיידית וחישוב עלות שנתית.'
          : 'Выберите один из 10 расчётных модулей по нужной системе. По нажатию открывается выбранный модуль с полями ввода, готовыми примерами и расчётом годовой стоимости.'}</p>
      </div>
      <div class="calc-overview-groups">
        ${CALC_OVERVIEW_GROUPS.map((grp) => {
          const gMeta = getSystemVisualMeta(grp.sysId);
          return `
          <div class="calc-overview-group" id="calc-overview-group-${grp.sysId}">
            ${grp.sysId !== 'chillers' ? `<span id="calc-${grp.sysId}" class="legacy-anchor-target"></span>` : ''}
            <h3 class="calc-overview-group-title">
              <span class="calc-overview-sys-icon" style="background:${gMeta.bg}; color:${gMeta.fg};">${gMeta.svg}</span>
              <span>${grp.title[lang] || grp.title.ru}</span>
            </h3>
            <div class="calc-overview-cards-grid">
              ${grp.modules.map((m) => `
                <a href="${m.hash}" class="calc-overview-card" data-calc-mod="${m.modId}" onclick="window.openCalcModuleFromOverview('${m.modId}'); return false;">
                  <div class="calc-overview-card-top">
                    <span class="calc-overview-code" style="background:${gMeta.bg}; color:${gMeta.fg};">${isHe ? `מודול ${m.codeHe}` : `Модуль ${m.code}`}</span>
                    <span class="calc-overview-open-hint">${isHe ? 'פתיחה ←' : 'Открыть →'}</span>
                  </div>
                  <div class="calc-overview-card-title">${m.title[lang] || m.title.ru}</div>
                  <p class="calc-overview-card-what">${m.what[lang] || m.what.ru}</p>
                  <div class="calc-overview-card-inputs">
                    <strong>${isHe ? 'שדות קלט עיקריים:' : 'Главные поля ввода:'}</strong>
                    <span dir="ltr">${m.inputs[lang] || m.inputs.ru}</span>
                  </div>
                </a>
              `).join('')}
            </div>
          </div>
          `;
        }).join('')}
      </div>
    `;
  };

  root.showCalcOverview = function (doScroll) {
    AppState.calcViewMode = 'overview';
    AppState.activeSubmoduleId = null;
    const sec = document.getElementById('sec-calculators');
    if (sec) {
      sec.classList.add('calc-in-overview');
      sec.classList.remove('calc-single-module-mode');
    }
    const ov = document.getElementById('calc-overview-container');
    if (ov) ov.style.display = 'block';
    const backBar = document.getElementById('calc-back-to-overview-bar');
    if (backBar) backBar.style.display = 'none';
    document.querySelectorAll('.calc-submodule-block').forEach((el) => {
      el.classList.remove('hidden-submodule');
    });
    document.querySelectorAll('.calc-submodule-hr').forEach((el) => {
      el.style.display = '';
    });
    root.renderCalcOverview();
    root.switchView('calc', {
      scrollTop: doScroll !== false,
      focusHeading: doScroll !== false
    });
  };

  root.openCalcModuleFromOverview = function (modId) {
    const norm = String(modId || '').toLowerCase();
    const targetHash = '#calc-' + norm;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      root.showSingleCalcModule(norm, true);
    }
  };

  root.showSingleCalcModule = function (modCodeOrId, doScroll) {
    const norm = String(modCodeOrId || '').toLowerCase();
    const modToPanel = {
      '1a': 'calc-panel-1',
      '1b': 'calc-panel-1',
      '2':  'calc-panel-2',
      '3a': 'calc-panel-3',
      '3b': 'calc-panel-3',
      '3c': 'calc-panel-3',
      '4a': 'calc-panel-4',
      '4b': 'calc-panel-4',
      '5a': 'calc-panel-5',
      '5b': 'calc-panel-5'
    };
    const panelId = modToPanel[norm];
    if (!panelId) return;

    AppState.calcViewMode = 'single';
    AppState.activeSubmoduleId = norm;
    AppState.activeCalcPanelId = panelId;

    const sec = document.getElementById('sec-calculators');
    if (sec) {
      sec.classList.remove('calc-in-overview');
      sec.classList.add('calc-single-module-mode');
    }
    const ov = document.getElementById('calc-overview-container');
    if (ov) ov.style.display = 'none';
    const backBar = document.getElementById('calc-back-to-overview-bar');
    if (backBar) backBar.style.display = 'flex';

    document.querySelectorAll('.calc-tab-btn').forEach((b) => {
      const isTarget = b.dataset.target === panelId;
      b.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      b.classList.toggle('active', isTarget);
    });
    document.querySelectorAll('.calc-panel').forEach((p) => {
      p.classList.toggle('active', p.id === panelId);
    });

    document.querySelectorAll('.calc-submodule-block').forEach((el) => {
      const sub = el.getAttribute('data-submodule');
      el.classList.toggle('hidden-submodule', sub !== norm);
    });
    document.querySelectorAll('.calc-submodule-hr').forEach((el) => {
      el.style.display = 'none';
    });

    root.renderCalcOverview();
    root.switchView('calc', {
      scrollTop: doScroll !== false,
      focusHeading: doScroll !== false
    });
  };

  root.openCalculatorTab = function (panelId, doScroll) {
    AppState.calcViewMode = 'panel';
    AppState.activeSubmoduleId = null;
    AppState.activeCalcPanelId = panelId;

    const sec = document.getElementById('sec-calculators');
    if (sec) {
      sec.classList.remove('calc-in-overview');
      sec.classList.remove('calc-single-module-mode');
    }
    const ov = document.getElementById('calc-overview-container');
    if (ov) ov.style.display = 'none';
    const backBar = document.getElementById('calc-back-to-overview-bar');
    if (backBar) backBar.style.display = 'flex';

    document.querySelectorAll('.calc-submodule-block').forEach((el) => {
      el.classList.remove('hidden-submodule');
    });
    document.querySelectorAll('.calc-submodule-hr').forEach((el) => {
      el.style.display = '';
    });

    document.querySelectorAll('.calc-tab-btn').forEach((b) => {
      const isTarget = b.dataset.target === panelId;
      b.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      b.classList.toggle('active', isTarget);
    });
    document.querySelectorAll('.calc-panel').forEach((p) => {
      p.classList.toggle('active', p.id === panelId);
    });
    root.renderCalcOverview();
    root.switchView('calc', {
      scrollTop: doScroll !== false,
      focusHeading: doScroll !== false
    });
  };

  // =========================================================================
  // URL HASH ROUTING & BROWSER BACK/FORWARD SUPPORT
  // =========================================================================
  function handleHashRoute() {
    const rawHash = (window.location.hash || '').replace(/^#/, '').trim();
    const searchBanner = document.getElementById('search-results-banner');
    if (searchBanner) searchBanner.style.display = 'none';
    const searchDrawer = document.getElementById('header-search-drawer');
    if (searchDrawer && !searchDrawer.hasAttribute('hidden')) {
      root.toggleHeaderSearch(false);
    }

    if (!rawHash || rawHash === 'home' || rawHash === 'top') {
      root.switchView('home');
      return;
    }

    if (rawHash === 'problem') {
      root.switchView('problem');
      return;
    }

    if (rawHash.startsWith('problem-case-') || rawHash.startsWith('symptom-')) {
      const caseId = rawHash.startsWith('problem-')
        ? rawHash.replace(/^problem-/, '')
        : 'case-' + rawHash.replace(/^symptom-/, '').replace(/\./g, '-');
      root.selectProblemCase(caseId, true);
      root.switchView('problem', { scrollTop: false, focusHeading: false });
      const asideEl = document.getElementById('problem-aside-card') || document.getElementById('problem-' + caseId);
      const asideH2 = document.getElementById('problem-aside-h2');
      root.scrollAndFocusBlock(asideEl, asideH2);
      return;
    }

    if (rawHash === 'learn') {
      root.selectSystem(AppState.activeSystemId || 'steam', true);
      return;
    }

    if (rawHash === 'calc' || rawHash === 'sec-calculators') {
      root.showCalcOverview(true);
      return;
    }

    if (rawHash === 'tools') {
      root.showToolSubview(AppState.activeToolId || 'sec-survey');
      return;
    }

    if (rawHash === 'about' || rawHash === 'sec-about' || rawHash === 'project-metadata-disclaimer') {
      root.switchView('about');
      return;
    }

    if (rawHash === 'sec-trainer') {
      root.switchView('case');
      return;
    }

    // Legacy v8 anchors & direct system hashes
    const legacySysMap = {
      'sec-steam-condensate': 'steam',
      'sec-chillers': 'chillers',
      'sec-air': 'air',
      'sec-ro': 'ro',
      'sys-steam': 'steam',
      'sys-condensate': 'condensate',
      'sys-chillers': 'chillers',
      'sys-air': 'air',
      'sys-ro': 'ro',
      'system-steam': 'steam',
      'system-condensate': 'condensate',
      'system-chillers': 'chillers',
      'system-air': 'air',
      'system-ro': 'ro'
    };
    if (legacySysMap[rawHash]) {
      const sysId = legacySysMap[rawHash];
      root.selectSystem(sysId, false);
      const artEl = document.getElementById(`system-${sysId}`);
      const h2El = document.getElementById(`system-heading-${sysId}`) || (artEl && artEl.querySelector('h2'));
      root.scrollAndFocusBlock(artEl, h2El);
      return;
    }

    // Direct textbook guide block hashes (#guide-<sysId>-<key>)
    const guideHashMatch = rawHash.match(/^guide-(steam|condensate|chillers|air|ro)-([a-z0-9_]+)$/);
    if (guideHashMatch) {
      const sysId = guideHashMatch[1];
      const blockKey = guideHashMatch[2];
      root.selectSystem(sysId, false);
      root.setActiveGuideTocKey(sysId, blockKey);
      const blockEl = document.getElementById(rawHash);
      if (blockEl) {
        blockEl.querySelectorAll('details.guide-depth-details').forEach((d) => {
          d.open = true;
        });
      }
      const h2El = document.getElementById(`guide-heading-${sysId}-${blockKey}`) || (blockEl && blockEl.querySelector('h2'));
      // v14.0.1: блок встаёт под липким оглавлением (+12 px); на телефоне шапка не липкая,
      // поэтому её высота из отступа вычитается.
      const tocBarEl = document.getElementById(`guide-toc-${sysId}`);
      const measuredTocHeight = tocBarEl ? Math.ceil(tocBarEl.getBoundingClientRect().height) : 0;
      const tocBarHeight = measuredTocHeight > 0 ? measuredTocHeight : 56;
      const headerEl = document.querySelector('.site-header');
      const headerHeight = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 0;
      const stickyHeader = root.syncGuideTocOffset ? root.syncGuideTocOffset() : headerHeight;
      root.scrollAndFocusBlock(blockEl, h2El, { padTop: tocBarHeight + 12 - (headerHeight - stickyHeader) });
      return;
    }

    // Direct case hashes (#case-1-1 .. #case-5-2)
    if (rawHash.startsWith('case-')) {
      const found = getAllCases().find((c) => c.id === rawHash);
      if (found) {
        AppState.activeCaseId = found.id;
        AppState.activeSystemId = found.systemId;
        const p = getCaseProgress(found.id);
        root.recordLastPlace({ type: 'case', caseId: found.id, step: p.currentStep || 1 });
        renderHomeDashboard();
        renderSystemsSection();
        renderTrainerSection();
        root.switchView('case', { scrollTop: false, focusHeading: false });
        const caseCardEl = document.getElementById(found.id);
        const caseHeadingEl = document.getElementById(`case-heading-${found.id}`) || (caseCardEl && caseCardEl.querySelector('h3'));
        root.scrollAndFocusBlock(caseCardEl, caseHeadingEl);
        return;
      }
    }

    // Direct module hashes (#calc-1a .. #calc-5b)
    const calcModuleMap = {
      'calc-1a': { panelId: 'calc-panel-1', anchorId: 'calc-1a', modCode: '1A' },
      'calc-1b': { panelId: 'calc-panel-1', anchorId: 'calc-1b', modCode: '1B' },
      'calc-2':  { panelId: 'calc-panel-2', anchorId: 'calc-2',  modCode: '2' },
      'calc-3a': { panelId: 'calc-panel-3', anchorId: 'calc-3a', modCode: '3A' },
      'calc-3b': { panelId: 'calc-panel-3', anchorId: 'calc-3b', modCode: '3B' },
      'calc-3c': { panelId: 'calc-panel-3', anchorId: 'calc-3c', modCode: '3C' },
      'calc-4a': { panelId: 'calc-panel-4', anchorId: 'calc-4a', modCode: '4A' },
      'calc-4b': { panelId: 'calc-panel-4', anchorId: 'calc-4b', modCode: '4B' },
      'calc-5a': { panelId: 'calc-panel-5', anchorId: 'calc-5a', modCode: '5A' },
      'calc-5b': { panelId: 'calc-panel-5', anchorId: 'calc-5b', modCode: '5B' }
    };
    if (calcModuleMap[rawHash]) {
      const mCfg = calcModuleMap[rawHash];
      const shortId = mCfg.anchorId.replace(/^calc-/, '');
      root.recordLastPlace({ type: 'calc', panelId: mCfg.panelId, modCode: mCfg.modCode });
      renderHomeDashboard();
      if (typeof root.showSingleCalcModule === 'function') {
        root.showSingleCalcModule(mCfg.modCode, false);
      } else {
        root.openCalculatorTab(mCfg.panelId, false);
      }
      const anchorEl = document.getElementById(mCfg.anchorId) || document.getElementById(`calc-subblock-${shortId}`) || document.getElementById('sec-calculators');
      const headingEl = document.getElementById(`calc-heading-${shortId}`) || (anchorEl && anchorEl.querySelector('h3, h2'));
      root.scrollAndFocusBlock(anchorEl, headingEl);
      return;
    }

    // Direct calculator hashes (#calc-steam, #calc-chillers, #calc-panel-1..5)
    const calcSysOverviewMap = {
      'calc-steam': 'steam',
      'calc-condensate': 'condensate',
      'calc-chillers': 'chillers',
      'calc-air': 'air',
      'calc-ro': 'ro'
    };
    if (calcSysOverviewMap[rawHash]) {
      const sysId = calcSysOverviewMap[rawHash];
      if (sysId === 'chillers') {
        root.showSingleCalcModule('2', false);
        const anchorEl = document.getElementById('calc-2') || document.getElementById('calc-subblock-2');
        const headingEl = document.getElementById('calc-heading-2') || (anchorEl && anchorEl.querySelector('h3'));
        root.scrollAndFocusBlock(anchorEl, headingEl);
      } else {
        root.showCalcOverview(false);
        const grpEl = document.getElementById(`calc-overview-group-${sysId}`);
        const grpH3 = grpEl && grpEl.querySelector('h3');
        root.scrollAndFocusBlock(grpEl, grpH3);
      }
      return;
    }
    const calcMap = {
      'calc-panel-1': 'calc-panel-1',
      'calc-panel-2': 'calc-panel-2',
      'calc-panel-3': 'calc-panel-3',
      'calc-panel-4': 'calc-panel-4',
      'calc-panel-5': 'calc-panel-5'
    };
    if (calcMap[rawHash]) {
      root.openCalculatorTab(calcMap[rawHash], true);
      return;
    }

    // Tool subview hashes (#sec-survey, #sec-shift-log, #sec-saved, #sec-steam-table, #sec-glossary, #sec-copyright, #sec-settings)
    const toolHashMap = ['sec-survey', 'sec-shift-log', 'sec-saved', 'sec-steam-table', 'sec-glossary', 'sec-copyright', 'sec-settings'];
    if (toolHashMap.includes(rawHash)) {
      root.showToolSubview(rawHash, { scrollTop: false, focusHeading: false });
      const toolEl = document.getElementById(rawHash);
      const toolHeading = toolEl && toolEl.querySelector('h2, h1, h3');
      root.scrollAndFocusBlock(toolEl, toolHeading);
      return;
    }

    // Direct shift log hashes (#shift-log-steam, #shift-log-chillers, etc.)
    if (rawHash.startsWith('shift-log-')) {
      AppState.activeShiftLogId = rawHash;
      renderShiftLogsSection();
      root.showToolSubview('sec-shift-log', { scrollTop: false, focusHeading: false });
      const logEl = document.getElementById(rawHash) || document.getElementById('sec-shift-log');
      const logHeading = logEl && logEl.querySelector('h2, h3');
      root.scrollAndFocusBlock(logEl, logHeading);
      return;
    }

    // Glossary term or Source row anchors (#term-..., #gl-..., #source-...)
    if (rawHash.startsWith('gl-') || rawHash.startsWith('term-')) {
      if (typeof root.resetGlossaryFilters === 'function') {
        root.resetGlossaryFilters();
      }
      root.showToolSubview('sec-glossary', { scrollTop: false, focusHeading: false });
      const termId = rawHash.startsWith('gl-') ? rawHash.replace(/^gl-/, 'term-') : rawHash;
      const glEl = document.getElementById(termId) || document.getElementById(rawHash);
      if (glEl) {
        const focusTarget = glEl.querySelector('th') || glEl;
        root.scrollAndFocusBlock(glEl, focusTarget, { padTop: 16 });
      }
      return;
    }
    if (rawHash.startsWith('source-')) {
      root.showToolSubview('sec-copyright', { scrollTop: false, focusHeading: false });
      const srcEl = document.getElementById(rawHash);
      if (srcEl) {
        const focusTarget = srcEl.querySelector('th') || srcEl;
        root.scrollAndFocusBlock(srcEl, focusTarget, { padTop: 16 });
      }
      return;
    }

    // Any other DOM ID (e.g. #params-table-* or engineer details inside a system lesson)
    const targetEl = document.getElementById(rawHash);
    if (targetEl) {
      let scrollOptions = {};
      const parentSys = targetEl.closest('.system-article');
      if (parentSys && parentSys.id.startsWith('system-')) {
        const sysId = parentSys.id.replace(/^system-/, '');
        root.selectSystem(sysId, false);
        const tocBarEl = document.getElementById(`guide-toc-${sysId}`);
        const measuredTocHeight = tocBarEl ? Math.ceil(tocBarEl.getBoundingClientRect().height) : 0;
        const tocBarHeight = measuredTocHeight > 0 ? measuredTocHeight : 56;
        const headerEl = document.querySelector('.site-header');
        const headerHeight = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 0;
        const stickyHeader = root.syncGuideTocOffset ? root.syncGuideTocOffset() : headerHeight;
        scrollOptions = { padTop: tocBarHeight + 12 - (headerHeight - stickyHeader) };
      } else {
        const parentTool = targetEl.closest('.tool-subview');
        if (parentTool) {
          root.showToolSubview(parentTool.getAttribute('data-tool-id'), { scrollTop: false, focusHeading: false });
        } else {
          const parentView = targetEl.closest('.app-view');
          if (parentView) {
            root.switchView(parentView.getAttribute('data-view'), { scrollTop: false, focusHeading: false });
          }
        }
      }
      const freshEl = document.getElementById(rawHash) || targetEl;
      if (freshEl.tagName === 'DETAILS') freshEl.open = true;
      let ancestorDetails = freshEl.parentElement ? freshEl.parentElement.closest('details') : null;
      while (ancestorDetails) {
        ancestorDetails.open = true;
        ancestorDetails = ancestorDetails.parentElement ? ancestorDetails.parentElement.closest('details') : null;
      }
      const parentBlock = freshEl.closest('.guide-textbook-block');
      if (parentBlock && parentSys && parentSys.id.startsWith('system-')) {
        const sysId = parentSys.id.replace(/^system-/, '');
        parentBlock.querySelectorAll('details.guide-depth-details').forEach((d) => {
          d.open = true;
        });
        const bKey = parentBlock.getAttribute('data-guide-key');
        if (bKey) root.setActiveGuideTocKey(sysId, bKey);
      }
      const focusTarget = freshEl.querySelector('h1, h2, h3, h4, summary, th') || freshEl;
      root.scrollAndFocusBlock(freshEl, focusTarget, scrollOptions);
    }
  }

  // =========================================================================
  // GLOBAL INSTANT SEARCH (v13.1 Stage 3: GRANULAR 8-GROUP INDEX + KEYBOARD)
  // =========================================================================
  let activeSearchIndex = [];
  let activeSearchResultIdx = -1;

  function escapeSearchHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cleanTextForSearchLang(raw, lang) {
    let s = String(raw || '');
    if (typeof root.renderGuideMathHtml === 'function' && s.includes('$')) {
      s = root.renderGuideMathHtml(s, lang);
    }
    s = s.replace(/<span[^>]*class="[^"]*sec-term[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
    s = s.replace(/<[^>]+>/g, ' ');
    s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    if (lang === 'he') {
      s = s.replace(/\(\s*\*?[А-Яа-яЁё][^)]*\)/g, '');
      s = s.replace(/\s*\/\s*[А-Яа-яЁё][^)]*/g, '');
      s = s.replace(/[А-Яа-яЁё]+/g, '');
      s = s.replace(/\(\s*\)/g, '');
    }
    return s.replace(/\s+/g, ' ').trim();
  }

  function normalizeSearchStr(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[\u0591-\u05C7]/g, '')
      .replace(/[׳’‘`]/g, "'");
  }

  function tokenizeSearchWords(str) {
    const norm = normalizeSearchStr(str);
    return norm.match(/[a-zа-я\u05d0-\u05ea0-9']+/g) || [];
  }

  function wordMatchesSearchToken(normWord, qToken) {
    if (normWord.startsWith(qToken)) {
      return { matched: true, prefixLen: 0 };
    }
    if (/^[\u05d0-\u05ea]/.test(qToken) && qToken.length >= 2) {
      const m2 = normWord.match(/^(?:וה|וב|ול|ומ|שה|שב|של|שמ)/);
      if (m2 && normWord.slice(m2[0].length).startsWith(qToken)) {
        return { matched: true, prefixLen: m2[0].length };
      }
      const m1 = normWord.match(/^[בהוכלמש]/);
      if (m1 && normWord.slice(1).startsWith(qToken)) {
        return { matched: true, prefixLen: 1 };
      }
    }
    return { matched: false, prefixLen: 0 };
  }

  function buildSearchSnippetHtml(rawText, qTokens) {
    const text = String(rawText || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    const wordRegex = /[A-Za-zА-Яа-яЁё\u0591-\u05C7\u05D0-\u05EA0-9'׳’]+/g;
    const words = [];
    let m;
    while ((m = wordRegex.exec(text)) !== null) {
      const normW = normalizeSearchStr(m[0]);
      let matchInfo = null;
      for (const qt of qTokens) {
        const res = wordMatchesSearchToken(normW, qt);
        if (res.matched) {
          matchInfo = { qt, prefixLen: res.prefixLen };
          break;
        }
      }
      words.push({
        word: m[0],
        start: m.index,
        end: m.index + m[0].length,
        matchInfo
      });
    }
    if (words.length === 0) return escapeSearchHtml(text.slice(0, 90));

    const firstMatchIdx = words.findIndex((w) => w.matchInfo !== null);
    if (firstMatchIdx === -1) {
      let endIdx = 0;
      for (let i = 0; i < words.length; i++) {
        if (words[i].end > 95 && i > 0) break;
        endIdx = i;
      }
      const sliceEnd = words[endIdx].end;
      return escapeSearchHtml(text.slice(0, sliceEnd)) + (endIdx < words.length - 1 ? ' …' : '');
    }

    const centerWord = words[firstMatchIdx];
    let startWordIdx = firstMatchIdx;
    let endWordIdx = firstMatchIdx;
    while (startWordIdx > 0 && (centerWord.start - words[startWordIdx - 1].start) <= 42) {
      startWordIdx--;
    }
    while (endWordIdx < words.length - 1 && (words[endWordIdx + 1].end - centerWord.end) <= 52) {
      endWordIdx++;
    }

    let sliceStart = words[startWordIdx].start;
    if (sliceStart > 0 && /^[(«"']/.test(text[sliceStart - 1])) {
      sliceStart--;
    }
    let sliceEnd = words[endWordIdx].end;
    while (sliceEnd < text.length && /^[%)»"']/.test(text[sliceEnd])) {
      sliceEnd++;
    }

    let out = startWordIdx > 0 ? '… ' : '';
    let cursor = sliceStart;
    for (let i = startWordIdx; i <= endWordIdx; i++) {
      const w = words[i];
      if (w.start > cursor) {
        out += escapeSearchHtml(text.slice(cursor, w.start));
      }
      if (w.matchInfo) {
        out += `<mark>${escapeSearchHtml(w.word)}</mark>`;
      } else {
        out += escapeSearchHtml(w.word);
      }
      cursor = w.end;
    }
    if (sliceEnd > cursor) {
      out += escapeSearchHtml(text.slice(cursor, sliceEnd));
    }
    if (endWordIdx < words.length - 1) {
      out += ' …';
    }
    return out;
  }

  root.rebuildSearchIndex = function (langArg) {
    const lang = langArg === 'he' ? 'he' : 'ru';
    const isHe = lang === 'he';
    const items = [];

    const addItem = (entry) => {
      const title = cleanTextForSearchLang(entry.title, lang);
      const text = cleanTextForSearchLang(entry.text, lang);
      const words = tokenizeSearchWords(title + ' ' + text);
      items.push({
        type: entry.type,
        code: entry.code || '',
        caseId: entry.caseId || '',
        systemId: entry.systemId || '',
        title,
        text,
        href: entry.href,
        words
      });
    };

    // 1. Признаки (SYMPTOMS_LIST)
    const symptoms = (root.SYMPTOMS_LIST && Array.isArray(root.SYMPTOMS_LIST)) ? root.SYMPTOMS_LIST : [];
    symptoms.forEach((s) => {
      const shortSym = (s.shortSymptom && (s.shortSymptom[lang] || s.shortSymptom.ru)) || '';
      const obs = (s.observedDetails && (s.observedDetails[lang] || s.observedDetails.ru)) || '';
      const where = (s.whereVisible && (s.whereVisible[lang] || s.whereVisible.ru)) || '';
      addItem({
        type: 'symptom',
        code: s.code,
        caseId: s.caseId,
        systemId: s.systemId,
        title: isHe ? `תסמין ${s.code}: ${shortSym}` : `Признак ${s.code}: ${shortSym}`,
        text: `${shortSym}. ${obs} (${where})`,
        href: `#problem-${s.caseId}`
      });
    });

    // 2. Случаи (заголовок и наблюдения шага 1)
    getAllCases().forEach((c) => {
      const nc = normalizeCase(c, lang);
      if (!nc) return;
      const step1Html = (nc.steps && nc.steps[0] && nc.steps[0].contentHtml) || '';
      addItem({
        type: 'case',
        code: nc.code,
        caseId: nc.id,
        systemId: nc.systemId,
        title: nc.title,
        text: `${nc.title}. ${step1Html}`,
        href: `#${nc.id}`
      });
    });

    // 3. Расчёты (10 модулей из CALC_OVERVIEW_GROUPS + подписи полей из CALC_FORM_LABELS)
    const formLabelsDict = (root.I18N_UI && root.I18N_UI.CALC_FORM_LABELS) || {};
    const modFieldRegexMap = {
      '1a': /c1a_/,
      '1b': /c1b?_(?!a)/,
      '2':  /c2_/,
      '3a': /c3a_/,
      '3b': /c3b_/,
      '3c': /c3_(?!a|b)/,
      '4a': /c4a_/,
      '4b': /c4_(?!a)/,
      '5a': /c5a_/,
      '5b': /c5_(?!a)/
    };
    CALC_OVERVIEW_GROUPS.forEach((grp) => {
      (grp.modules || []).forEach((m) => {
        const mTitle = (m.title && (m.title[lang] || m.title.ru)) || '';
        const mWhat = (m.what && (m.what[lang] || m.what.ru)) || '';
        const mInputs = (m.inputs && (m.inputs[lang] || m.inputs.ru)) || '';
        const fieldRe = modFieldRegexMap[m.modId];
        const fieldLabels = [];
        if (fieldRe) {
          Object.keys(formLabelsDict).forEach((k) => {
            if (fieldRe.test(k)) {
              const lblObj = formLabelsDict[k];
              const lblTxt = lblObj && (lblObj[lang] || lblObj.ru);
              if (lblTxt) fieldLabels.push(lblTxt);
            }
          });
        }
        const fieldsJoined = fieldLabels.join(' · ');
        addItem({
          type: 'calc',
          code: isHe ? m.codeHe : m.code,
          systemId: grp.sysId,
          title: mTitle,
          text: `${mTitle}. ${mWhat} (${mInputs}). ${fieldsJoined}`,
          href: m.hash
        });
      });
    });

    // 4. Термины (все термины словаря GLOSSARY_ITEMS -> #term-...)
    const uiDict = (root.I18N_UI && root.I18N_UI.UI_STRINGS && root.I18N_UI.UI_STRINGS[lang]) || {};
    const glossary = (root.GLOSSARY_ITEMS && Array.isArray(root.GLOSSARY_ITEMS)) ? root.GLOSSARY_ITEMS : [];
    glossary.forEach((g) => {
      const codePrefix = g.abbr ? `${g.abbr} (${g.en}) — ` : '';
      const codeSuffix = !g.abbr && g.en ? ` (${g.en})` : '';
      if (isHe) {
        const defHe = (g.def && g.def.he) ? g.def.he : (uiDict.guideRuOnlyNotice || '');
        addItem({
          type: 'term',
          code: g.abbr || g.id,
          systemId: g.systemId || '',
          title: `${codePrefix}${g.he}${codeSuffix}`,
          text: `${codePrefix}${g.he}${codeSuffix} ${g.heVariants || ''}. ${defHe}`,
          href: `#${g.id}`
        });
      } else {
        const extraSyn = (g.id === 'term-boiler-blowdown' || g.id === 'term-concentration-factor')
          ? ' (кратность упаривания / концентрирования котловой воды Cycles of Concentration)'
          : '';
        addItem({
          type: 'term',
          code: g.abbr || g.id,
          systemId: g.systemId || '',
          title: `${codePrefix}${g.ru}${codeSuffix}`,
          text: `${codePrefix}${g.ru} ${g.v9RuTitle || ''}${codeSuffix} — ${g.heVariants || g.he}. ${(g.def && g.def.ru) || ''} ${g.v9DefRu || ''}${extraSyn}`,
          href: `#${g.id}`
        });
      }
    });

    // 4B. Учебник (все блоки GUIDE_SECTIONS каждой системы -> #guide-<sysId>-<key>)
    getSystemsList().forEach((sys) => {
      const sysShort = getSystemVisualMeta(sys.id).shortTitle[lang];
      const guideData = (root.GUIDE_SECTIONS && root.GUIDE_SECTIONS[sys.id]) || { blocks: [] };
      const guideBlocksArr = Array.isArray(guideData.blocks) ? guideData.blocks : [];

      guideBlocksArr.forEach((b) => {
        const meta = GUIDE_TOC_META[b.key] || { fullRu: b.key, fullHe: b.key };
        const blockTitle = isHe
          ? ((b.title && b.title.he) || meta.fullHe)
          : ((b.title && b.title.ru) || meta.fullRu);
        const fullTitle = `${sysShort}: ${blockTitle}`;
        let blockText = '';

        if (b.key === 'how') {
          const purp = (sys.purposeHtml && (sys.purposeHtml[lang] || sys.purposeHtml.ru)) || '';
          const gIntro = (b.html && (b.html[lang] || (!isHe && b.html.ru))) || '';
          blockText = `${purp} ${gIntro}`;
        } else if (b.key === 'nodes') {
          const nodesTxt = ((sys.diagram && sys.diagram.nodes) || []).map((n) => {
            const nt = (n.title && (n.title[lang] || n.title.ru)) || '';
            const nw = (n.whatIs && (n.whatIs[lang] || n.whatIs.ru)) || '';
            const np = (n.purpose && (n.purpose[lang] || n.purpose.ru)) || '';
            return `${nt} ${nw} ${np}`;
          }).join(' ');
          const gNodes = (b.html && (b.html[lang] || (!isHe && b.html.ru))) || '';
          blockText = `${nodesTxt} ${gNodes}`;
        } else if (b.key === 'logbook') {
          const ptRows = (sys.paramsTable && sys.paramsTable.rows && (sys.paramsTable.rows[lang] || sys.paramsTable.rows.ru)) || [];
          const rowsTxt = ptRows.map((r) => r.join(' ')).join(' ');
          const gLog = (b.html && (b.html[lang] || (!isHe && b.html.ru))) || '';
          blockText = `${rowsTxt} ${gLog}`;
        } else if (b.key === 'selfcheck') {
          const hasHeQa = (b.questions || []).every((qItem) => qItem.q && qItem.q.he && qItem.a && qItem.a.he);
          if (isHe && !hasHeQa) {
            blockText = `${blockTitle}. ${uiDict.guideRuOnlyNotice || ''}`;
          } else {
            const qaTxt = (b.questions || []).map((qItem) =>
              `${(qItem.q && (qItem.q[lang] || qItem.q.ru)) || ''} ${(qItem.a && (qItem.a[lang] || qItem.a.ru)) || ''}`
            ).join(' ');
            blockText = `${blockTitle}. ${qaTxt}`;
          }
        } else if (b.key === 'formulas') {
          const princ = (sys.principleHtml && (sys.principleHtml[lang] || sys.principleHtml.ru)) || '';
          const gForm = (b.html && (b.html[lang] || (!isHe && b.html.ru))) || '';
          blockText = `${blockTitle}. ${gForm} ${princ}`;
        } else {
          const gHtml = (b.html && (b.html[lang] || (!isHe && b.html.ru))) || '';
          blockText = (isHe && !gHtml) ? `${blockTitle}. ${uiDict.guideRuOnlyNotice || ''}` : `${blockTitle}. ${gHtml}`;
        }

        addItem({
          type: 'guide',
          code: b.key,
          systemId: sys.id,
          title: fullTitle,
          text: blockText,
          href: `#guide-${sys.id}-${b.key}`
        });
      });
    });

    // 5. Строки таблицы параметров (paramsTable каждой системы -> #params-table-...)
    getSystemsList().forEach((sys) => {
      const pt = sys.paramsTable;
      if (!pt || !pt.rows) return;
      const rows = pt.rows[lang] || pt.rows.ru || [];
      const sysShort = getSystemVisualMeta(sys.id).shortTitle[lang];
      rows.forEach((row) => {
        const paramName = cleanTextForSearchLang(row[0] || '', lang);
        const rowJoined = row.map((cell) => cleanTextForSearchLang(cell, lang)).join(' · ');
        addItem({
          type: 'param',
          systemId: sys.id,
          title: `${sysShort}: ${paramName}`,
          text: rowJoined,
          href: `#params-table-${sys.id}`
        });
      });
    });

    // 6. Системы (название и выжимка -> #system-...)
    getSystemsList().forEach((sys) => {
      const sysTitle = (sys.title && (sys.title[lang] || sys.title.ru)) || '';
      const sysSum = (sys.shortSummary && (sys.shortSummary[lang] || sys.shortSummary.ru)) || '';
      addItem({
        type: 'system',
        systemId: sys.id,
        title: sysTitle,
        text: `${sysTitle}. ${sysSum}`,
        href: `#system-${sys.id}`
      });
    });

    // 7. Источники (S01–S23 -> #source-S...)
    const sources = (root.SOURCES_REGISTRY && Array.isArray(root.SOURCES_REGISTRY)) ? root.SOURCES_REGISTRY : [];
    sources.forEach((s) => {
      const noteLocal = (s.note && (s.note[lang] || s.note.ru)) || '';
      addItem({
        type: 'source',
        code: s.code,
        title: `${s.code}: ${s.title}`,
        text: `${s.code} ${s.title} (${s.pages}) — ${noteLocal}`,
        href: `#source-${s.code}`
      });
    });

    // 8. Инструменты (обход, журнал, мои расчёты, таблица пара)
    const toolsList = [
      {
        href: '#sec-survey',
        title: isHe ? 'סיור ציוד ומדידות (A4)' : 'Обход и замеры (A4)',
        text: isHe
          ? 'סיור ציוד ומדידות במשמרת, רשימת בקרה לפי 5 מערכות, ייצוא CSV והדפסת גיליון A4'
          : 'Обход и замеры оборудования на смене, контрольный лист по 5 системам, экспорт CSV и печать бланка A4'
      },
      {
        href: '#sec-shift-log',
        title: isHe ? 'יומן משמרת (A4)' : 'Сменный журнал (A4)',
        text: isHe
          ? 'יומני משמרת לבקרה תפעולית ב-5 מערכות (08:00, 12:00, 16:00, 20:00), הדפסת A4 וייצוא CSV'
          : 'Сменные журналы оперативного контроля по 5 системам (08:00, 12:00, 16:00, 20:00), печать A4 и экспорт CSV'
      },
      {
        href: '#sec-saved',
        title: isHe ? 'החישובים שלי' : 'Мои расчёты',
        text: isHe
          ? 'חישובים שמורים בדפדפן, השוואת תרחישים לפני/אחרי וחיסכון שנתי ב-$ וב-₪'
          : 'Сохранённые расчёты в браузере, сравнение сценариев «Было / Стало» и годовой экономии в $ и ₪'
      },
      {
        href: '#sec-steam-table',
        title: isHe ? 'טבלת קיטור רווי' : 'Таблица насыщенного пара',
        text: isHe
          ? 'טבלת ייחוס לקיטור רווי (P_barg, P_bara, T_sat, h_f, h_fg, h_g) ואינטרפולציה ליניארית'
          : 'Справочная таблица насыщенного водяного пара (P_barg, P_bara, T_sat, h_f, h_fg, h_g) и линейная интерполяция'
      }
    ];
    toolsList.forEach((t) => {
      addItem({
        type: 'tool',
        title: t.title,
        text: t.text,
        href: t.href
      });
    });

    activeSearchIndex = items;
    root.SEARCH_INDEX = items;
    return items;
  };

  root.onSearchResultClick = function (event, href) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    root.clearSearch();
    root.toggleHeaderSearch(false);
    root.navigateToHash(href);
    return false;
  };

  root.applySearchSuggestion = function (term) {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;
    searchInput.value = term;
    searchInput.dispatchEvent(new Event('input'));
    try { searchInput.focus(); } catch (_) {}
  };

  function initGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    const searchBanner = document.getElementById('search-results-banner');
    const searchStatus = document.getElementById('search-status-text');
    const searchList = document.getElementById('search-results-list');
    if (!searchInput || !searchBanner || !searchStatus) return;

    if (!activeSearchIndex || activeSearchIndex.length === 0) {
      root.rebuildSearchIndex(AppState.lang);
    }

    const groupOrder = ['symptom', 'case', 'calc', 'term', 'guide', 'param', 'system', 'source', 'tool'];
    const groupLabels = {
      symptom: { ru: 'Признаки', he: 'תסמינים' },
      case:    { ru: 'Случаи', he: 'אירועים' },
      calc:    { ru: 'Расчёты', he: 'חישובים' },
      term:    { ru: 'Термины словаря', he: 'מונחי מילון' },
      guide:   { ru: 'Учебник', he: 'ספר לימוד' },
      param:   { ru: 'Таблицы параметров', he: 'טבלאות פרמטרים' },
      system:  { ru: 'Системы', he: 'מערכות' },
      source:  { ru: 'Источники S01–S23', he: 'מקורות S01–S23' },
      tool:    { ru: 'Инструменты', he: 'כלים' }
    };

    function updateKeyboardHighlight() {
      if (!searchList) return;
      const items = searchList.querySelectorAll('.search-preview-item');
      items.forEach((el, idx) => {
        const isSel = idx === activeSearchResultIdx;
        el.classList.toggle('active-search-item', isSel);
        el.setAttribute('aria-selected', isSel ? 'true' : 'false');
        if (isSel && el.id) {
          searchInput.setAttribute('aria-activedescendant', el.id);
          try { el.scrollIntoView({ block: 'nearest' }); } catch (_) {}
        }
      });
      if (activeSearchResultIdx < 0) {
        searchInput.removeAttribute('aria-activedescendant');
      }
    }

    searchInput.addEventListener('keydown', (e) => {
      if (!searchList) return;
      const items = searchList.querySelectorAll('.search-preview-item');
      if (e.key === 'ArrowDown') {
        if (items.length > 0) {
          e.preventDefault();
          activeSearchResultIdx = (activeSearchResultIdx + 1) % items.length;
          updateKeyboardHighlight();
        }
      } else if (e.key === 'ArrowUp') {
        if (items.length > 0) {
          e.preventDefault();
          activeSearchResultIdx = activeSearchResultIdx <= 0 ? items.length - 1 : activeSearchResultIdx - 1;
          updateKeyboardHighlight();
        }
      } else if (e.key === 'Enter') {
        if (items.length > 0) {
          e.preventDefault();
          const targetIdx = activeSearchResultIdx >= 0 && activeSearchResultIdx < items.length ? activeSearchResultIdx : 0;
          items[targetIdx].click();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        root.clearSearch();
        root.toggleHeaderSearch(false);
      }
    });

    searchInput.addEventListener('input', () => {
      const rawQuery = searchInput.value.trim();
      const lang = AppState.lang;
      const isHe = lang === 'he';
      activeSearchResultIdx = -1;

      if (!rawQuery) {
        searchBanner.style.display = 'none';
        if (searchList) searchList.innerHTML = '';
        searchInput.removeAttribute('aria-activedescendant');
        return;
      }

      const qTokens = tokenizeSearchWords(rawQuery);
      if (qTokens.length === 0) {
        searchBanner.style.display = 'none';
        if (searchList) searchList.innerHTML = '';
        return;
      }

      const groupedMatches = {};
      groupOrder.forEach((g) => { groupedMatches[g] = []; });

      activeSearchIndex.forEach((item) => {
        const isMatch = qTokens.every((qt) =>
          item.words.some((w) => wordMatchesSearchToken(w, qt).matched)
        );
        if (isMatch && groupedMatches[item.type]) {
          groupedMatches[item.type].push(item);
        }
      });

      // Cap at 5 per group and 35 total in groupOrder (with title-match priority inside each group)
      let totalSelected = 0;
      const finalGroups = [];
      for (const gType of groupOrder) {
        if (totalSelected >= 35) break;
        const rawList = groupedMatches[gType] || [];
        const sortedList = rawList.slice().sort((a, b) => {
          const aTitleWords = tokenizeSearchWords(a.title);
          const bTitleWords = tokenizeSearchWords(b.title);
          const aTitleHits = qTokens.filter((qt) => aTitleWords.some((w) => wordMatchesSearchToken(w, qt).matched)).length;
          const bTitleHits = qTokens.filter((qt) => bTitleWords.some((w) => wordMatchesSearchToken(w, qt).matched)).length;
          return bTitleHits - aTitleHits;
        });
        const candidates = sortedList.slice(0, 5);
        const allowed = candidates.slice(0, 35 - totalSelected);
        if (allowed.length > 0) {
          finalGroups.push({
            type: gType,
            label: (groupLabels[gType] && (groupLabels[gType][lang] || groupLabels[gType].ru)) || gType,
            items: allowed
          });
          totalSelected += allowed.length;
        }
      }

      searchBanner.style.display = 'block';
      if (totalSelected > 0) {
        searchStatus.textContent = isHe
          ? `נמצאו ${totalSelected} תוצאות עבור "${rawQuery}":`
          : `Найдено результатов по запросу «${rawQuery}»: ${totalSelected}`;
      } else {
        searchStatus.textContent = isHe
          ? `לא נמצאו תוצאות עבור "${rawQuery}"`
          : `Ничего не нашлось по запросу «${rawQuery}»`;
      }

      if (!searchList) return;

      if (totalSelected === 0) {
        const suggestions = isHe
          ? ['COP', 'צ\'ילר', 'אוסמוזה']
          : ['COP', 'заморозка', 'отводчик'];
        const emptyTitle = isHe ? 'לא נמצאו תוצאות' : 'Ничего не нашлось';
        const hintsLabel = isHe ? 'נסו אחד מהמונחים:' : 'Попробуйте один из терминов:';
        const probBtnLbl = isHe ? 'תיאור תסמין ←' : 'Описать признак →';
        searchList.innerHTML = `
          <div class="search-empty-state" id="search-empty-state">
            <p class="search-empty-title"><strong>${emptyTitle}</strong></p>
            <div class="search-empty-suggestions">
              <span class="search-empty-hints-label">${hintsLabel}</span>
              ${suggestions.map((sug) => `
                <button type="button" class="btn btn-sm btn-outline search-suggestion-chip" onclick="window.applySearchSuggestion('${sug.replace(/'/g, "\\'")}')">${escapeSearchHtml(sug)}</button>
              `).join('')}
            </div>
            <div class="search-empty-actions">
              <a href="#problem" class="btn btn-sm btn-primary search-empty-problem-btn" onclick="return window.onSearchResultClick(event, '#problem')">${probBtnLbl}</a>
            </div>
          </div>
        `;
        return;
      }

      let flatIndex = 0;
      searchList.innerHTML = finalGroups.map((grp) => `
        <div class="search-group-block" data-search-group="${grp.type}">
          <div class="search-group-header">${escapeSearchHtml(grp.label)}</div>
          ${grp.items.map((item) => {
            const idx = flatIndex++;
            const snippetHtml = buildSearchSnippetHtml(item.text, qTokens);
            return `
              <a class="search-preview-item"
                id="search-result-item-${idx}"
                role="option"
                aria-selected="false"
                href="${item.href}"
                data-type="${item.type}"
                data-code="${escapeSearchHtml(item.code)}"
                data-case-id="${escapeSearchHtml(item.caseId)}"
                onclick="return window.onSearchResultClick(event, '${item.href}')">
                <strong>${escapeSearchHtml(item.title)}</strong>
                <span class="search-item-snippet">${snippetHtml}</span>
              </a>
            `;
          }).join('')}
        </div>
      `).join('');
    });
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  function initApp() {
    document.querySelectorAll('[data-lang-switch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        root.setAppLanguage(btn.getAttribute('data-lang-switch'));
      });
    });

    document.querySelectorAll('.calc-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root.openCalculatorTab(btn.dataset.target, false);
      });
    });

    const dlg = document.getElementById('diagram-node-dialog');
    if (dlg) {
      dlg.addEventListener('close', () => {
        if (lastDialogTriggerEl && typeof lastDialogTriggerEl.focus === 'function' && document.contains(lastDialogTriggerEl)) {
          try {
            lastDialogTriggerEl.focus({ preventScroll: true });
          } catch (_) {
            lastDialogTriggerEl.focus();
          }
        }
      });
    }

    root.setAppLanguage(AppState.lang);
    initGlobalSearch();
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (typeof root.closeHelpPopovers === 'function') root.closeHelpPopovers();
        const dlg = document.getElementById('diagram-node-dialog');
        if (dlg && (dlg.open || dlg.hasAttribute('open'))) {
          if (typeof dlg.close === 'function') dlg.close();
          else dlg.removeAttribute('open');
        }
        const drawer = document.getElementById('header-search-drawer');
        if (drawer && !drawer.hasAttribute('hidden') && typeof root.toggleHeaderSearch === 'function') {
          root.toggleHeaderSearch(false);
        }
      }
    });
    window.addEventListener('resize', syncHeaderTitleByViewport);
    window.addEventListener('resize', () => {
      if (AppState.activeView === 'learn') setupGuideTocObserver();
    });

    // v14 Stage 2.3 + v15.2 (п. 2.4d): Expand all self-check answers and depth details automatically in print mode
    if (typeof window !== 'undefined' && window.matchMedia) {
      const printMql = window.matchMedia('print');
      const handlePrintMediaChange = (e) => {
        if (e.matches) {
          document.querySelectorAll('details.selfcheck-answer, details.guide-depth-details').forEach((d) => {
            if (!d.open) {
              d.setAttribute('data-opened-for-print', 'true');
              d.open = true;
            }
          });
        } else {
          document.querySelectorAll('details.selfcheck-answer[data-opened-for-print="true"], details.guide-depth-details[data-opened-for-print="true"]').forEach((d) => {
            d.removeAttribute('data-opened-for-print');
            d.open = false;
          });
        }
      };
      if (typeof printMql.addEventListener === 'function') {
        printMql.addEventListener('change', handlePrintMediaChange);
      } else if (typeof printMql.addListener === 'function') {
        printMql.addListener(handlePrintMediaChange);
      }
      window.addEventListener('beforeprint', () => handlePrintMediaChange({ matches: true }));
      window.addEventListener('afterprint', () => handlePrintMediaChange({ matches: false }));
    }

    window.addEventListener('hashchange', () => {
      if (suppressNextHashChangeFor && window.location.hash === suppressNextHashChangeFor) {
        suppressNextHashChangeFor = null;
        return;
      }
      suppressNextHashChangeFor = null;
      handleHashRoute();
    });
    if (window.location.hash) {
      handleHashRoute();
    } else {
      root.switchView('home', { scrollTop: false, focusHeading: false });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
