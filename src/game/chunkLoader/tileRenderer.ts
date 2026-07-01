import * as Phaser from "phaser";
import { RECT_SIZE } from "../CONSTANTS";
import { tileMask } from "../tileMasks";
import { imageTileLoader } from "../imageTileLoader";

// Создаёт и возвращает спрайт тайла земли
// Все тайлы земли имеют depth=0 — рисуются под всеми объектами
export function createTileImage(
  scene: Phaser.Scene,
  x: number, // пиксельная координата X
  y: number, // пиксельная координата Y
  mask: number, // битовая маска — определяет форму тайла
  tileset: string, // ключ текстуры: 'tileset' | 'water' | 'road'
  tileValueFloor: number, // псевдослучайное число для выбора декора
  hasLoder: number, // вариант автотайлинга
): Phaser.GameObjects.Image {
  // Вода и дорога — рисуем напрямую без автотайлинга
  if (tileset !== "tileset") {
    return scene.add
      .image(x, y, tileset, tileMask[mask])
      .setOrigin(0, 0)
      .setDisplaySize(RECT_SIZE, RECT_SIZE)
      .setDepth(0); // земля всегда под всем
  }

  // Граничный тайл (переход между биомами) — автотайлинг
  // imageTileLoader выбирает правильный спрайт по маске
  if (mask !== 255) {
    return imageTileLoader(scene, x, y, mask, tileset, hasLoder).setDepth(0);
  }

  // Открытый тайл с декором — цветы, трава
  // tileValueFloor < 16 — примерно 16/FLOWERS вероятность появления декора
  if (tileValueFloor < 16) {
    return scene.add
      .image(x, y, "flowers", tileValueFloor)
      .setOrigin(0, 0)
      .setDisplaySize(RECT_SIZE, RECT_SIZE)
      .setDepth(0);
  }

  // Обычный открытый тайл без декора
  return scene.add
    .image(x, y, tileset, tileMask[mask])
    .setOrigin(0, 0)
    .setDisplaySize(RECT_SIZE, RECT_SIZE)
    .setDepth(0);
}
