import { describe, it, expect } from 'vitest';
import { rng, smoothstep, lerp, terrainHeight, segDist, distToPath, isWalkable, CAMP, LAKE, WATER_BLOCK, WORLD_LIMIT } from '../../src/core/world.js';

describe('rng', () => {
  it('is deterministic for the same seed', () => {
    const a = rng(42), b = rng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it('returns values in [0, 1)', () => {
    const r = rng(7);
    for (let i = 0; i < 1000; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});

describe('math helpers', () => {
  it('smoothstep clamps and eases', () => {
    expect(smoothstep(0, 10, -5)).toBe(0);
    expect(smoothstep(0, 10, 15)).toBe(1);
    expect(smoothstep(0, 10, 5)).toBeCloseTo(0.5);
  });
  it('lerp interpolates', () => expect(lerp(2, 4, 0.5)).toBe(3));
  it('segDist measures distance to a segment, including its ends', () => {
    expect(segDist(5, 3, 0, 0, 10, 0)).toBeCloseTo(3);
    expect(segDist(-4, 3, 0, 0, 10, 0)).toBeCloseTo(5);
  });
});

describe('terrain', () => {
  it('keeps the village flat at height 0', () => {
    for (const [x, z] of [[0, 0], [10, 5], [-15, 8]]) expect(terrainHeight(x, z)).toBeCloseTo(0, 5);
  });
  it('keeps the bandit camp flat and above water', () => {
    expect(terrainHeight(CAMP.x, CAMP.z)).toBeCloseTo(1.2, 5);
  });
  it('sinks the lake below the walkable limit', () => {
    expect(terrainHeight(LAKE.x, LAKE.z)).toBeLessThan(WATER_BLOCK);
    expect(isWalkable(LAKE.x, LAKE.z)).toBe(false);
  });
  it('blocks walking outside the world bounds', () => {
    expect(isWalkable(WORLD_LIMIT + 1, 0)).toBe(false);
    expect(isWalkable(0, 0)).toBe(true);
  });
  it('places the village on every road', () => expect(distToPath(0, 0)).toBe(0));
});
