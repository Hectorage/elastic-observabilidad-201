#!/usr/bin/env node
/**
 * Capturas reales de Kibana 8.17 (Chrome + puppeteer-core).
 * Prepara data views vía API, indexa lab-smoke para M02 y captura pantallas del curso.
 * Uso: npm run capture-screenshots
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

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, type: 'png' });
  console.log('OK', file);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function kibanaFetch(apiPath, opts = {}) {
  return fetch(`${BASE}${apiPath}`, {
    ...opts,
    headers: { 'kbn-xsrf': 'true', ...(opts.headers || {}) },
  });
}

async function ensureDataView(title, name) {
  const res = await kibanaFetch('/api/data_views/data_view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data_view: { title, name, timeFieldName: '@timestamp' },
    }),
  });
  if (res.ok) {
    const json = await res.json();
    return json.data_view.id;
  }
  const list = await kibanaFetch('/api/data_views');
  const all = await list.json();
  const found = all.data_view?.find((d) => d.title === title);
  return found?.id || title;
}

async function ensureLabSmoke() {
  await fetch(`${ES}/lab-smoke`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings: { number_of_shards: 1, number_of_replicas: 0 } }),
  });
  await fetch(`${ES}/lab-smoke/_doc/smoke-m02`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      '@timestamp': '2025-01-15T10:00:00.000Z',
      message: 'M02-01 smoke document',
      'course.exercise': 'M02-01',
      'course.module': 'M02',
    }),
  });
  return ensureDataView('lab-smoke', 'lab-smoke');
}

async function goto(page, url, waitMs = 5000) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 120_000 });
  await sleep(waitMs);
}

async function dismissToasts(page) {
  for (const sel of [
    '[data-test-subj="dismissAlertButton"]',
    '[data-test-subj="toastCloseButton"]',
  ]) {
    const btn = await page.$(sel);
    if (btn) {
      await btn.click();
      await sleep(500);
    }
  }
}

async function selectDataView(page, label) {
  const btn = await page.$(
    '[data-test-subj="dataViewSelector"], [data-test-subj="indexPattern-switch-link"], button[data-test-subj*="dataView"]'
  );
  if (btn) {
    await btn.click();
    await sleep(1000);
  }
  const picked = await page.evaluate((text) => {
    const items = [...document.querySelectorAll('button, a, [role="option"], span')];
    const match = items.find(
      (el) => el.textContent?.trim() === text || el.textContent?.includes(text)
    );
    if (match) {
      match.click();
      return true;
    }
    return false;
  }, label);
  if (!picked) {
    // Fallback: escribir en el buscador del popover
    await page.keyboard.type(label.slice(0, 8));
    await sleep(800);
    await page.keyboard.press('Enter');
  }
  await sleep(3000);
}

async function setTimeRange(page, label) {
  const tp = await page.$(
    '[data-test-subj="superDatePickerShowDatesButton"], [data-test-subj="datePickerRange"]'
  );
  if (!tp) return;
  await tp.click();
  await sleep(800);
  const picked = await page.evaluate((text) => {
    const items = [...document.querySelectorAll('button, span')];
    const match = items.find((el) => el.textContent?.trim() === text);
    if (match) {
      match.click();
      return true;
    }
    return false;
  }, label);
  if (picked) await sleep(2000);
  else await page.keyboard.press('Escape');
}

async function applyKql(page, kql) {
  const search = await page.$(
    '[data-test-subj="unifiedQueryInput"] textarea, [data-test-subj="queryInput"], [data-test-subj="unifiedQueryInput"]'
  );
  if (!search || !kql) return;
  await search.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.type(kql);
  await page.keyboard.press('Enter');
  await sleep(5000);
}

async function openDiscover(page, dataViewName, kql, timeLabel = 'Last 15 minutes') {
  await goto(page, `${BASE}/app/discover`, 4000);
  await dismissToasts(page);
  await selectDataView(page, dataViewName);
  if (timeLabel) await setTimeRange(page, timeLabel);
  if (kql) await applyKql(page, kql);
  const expandTime = await page.$(
    '[data-test-subj="discoverNoResultsSearchEntireTimeRange"], button'
  );
  if (expandTime) {
    const clicked = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Search entire time range')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (clicked) await sleep(4000);
  }
}

async function expandFirstDiscoverRow(page) {
  // Clic en la primera fila de documentos (columna Summary)
  const clicked = await page.evaluate(() => {
    const row =
      document.querySelector('tr[data-test-subj="docTableRow"]') ||
      document.querySelector('[data-test-subj="discoverDocTable"] tbody tr') ||
      document.querySelector('[data-test-subj="docTable"] tbody tr');
    if (row) {
      row.click();
      return 'row';
    }
    const cells = document.querySelectorAll('[data-test-subj="dataGridRowCell"]');
    if (cells.length) {
      cells[0].click();
      return 'grid';
    }
    return null;
  });
  if (clicked) {
    await sleep(2500);
    // Segundo clic en chevron de expansión si aparece
    await page.evaluate(() => {
      const chevron = document.querySelector(
        '[data-test-subj="docTableExpandToggleButton"], button[aria-label*="Expand"], .euiButtonIcon[aria-label*="expand"]'
      );
      chevron?.click();
    });
    await sleep(1500);
    return true;
  }
  return false;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await ensureDataView('filebeat-*', 'filebeat-logs');
  await ensureLabSmoke();

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: VIEWPORT,
  });
  const page = await browser.newPage();

  await goto(page, `${BASE}/app/discover`);
  await dismissToasts(page);
  await shot(page, 'kibana-discover-sin-data-view');

  await goto(page, `${BASE}/app/management/kibana/dataViews/create`);
  const pat = await page.$('[data-test-subj="createIndexPatternIndexPatternInput"], input[name="title"]');
  if (pat) {
    await pat.click({ clickCount: 3 });
    await page.keyboard.type('filebeat-*');
    await sleep(2000);
  }
  await shot(page, 'kibana-crear-data-view');

  await goto(page, `${BASE}/app/management/kibana/dataViews`);
  await shot(page, 'kibana-data-views-list');

  await openDiscover(page, 'filebeat-logs', 'log_source : "demo-app"');
  await shot(page, 'kibana-discover-con-eventos');

  if (await expandFirstDiscoverRow(page)) {
    await shot(page, 'kibana-discover-fila-expandida');
  } else {
    console.warn('WARN: no se pudo expandir fila Discover');
  }

  await openDiscover(page, 'lab-smoke', 'course.exercise : "M02-01"', 'Last 1 year');
  await shot(page, 'kibana-discover-lab-smoke');

  await goto(page, `${BASE}/app/management/data/index_management/indices`);
  await shot(page, 'kibana-index-management');

  await goto(page, `${BASE}/app/lens`, 8000);
  await dismissToasts(page);
  await shot(page, 'kibana-lens-editor');

  await goto(page, `${BASE}/app/dashboards`);
  await shot(page, 'kibana-dashboards-list');

  await goto(page, `${BASE}/app/observability/alerts`);
  await shot(page, 'kibana-observability-alerts');

  await goto(page, `${BASE}/app/management/insightsAndAlerting/triggersActions/rules`);
  await shot(page, 'kibana-alerting-rules');

  await goto(page, `${BASE}/app/management/kibana/objects`);
  await shot(page, 'kibana-saved-objects');

  await goto(page, `${BASE}/app/monitoring`, 8000);
  await dismissToasts(page);
  await shot(page, 'kibana-stack-monitoring');

  await browser.close();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
