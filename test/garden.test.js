import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseSpecies, detectSpike, growthStage, hashSpecies } from '../src/garden.js';

test('growth stages use cumulative watering thresholds', () => {
  assert.deepEqual([0, 2, 3, 9, 10, 29, 30].map(growthStage), ['seed', 'seed', 'sprout', 'sprout', 'bud', 'bud', 'bloom']);
});
test('species uses the most frequent emote and fallback is stable', () => {
  assert.equal(chooseSpecies('alice', { rare: ['0-1'], common: ['2-3,4-5'] }), chooseSpecies('alice', { common: ['0-1,2-3'] }));
  assert.equal(chooseSpecies('alice', {}), hashSpecies('alice'));
  assert.equal(hashSpecies('alice'), hashSpecies('ALICE'));
});
test('spike detector detects a burst over an established average', () => {
  const old = Array.from({ length: 30 }, (_, i) => i * 30_000);
  const now = 900_000;
  assert.equal(detectSpike([...old, ...Array.from({ length: 10 }, (_, i) => now - 1000 + i * 50)], now).spike, true);
  assert.equal(detectSpike([now - 1000], now).spike, false);
});
