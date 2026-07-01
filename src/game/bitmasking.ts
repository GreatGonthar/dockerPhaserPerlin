import { LAYERS } from "./CONSTANTS";
import { getNoiseValue } from "./noise"; // функция возвращает значение шума для координат

export function getTileMask(
  chunkX: number,
  chunkY: number,
  col: number,
  row: number,
  chunkCols: number,
  chunkRows: number,
): number {
  const noiseValue = getNoiseValue(
    chunkX,
    chunkY,
    col,
    row,
    chunkCols,
    chunkRows,
  );
  const currentType = Math.floor(noiseValue * LAYERS);

  const isTarget = (tc: number, tr: number): boolean => {
    // Вычисляем глобальные координаты тайла
    const globalCol = chunkX * chunkCols + tc;
    const globalRow = chunkY * chunkRows + tr;
    const value = getNoiseValue(
      0,
      0,
      globalCol,
      globalRow,
      chunkCols,
      chunkRows,
    );
    const type = Math.floor(value * LAYERS);

    return type >= currentType;
  };

  const n = isTarget(col, row - 1);
  const s = isTarget(col, row + 1);
  const e = isTarget(col + 1, row);
  const w = isTarget(col - 1, row);
  const ne = n && e && isTarget(col + 1, row - 1);
  const se = s && e && isTarget(col + 1, row + 1);
  const sw = s && w && isTarget(col - 1, row + 1);
  const nw = n && w && isTarget(col - 1, row - 1);

  return (
    +n * 1 +
    +ne * 2 +
    +e * 4 +
    +se * 8 +
    +s * 16 +
    +sw * 32 +
    +w * 64 +
    +nw * 128
  );
}
