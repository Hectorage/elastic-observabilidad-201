#!/usr/bin/env node
/**
 * Capturas M05 — Lens, dashboards, métricas y alertas (Kibana 8.17).
 * Configura runtime fields, construye visualizaciones en Lens y captura el editor en vivo.
 * Uso: npm run capture-m05-screenshots
 */
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'docs', 'imagenes', 'kibana');
const BASE = process.env.KIBANA_URL || 'http://localhost:5601';
const ES = process.env.ES_URL || 'http://localhost:9200';
const VIEWPORT = { width: 1440, height: 900 };
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const TIME_RANGE = process.env.M05_TIME_RANGE || 'Last 24 hours';

const FILEBEAT_RUNTIME = {
  status_code: {
    type: 'long',
    script: {
      source: `
        if (params._source.message == null) return;
        def m = /status=(\\d+)/.matcher(params._source.message);
        if (m.find()) emit(Long.parseLong(m.group(1)));
      `.trim(),
    },
  },
  latency_ms: {
    type: 'long',
    script: {
      source: `
        if (params._source.message == null) return;
        def m = /latency_ms=(\\d+)/.matcher(params._source.message);
        if (m.find()) emit(Long.parseLong(m.group(1)));
      `.trim(),
    },
  },
};

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, type: 'png' });
  console.log('OK', file);
}

async function kibanaFetch(apiPath, opts = {}) {
  return fetch(`${BASE}${apiPath}`, {
    ...opts,
    headers: { 'kbn-xsrf': 'true', ...(opts.headers || {}) },
  });
}

async function ensureDataView(title, name, runtimeFieldMap = {}) {
  const list = await kibanaFetch('/api/data_views');
  const all = await list.json();
  const found = all.data_view?.find((d) => d.title === title);
  const body = { data_view: { title, name, timeFieldName: '@timestamp', runtimeFieldMap } };
  if (found) {
    await kibanaFetch(`/api/data_views/data_view/${found.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return found.id;
  }
  const res = await kibanaFetch('/api/data_views/data_view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await res.json()).data_view.id;
}

async function goto(page, url, waitMs = 4000) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await sleep(waitMs);
}

async function dismissToasts(page) {
  for (const sel of ['[data-test-subj="dismissAlertButton"]', '[data-test-subj="toastCloseButton"]']) {
    await page.$(sel).then((btn) => btn?.click());
    await sleep(200);
  }
}

async function setTimeRange(page, label = TIME_RANGE) {
  const tp = await page.$('[data-test-subj="superDatePickerShowDatesButton"]');
  if (!tp) return;
  await tp.click();
  await sleep(800);
  const picked = await page.evaluate((text) => {
    const match = [...document.querySelectorAll('button, span')].find(
      (el) => el.textContent?.trim() === text
    );
    match?.click();
    return !!match;
  }, label);
  if (picked) await sleep(2500);
  else await page.keyboard.press('Escape');
}

async function applyKql(page, kql) {
  const search = await page.$(
    '[data-test-subj="unifiedQueryInput"] textarea, [data-test-subj="queryInput"]'
  );
  if (!search || !kql) return;
  await search.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.type(kql, { delay: 5 });
  await page.keyboard.press('Enter');
  await sleep(4500);
}

async function openDiscover(page, dataViewLabel, kql) {
  await goto(page, `${BASE}/app/discover`);
  await dismissToasts(page);
  await page.click('[data-test-subj="dataViewSelector"]').catch(() => {});
  await sleep(800);
  await page.evaluate((text) => {
    [...document.querySelectorAll('button, a, [role="option"]')]
      .find((el) => el.textContent?.includes(text))
      ?.click();
  }, dataViewLabel);
  await sleep(2000);
  await setTimeRange(page);
  if (kql) await applyKql(page, kql);
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Search entire time range')
    )?.click();
  });
  await sleep(4000);
}

async function openNewLens(page, dataViewLabel = 'filebeat-logs') {
  await goto(page, `${BASE}/app/lens`);
  await dismissToasts(page);
  await page.evaluate(() =>
    [...document.querySelectorAll('a, button')].find((b) => /create/i.test(b.textContent))?.click()
  );
  await sleep(5000);
  await page.click('[data-test-subj="lns-dataView-switch-link"]');
  await sleep(800);
  await page.evaluate((label) => {
    [...document.querySelectorAll('button, a, [role="option"]')]
      .find((el) => el.textContent?.includes(label))
      ?.click();
  }, dataViewLabel);
  await sleep(2500);
  await setTimeRange(page);
}

async function addLensField(page, fieldName) {
  const search = await page.$('[data-test-subj="lnsIndexPatternFieldSearch"]');
  if (!search) return;
  await search.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  const term = fieldName === 'Records' ? 'records' : fieldName;
  await page.keyboard.type(term, { delay: 8 });
  await sleep(1200);
  const testId =
    fieldName === 'Records' ? 'fieldToggle-___records___' : `fieldToggle-${fieldName}`;
  const toggle = await page.$(`[data-test-subj="${testId}"]`);
  if (toggle) await toggle.click();
  await sleep(3500);
}

async function setLensChartType(page, label) {
  await page.click('[data-test-subj="lnsChartSwitchPopover"]');
  await sleep(700);
  const picked = await page.evaluate((text) => {
    const items = [...document.querySelectorAll('button, [role="menuitem"], [role="option"]')];
    const exact = items.find((el) => el.textContent?.trim() === text);
    const partial = items.find((el) => el.textContent?.includes(text));
    (exact || partial)?.click();
    return !!(exact || partial);
  }, label);
  if (!picked) await page.keyboard.press('Escape');
  await sleep(3500);
}

async function captureLens(page, { dataView, kql, field, chartType, chartFirst = false, shotName }) {
  await openNewLens(page, dataView);
  if (kql) await applyKql(page, kql);
  if (chartFirst && chartType) await setLensChartType(page, chartType);
  if (field) await addLensField(page, field);
  if (!chartFirst && chartType) await setLensChartType(page, chartType);
  await sleep(2000);
  await shot(page, shotName);
}

async function captureDashboardFromLensPanels(page, shotName, configs) {
  await goto(page, `${BASE}/app/dashboards`);
  await dismissToasts(page);
  await page.evaluate(() =>
    [...document.querySelectorAll('a, button')].find((b) => /create dashboard/i.test(b.textContent))?.click()
  );
  await sleep(5000);
  await setTimeRange(page);

  for (const cfg of configs) {
    await page.evaluate(() =>
      [...document.querySelectorAll('button')].find((b) =>
        /add panel|add from library|create/i.test(b.textContent)
      )?.click()
    );
    await sleep(1500);
    await page.evaluate(() =>
      [...document.querySelectorAll('button, a, [role="menuitem"]')].find((el) =>
        /create visualization|new visualization|create/i.test(el.textContent)
      )?.click()
    );
    await sleep(6000);
    if (cfg.dataView) {
      await page.click('[data-test-subj="lns-dataView-switch-link"]').catch(() => {});
      await sleep(800);
      await page.evaluate((label) => {
        [...document.querySelectorAll('button, a, [role="option"]')]
          .find((el) => el.textContent?.includes(label))
          ?.click();
      }, cfg.dataView);
      await sleep(2000);
    }
    if (cfg.kql) await applyKql(page, cfg.kql);
    if (cfg.field) await addLensField(page, cfg.field);
    if (cfg.chartType) await setLensChartType(page, cfg.chartType);
    await sleep(2000);
    await page.evaluate(() =>
      [...document.querySelectorAll('button')].find((b) =>
        /^save and return$/i.test(b.textContent?.trim())
      )?.click()
    );
    await sleep(4000);
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(500);
  }

  await sleep(2000);
  await shot(page, shotName);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const count = await fetch(`${ES}/filebeat-*/_count`).then((r) => r.json());
  if (!count.count) {
    throw new Error('Sin documentos en filebeat-* — levanta: docker compose --profile beats up -d');
  }

  await ensureDataView('filebeat-*', 'filebeat-logs', FILEBEAT_RUNTIME);
  await ensureDataView('metricbeat-*', 'metricbeat-metrics');

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--window-size=${VIEWPORT.width},${VIEWPORT.height}`],
    defaultViewport: VIEWPORT,
  });

  // M05-01
  {
    const page = await browser.newPage();
    await openDiscover(page, 'filebeat-logs', 'log_source : "demo-app"');
    await shot(page, 'm05-discover-demo-app');
    await page.close();
  }
  {
    const page = await browser.newPage();
    await captureLens(page, {
      dataView: 'filebeat-logs',
      kql: 'log_source : "demo-app"',
      field: 'status_code',
      chartType: 'Donut',
      chartFirst: true,
      shotName: 'm05-lens-donut-status',
    });
    await page.close();
  }

  // M05-02
  {
    const page = await browser.newPage();
    await captureLens(page, {
      dataView: 'filebeat-logs',
      kql: 'log_source : "demo-app" and status_code >= 500',
      field: 'Records',
      chartType: 'Metric',
      chartFirst: true,
      shotName: 'm05-lens-metric-error',
    });
    await page.close();
  }
  {
    const page = await browser.newPage();
    await captureLens(page, {
      dataView: 'filebeat-logs',
      kql: 'log_source : "demo-app"',
      field: 'latency_ms',
      chartType: 'Line',
      shotName: 'm05-lens-line-latency',
    });
    await page.close();
  }
  {
    const page = await browser.newPage();
    await captureDashboardFromLensPanels(page, 'm05-dashboard-ops-logs', [
      {
        dataView: 'filebeat-logs',
        kql: 'log_source : "demo-app" and status_code >= 500',
        field: 'Records',
        chartType: 'Metric',
      },
      {
        dataView: 'filebeat-logs',
        kql: 'log_source : "demo-app"',
        field: 'latency_ms',
        chartType: 'Line',
      },
      {
        dataView: 'filebeat-logs',
        kql: 'log_source : "demo-app"',
        field: 'status_code',
        chartType: 'Donut',
      },
    ]);
    await page.close();
  }

  // M05-03
  {
    const page = await browser.newPage();
    await openDiscover(
      page,
      'metricbeat-metrics',
      'event.module : "docker" and metricset.name : "cpu"'
    );
    await shot(page, 'm05-discover-metricbeat-docker');
    await page.close();
  }
  {
    const page = await browser.newPage();
    await captureLens(page, {
      dataView: 'metricbeat-metrics',
      kql: 'event.module : "docker" and metricset.name : "cpu"',
      field: 'docker.cpu.total.pct',
      chartType: 'Line',
      shotName: 'm05-lens-cpu-docker',
    });
    await page.close();
  }
  {
    const page = await browser.newPage();
    await captureDashboardFromLensPanels(page, 'm05-dashboard-host-metrics', [
      {
        dataView: 'metricbeat-metrics',
        kql: 'event.module : "docker" and metricset.name : "cpu"',
        field: 'docker.cpu.total.pct',
        chartType: 'Line',
      },
    ]);
    await page.close();
  }

  // M05-04 — biblioteca, saved objects, alertas
  {
    const page = await browser.newPage();
    await goto(page, `${BASE}/app/visualize`);
    await dismissToasts(page);
    await shot(page, 'm05-visualize-library');

    await goto(page, `${BASE}/app/management/kibana/objects`);
    await dismissToasts(page);
    await shot(page, 'm05-saved-objects-lab');

    await goto(page, `${BASE}/app/observability/alerts/rules/create`);
    await dismissToasts(page);
    await sleep(3000);
    await shot(page, 'm05-alert-create-rule');

    await goto(page, `${BASE}/app/observability/alerts`);
    await dismissToasts(page);
    await shot(page, 'm05-observability-alerts');

    await goto(page, `${BASE}/app/management/insightsAndAlerting/triggersActions/rules`);
    await dismissToasts(page);
    await shot(page, 'm05-alert-rule-list');
    await page.close();
  }

  await browser.close();
  console.log('M05 captures done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
