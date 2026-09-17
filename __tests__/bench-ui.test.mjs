import { beforeAll, beforeEach, describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Bench calculator browser controls', () => {
  beforeAll(async () => {
    const html = readFileSync(resolve('cloudflare-landing/bench/index.html'), 'utf8');
    document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
    await import('../cloudflare-landing/bench/calculator.mjs');
  });
  beforeEach(() => document.getElementById('reset').click());

  it('updates the recommendation for a selected business scenario', () => {
    document.querySelector('[data-preset="intelligence"]').click();
    expect(document.getElementById('result-title').textContent).toContain('Luminance');
    expect(document.getElementById('weight-1').value).toBe('0');
  });
  it('recomputes vetoes on native select change events', () => {
    for (const vendor of [0, 1]) {
      const el = document.querySelector(`[data-vendor="${vendor}"][data-gate="0"]`);
      el.value = 'fail'; el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    expect(document.getElementById('result-title').textContent).toContain('Nenhuma ferramenta');
    expect(document.getElementById('ranking').textContent).toContain('Veto: Segurança');
  });
  it('updates custom scores and handles all-zero priorities', () => {
    const el = document.querySelector('[data-vendor="0"][data-score="0"]');
    el.value = '0'; el.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.getElementById('result-title').textContent).toContain('Luminance');
    document.querySelectorAll('[data-weight]').forEach(el => {
      el.value = '0'; el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(document.getElementById('result-title').textContent).toContain('Escolha ao menos');
    expect(document.getElementById('pilot').children.length).toBe(0);
  });
  it('reveals the official source list when a citation is selected', () => {
    const el = document.querySelector('a[href="#source-lu-sf"]');
    el.addEventListener('click', e => e.preventDefault(), { once: true });
    el.click();
    expect(document.querySelector('.sources').open).toBe(true);
  });
});
