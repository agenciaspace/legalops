import { describe, it, expect } from 'vitest';
import { initialState, calculate, decodeState, normalizeState, report, presets, VERSION } from '../cloudflare-landing/bench/model.mjs';

describe('public Bench decision model', () => {
  it('normalizes the weighted mean to 100 without confusing weights with percentages', () => {
    const state = initialState();
    state.weights = [5, 0, 0, 0];
    const { results } = calculate(state);
    expect(results[0].score).toBe(100);
    expect(results[1].score).toBe(40);
  });
  it('changes the leading candidate when business priorities change', () => {
    const state = initialState();
    state.weights = presets.revenue.weights;
    expect(calculate(state).eligible[0].id).toBe('ironclad');
    state.weights = presets.intelligence.weights;
    expect(calculate(state).eligible[0].id).toBe('luminance');
  });
  it('does not invent a ranking when all priorities are zero', () => {
    const state = initialState(); state.weights = [0, 0, 0, 0];
    expect(calculate(state).status).toBe('empty');
    expect(calculate(state).results.every(v => v.score === null)).toBe(true);
  });
  it('treats a tie and a margin below five points as close', () => {
    const state = initialState(); state.weights = presets.balanced.weights; state.scores[1] = [...state.scores[0]];
    expect(calculate(state).status).toBe('close');
    state.weights = [1, 5, 5, 5]; state.scores[1][0] -= 1;
    expect(calculate(state).status).toBe('close');
    state.weights = [1, 1, 1, 1];
    expect(calculate(state).status).toBe('lead');
  });
  it('excludes a vetoed leader and preserves its score for audit', () => {
    const state = initialState(); state.weights = presets.balanced.weights; state.gates[0][0] = 'fail';
    const result = calculate(state);
    expect(result.eligible[0].id).toBe('luminance');
    expect(result.results[0].score).toBe(90);
    expect(result.results[0].failed).toEqual(['Segurança e governança']);
    state.gates[1][3] = 'fail';
    expect(calculate(state).status).toBe('blocked');
  });
  it('preserves pending requirements instead of implicitly approving them', () => {
    expect(calculate(initialState()).results[0].pending).toHaveLength(4);
  });
  it('round trips shared edited weights, scores and gates', () => {
    const state = initialState(); state.weights = [0, 2, 4, 5]; state.scores[1][0] = 4; state.gates[1][1] = 'pass';
    expect(decodeState('#cenario=' + encodeURIComponent(JSON.stringify(state)))).toEqual(normalizeState(state));
  });
  it('rejects malformed and incompatible shared payloads and ignores invalid values', () => {
    expect(decodeState('#cenario=%bad')).toBeNull();
    expect(decodeState('#cenario=' + encodeURIComponent(JSON.stringify({version:'old'})))).toBeNull();
    expect(decodeState('#cenario=' + 'x'.repeat(6000))).toBeNull();
    const state = normalizeState({ weights: [Infinity, -1, '5', 99], scores: [[NaN]], gates: [['<script>']] });
    expect(state).toEqual(initialState());
    expect(normalizeState(null)).toEqual(initialState());
  });
  it('exports actual inputs, vetoes, provenance and source URLs', () => {
    const state = initialState(); state.gates[0][3] = 'fail'; state.weights[0] = 4;
    const text = report(state);
    expect(text).toContain(VERSION);
    expect(text).toContain('| Workflows e aprovações | 4 | 5 | 2 |');
    expect(text).toContain('Ironclad — Custo total aprovado: Não atende');
    expect(text).toContain('https://www.luminance.com/solutions/sales/');
    expect(text).toContain('hipóteses editoriais');
  });
});

it('starts with all 32 criteria and never recommends a vendor with missing evidence', () => {
  const state = initialState();
  const result = calculate(state);
  expect(state.weights).toHaveLength(32);
  expect(result.status).toBe('incomplete');
  expect(result.results[0].score).toBeNull();
  expect(result.results[0].coverage).toBe(4 / 32);
  expect(result.results[0].lower).toBeCloseTo(11.25);
  expect(result.results[0].upper).toBeCloseTo(98.75);
  state.weights = presets.balanced.weights;
  state.scores[0][0] = null;
  expect(calculate(state).status).toBe('incomplete');
  state.scores[0][0] = 0;
  expect(calculate(state).results[0].score).toBe(65);
});
it('keeps old shared scenarios compatible without adding 28 new priorities', () => {
  const state = decodeState('#cenario=' + encodeURIComponent(JSON.stringify({ version: '2026-09-17', weights: [3,3,3,3] })));
  expect(state.weights.slice(4).every(w => w === 0)).toBe(true);
  expect(calculate(state).results[0].score).toBe(90);
});
it('bounds private context and only accepts known decision stages and checklist items', () => {
  const state = normalizeState({ profile: { legal_users: -1, business_users: 30, existing_tools: 'X'.repeat(900) }, stage: 'pilot', completed: ['pilot-0', 'pilot-0', '<script>'] });
  expect(state.profile.legal_users).toBe('');
  expect(state.profile.business_users).toBe(30);
  expect(state.profile.existing_tools).toHaveLength(700);
  expect(state.completed).toEqual(['pilot-0']);
  expect(report(state)).toContain('[x]');
});
