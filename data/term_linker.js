/**
 * 06_web_project/data/term_linker.js — Чистая функция расстановки контекстных ссылок
 * на термины словаря при рендере учебника и тренажёра (Поручение v15.5, раздел 2.3b).
 *
 * Правила:
 * 1. Текст в данных (guide_*.js, trainer_cases_*.js, glossary_and_sources.js) не меняется.
 * 2. Не трогается текст внутри <a>, <code>, <pre>, <h1>–<h4>, <summary>, <mark> и элементов
 *    с классами formula-box, ltr-math, sec-term, term-link, guide-ru-fallback, а также внутри $...$ / $$...$$.
 * 3. Для каждого термина в блоке подсвечивается только первое вхождение.
 * 4. Функция идемпотентна и сохраняет innerText байт-в-байт.
 * 5. UMD-обёртка: в Node — module.exports, в браузере — window.TERM_LINKER.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const api = factory();
    root.TERM_LINKER = api;
    root.linkGlossaryTerms = api.linkGlossaryTerms;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function () {
  'use strict';

  const EXCLUDED_TAGS = new Set([
    'a',
    'code',
    'pre',
    'h1',
    'h2',
    'h3',
    'h4',
    'summary',
    'mark',
    'script',
    'style',
    'button',
    'svg'
  ]);

  const VOID_TAGS = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr'
  ]);

  const EXCLUDED_CLASSES = [
    'formula-box',
    'ltr-math',
    'sec-term',
    'term-link',
    'guide-ru-fallback'
  ];

  const WORD_CHAR_CLASS = 'A-Za-zА-Яа-яЁё0-9\\u0590-\\u05FF';
  const BOUNDARY_BEFORE = `(?<![${WORD_CHAR_CLASS}])`;
  const BOUNDARY_AFTER = `(?![${WORD_CHAR_CLASS}])`;

  function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function isAbbreviationOrExactForm(form) {
    const s = String(form || '').trim();
    if (!s) return false;
    // Если содержит латиницу или состоит только из заглавных кириллических букв/цифр/символов (КО, ЧРП, ОВП, ЭРВ, ТРВ)
    if (/[A-Za-z]/.test(s)) return true;
    if (/^[А-ЯЁ0-9/+_-]+$/.test(s)) return true;
    return false;
  }

  function buildFormRegex(form, lang) {
    const trimmed = String(form || '').trim();
    if (!trimmed) return null;
    const esc = escapeRegex(trimmed);
    if (isAbbreviationOrExactForm(trimmed)) {
      return new RegExp(`${BOUNDARY_BEFORE}(${esc})${BOUNDARY_AFTER}`, 'g');
    }
    if (lang === 'he') {
      return new RegExp(`${BOUNDARY_BEFORE}([והבלכמש]?${esc}(?:ים|ות|י)?)${BOUNDARY_AFTER}`, 'g');
    }
    // RU-форма: граница слова, форма, до 3 кириллических букв окончания, граница слова, без учёта регистра
    return new RegExp(`${BOUNDARY_BEFORE}(${esc}[а-яё]{0,3})${BOUNDARY_AFTER}`, 'gi');
  }

  function hasExcludedClass(tagToken) {
    const m = tagToken.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (!m) return false;
    const clsStr = (m[1] || m[2] || '').trim();
    if (!clsStr) return false;
    const classes = clsStr.split(/\s+/);
    for (const c of classes) {
      if (EXCLUDED_CLASSES.includes(c)) return true;
    }
    return false;
  }

  function buildCompiledMatchers(lang, glossaryItems, aliases) {
    const validIds = new Set(
      Array.isArray(glossaryItems) ? glossaryItems.map((g) => g.id) : []
    );
    const termsMap = (aliases && aliases.TERMS) || aliases || {};
    const list = [];

    for (const [termId, cfg] of Object.entries(termsMap)) {
      if (validIds.size > 0 && !validIds.has(termId)) continue;
      const forms = cfg && cfg.linkForms && Array.isArray(cfg.linkForms[lang])
        ? cfg.linkForms[lang]
        : [];
      for (const rawForm of forms) {
        const form = String(rawForm || '').trim();
        if (!form) continue;
        const regex = buildFormRegex(form, lang);
        if (regex) {
          list.push({
            termId,
            form,
            len: form.length,
            regex
          });
        }
      }
    }

    // Более длинные формы первыми, чтобы составные термины («вторичный пар», «מלכודת קיטור»)
    // срабатывали раньше одиночных слов («пар», «קיטור»)
    list.sort((a, b) => b.len - a.len);
    return list;
  }

  function linkPlainTextSegment(text, matchers, linkedTermIds) {
    if (!text || !text.trim()) return text;

    // Собираем кандидаты вхождений для ещё не связанных терминов
    const accepted = [];
    const selectedInSegment = new Set();

    for (const m of matchers) {
      if (linkedTermIds.has(m.termId) || selectedInSegment.has(m.termId)) continue;
      m.regex.lastIndex = 0;
      let match;
      while ((match = m.regex.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        // Проверяем отсутствие пересечения с уже выбранными вхождениями
        const overlaps = accepted.some((a) => !(end <= a.start || start >= a.end));
        if (!overlaps) {
          accepted.push({
            termId: m.termId,
            start,
            end,
            matchedText: match[0]
          });
          selectedInSegment.add(m.termId);
          break;
        }
      }
    }

    if (accepted.length === 0) return text;

    accepted.sort((a, b) => a.start - b.start);
    let out = '';
    let cursor = 0;
    for (const item of accepted) {
      if (linkedTermIds.has(item.termId)) continue;
      out += text.slice(cursor, item.start);
      out += `<a class="term-link" href="#${item.termId}" data-term-id="${item.termId}">${item.matchedText}</a>`;
      linkedTermIds.add(item.termId);
      cursor = item.end;
    }
    out += text.slice(cursor);
    return out;
  }

  function linkTextProtectingInlineMath(text, matchers, linkedTermIds) {
    if (!text || !text.trim()) return text;
    if (!text.includes('$')) {
      return linkPlainTextSegment(text, matchers, linkedTermIds);
    }
    // Защищаем $$...$$ и $...$ на случай вызова до renderGuideMathHtml
    const mathRe = /\$\$[\s\S]*?\$\$|\$[^$\n]+?\$/g;
    let out = '';
    let lastIdx = 0;
    let m;
    while ((m = mathRe.exec(text)) !== null) {
      if (m.index > lastIdx) {
        out += linkPlainTextSegment(text.slice(lastIdx, m.index), matchers, linkedTermIds);
      }
      out += m[0];
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < text.length) {
      out += linkPlainTextSegment(text.slice(lastIdx), matchers, linkedTermIds);
    }
    return out;
  }

  function linkGlossaryTerms(html, lang, glossaryItems, aliases) {
    if (typeof html !== 'string' || !html) return html || '';
    const normLang = lang === 'he' ? 'he' : 'ru';
    const matchers = buildCompiledMatchers(normLang, glossaryItems, aliases);
    if (matchers.length === 0) return html;

    // Для идемпотентности отмечаем уже существующие в блоке ссылки data-term-id
    const linkedTermIds = new Set();
    const existingRe = /\bdata-term-id\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;
    let em;
    while ((em = existingRe.exec(html)) !== null) {
      const id = em[1] || em[2];
      if (id) linkedTermIds.add(id);
    }

    const tokens = html.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g);
    if (!tokens) return html;

    const stack = [];
    const outTokens = [];

    for (const token of tokens) {
      if (token.startsWith('<!--')) {
        outTokens.push(token);
        continue;
      }
      if (token.startsWith('<')) {
        const closeMatch = token.match(/^<\s*\/\s*([A-Za-z0-9:-]+)/);
        if (closeMatch) {
          const closeTag = closeMatch[1].toLowerCase();
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].tag === closeTag) {
              stack.length = i;
              break;
            }
          }
          outTokens.push(token);
          continue;
        }

        const openMatch = token.match(/^<\s*([A-Za-z0-9:-]+)/);
        if (openMatch) {
          const openTag = openMatch[1].toLowerCase();
          const isSelfClosing = /\/\s*>$/.test(token) || VOID_TAGS.has(openTag);
          if (!isSelfClosing) {
            const parentExcluded = stack.length > 0 ? stack[stack.length - 1].excluded : false;
            const selfExcluded = EXCLUDED_TAGS.has(openTag) || hasExcludedClass(token);
            stack.push({
              tag: openTag,
              excluded: parentExcluded || selfExcluded
            });
          }
        }
        outTokens.push(token);
        continue;
      }

      const isExcluded = stack.length > 0 && stack[stack.length - 1].excluded;
      if (isExcluded) {
        outTokens.push(token);
      } else {
        outTokens.push(linkTextProtectingInlineMath(token, matchers, linkedTermIds));
      }
    }

    return outTokens.join('');
  }

  return Object.freeze({
    linkGlossaryTerms,
    buildFormRegex,
    isAbbreviationOrExactForm
  });
});
