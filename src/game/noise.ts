import { createNoise2D } from "simplex-noise";
import Alea from "alea";
import {  
  RIVER_LEVEL,
  RIVER_WIDTH,
  ROAD_LEVEL,
  ROAD_WIDTH,
  SCALE,
  SEED,
  WATER_LEVEL,
} from "./CONSTANTS";

const rng = Alea(SEED);
const noise2D = createNoise2D(rng);
const structure = (normalized: number) => {
  if (normalized < WATER_LEVEL) {
    return 5;
  } else if (
    normalized > RIVER_LEVEL &&
    normalized < RIVER_LEVEL + RIVER_WIDTH
  ) {
    return 5;
  } else if (normalized > ROAD_LEVEL && normalized < ROAD_LEVEL + ROAD_WIDTH) {
    return 6;
  } else return normalized;
};
export function generateMap(
  rows: number,
  cols: number,
  chunkX: number,
  chunkY: number,
  scale = SCALE, 
): number[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      const globalX = chunkX * cols + col;
      const globalY = chunkY * rows + row;
      const value = noise2D(globalX * scale, globalY * scale);     
      const normalized = (value + 1) / 2;
      return structure(normalized);
    }),
  );
}

export function getNoiseValue(
  chunkX: number,
  chunkY: number,
  col: number,
  row: number,
  chunkCols: number,
  chunkRows: number,
  scale = SCALE,
): number {
  const globalX = chunkX * chunkCols + col;
  const globalY = chunkY * chunkRows + row;
  const raw = noise2D(globalX * scale, globalY * scale);
  const normalized = (raw + 1) / 2;

  return structure(normalized);
}
