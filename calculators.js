/**
 * calculators.js — Единый клиентский и тестируемый модуль инженерных калькуляторов
 * проекта «Инженерная тетрадка» (06_web_project/, ревизия v6).
 *
 * Подключается в index.html (<script src="calculators.js"></script>) и напрямую
 * тестируется автотестом test_calculators_js.mjs в Node.js.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.EngineeringCalculators = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Единый воспроизводимый справочный набор свойств насыщенного водяного пара (11 фиксированных опорных точек).
  // Происхождение, библиотека, расчётная модель и правила округления:
  // - Принятое стандартное атмосферное давление: P_atm = 1.013 бар абс. (P_bara = P_barg + 1.013; P_Pa = P_bara * 1e5 Па).
  // - Метод и библиотека: прямой расчёт в CoolProp 8.0.0 (CoolProp.CoolProp.PropsSI), расчётная модель HEOS::Water
  //   (международная эталонная формулировка уравнения состояния воды и водяного пара IAPWS-95).
  // - Правило округления:
  //     T_sat_C = round(PropsSI('T', 'P', P_Pa, 'Q', 0, 'HEOS::Water') - 273.15, 1) [°C]
  //     hf      = round(PropsSI('H', 'P', P_Pa, 'Q', 0, 'HEOS::Water') / 1000.0, 1) [кДж/кг]
  //     hg      = round(PropsSI('H', 'P', P_Pa, 'Q', 1, 'HEOS::Water') / 1000.0, 1) [кДж/кг]
  //     hfg     = round(hg - hf, 1) [кДж/кг] (строгое соблюдение тождества h_fg = h_g - h_f в каждой строке;
  //               в 10 из 11 точек совпадает с round((H_V - H_L)/1000, 1), а при 1.0 бар изб. 2200.953 -> 2200.9 кДж/кг).
  // - Внимание: в пособиях [S01] и [S07] этой многоточечной метрической таблицы нет ([S01, PDF p. 42]
  //   отсылает к внешним ASME Steam Tables, а [S01, PDF pp. 58–62] — это глоссарий терминов).
  // - Таблица является фиксированной (не интерполируется между точками и не пересчитывается при изменении
  //   P_atm в конвертере 5А).
  const STEAM_TABLE_METADATA = {
    p_atm_bar: 1.013,
    library: 'CoolProp 8.0.0',
    model: 'HEOS::Water (IAPWS-95)',
    rounding: 'T_sat to 0.1 °C; hf, hg to 0.1 kJ/kg; hfg = round(hg - hf, 1)',
    interpolated: false,
    identity: 'h_fg = h_g - h_f',
    source_description:
      'Единый воспроизводимый набор проекта (11 фиксированных точек насыщенного пара при P_atm = 1.013 бар абс., P_abs = P_изб + 1.013 бар абс.; расчёт CoolProp 8.0.0, модель HEOS::Water / IAPWS-95, округление hf и hg до 0.1 кДж/кг с тождеством h_fg = h_g − h_f; Таблица 1.1 в 02_guides/01_пар.md).'
  };

  const VERIFIED_STEAM_TABLE = [
    { p_barg: 0.0,  p_bara: 1.013, t_sat_C: 100.0, hf: 419.0, hfg: 2256.5, hg: 2675.5 },
    { p_barg: 0.5,  p_bara: 1.513, t_sat_C: 111.6, hf: 468.2, hfg: 2225.3, hg: 2693.5 },
    { p_barg: 1.0,  p_bara: 2.013, t_sat_C: 120.4, hf: 505.6, hfg: 2200.9, hg: 2706.5 },
    { p_barg: 2.0,  p_bara: 3.013, t_sat_C: 133.7, hf: 562.1, hfg: 2163.0, hg: 2725.1 },
    { p_barg: 3.0,  p_bara: 4.013, t_sat_C: 143.7, hf: 605.2, hfg: 2133.0, hg: 2738.2 },
    { p_barg: 4.0,  p_bara: 5.013, t_sat_C: 151.9, hf: 640.5, hfg: 2107.7, hg: 2748.2 },
    { p_barg: 5.0,  p_bara: 6.013, t_sat_C: 158.9, hf: 670.7, hfg: 2085.5, hg: 2756.2 },
    { p_barg: 6.0,  p_bara: 7.013, t_sat_C: 165.0, hf: 697.3, hfg: 2065.5, hg: 2762.8 },
    { p_barg: 8.0,  p_bara: 9.013, t_sat_C: 175.4, hf: 742.8, hfg: 2030.3, hg: 2773.1 },
    { p_barg: 10.0, p_bara: 11.013, t_sat_C: 184.1, hf: 781.3, hfg: 1999.4, hg: 2780.7 },
    { p_barg: 12.0, p_bara: 13.013, t_sat_C: 191.7, hf: 814.8, hfg: 1971.7, hg: 2786.5 }
  ];

  // Точные таблицы подбора открытого атмосферного ресивера TLV (GP10/GP14, длина 1 м)
  // Первоисточник: [S07, TLV PowerTrap Manual Doc. 172-65318MA-07, printed p. 14 / PDF p. 15]
  const TLV_VENTED_RECEIVER_TABLE_1 = [
    { row: 1,  maxFlashKgH: 25,   receiverMm: 80,  receiverIn: '3"',  ventMm: 25,  ventLineMm: 25,  ventIn: '1"' },
    { row: 2,  maxFlashKgH: 50,   receiverMm: 100, receiverIn: '4"',  ventMm: 50,  ventLineMm: 50,  ventIn: '2"' },
    { row: 3,  maxFlashKgH: 75,   receiverMm: 125, receiverIn: '5"',  ventMm: 50,  ventLineMm: 50,  ventIn: '2"' },
    { row: 4,  maxFlashKgH: 100,  receiverMm: 150, receiverIn: '6"',  ventMm: 80,  ventLineMm: 80,  ventIn: '3"' },
    { row: 5,  maxFlashKgH: 150,  receiverMm: 200, receiverIn: '8"',  ventMm: 80,  ventLineMm: 80,  ventIn: '3"' },
    { row: 6,  maxFlashKgH: 200,  receiverMm: 200, receiverIn: '8"',  ventMm: 100, ventLineMm: 100, ventIn: '4"' },
    { row: 7,  maxFlashKgH: 300,  receiverMm: 250, receiverIn: '10"', ventMm: 125, ventLineMm: 125, ventIn: '5"' },
    { row: 8,  maxFlashKgH: 400,  receiverMm: 300, receiverIn: '12"', ventMm: 125, ventLineMm: 125, ventIn: '5"' },
    { row: 9,  maxFlashKgH: 500,  receiverMm: 350, receiverIn: '14"', ventMm: 150, ventLineMm: 150, ventIn: '6"' },
    { row: 10, maxFlashKgH: 700,  receiverMm: 400, receiverIn: '16"', ventMm: 200, ventLineMm: 200, ventIn: '8"' },
    { row: 11, maxFlashKgH: 800,  receiverMm: 450, receiverIn: '18"', ventMm: 200, ventLineMm: 200, ventIn: '8"' },
    { row: 12, maxFlashKgH: 1000, receiverMm: 500, receiverIn: '20"', ventMm: 200, ventLineMm: 200, ventIn: '8"' },
    { row: 13, maxFlashKgH: 1100, receiverMm: 500, receiverIn: '20"', ventMm: 250, ventLineMm: 250, ventIn: '10"' },
    { row: 14, maxFlashKgH: 1400, receiverMm: 550, receiverIn: '22"', ventMm: 250, ventLineMm: 250, ventIn: '10"' },
    { row: 15, maxFlashKgH: 1500, receiverMm: 600, receiverIn: '24"', ventMm: 250, ventLineMm: 250, ventIn: '10"' }
  ];

  const TLV_VENTED_RECEIVER_TABLE_2 = [
    { row: 1, maxCondKgH: 1000,  receiverMm: 80,  receiverIn: '3"' },
    { row: 2, maxCondKgH: 1500,  receiverMm: 100, receiverIn: '4"' },
    { row: 3, maxCondKgH: 2000,  receiverMm: 125, receiverIn: '5"' },
    { row: 4, maxCondKgH: 3000,  receiverMm: 150, receiverIn: '6"' },
    { row: 5, maxCondKgH: 6000,  receiverMm: 200, receiverIn: '8"' },
    { row: 6, maxCondKgH: 10000, receiverMm: 250, receiverIn: '10"' }
  ];

  // Строгий парсер обязательного числа (никогда не заменяет пустую строку нулём или единицей!)
  function parseRequiredNumber(raw, label) {
    if (raw === undefined || raw === null) {
      throw new Error(`Обязательное поле «${label}» не заполнено. Пустой ввод не заменяется значением по умолчанию.`);
    }
    const str = String(raw).trim();
    if (str === '') {
      throw new Error(`Обязательное поле «${label}» не заполнено. Пустой ввод не заменяется значением по умолчанию.`);
    }
    const val = Number(str);
    if (!Number.isFinite(val)) {
      throw new Error(`Поле «${label}» должно содержать корректное число.`);
    }
    return val;
  }

  // Строгий парсер опционального числа (возвращает null при пустой строке, но сохраняет явно введённый 0!)
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

  // Форматирование строки выбора точки насыщенного пара из единого набора VERIFIED_STEAM_TABLE
  function formatSteamTableOptionLabel(row) {
    return `${row.p_barg.toFixed(1)} бар изб. (${row.p_bara.toFixed(3)} бар абс., T_sat=${row.t_sat_C.toFixed(1)} °C): h_g=${row.hg.toFixed(1)} − h_f=${row.hf.toFixed(1)} → h_fg=${row.hfg.toFixed(1)} кДж/кг`;
  }

  // Расчёт температурного коэффициента TCF для мембран DuPont FilmTec по [S16, PDF p. 131, Eq. 73–74]
  // с константами 298 и 273:
  // Eq. 73 (T >= 25 °C): TCF = exp[2640 * (1/298 - 1/(273 + T))]
  // Eq. 74 (T <= 25 °C): TCF = exp[3020 * (1/298 - 1/(273 + T))]
  function calcFilmTecTCF(tempC) {
    const t = parseRequiredNumber(tempC, 'Температура воды T (°C)');
    if (t <= 0 || t > 60) {
      throw new Error('Температура воды T для расчёта TCF мембран RO должна находиться в жидком рабочем диапазоне (0; 60] °C.');
    }
    const k = t >= 25.0 ? 2640.0 : 3020.0;
    return Math.exp(k * (1.0 / 298.0 - 1.0 / (273.0 + t)));
  }

  // ============================================================================
  // КАЛЬКУЛЯТОР 1А (ОСНОВНОЙ): Потерянная/возвращаемая вода, чувствительное тепло,
  // итоги за смену и за год, стоимость при явно введённых тарифах [S01, p. 37; S21, p. 1]
  // ============================================================================
  function calcCondensatePrimary(rawParams) {
    const mode = rawParams.mode || 'direct_l_min';

    // Специальный режим проверки эталонного примера DOE Tip Sheet #8 [S21, PDF p. 1] в единицах US Customary
    if (mode === 'doe_s21_imperial') {
      const mLbHr = parseRequiredNumber(rawParams.m_lb_hr, 'Массовый расход конденсата (lb/hr)');
      const hfCondBtu = parseRequiredNumber(rawParams.hf_cond_btu_lb, 'Энтальпия конденсата (Btu/lb)');
      const hfMkBtu = parseRequiredNumber(rawParams.hf_mk_btu_lb, 'Энтальпия подпитки (Btu/lb)');
      const hoursYear = parseRequiredNumber(rawParams.t_year_h, 'Наработка за год (ч/год)');
      const etaBoilerPct = parseOptionalNumber(rawParams.eta_boiler_pct, 'КПД котла (%)');
      const tariffMmbtu = parseOptionalNumber(rawParams.tariff_per_mmbtu, 'Тариф на топливо ($/MMBtu)');

      if (mLbHr < 0) throw new Error('Расход конденсата не может быть отрицательным (должен быть ≥ 0 lb/hr).');
      if (hfCondBtu <= hfMkBtu || hfMkBtu < 0) {
        throw new Error('Энтальпия горячего конденсата должна быть выше энтальпии холодной подпитки (и ≥ 0 Btu/lb).');
      }
      if (hoursYear <= 0 || hoursYear > 8784) {
        throw new Error('Годовая наработка должна быть в диапазоне (0; 8784] ч/год.');
      }
      const heatRateBtuHr = mLbHr * (hfCondBtu - hfMkBtu);
      const heatRateKw = heatRateBtuHr / 3412.1416;
      const annualCondMMBtu = (heatRateBtuHr * hoursYear) / 1e6;

      let annualFuelMMBtuExact = null;
      let annualFuelMMBtuRoundedDOE = null;
      let annualCostExact = null;
      let annualCostRoundedDOE = null;
      let realismWarning = null;

      if (etaBoilerPct !== null) {
        if (etaBoilerPct <= 0 || etaBoilerPct > 100) {
          throw new Error('Математически КПД котла должен находиться в интервале (0%; 100%].');
        }
        if (etaBoilerPct < 50 || etaBoilerPct > 98) {
          realismWarning = `Математически расчёт выполнен (0% < η_b ≤ 100%), однако введённый КПД котла η_b = ${etaBoilerPct}% выходит за типичный промышленный диапазон паровых котлов (70–95% по [S01, S21]) — проверьте реалистичность исходных данных.`;
        }
        annualFuelMMBtuExact = annualCondMMBtu / (etaBoilerPct / 100.0);
        annualFuelMMBtuRoundedDOE = Math.round(annualFuelMMBtuExact);
      }

      if (tariffMmbtu !== null) {
        if (tariffMmbtu < 0) throw new Error('Тариф на топливо не может быть отрицательным (должен быть ≥ 0 $/MMBtu).');
        if (etaBoilerPct === null) {
          throw new Error('Для расчёта стоимости топлива необходимо явно ввести КПД котла (%).');
        }
        annualCostExact = annualFuelMMBtuExact * tariffMmbtu;
        annualCostRoundedDOE = annualFuelMMBtuRoundedDOE * tariffMmbtu;
      }

      return {
        mode: 'doe_s21_imperial',
        mLbHr,
        heatRateKw,
        annualCondMMBtu,
        annualFuelMMBtuExact,
        annualFuelMMBtuRoundedDOE,
        annualCostExact,
        annualCostRoundedDOE,
        realismWarning
      };
    }

    // Стандартные режимы СИ: 'direct_l_min', 'direct_kg_h', 'steam_return_pct'
    const rhoKgL = parseRequiredNumber(rawParams.rho_kg_l, 'Плотность воды ρ (кг/л)');
    const cpKjKgC = parseRequiredNumber(rawParams.cp_kj_kgc, 'Теплоёмкость воды c_p (кДж/(кг·°C))');
    const tCondC = parseRequiredNumber(rawParams.t_cond_c, 'Температура конденсата T_cond (°C)');
    const tMakeupC = parseRequiredNumber(rawParams.t_makeup_c, 'Температура подпитки T_makeup (°C)');
    const tShiftH = parseRequiredNumber(rawParams.t_shift_h, 'Длительность смены t_shift (ч)');

    const tYearH = parseOptionalNumber(rawParams.t_year_h, 'Часы работы в год t_year (ч/год)');
    const etaBoilerPct = parseOptionalNumber(rawParams.eta_boiler_pct, 'КПД котла η_b (%)');
    const tariffEnergyPerGJ = parseOptionalNumber(rawParams.tariff_per_gj, 'Тариф на тепло/топливо (валюта/ГДж)');
    const tariffWaterPerM3 = parseOptionalNumber(rawParams.tariff_water_m3, 'Тариф на воду и стоки (валюта/м³)');
    const fuelLhvKwhUnit = parseOptionalNumber(rawParams.fuel_lhv_kwh, 'Низшая теплота сгорания топлива LHV (кВт·ч/ед.)');

    if (rhoKgL <= 0 || rhoKgL > 2.0) {
      throw new Error('Плотность воды ρ должна быть в физически допустимых пределах (0; 2.0] кг/л.');
    }
    if (cpKjKgC <= 0 || cpKjKgC > 10.0) {
      throw new Error('Удельная теплоёмкость c_p должна быть строго больше 0 кДж/(кг·°C).');
    }
    if (tCondC <= -273.15 || tMakeupC <= -273.15) {
      throw new Error('Температура не может быть ниже абсолютного нуля (-273.15 °C).');
    }
    // Область применимости модели жидкой воды (водного конденсата и подпиточной воды):
    if (tCondC <= 0 || tMakeupC <= 0) {
      throw new Error(
        'Ошибка области применимости (фазовое состояние воды): в расчёте водного конденсата и подпиточной воды температуры T_cond и T_makeup должны быть строго выше 0 °C (точки замерзания воды). При T ≤ 0 °C вода переходит в лёд, и формула чувствительного тепла жидкой воды с постоянной c_p неприменима.'
      );
    }
    if (tCondC >= 373.95 || tMakeupC >= 373.95) {
      throw new Error(
        'Ошибка области применимости: температура достигает или превышает критическую точку воды (373.95 °C), выше которой жидкая фаза воды не существует.'
      );
    }
    if (tCondC <= tMakeupC) {
      throw new Error('Температура горячего конденсата T_cond должна быть строго выше температуры холодной подпитки T_makeup.');
    }
    if (tShiftH <= 0 || tShiftH > 24) {
      throw new Error('Длительность смены t_shift должна быть в интервале (0; 24] ч.');
    }

    let phaseWarning = null;
    if (tCondC > 100.0 || tMakeupC > 100.0) {
      phaseWarning = `Внимание (область применимости по давлению и фазе): введена температура воды выше 100 °C (T_cond = ${tCondC} °C). При атмосферном давлении вода кипит при 100 °C; расчёт жидкой фазы без учёта фазового перехода применим только для напорных (закрытых) систем под давлением выше давления насыщения P > P_sat(T). При сбросе такого конденсата в открытый бак часть массы вскипит во вторичный пар (см. Модуль 1Б), а при высоких температурах точнее использовать разность табличных энтальпий жидкости h_f(T), так как c_p воды растёт с температурой.`;
    }

    let propertyWarning = null;
    if (rhoKgL < 0.85 || rhoKgL > 1.05 || cpKjKgC < 4.0 || cpKjKgC > 4.6) {
      propertyWarning = `Примечание по свойствам среды: введённые значения ρ = ${rhoKgL} кг/л или c_p = ${cpKjKgC} кДж/(кг·°C) выходят за типичный диапазон жидкой воды (ρ ≈ 0.88–1.00 кг/л, c_p ≈ 4.18–4.45 кДж/(кг·°C)). Убедитесь, что свойства соответствуют вашей рабочей жидкости.`;
    }

    let vTargetM3H = 0;
    let mTargetKgH = 0;
    let vReturnM3H = null;
    let mReturnKgH = null;
    let qReturnKw = null;

    if (mode === 'direct_l_min') {
      const qLMin = parseRequiredNumber(rawParams.q_l_min, 'Объёмный расход конденсата (л/мин)');
      if (qLMin < 0) throw new Error('Расход потерь конденсата (л/мин) не может быть отрицательным (должен быть ≥ 0).');
      vTargetM3H = (qLMin * 60.0) / 1000.0;
      mTargetKgH = qLMin * 60.0 * rhoKgL;
    } else if (mode === 'direct_kg_h') {
      const mKgH = parseRequiredNumber(rawParams.m_kg_h, 'Массовый расход конденсата (кг/ч)');
      if (mKgH < 0) throw new Error('Массовый расход потерь конденсата (кг/ч) не может быть отрицательным (должен быть ≥ 0).');
      mTargetKgH = mKgH;
      vTargetM3H = mKgH / (rhoKgL * 1000.0);
    } else if (mode === 'steam_return_pct') {
      const mSteamKgH = parseRequiredNumber(rawParams.m_steam_kg_h, 'Расход пара (кг/ч)');
      const returnPct = parseRequiredNumber(rawParams.return_pct, 'Доля возврата конденсата (%)');
      if (mSteamKgH < 0) throw new Error('Расход пара не может быть отрицательным (должен быть ≥ 0 кг/ч).');
      if (returnPct < 0 || returnPct > 100) {
        throw new Error('Доля возврата конденсата должна находиться в диапазоне от 0% до 100%.');
      }
      mReturnKgH = mSteamKgH * (returnPct / 100.0);
      vReturnM3H = mReturnKgH / (rhoKgL * 1000.0);
      mTargetKgH = mSteamKgH * (1.0 - returnPct / 100.0);
      vTargetM3H = mTargetKgH / (rhoKgL * 1000.0);
    } else {
      throw new Error(`Неизвестный режим ввода расхода: ${mode}`);
    }

    const deltaTC = tCondC - tMakeupC;
    const deltaHKjKg = cpKjKgC * deltaTC;
    const qThermalKw = (mTargetKgH * deltaHKjKg) / 3600.0;
    if (mReturnKgH !== null) {
      qReturnKw = (mReturnKgH * deltaHKjKg) / 3600.0;
    }

    // Итоги за смену
    const vShiftM3 = vTargetM3H * tShiftH;
    const eShiftKwh = qThermalKw * tShiftH;
    const eShiftGJ = eShiftKwh * 0.0036;
    const vReturnShiftM3 = vReturnM3H !== null ? vReturnM3H * tShiftH : null;
    const eReturnShiftKwh = qReturnKw !== null ? qReturnKw * tShiftH : null;

    // Итоги за год (только при явно введённом t_year_h)
    let vYearM3 = null;
    let eYearKwh = null;
    let eYearGJ = null;
    if (tYearH !== null) {
      if (tYearH <= 0 || tYearH > 8784) {
        throw new Error('Часы работы в год t_year должны быть в диапазоне (0; 8784] ч/год.');
      }
      vYearM3 = vTargetM3H * tYearH;
      eYearKwh = qThermalKw * tYearH;
      eYearGJ = eYearKwh * 0.0036;
    }

    // Учёт КПД котла и топлива (только при явном вводе; математически допустим 0 < η_b <= 100%)
    let qFuelKw = null;
    let eFuelYearKwh = null;
    let eFuelYearGJ = null;
    let fuelUnitsYear = null;
    let realismWarning = null;

    if (etaBoilerPct !== null) {
      if (etaBoilerPct <= 0 || etaBoilerPct > 100) {
        throw new Error('Математически КПД котла η_b должен быть в интервале (0%; 100%].');
      }
      if (etaBoilerPct < 50 || etaBoilerPct > 98) {
        realismWarning = `Математически расчёт выполнен (0% < η_b ≤ 100%), однако введённый КПД котла η_b = ${etaBoilerPct}% выходит за типичный промышленный диапазон паровых котлов (70–95% по [S01, S21]) — проверьте реалистичность исходных данных.`;
      }
      qFuelKw = qThermalKw / (etaBoilerPct / 100.0);
      if (eYearKwh !== null) {
        eFuelYearKwh = eYearKwh / (etaBoilerPct / 100.0);
        eFuelYearGJ = eYearGJ / (etaBoilerPct / 100.0);
      }
    }

    if (fuelLhvKwhUnit !== null) {
      if (fuelLhvKwhUnit <= 0) {
        throw new Error('Теплота сгорания топлива LHV должна быть строго больше 0 кВт·ч/ед.');
      }
      if (eFuelYearKwh !== null) {
        fuelUnitsYear = eFuelYearKwh / fuelLhvKwhUnit;
      }
    }

    // Финансовый расчёт: пустой тариф -> null (отсутствие денежной оценки);
    // явно введённый нулевой тариф (0) -> 0.00; отрицательный тариф (< 0) -> ошибка!
    let costEnergyYear = null;
    let costWaterYear = null;
    let costTotalYear = null;

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

    if (costEnergyYear !== null || costWaterYear !== null) {
      costTotalYear = (costEnergyYear !== null ? costEnergyYear : 0) + (costWaterYear !== null ? costWaterYear : 0);
    }

    return {
      mode,
      vTargetM3H,
      mTargetKgH,
      deltaTC,
      deltaHKjKg,
      qThermalKw,
      tShiftH,
      vShiftM3,
      eShiftKwh,
      eShiftGJ,
      vReturnM3H,
      mReturnKgH,
      qReturnKw,
      vReturnShiftM3,
      eReturnShiftKwh,
      tYearH,
      vYearM3,
      eYearKwh,
      eYearGJ,
      etaBoilerPct,
      qFuelKw,
      eFuelYearKwh,
      eFuelYearGJ,
      fuelUnitsYear,
      costEnergyYear,
      costWaterYear,
      costTotalYear,
      phaseWarning,
      propertyWarning,
      realismWarning
    };
  }

  // ============================================================================
  // КАЛЬКУЛЯТОР 1Б (ДОПОЛНИТЕЛЬНЫЙ): Вторичный пар вскипания и учебный подбор
  // диаметра открытого ресивера TLV GP10/GP14 (L = 1 м) [S07, PDF p. 14–15]
  // ============================================================================
  function calcCondensateFlashAndTLV(rawParams) {
    const mc = parseRequiredNumber(rawParams.mc_kg_h, 'Массовый расход конденсата m_c (кг/ч)');
    const p1 = parseRequiredNumber(rawParams.p1_barg, 'Давление перед КО P₁ (бар изб.)');
    const p2 = parseRequiredNumber(rawParams.p2_barg, 'Давление в ресивере P₂ (бар изб.)');
    const hf1 = parseRequiredNumber(rawParams.hf1_kj_kg, 'Энтальпия жидкости h_f1 (кДж/кг)');
    const hf2 = parseRequiredNumber(rawParams.hf2_kj_kg, 'Энтальпия жидкости h_f2 (кДж/кг)');
    const hfg2 = parseRequiredNumber(rawParams.hfg2_kj_kg, 'Скрытая теплота h_fg2 (кДж/кг)');
    const dopMm = parseOptionalNumber(rawParams.dop_mm, 'Диаметр переливной трубы D_op (мм)');

    if (mc <= 0) throw new Error('Расход конденсата m_c должен быть строго больше 0 кг/ч.');
    if (p1 + 1.01325 <= 0 || p2 + 1.01325 <= 0) {
      throw new Error('Абсолютное давление не может быть нулевым или отрицательным (P_изб должно быть > -1.013 бар).');
    }
    if (p1 <= p2 || hf1 <= hf2) {
      throw new Error('При P₁ ≤ P₂ (или h_f1 ≤ h_f2) вторичный пар вскипания из насыщенного конденсата не образуется (x_flash = 0%).');
    }
    if (hf1 <= 0 || hf2 <= 0 || hfg2 <= 0) {
      throw new Error('Энтальпии h_f1, h_f2 и скрытая теплота h_fg2 должны быть строго больше 0 кДж/кг.');
    }

    const xFlashPct = ((hf1 - hf2) / hfg2) * 100.0;
    if (xFlashPct <= 0 || xFlashPct >= 100.0) {
      throw new Error(`Нефизичная расчётная доля вторичного пара x_flash = ${xFlashPct.toFixed(2)}% (должна быть строго в интервале 0% < x_flash < 100%; проверьте согласованность h_f1, h_f2 и h_fg2 по таблицам пара).`);
    }

    const mFlashKgH = mc * (xFlashPct / 100.0);
    const mLiqKgH = mc - mFlashKgH;

    // Проверка соответствия введённых (P, h) встроенной проверенной таблице насыщенного пара
    const ref1 = VERIFIED_STEAM_TABLE.find((r) => Math.abs(r.p_barg - p1) < 1e-3);
    const ref2 = VERIFIED_STEAM_TABLE.find((r) => Math.abs(r.p_barg - p2) < 1e-3);
    let manualEnthalpyWarning = null;
    if (!ref1 || Math.abs(ref1.hf - hf1) > 2.0 || !ref2 || Math.abs(ref2.hf - hf2) > 2.0 || Math.abs(ref2.hfg - hfg2) > 3.0) {
      manualEnthalpyWarning = 'Внимание: давления и энтальпии введены вручную (вне встроенных опорных точек таблицы насыщения) — убедитесь по таблицам насыщенного пара, что h_f1, h_f2 и h_fg2 соответствуют P₁ и P₂.';
    }

    if (dopMm !== null && dopMm <= 0) {
      throw new Error('Диаметр переливной трубы D_op должен быть строго больше 0 мм.');
    }

    // Строгий подбор по Vented Receiver Table - 1 и Table - 2 [S07, PDF p. 15 / printed p. 14] БЕЗ экстраполяции!
    const table1Row = TLV_VENTED_RECEIVER_TABLE_1.find((r) => mFlashKgH <= r.maxFlashKgH) || null;
    const table2Row = TLV_VENTED_RECEIVER_TABLE_2.find((r) => mc <= r.maxCondKgH) || null;

    const tlvOutOfRangeReasons = [];
    if (!table1Row) {
      tlvOutOfRangeReasons.push(`расход вторичного пара ${mFlashKgH.toFixed(2)} кг/ч превышает верхний предел Vented Receiver Table - 1 (1500 кг/ч)`);
    }
    if (!table2Row) {
      tlvOutOfRangeReasons.push(`расход конденсата ${mc.toFixed(0)} кг/ч превышает верхний предел Vented Receiver Table - 2 (10 000 кг/ч)`);
    }
    if (Math.abs(p2) > 0.05) {
      tlvOutOfRangeReasons.push(`давление в ресивере P₂ = ${p2} бар изб. отлично от атмосферного (таблицы S07, PDF p. 15 составлены только для открытых атмосферных ресиверов P₂ = 0 бар изб.)`);
    }

    const dCond3Mm = dopMm !== null ? 3.0 * dopMm : null;
    let dReceiverMm = null;
    const isPreliminary = dopMm === null;

    if (table1Row && table2Row && Math.abs(p2) <= 0.05) {
      dReceiverMm = dCond3Mm !== null
        ? Math.max(table1Row.receiverMm, table2Row.receiverMm, dCond3Mm)
        : Math.max(table1Row.receiverMm, table2Row.receiverMm);
    }

    return {
      mc,
      p1,
      p2,
      hf1,
      hf2,
      hfg2,
      xFlashPct,
      mFlashKgH,
      mLiqKgH,
      manualEnthalpyWarning,
      table1Row,
      table2Row,
      dCond3Mm,
      dReceiverMm,
      isPreliminary,
      tlvOutOfRange: tlvOutOfRangeReasons.length > 0,
      tlvOutOfRangeReasons
    };
  }

  // ============================================================================
  // КАЛЬКУЛЯТОР 2: Чиллеры — Тепловая мощность, выбор Вода/Гликоль, Approach, COP
  // Первоисточники: [S08, pp. 11, 33, 41, 66, 82–83; S09, printed p. 125 / PDF p. 129; S10, pp. 44–45; S11, pp. 16–17, 19, 40]
  // ============================================================================
  function calcChillerPerformance(rawParams) {
    const fluidType = rawParams.fluid_type || 'water';
    if (fluidType !== 'water' && fluidType !== 'glycol') {
      throw new Error('Выберите корректный тип теплоносителя: «water» (Вода) или «glycol» (Раствор гликоля).');
    }

    const vw = parseRequiredNumber(rawParams.vw_m3_h, 'Объёмный расход холодоносителя V_w (м³/ч)');
    const rho = parseRequiredNumber(rawParams.rho_kg_m3, 'Плотность холодоносителя ρ (кг/м³)');
    const cp = parseRequiredNumber(rawParams.cp_kj_kgc, 'Удельная теплоёмкость холодоносителя c_p (кДж/(кг·°C))');
    const tIn = parseRequiredNumber(rawParams.t_evap_in_c, 'Температура входа холодоносителя T_evap,in (°C)');
    const tOut = parseRequiredNumber(rawParams.t_evap_out_c, 'Температура выхода холодоносителя T_evap,out (°C)');

    const tSatEv = parseOptionalNumber(rawParams.t_sat_evap_c, 'Температура кипения хладагента T_sat,evap (°C)');
    const tCondOut = parseOptionalNumber(rawParams.t_cond_out_c, 'Температура воды на выходе конденсатора T_cond,out (°C)');
    const tSatCd = parseOptionalNumber(rawParams.t_sat_cond_c, 'Температура конденсации хладагента T_sat,cond (°C)');
    const pEl = parseOptionalNumber(rawParams.p_el_kw, 'Потребляемая электрическая мощность чиллера P_el (кВт)');

    if (vw <= 0) throw new Error('Объёмный расход холодоносителя V_w должен быть строго больше 0 м³/ч.');
    if (rho <= 500 || rho > 1500) {
      throw new Error('Плотность холодоносителя ρ должна находиться в физическом диапазоне (500; 1500] кг/м³.');
    }
    if (cp <= 1.0 || cp > 6.0) {
      throw new Error('Удельная теплоёмкость холодоносителя c_p должна находиться в диапазоне (1.0; 6.0] кДж/(кг·°C).');
    }
    if (tIn <= -273.15 || tOut <= -273.15) {
      throw new Error('Температура не может быть ниже абсолютного нуля (-273.15 °C).');
    }
    // Область применимости по фазе и среде:
    if (fluidType === 'water') {
      if (tIn <= 0.0 || tOut <= 0.0) {
        throw new Error(
          'Ошибка области применимости (фазовое состояние воды): для теплоносителя «Чистая вода» температуры T_evap,in и T_evap,out должны быть строго выше 0 °C (точки замерзания воды). Для отрицательных температур выберите «Раствор гликоля» и введите плотность и теплоёмкость раствора.'
        );
      }
      if (tIn >= 373.95) {
        throw new Error('Ошибка области применимости: температура превышает критическую точку воды (373.95 °C).');
      }
    } else {
      if (tOut < -60.0 || tIn > 200.0) {
        throw new Error('Ошибка области применимости: температуры выходят за рабочий диапазон водно-гликолевых хладоносителей [-60; +200] °C.');
      }
    }

    if (tIn <= tOut) {
      throw new Error('В режиме охлаждения температура на входе испарителя T_evap,in должна быть строго выше температуры на выходе T_evap,out.');
    }

    // Проверка неполной пары температур конденсатора
    if ((tCondOut !== null && tSatCd === null) || (tCondOut === null && tSatCd !== null)) {
      throw new Error('Неполная пара температур конденсатора: для расчёта подхода ΔT_app,cond необходимо одновременно ввести и T_cond,out, и T_sat,cond (либо оставить оба поля пустыми).');
    }

    let appEvapC = null;
    if (tSatEv !== null) {
      if (tSatEv <= -273.15) throw new Error('T_sat,evap не может быть ниже абсолютного нуля.');
      if (tSatEv >= tOut) {
        throw new Error('Физическое противоречие: в работающем испарителе температура кипения фреона T_sat,evap должна быть строго ниже температуры выходящего холодоносителя T_evap,out.');
      }
      appEvapC = tOut - tSatEv;
    }

    let appCondC = null;
    if (tCondOut !== null && tSatCd !== null) {
      if (tCondOut <= -273.15 || tSatCd <= -273.15) {
        throw new Error('Температуры конденсатора не могут быть ниже абсолютного нуля.');
      }
      if (tSatCd <= tCondOut) {
        throw new Error('Физическое противоречие: в работающем конденсаторе температура конденсации T_sat,cond должна быть строго выше температуры уходящей охлаждающей воды T_cond,out.');
      }
      appCondC = tSatCd - tCondOut;
    }

    let cop = null;
    let kwPerTr = null;
    if (pEl !== null) {
      if (pEl <= 0) {
        throw new Error('Потребляемая электрическая мощность чиллера P_el должна быть строго больше 0 кВт.');
      }
    }

    const mFlowKgS = (vw * rho) / 3600.0;
    const dTevapC = tIn - tOut;
    const qEvapKw = mFlowKgS * cp * dTevapC;
    const qEvapTr = qEvapKw / 3.51685;

    if (pEl !== null) {
      cop = qEvapKw / pEl;
      kwPerTr = pEl / qEvapTr;
    }

    // Предупреждение о риске заморозки чистой воды и напоминание о свойствах гликоля
    let freezeWarning = null;
    if (fluidType === 'water' && (tOut < 4.0 || (tSatEv !== null && tSatEv <= 0.0))) {
      freezeWarning =
        'ПОВЫШЕННЫЙ РИСК ЗАМОРОЗКИ ИСПАРИТЕЛЯ: выбран режим «Чистая вода» при T_evap,out < +4.0 °C или T_sat,evap ≤ 0.0 °C. ' +
        'Граница минимально допустимой температуры выхода воды не является универсальной для всех чиллеров и зависит от конструкции испарителя, режима протока и настроек защит конкретной машины ' +
        '(например, в руководстве Daikin EWAD-TZ [S11, Table 1, Section 5.7.1, Section 9.3.3, printed / PDF pp. 16–17, 19, 40] заводская рабочая уставка Cool LWT 1/2 составляет 7.0 °C / 44 °F при допустимом диапазоне без гликоля +4.0…+15.5 °C / 40…60 °F и с гликолем −4.0…+15.5 °C / 25…60 °F, а отдельная уставка защиты от заморозки Evaporator Water Freeze без гликоля настраивается в диапазоне +2.0…+6.0 °C / 36…42 °F с заводским значением +2.2 °C / 36 °F и срабатывает при падении LWT или EWT ниже порога; в руководстве Trane Series R™ Model RTWD [S08, Table 14, printed / PDF p. 41; Table 32, pp. 82–83] для чистой воды 0% гликоля минимальная рекомендуемая уставка отсечки по воде LWTC составляет +1.7 °C / 35.0 °F с интегралом 30 °F·с в работе, а по хладагенту LRTC = −1.9 °C / 28.6 °F, причём диагностика Low Evaporator Refrigerant Temperature срабатывает при снижении более высокой из двух температур — жидкого хладагента в испарителе Evaporator Refrigerant Pool Temperature или активной температуры насыщения Active Rfgt Sat Temp соответствующего контура — ниже LRTC с интегралом 1125 °F·с). ' +
        'Обязательно сверьтесь с паспортом вашей машины, минимальным допустимым расходом и уставками защит от замерзания либо примените водно-гликолевый раствор.';
    }
    let phaseWarning = null;
    if (fluidType === 'water' && tIn > 100.0) {
      phaseWarning = `Внимание (область применимости): T_evap,in = ${tIn} °C > 100 °C — жидкая фаза воды без вскипания возможна только в контуре под избыточным давлением P > P_sat(T).`;
    }
    let glycolPropertyNotice = null;
    if (fluidType === 'glycol' && Math.abs(cp - 4.186) < 0.03 && Math.abs(rho - 1000.0) < 5.0) {
      glycolPropertyNotice = 'Внимание: выбран «Раствор гликоля», но в полях ρ и c_p оставлены свойства чистой воды (~1000 кг/м³ и ~4.186 кДж/(кг·°C)). Укажите фактические плотность и теплоёмкость водно-гликолевой смеси для вашей концентрации [S08, pp. 11, 33]!';
    }

    return {
      fluidType,
      vw,
      rho,
      cp,
      dTevapC,
      qEvapKw,
      qEvapTr,
      appEvapC,
      appCondC,
      pEl,
      cop,
      kwPerTr,
      freezeWarning,
      phaseWarning,
      glycolPropertyNotice
    };
  }

  // ============================================================================
  // КАЛЬКУЛЯТОР 3А (ОСНОВНОЙ): Пересчёт объёмного расхода воздуха между двумя
  // состояниями (1 -> 2, в т.ч. Normal <-> FAD) [S13, printed pp. 14, 17, 113–118 / PDF pp. 16, 19, 115–120]
  // ============================================================================
  function calcAirFlowConversion(rawParams) {
    const q1 = parseRequiredNumber(rawParams.q1_l_s, 'Исходный объёмный расход Q₁ (л/с)');
    const p1Abs = parseRequiredNumber(rawParams.p1_abs_bar, 'Абсолютное давление состояния 1 P₁,abs (бар(а))');
    const t1C = parseRequiredNumber(rawParams.t1_c, 'Температура состояния 1 T₁ (°C)');
    const rh1Pct = parseRequiredNumber(rawParams.rh1_pct, 'Относительная влажность φ₁ (%)');
    const psat1Bar = parseRequiredNumber(rawParams.psat1_bar, 'Давление насыщ. пара p_sat(T₁) (бар)');

    const p2Abs = parseRequiredNumber(rawParams.p2_abs_bar, 'Абсолютное давление состояния 2 P₂,abs (бар(а))');
    const t2C = parseRequiredNumber(rawParams.t2_c, 'Температура состояния 2 T₂ (°C)');
    const rh2Pct = parseRequiredNumber(rawParams.rh2_pct, 'Относительная влажность φ₂ (%)');
    const psat2Bar = parseRequiredNumber(rawParams.psat2_bar, 'Давление насыщ. пара p_sat(T₂) (бар)');

    if (q1 <= 0) throw new Error('Исходный объёмный расход Q₁ должен быть строго больше 0 л/с.');
    if (p1Abs <= 0 || p2Abs <= 0) throw new Error('Абсолютные давления P₁,abs и P₂,abs должны быть строго больше 0 бар(а).');
    if (t1C <= -273.15 || t2C <= -273.15) throw new Error('Температуры T₁ и T₂ должны быть выше абсолютного нуля (-273.15 °C).');
    if (rh1Pct < 0 || rh1Pct > 100 || rh2Pct < 0 || rh2Pct > 100) {
      throw new Error('Относительная влажность φ₁ и φ₂ должна быть в диапазоне от 0% до 100%.');
    }
    if (psat1Bar < 0 || psat2Bar < 0) {
      throw new Error('Парциальное давление насыщенного пара p_sat не может быть отрицательным.');
    }

    const pDry1 = p1Abs - (rh1Pct / 100.0) * psat1Bar;
    const pDry2 = p2Abs - (rh2Pct / 100.0) * psat2Bar;
    if (pDry1 <= 0 || pDry2 <= 0) {
      throw new Error('Нефизичный режим: парциальное давление водяного пара φ·p_sat превышает или равно общему абсолютному давлению газа.');
    }

    const t1K = t1C + 273.15;
    const t2K = t2C + 273.15;
    const q2LS = q1 * (pDry1 / pDry2) * (t2K / t1K);
    const q2M3Min = (q2LS * 60.0) / 1000.0;
    const q2M3H = q2M3Min * 60.0;

    return {
      q1LS: q1,
      pDry1,
      pDry2,
      t1K,
      t2K,
      q2LS,
      q2M3Min,
      q2M3H
    };
  }

  // ============================================================================
  // КАЛЬКУЛЯТОР 3Б (ОСНОВНОЙ): Оценка утечек сжатого воздуха по ресиверу (Метод 1)
  // и по циклу Load/Unload (Метод 2) [S12, printed pp. 49–50 / PDF pp. 53–54; S13, printed p. 102 / PDF p. 104]
  // ============================================================================
  function calcAirLeaks(rawParams) {
    const method = rawParams.method || 'receiver_drop';
    const qCompM3Min = parseOptionalNumber(rawParams.q_comp_m3_min, 'Номинальная подача компрессора Q_comp (м³/мин)');
    if (qCompM3Min !== null && qCompM3Min <= 0) {
      throw new Error('Номинальная подача компрессора Q_comp должна быть строго больше 0 м³/мин.');
    }

    if (method === 'receiver_drop') {
      const vRecM3 = parseRequiredNumber(rawParams.v_rec_m3, 'Суммарный объём ресивера и сети V (м³)');
      const p1GBar = parseRequiredNumber(rawParams.p1_g_bar, 'Начальное избыточное давление P₁ (бар изб.)');
      const p2GBar = parseRequiredNumber(rawParams.p2_g_bar, 'Конечное избыточное давление P₂ (бар изб.)');
      const tMin = parseRequiredNumber(rawParams.t_min, 'Время падения давления t (мин)');
      const pAtmBar = parseRequiredNumber(rawParams.p_atm_bar, 'Атмосферное давление P_atm (бар абс.)');

      if (vRecM3 <= 0) throw new Error('Объём ресивера и сети V должен быть строго больше 0 м³.');
      if (pAtmBar <= 0) throw new Error('Атмосферное давление P_atm должно быть строго больше 0 бар абс.');
      if (p1GBar <= p2GBar || p2GBar < 0) {
        throw new Error('Начальное давление P₁ должно быть строго выше конечного P₂ (и P₂ ≥ 0 бар изб.).');
      }
      if (tMin <= 0) throw new Error('Время замера t должно быть строго больше 0 мин.');

      const qLeakM3Min = (vRecM3 * (p1GBar - p2GBar)) / (pAtmBar * tMin);
      const qLeakLS = (qLeakM3Min * 1000.0) / 60.0;
      const leakPct = qCompM3Min !== null ? (qLeakM3Min / qCompM3Min) * 100.0 : null;

      return {
        method,
        qLeakM3Min,
        qLeakLS,
        leakPct
      };
    } else if (method === 'load_unload') {
      const tLoadMin = parseRequiredNumber(rawParams.t_load_min, 'Суммарное время нагрузки T_load (мин)');
      const tUnloadMin = parseRequiredNumber(rawParams.t_unload_min, 'Суммарное время холостого хода T_unload (мин)');

      if (tLoadMin < 0 || tUnloadMin < 0 || (tLoadMin + tUnloadMin) <= 0) {
        throw new Error('Время T_load и T_unload должно быть неотрицательным, а общая длительность цикла (T_load + T_unload) > 0 мин.');
      }

      const leakPct = (tLoadMin / (tLoadMin + tUnloadMin)) * 100.0;
      const qLeakM3Min = qCompM3Min !== null ? qCompM3Min * (leakPct / 100.0) : null;
      const qLeakLS = qLeakM3Min !== null ? (qLeakM3Min * 1000.0) / 60.0 : null;

      return {
        method,
        leakPct,
        qLeakM3Min,
        qLeakLS
      };
    } else {
      throw new Error(`Неизвестный метод расчёта утечек: ${method}`);
    }
  }

  // ============================================================================
  // КАЛЬКУЛЯТОР 3В (ДОПОЛНИТЕЛЬНЫЙ): Выпадение водного конденсата при сжатии и
  // охлаждении/осушке [S13, Section 5.4.1, printed pp. 100–101, 116 / PDF pp. 102–103, 118]
  // ============================================================================
  function calcAirMoistureCondensation(rawParams) {
    const qc = parseRequiredNumber(rawParams.qc_l_s, 'Подача компрессора FAD q_c (л/с)');
    const rh = parseRequiredNumber(rawParams.rh_fraction, 'Относительная влажность всаса RH (0..1)');
    const rhoIn = parseRequiredNumber(rawParams.rho_in_g_m3, 'Табличная плотность насыщ. пара при T_amb (г/м³)');
    const tAmbK = parseRequiredNumber(rawParams.t_amb_k, 'Абсолютная температура всаса T_amb (К)');
    const pAfterAbs = parseRequiredNumber(rawParams.p_after_abs_bar, 'Абсолютное давление сжатия p_after (бар(а))');
    const tAfterK = parseRequiredNumber(rawParams.t_after_k, 'Абсолютная температура в точке расчёта T_after (К)');
    const rhoOut = parseRequiredNumber(rawParams.rho_out_g_m3, 'Табличная плотность насыщ. пара при T_after (г/м³)');

    if (qc <= 0) throw new Error('Подача компрессора q_c должна быть строго больше 0 л/с.');
    if (rh < 0 || rh > 1) throw new Error('Относительная влажность RH в долях единицы должна быть в диапазоне [0; 1].');
    if (rhoIn <= 0 || rhoOut <= 0) {
      throw new Error('Табличные плотности насыщенного водяного пара ρ_in и ρ_out должны быть строго больше 0 г/м³.');
    }
    if (tAmbK <= 150 || tAfterK <= 150) {
      throw new Error('Абсолютные температуры T_amb и T_after должны быть строго положительными (> 150 К).');
    }
    if (pAfterAbs <= 1.0) {
      throw new Error('Абсолютное давление сжатого воздуха p_after должно быть строго больше 1.0 бар(а).');
    }

    const mwInGs = (qc * rh * rhoIn) / 1000.0;

    // Вариант 1: По упрощённой формуле примера S13, Section 5.4.1, printed pp. 100–101 / PDF pp. 102–103 (изотермическое отношение давлений q_c / p_after)
    const qCompIsoLS = qc / pAfterAbs;
    const mwMaxIsoGs = (qCompIsoLS * rhoOut) / 1000.0;
    const mCondIsoGs = Math.max(0.0, mwInGs - mwMaxIsoGs);
    const mCondIsoKgH = mCondIsoGs * 3.6;

    // Вариант 2: С температурной поправкой объёма по уравнению идеального газа q_c * (1.0 / p_after) * (T_after / T_amb)
    const qCompTempLS = (qc * 1.0 * tAfterK) / (pAfterAbs * tAmbK);
    const mwMaxTempGs = (qCompTempLS * rhoOut) / 1000.0;
    const mCondTempGs = Math.max(0.0, mwInGs - mwMaxTempGs);
    const mCondTempKgH = mCondTempGs * 3.6;

    return {
      mwInGs,
      qCompIsoLS,
      mwMaxIsoGs,
      mCondIsoGs,
      mCondIsoKgH,
      qCompTempLS,
      mwMaxTempGs,
      mCondTempGs,
      mCondTempKgH
    };
  }

  // ============================================================================
  // КАЛЬКУЛЯТОР 4А (ОСНОВНОЙ): Баланс потоков RO, Recovery Y, оценочная
  // селективность по электропроводности (SP_EC, SR_EC, оценочный CF_EC) с допущениями
  // и опциональный массовый баланс по измеренным концентрациям TDS (мг/л)
  // Первоисточник: [S16, DuPont FilmTec Manual, PDF p. 35, 102, 152]
  // ============================================================================
  function calcROBalance(rawParams) {
    const qp = parseRequiredNumber(rawParams.qp_m3_h, 'Расход пермеата Q_p (м³/ч)');
    const qc = parseRequiredNumber(rawParams.qc_m3_h, 'Расход концентрата Q_c (м³/ч)');
    const ecF = parseRequiredNumber(rawParams.ec_f_us_cm, 'Проводимость исходной воды EC_f (мкСм/см)');
    const ecP = parseRequiredNumber(rawParams.ec_p_us_cm, 'Проводимость пермеата EC_p (мкСм/см)');

    const qfMeas = parseOptionalNumber(rawParams.qf_meas_m3_h, 'Измеренный входной расход Q_f,meas (м³/ч)');
    const ecC = parseOptionalNumber(rawParams.ec_c_us_cm, 'Проводимость концентрата EC_c (мкСм/см)');

    // Опциональные лабораторные концентрации TDS (мг/л) для точного массового солевого баланса
    const tdsF = parseOptionalNumber(rawParams.tds_f_mg_l, 'Массовая концентрация солей входа TDS_f (мг/л)');
    const tdsP = parseOptionalNumber(rawParams.tds_p_mg_l, 'Массовая концентрация солей пермеата TDS_p (мг/л)');
    const tdsC = parseOptionalNumber(rawParams.tds_c_mg_l, 'Массовая концентрация солей концентрата TDS_c (мг/л)');

    if (qp <= 0 || qc <= 0) {
      throw new Error('Расходы пермеата Q_p и концентрата Q_c должны быть строго больше 0 м³/ч.');
    }
    if (ecF <= 0) throw new Error('Проводимость питательной воды EC_f должна быть строго больше 0 мкСм/см.');
    if (ecP < 0 || ecP >= ecF) {
      throw new Error('Проводимость пермеата EC_p должна быть неотрицательной и строго меньше проводимости входа EC_f.');
    }

    const qfCalc = qp + qc;
    let flowDiscrepancyPct = null;
    if (qfMeas !== null) {
      if (qfMeas <= 0) throw new Error('Измеренный расход питания Q_f,meas должен быть строго больше 0 м³/ч.');
      flowDiscrepancyPct = ((qfMeas - qfCalc) / qfCalc) * 100.0;
    }

    const yFrac = qp / qfCalc;
    const recoveryPct = yFrac * 100.0;
    const spEcPct = (ecP / ecF) * 100.0;
    const srEcPct = 100.0 - spEcPct;
    const srFrac = srEcPct / 100.0;

    // CF_ideal (при 100% задержании) и оценочный CF_EC по отношению электропроводностей с допущениями
    const cfIdeal = 1.0 / (1.0 - yFrac);
    const cfApproxEc = (1.0 - yFrac * (1.0 - srFrac)) / (1.0 - yFrac);

    let bEc = null;
    let bEcStatus = null;
    if (ecC !== null) {
      if (ecC <= ecF) {
        throw new Error('Проводимость концентрата EC_c должна быть выше проводимости исходной воды EC_f.');
      }
      bEc = (qfCalc * ecF) / (qp * ecP + qc * ecC);
      bEcStatus = (bEc >= 0.95 && bEc <= 1.05)
        ? 'Оценка по EC сходится в пределах ориентира 1.00 ± 0.05 [S16, Eq. 80, PDF p. 152] (приближённый баланс проводимости, не массовый баланс солей)'
        : 'Выходит за пределы 0.95–1.05: проверьте калибровку расходомеров и кондуктометров (или влияние CO₂/pH и нелинейности EC↔TDS)';
    }

    // Расчёт по массовым концентрациям TDS (мг/л), если они введены
    let massSaltBalance = null;
    if (tdsF !== null || tdsP !== null || tdsC !== null) {
      if (tdsF === null || tdsP === null) {
        throw new Error('Для расчёта массового проскока солей по TDS необходимо ввести как минимум TDS_f и TDS_p (мг/л).');
      }
      if (tdsF <= 0 || tdsP < 0 || tdsP >= tdsF) {
        throw new Error('Массовые концентрации должны удовлетворять условию 0 ≤ TDS_p < TDS_f (мг/л).');
      }
      const spMassPct = (tdsP / tdsF) * 100.0;
      const srMassPct = 100.0 - spMassPct;
      const cfMass = (1.0 - yFrac * (1.0 - srMassPct / 100.0)) / (1.0 - yFrac);
      let bMass = null;
      if (tdsC !== null) {
        if (tdsC <= tdsF) {
          throw new Error('Массовая концентрация концентрата TDS_c должна быть выше TDS_f (мг/л).');
        }
        bMass = (qfCalc * tdsF) / (qp * tdsP + qc * tdsC);
      }
      massSaltBalance = {
        tdsF,
        tdsP,
        tdsC,
        spMassPct,
        srMassPct,
        cfMass,
        bMass
      };
    }

    const ecAssumptionNote =
      'Важное метрологическое разграничение: отношение электропроводностей (EC_p / EC_f) даёт видимую (кажущуюся) селективность по проводимости и оценочный коэффициент концентрирования CF_EC при допущении линейной связи EC и концентрации без влияния растворённого газа CO₂ и pH. Это НЕ точный массовый солевой баланс; для массового баланса требуются измеренные концентрации TDS (мг/л).';

    return {
      qp,
      qc,
      qfCalc,
      qfMeas,
      flowDiscrepancyPct,
      recoveryPct,
      spEcPct,
      srEcPct,
      cfIdeal,
      cfApproxEc,
      cfReal: cfApproxEc, // сохранено как псевдоним оценочного CF_EC для обратной совместимости вызовов
      bEc,
      bEcStatus,
      ecAssumptionNote,
      massSaltBalance,
      spTdsPct: massSaltBalance ? massSaltBalance.spMassPct : null,
      srTdsPct: massSaltBalance ? massSaltBalance.srMassPct : null,
      cfMassTds: massSaltBalance ? massSaltBalance.cfMass : null,
      bTds: massSaltBalance ? massSaltBalance.bMass : null
    };
  }

  // ============================================================================
  // КАЛЬКУЛЯТОР 4Б (ДОПОЛНИТЕЛЬНЫЙ): Нормализация потока пермеата RO по Eq. 72
  // и учебная проверка обратного давления пермеата [S16, PDF p. 106, 131–133, 165]
  // ============================================================================
  function calcRONormalization(rawParams) {
    const qp = parseRequiredNumber(rawParams.qp_o_m3_h, 'Текущий расход пермеата Q_po (м³/ч)');
    const qc = parseRequiredNumber(rawParams.qc_o_m3_h, 'Текущий расход концентрата Q_co (м³/ч)');
    const qBase = parseRequiredNumber(rawParams.qp_s_m3_h, 'Базовый расход пермеата Q_ps (м³/ч)');
    const ndps = parseRequiredNumber(rawParams.ndp_s_bar, 'Базовая движущая сила NDP_s (бар)');
    const ndpo = parseRequiredNumber(rawParams.ndp_o_bar, 'Текущая движущая сила NDP_o (бар)');
    const tcfs = parseRequiredNumber(rawParams.tcf_s, 'Базовый коэффициент TCF_s');
    const tcfo = parseRequiredNumber(rawParams.tcf_o, 'Текущий коэффициент TCF_o');
    const dpBack = parseOptionalNumber(rawParams.dp_back_bar, 'Разность давлений P_p − P_c (бар)');

    if (qp <= 0 || qc <= 0 || qBase <= 0 || ndps <= 0 || ndpo <= 0 || tcfs <= 0 || tcfo <= 0) {
      throw new Error('Все расходы (Q_po, Q_co, Q_ps), движущие силы (NDP_s, NDP_o) и коэффициенты (TCF_s, TCF_o) должны быть строго больше 0.');
    }

    if (dpBack !== null && dpBack > 0.3) {
      throw new Error(
        `УЧЕБНОЕ ПРЕДУПРЕЖДЕНИЕ ПО ОБРАТНОМУ ДАВЛЕНИЮ ПЕРМЕАТА: P_p − P_c = +${dpBack.toFixed(2)} бар превышает номинальный предел 0.3 бар (≈ 4.35 psi) / 5 psi (≈ 0.345 бар), указанный для элементов DuPont FilmTec и Toray [S16, PDF p. 106 ("0.3 bar (5 psi)"), PDF p. 165 ("5 psi (0.3 bar)"); S17, PDF p. 1; S20, PDF p. 51]! Риск отслоения мембранного полотна (Blistering / Delamination). (Примечание: данный расчёт в браузере является учебной проверкой и не заменяет аппаратные блокировки и паспорт конкретной модели мембраны).`
      );
    }

    const qf = qp + qc;
    const yPct = (qp / qf) * 100.0;
    const cfIdeal = 1.0 / (1.0 - qp / qf);
    const rawDevPct = ((qp - qBase) / qBase) * 100.0;
    const qsNorm = qp * (ndps / ndpo) * (tcfs / tcfo);
    const normDevPct = ((qsNorm - qBase) / qBase) * 100.0;

    // Количественная оценка вклада введённых факторов в рамках расчётной модели Eq. 72:
    // Q_po / Q_s = (NDP_o / NDP_s) * (TCF_o / TCF_s)
    const ndpFactorRatio = ndpo / ndps;
    const ndpEffectPct = (ndpFactorRatio - 1.0) * 100.0;
    const tcfFactorRatio = tcfo / tcfs;
    const tcfEffectPct = (tcfFactorRatio - 1.0) * 100.0;
    const combinedEnvFactorRatio = ndpFactorRatio * tcfFactorRatio;
    const combinedEnvEffectPct = (combinedEnvFactorRatio - 1.0) * 100.0;

    const fmtSigned = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
    const factorSummary =
      `В рамках расчётной модели Eq. 72 множитель движущей силы NDP_o/NDP_s = ${ndpFactorRatio.toFixed(4)} (${fmtSigned(ndpEffectPct)}), ` +
      `температурный множитель TCF_o/TCF_s = ${tcfFactorRatio.toFixed(4)} (${fmtSigned(tcfEffectPct)}), ` +
      `совместный множитель внешних условий = ${combinedEnvFactorRatio.toFixed(4)} (${fmtSigned(combinedEnvEffectPct)}).`;

    let dominantFactorNote = '';
    const absNdp = Math.abs(ndpEffectPct);
    const absTcf = Math.abs(tcfEffectPct);
    if (absNdp < 0.05 && absTcf < 0.05) {
      dominantFactorNote = 'Введённые коэффициенты NDP и TCF практически не изменились относительно базового режима.';
    } else if (absNdp > absTcf * 1.15) {
      dominantFactorNote = `Среди введённых факторов модели преобладает изменение чистой движущей силы NDP (${fmtSigned(ndpEffectPct)}), тогда как температурный множитель TCF изменился на ${fmtSigned(tcfEffectPct)}.`;
    } else if (absTcf > absNdp * 1.15) {
      dominantFactorNote = `Среди введённых факторов модели преобладает изменение температурного множителя TCF (${fmtSigned(tcfEffectPct)}), тогда как множитель NDP изменился на ${fmtSigned(ndpEffectPct)}.`;
    } else {
      dominantFactorNote = `Оба введённых фактора модели — движущая сила NDP (${fmtSigned(ndpEffectPct)}) и температурный множитель TCF (${fmtSigned(tcfEffectPct)}) — вносят сопоставимый вклад.`;
    }

    // Асимметричная осторожная интерпретация без категоричного диагноза и без одинакового вывода CIP для роста и падения!
    let statusHypothesis = '';
    if (normDevPct <= -10.0) {
      statusHypothesis =
        `Нормализованный поток пермеата снизился на ${normDevPct.toFixed(2)}% относительно базового Q_ps (достигнут ориентировочный критерий −10% по снижению NPF в [S16, PDF p. 135]). ` +
        `Рабочая гипотеза (не доказанный диагноз): снижение гидравлической проницаемости мембран (фоулинг/скейлинг) либо погрешность датчиков давления, температуры или расхода. ` +
        `Для различения причин перед принятием решения о химической мойке (CIP) проверьте калибровку приборов, стадийные перепады давления ΔP₁, ΔP₂ и нормализованный проскок солей NSP.`;
    } else if (normDevPct >= 10.0) {
      statusHypothesis =
        `Нормализованный поток пермеата вырос на +${normDevPct.toFixed(2)}% относительно базового Q_ps (превышен порог +10% по NPF в [S16, PDF p. 135]). ` +
        `Внимание: рост нормализованного потока НЕ указывает на зарастание мембран отложениями и НЕ означает необходимость CIP от фоулинга! ` +
        `Основные гипотезы для проверки: химическое повреждение (окисление) барьерного слоя, механическое повреждение мембраны / течь уплотнений (O-ring) или недостоверность показаний манометров/термометра. Проверьте проводимость пермеата EC_p по корпусам!`;
    } else {
      statusHypothesis =
        `Отклонение нормализованного потока NPF от базового режима составляет ${fmtSigned(normDevPct)} (в пределах ориентировочного диапазона от −10% до +10% [S16, PDF p. 135]). ` +
        `Осторожная гипотеза: расчётная производительность с учётом введённых NDP и TCF близка к базовой, однако нормальный NPF сам по себе не исключает локального фоулинга или начального скейлинга — дополнительно контролируйте стадийные перепады давления ΔP₁, ΔP₂ и селективность по солям.`;
    }

    const dynamicInterpretation = `${factorSummary} ${dominantFactorNote} ${statusHypothesis}`;

    return {
      qp,
      qc,
      qf,
      yPct,
      cfIdeal,
      rawDevPct,
      qsNorm,
      normDevPct,
      ndpFactorRatio,
      ndpEffectPct,
      tcfFactorRatio,
      tcfEffectPct,
      combinedEnvFactorRatio,
      combinedEnvEffectPct,
      dpBack,
      dynamicInterpretation
    };
  }

  // ============================================================================
  // КАЛЬКУЛЯТОР 5А (ОСНОВНОЙ): Двусторонний перевод избыточного и абсолютного
  // давления (barg / psig / kPag <-> bara / psia / kPaa) при заданном P_atm
  // ============================================================================
  function calcSteamPressureConversion(rawParams) {
    const mode = rawParams.mode || 'gauge_to_abs';
    const unit = rawParams.unit || 'bar';
    const pVal = parseRequiredNumber(rawParams.p_val, 'Значение давления P');
    const pAtmBar = parseRequiredNumber(rawParams.p_atm_bar, 'Атмосферное давление P_atm (бар абс.)');

    if (pAtmBar <= 0 || pAtmBar > 2.0) {
      throw new Error('Атмосферное давление P_atm должно быть строго положительным в разумных пределах (0; 2.0] бар абс.');
    }

    const PSI_PER_BAR = 14.5037738;
    const KPA_PER_BAR = 100.0;

    let pInputBar = pVal;
    if (unit === 'psi') {
      pInputBar = pVal / PSI_PER_BAR;
    } else if (unit === 'kpa') {
      pInputBar = pVal / KPA_PER_BAR;
    } else if (unit !== 'bar') {
      throw new Error(`Неизвестная единица давления: ${unit}`);
    }

    let pGaugeBar = 0;
    let pAbsBar = 0;
    if (mode === 'gauge_to_abs') {
      pGaugeBar = pInputBar;
      pAbsBar = pGaugeBar + pAtmBar;
    } else if (mode === 'abs_to_gauge') {
      pAbsBar = pInputBar;
      pGaugeBar = pAbsBar - pAtmBar;
    } else {
      throw new Error(`Неизвестное направление перевода давления: ${mode}`);
    }

    if (pAbsBar <= 0) {
      throw new Error('Физическая ошибка: абсолютное давление P_abs должно быть строго больше 0 бар абс. (невозможен вакуум глубже абсолютного нуля).');
    }

    return {
      mode,
      unit,
      pAtmBar,
      pGaugeBar,
      pAbsBar,
      pGaugePsi: pGaugeBar * PSI_PER_BAR,
      pAbsPsi: pAbsBar * PSI_PER_BAR,
      pGaugeKpa: pGaugeBar * KPA_PER_BAR,
      pAbsKpa: pAbsBar * KPA_PER_BAR,
      saturationTableNotice:
        'Примечание: изменение P_atm в конвертере давления 5А пересчитывает только связь P_abs = P_gauge + P_atm и НЕ пересчитывает фиксированную справочную таблицу насыщенного пара в Модуле 5Б (которая составлена для 11 опорных точек при стандартном P_atm = 1.013 бар абс.).'
    };
  }

  // ============================================================================
  // КАЛЬКУЛЯТОР 5Б (ОСНОВНОЙ): Расход пара по тепловой нагрузке [S01, PDF p. 25]
  // + опциональная оценка умножения на SF и продувки котла [S01, p. 34; S22, p. 1]
  // ============================================================================
  function calcSteamLoad(rawParams) {
    const loadMode = rawParams.load_mode || 'direct_kw';
    let qLoadKw = 0;
    let phaseWarning = null;

    if (loadMode === 'direct_kw') {
      qLoadKw = parseRequiredNumber(rawParams.q_load_kw, 'Тепловая нагрузка аппарата Q_load (кВт)');
      if (qLoadKw <= 0) throw new Error('Тепловая нагрузка Q_load должна быть строго больше 0 кВт.');
    } else if (loadMode === 'product_heating') {
      const mp = parseRequiredNumber(rawParams.mp_kg_h, 'Массовый расход продукта m_p (кг/ч)');
      const cp = parseRequiredNumber(rawParams.cp_kj_kgc, 'Теплоёмкость продукта c_p (кДж/(кг·°C))');
      const tIn = parseRequiredNumber(rawParams.t_in_c, 'Начальная температура продукта T_in (°C)');
      const tOut = parseRequiredNumber(rawParams.t_out_c, 'Конечная температура продукта T_out (°C)');

      if (mp <= 0 || cp <= 0) throw new Error('Расход продукта m_p и теплоёмкость c_p должны быть строго больше 0.');
      if (tIn <= -273.15 || tOut <= -273.15) throw new Error('Температура не может быть ниже абсолютного нуля (-273.15 °C).');
      if (tIn < -50.0 || tOut >= 373.95) {
        throw new Error('Ошибка области применимости: температуры нагреваемого жидкого продукта выходят за физический диапазон жидкой фазы (-50; 373.95) °C.');
      }
      if (tIn <= 0.0 && cp >= 4.0) {
        throw new Error(
          'Ошибка области применимости (фазовое состояние): при T_in ≤ 0 °C и водяной теплоёмкости (c_p ≥ 4.0 кДж/(кг·°C)) среда замерзает, и формула однофазного нагрева без учёта скрытой теплоты плавления льда неприменима.'
        );
      }
      if (tOut <= tIn) throw new Error('Для процесса нагрева конечная температура T_out должна быть строго выше T_in.');
      if (tOut > 100.0) {
        phaseWarning = `Внимание (область применимости): T_out = ${tOut} °C > 100 °C — однофазный расчёт нагрева жидкости Q = m_p·c_p·ΔT/3600 без парообразования применим только если продукт находится под избыточным давлением P > P_sat(T_out).`;
      }

      qLoadKw = (mp * cp * (tOut - tIn)) / 3600.0;
    } else {
      throw new Error(`Неизвестный режим задания тепловой нагрузки: ${loadMode}`);
    }

    const hgOpt = parseOptionalNumber(rawParams.hg_kj_kg, 'Энтальпия сухого насыщенного пара h_g (кДж/кг)');
    const hfOpt = parseOptionalNumber(rawParams.hf_kj_kg, 'Энтальпия жидкого конденсата h_f (кДж/кг)');

    let hfg = null;
    if (rawParams.hfg_kj_kg !== undefined && rawParams.hfg_kj_kg !== null && String(rawParams.hfg_kj_kg).trim() !== '') {
      hfg = parseRequiredNumber(rawParams.hfg_kj_kg, 'Скрытая теплота парообразования h_fg (кДж/кг)');
    } else if (hgOpt !== null && hfOpt !== null) {
      hfg = +(hgOpt - hfOpt).toFixed(4);
    } else {
      hfg = parseRequiredNumber(rawParams.hfg_kj_kg, 'Скрытая теплота парообразования h_fg (кДж/кг)');
    }

    if (hgOpt !== null && hfOpt !== null) {
      if (hfOpt <= 0 || hgOpt <= hfOpt) {
        throw new Error('Энтальпия пара h_g должна быть строго больше энтальпии жидкости h_f (и h_f > 0 кДж/кг).');
      }
      const diff = hgOpt - hfOpt;
      if (Math.abs(diff - hfg) > 0.5) {
        throw new Error(
          `Нарушено термодинамическое тождество h_fg = h_g − h_f: введено h_fg = ${hfg} кДж/кг, но h_g − h_f = ${hgOpt} − ${hfOpt} = ${diff.toFixed(2)} кДж/кг.`
        );
      }
    }

    // Обязательное поле степени сухости пара x: пустой ввод НЕ подменяется молча единицей!
    const xDryness = parseRequiredNumber(rawParams.x_dryness, 'Степень сухости пара x (0..1)');

    const sf = parseOptionalNumber(rawParams.sf, 'Коэффициент запаса конденсатоотводчика SF');
    const tdsFw = parseOptionalNumber(rawParams.tds_fw_ppm, 'Проводимость/TDS питательной воды');
    const tdsMax = parseOptionalNumber(rawParams.tds_max_ppm, 'Макс. допустимый TDS/проводимость котловой воды');

    if (hfg <= 100 || hfg > 3000) {
      throw new Error('Скрытая теплота парообразования h_fg должна быть в физическом диапазоне (100; 3000] кДж/кг.');
    }
    if (xDryness <= 0 || xDryness > 1.0) {
      throw new Error('Степень сухости пара x должна находиться в интервале (0; 1.0].');
    }
    if (sf !== null && sf < 1.0) {
      throw new Error('Коэффициент запаса конденсатоотводчика SF должен быть не менее 1.0.');
    }

    // Проверка полноты пары TDS для продувки котла
    if ((tdsFw !== null && tdsMax === null) || (tdsFw === null && tdsMax !== null)) {
      throw new Error('Неполная пара параметров продувки котла: заполните оба поля (TDS/EC питательной воды и макс. TDS/EC котловой воды) либо оставьте оба пустыми.');
    }

    const hUsefulKjKg = xDryness * hfg;
    const mSteamKgH = (qLoadKw * 3600.0) / hUsefulKjKg;
    const mSteamTH = mSteamKgH / 1000.0;
    const mTrapCalcKgH = sf !== null ? mSteamKgH * sf : null;

    const hfgIdentityFormula = (hgOpt !== null && hfOpt !== null)
      ? `h_fg = h_g − h_f = ${hgOpt.toFixed(1)} − ${hfOpt.toFixed(1)} = ${(hgOpt - hfOpt).toFixed(1)} кДж/кг`
      : `h_fg = h_g − h_f = ${hfg.toFixed(1)} кДж/кг`;

    let blowdownResult = null;
    if (tdsFw !== null && tdsMax !== null) {
      if (tdsFw <= 0 || tdsMax <= tdsFw) {
        throw new Error('Должно выполняться условие TDS_max > TDS_fw > 0.');
      }
      const bFeedwaterFrac = tdsFw / tdsMax;
      const bSteamRatio = tdsFw / (tdsMax - tdsFw);
      const mFeedwaterIfSoleConsumerKgH = mSteamKgH / (1.0 - bFeedwaterFrac);
      const mBlowdownIfSoleConsumerKgH = mFeedwaterIfSoleConsumerKgH - mSteamKgH;

      blowdownResult = {
        bFeedwaterPct: bFeedwaterFrac * 100.0,
        bSteamPct: bSteamRatio * 100.0,
        cyclesOfConcentration: tdsMax / tdsFw,
        mFeedwaterIfSoleConsumerKgH,
        mBlowdownIfSoleConsumerKgH
      };
    }

    return {
      loadMode,
      qLoadKw,
      hg: hgOpt,
      hf: hfOpt,
      hfg,
      hfgIdentityFormula,
      xDryness,
      hUsefulKjKg,
      mSteamKgH,
      mSteamTH,
      sf,
      mTrapCalcKgH,
      blowdownResult,
      phaseWarning
    };
  }

  return {
    STEAM_TABLE_METADATA,
    VERIFIED_STEAM_TABLE,
    TLV_VENTED_RECEIVER_TABLE_1,
    TLV_VENTED_RECEIVER_TABLE_2,
    parseRequiredNumber,
    parseOptionalNumber,
    formatSteamTableOptionLabel,
    calcFilmTecTCF,
    calcCondensatePrimary,
    calcCondensateFlashAndTLV,
    calcChillerPerformance,
    calcAirFlowConversion,
    calcAirLeaks,
    calcAirMoistureCondensation,
    calcROBalance,
    calcRONormalization,
    calcSteamPressureConversion,
    calcSteamLoad
  };
});
