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
    const state = initialState(); state.scores[1] = [...state.scores[0]];
    expect(calculate(state).status).toBe('close');
    state.weights = [1, 5, 5, 5]; state.scores[1][0] -= 1;
    expect(calculate(state).status).toBe('close');
    state.weights = [1, 1, 1, 1];
    expect(calculate(state).status).toBe('lead');
  });
  it('excludes a vetoed leader and preserves its score for audit', () => {
    const state = initialState(); state.gates[0][0] = 'fail';
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
    expect(decodeState('#cenario=' + encodeURIComponent(JSON.stringify(state)))).toEqual(state);
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
