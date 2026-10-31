// 06_web_project/sw.js
// Generated deterministically by scripts/build_sw.mjs (Edition v15.8)

'use strict';

const BUILD_ID = 'v15.8-ff0946b7';
const CACHE_NAME = 'eng-lib-' + BUILD_ID;
const PRECACHE = [
  "./",
  "app.js",
  "app.webmanifest",
  "assets/charts/chart_01_flash_steam.svg",
  "assets/charts/chart_02_chiller_cond_fouling.svg",
  "assets/charts/chart_03_air_moisture_pdp.svg",
  "assets/charts/chart_04_ro_tcf_temp.svg",
  "assets/icon.svg",
  "calc_ui.js",
  "calculators.js",
  "data/case_context.js",
  "data/diagram_flows.js",
  "data/economics.js",
  "data/experiments.js",
  "data/glossary_and_sources.js",
  "data/guide_air.js",
  "data/guide_chillers.js",
  "data/guide_condensate.js",
  "data/guide_ro.js",
  "data/guide_steam.js",
  "data/i18n_ui.js",
  "data/learning_map.js",
  "data/saved_calcs.js",
  "data/shift_logs.js",
  "data/steam_table.js",
  "data/survey.js",
  "data/symptoms.js",
  "data/systems_air_ro.js",
  "data/systems_chillers.js",
  "data/systems_steam_condensate.js",
  "data/term_aliases.js",
  "data/term_linker.js",
  "data/trainer_cases_part1.js",
  "data/trainer_cases_part2.js",
  "data/trust_labels.js",
  "data/units.js",
  "diagrams/01_steam_system_flow.svg",
  "diagrams/01_steam_system_flow_he.svg",
  "diagrams/01_steam_system_flow_ru.svg",
  "diagrams/02_condensate_recovery_flow.svg",
  "diagrams/02_condensate_recovery_flow_he.svg",
  "diagrams/02_condensate_recovery_flow_ru.svg",
  "diagrams/03_chiller_loops_flow.svg",
  "diagrams/03_chiller_loops_flow_he.svg",
  "diagrams/03_chiller_loops_flow_ru.svg",
  "diagrams/04_compressed_air_system_flow.svg",
  "diagrams/04_compressed_air_system_flow_he.svg",
  "diagrams/04_compressed_air_system_flow_ru.svg",
  "diagrams/05_reverse_osmosis_flow.svg",
  "diagrams/05_reverse_osmosis_flow_he.svg",
  "diagrams/05_reverse_osmosis_flow_ru.svg",
  "index.html",
  "styles/main.css"
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE);
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key.indexOf('eng-lib-') === 0 && key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (!event.request || event.request.method !== 'GET') {
    return;
  }
  const scopeStr = (self.registration && self.registration.scope) ? self.registration.scope : self.location.href;
  const scopeUrl = new URL('./', scopeStr);
  const reqUrl = new URL(event.request.url);

  if (reqUrl.origin !== scopeUrl.origin || reqUrl.pathname.indexOf(scopeUrl.pathname) !== 0) {
    return;
  }

  if (event.request.mode === 'navigate') {
    const indexUrl = new URL('index.html', scopeUrl).href;
    event.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(indexUrl).then(function (hit) {
          if (hit) return hit;
          return cache.match(event.request, { ignoreSearch: true });
        });
      }).then(function (cached) {
        return cached || fetch(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(event.request).then(function (hit) {
        if (hit) return hit;
        return cache.match(event.request, { ignoreSearch: true });
      });
    }).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});

self.addEventListener('message', function (event) {
  const data = event && event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'GET_BUILD_ID') {
    const reply = { buildId: BUILD_ID, cacheName: CACHE_NAME };
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage(reply);
    } else if (event.source && typeof event.source.postMessage === 'function') {
      event.source.postMessage(reply);
    }
  }
});
