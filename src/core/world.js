// Pure world helpers: terrain height, paths and seeded randomness.
// No DOM or Three.js imports, so everything here is unit-testable in Node.

export const CAMP = { x: 72, z: 58 };
export const FOREST = { x: -78, z: 22, r: 52 };
export const LAKE = { x: -12, z: -82 };
export const WATER = -3;
/** Terrain below this height counts as water and blocks movement. */
export const WATER_BLOCK = -2.5;
/** Half-size of the walkable square around the origin. */
export const WORLD_LIMIT = 172;
export const PATHS = [[0, 0, CAMP.x, CAMP.z], [0, 0, -46, 16], [0, 0, -10, -58]];

/** Deterministic PRNG (mulberry32). Same seed, same world. */
export function rng(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
export const lerp = (a, b, t) => a + (b - a) * t;

/** Terrain height at (x, z). Flat at the village and the camp, sunk at the lake, mountains at the edge. */
export function terrainHeight(x, z) {
  let h = Math.sin(x * 0.045) * Math.cos(z * 0.038) * 3.2 + Math.sin(x * 0.012 + 1.3) * 5 +
    Math.cos(z * 0.015 + 0.4) * 4.5 + Math.sin((x + z) * 0.08) * 0.7 + 1.5;
  h *= smoothstep(24, 46, Math.hypot(x, z));
  const fc = smoothstep(18, 34, Math.hypot(x - CAMP.x, z - CAMP.z));
  h = h * fc + 1.2 * (1 - fc);
  // Blend toward a fixed lake bed so the lake is always water, whatever the hills around it do.
  h = lerp(-6, h, smoothstep(8, 28, Math.hypot(x - LAKE.x, z - LAKE.z)));
  h += smoothstep(150, 195, Math.max(Math.abs(x), Math.abs(z))) * 28;
  return h;
}

/** Distance from point P to segment AB (on the XZ plane). */
export function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  let t = ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz);
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
}

/** Distance to the nearest dirt road. */
export const distToPath = (x, z) => Math.min(...PATHS.map((p) => segDist(x, z, p[0], p[1], p[2], p[3])));

/** Whether a character may stand at (x, z): not in water and inside the world bounds. */
export const isWalkable = (x, z) =>
  terrainHeight(x, z) > WATER_BLOCK && Math.abs(x) < WORLD_LIMIT && Math.abs(z) < WORLD_LIMIT;
