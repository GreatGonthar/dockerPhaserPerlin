import * as Phaser from "phaser";
import { RECT_SIZE } from "../CONSTANTS";
import { getTileMask } from "../bitmasking";
import { createWall } from "./wallBuilder";

// Проверяет можно ли поставить дерево на данный тайл и ставит его
export function tryPlaceTree(
  scene: Phaser.Scene,
  walls: Phaser.Physics.Arcade.StaticGroup,
  x: number, // пиксельная координата X тайла
  y: number, // пиксельная координата Y тайла
  col: number, // колонка тайла внутри чанка
  row: number, // строка тайла внутри чанка
  chunkX: number, // индекс чанка по X
  chunkY: number, // индекс чанка по Y
  map: number[][], // двумерный массив значений шума
  tileValueFloor: number, // псевдослучайное число для условия появления
): {
  tree: Phaser.GameObjects.Image;
  wall: Phaser.Physics.Arcade.Sprite;
} | null {
  // Дерево появляется только при определённом tileValueFloor
  if (tileValueFloor <= 16 || tileValueFloor >= 20) return null;

  // Проверяем правый соседний тайл — дерево занимает 2 тайла по ширине
  // Если правый сосед за границей чанка — не ставим дерево
  const rightNeighborMask =
    col + 1 < map[0].length
      ? getTileMask(chunkX, chunkY, col + 1, row, map[0].length, map.length)
      : -1;

  // Правый сосед должен быть открытым тайлом (255 = полностью окружён своими)
  if (rightNeighborMask !== 255) return null;

  // Рисуем дерево — начинаем на 2 тайла выше текущего
  // Дерево 2x3 тайла = RECT_SIZE*2 x RECT_SIZE*3 пикселей
  const tree = scene.add
    .image(x, y - RECT_SIZE * 2, "tree")
    .setOrigin(0, 0)
    .setDisplaySize(RECT_SIZE * 2, RECT_SIZE * 3)
    // depth по нижнему краю дерева — для правильной сортировки с игроком
    .setDepth(1 + y / 10000000);

  // Коллизия у основания дерева — тонкая полоска у корней
  const wall = createWall(
    walls,
    x,
    y,
    RECT_SIZE * 0.5, // ширина хитбокса — половина тайла
    RECT_SIZE * 0.5, // высота хитбокса — половина тайла
    RECT_SIZE / 2, // смещаем к центру дерева по X
    0,
  );

  return { tree, wall };
}
