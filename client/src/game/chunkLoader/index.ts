import * as Phaser from "phaser";
import { DEBUG, FLOWERS, LAYERS, LODERS, RECT_SIZE } from "../CONSTANTS";
import { getTileMask } from "../bitmasking";
import { tileMask } from "../tileMasks";
import type { Chunk } from "../../types/types";
import { createTileImage } from "./tileRenderer";
import { tryPlaceTree } from "./treeRenderer";
import { createWall } from "./wallBuilder";
import { createDebugLabel } from "./debugLabel";

export function loadChunk(
  scene: Phaser.Scene,
  walls: Phaser.Physics.Arcade.StaticGroup,
  player: Phaser.Physics.Arcade.Sprite,
  chunkX: number, // индекс чанка по X (не пиксели)
  chunkY: number, // индекс чанка по Y (не пиксели)
  map: number[][], // двумерный массив значений шума Перлина (0-1)
  chunkPixelWidth: number, // ширина чанка в пикселях
  chunkPixelHeight: number, // высота чанка в пикселях
): Chunk {
  // Смещение чанка в пикселях — начало координат чанка на сцене
  const offsetX = chunkX * chunkPixelWidth;
  const offsetY = chunkY * chunkPixelHeight;

  // tiles — всё что рисуется (тайлы, деревья, декор, отладочные метки)
  // walls_ — невидимые физические блоки коллизий
  const tiles: Phaser.GameObjects.Image[] = [];
  const walls_: Phaser.Physics.Arcade.Sprite[] = [];

  // Проходим по каждой ячейке массива карты
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[0].length; col++) {
      // Пиксельные координаты левого верхнего угла тайла на сцене
      const x = offsetX + col * RECT_SIZE;
      const y = offsetY + row * RECT_SIZE;

      // Значение шума Перлина для этой ячейки — число от 0 до 1
      // Определяет биом: вода, песок, трава, лес, горы, снег
      const tileValue = map[row][col];

      // Битовая маска — число от 0 до 255
      // Кодирует какие из 8 соседей того же типа
      // 255 = все соседи одинаковые = открытый тайл
      const mask = getTileMask(
        chunkX,
        chunkY,
        col,
        row,
        map[0].length,
        map.length,
      );

      // Псевдослучайное число для выбора декора и деревьев
      // Уникально для каждого тайла но детерминировано — одинаково при перезагрузке
      const tileValueFloor = Math.floor(
        Math.abs(tileValue * 1000000000 + x + y) %
          (FLOWERS / Math.floor(tileValue * LAYERS)),
      );

      // Псевдослучайный вариант автотайлинга — какой именно спрайт использовать
      const hasLoder = Math.floor(
        Math.abs(tileValue * 100000000000 + x + y) % LODERS,
      );

      // Флаг проходимости — некоторые граничные тайлы можно пройти
      // [199, 124, 31, 241] — маски открытых угловых тайлов
      // hasLoder === 0 — только каждый LODERS-й тайл проходим
      const isPassable = [199, 124, 31, 241].includes(mask) && hasLoder === 0;

      // Номер слоя биома — целое число от 0 до LAYERS
      const layer = Math.floor(tileValue * LAYERS);

      // Определяем тайлсет по значению шума
      // > 1 невозможно для нормализованного шума — замени на свои пороги
      const tileset =
        tileValue > 1 ? (tileValue > 5 ? "road" : "water") : "tileset";

      // Рисуем тайл земли если для маски есть спрайт в таблице tileMask
      if (tileMask[mask] >= 0) {
        const tile = createTileImage(
          scene,
          x,
          y,
          mask,
          tileset,
          tileValueFloor,
          hasLoder,
        );
        tiles.push(tile as any);
      }

      // Пробуем поставить дерево — функция сама проверяет условия
      // Возвращает { tree, wall } если дерево поставлено, null если нет
      if (mask === 255) {
        const treeResult = tryPlaceTree(
          scene,
          walls,
          x,
          y,
          col,
          row,
          chunkX,
          chunkY,
          map,
          tileValueFloor,
        );
        if (treeResult) {
          tiles.push(treeResult.tree as any); // добавляем спрайт дерева
          walls_.push(treeResult.wall); // добавляем коллизию дерева
        }
      }

      // Создаём коллизию для непроходимых граничных тайлов
      // Условия: граничный тайл (mask !== 255) + непроходимый + земля (не вода/дорога)
      if (mask !== 255 && !isPassable && tileset === "tileset") {
        const wall = createWall(walls, x, y, RECT_SIZE, RECT_SIZE);
        walls_.push(wall);
      }

      // Отладочная метка — показывает номер слоя на каждом тайле
      // Включается через DEBUG в CONSTANTS
      if (DEBUG) {
        const label = createDebugLabel(scene, x, y, layer);
        tiles.push(label as any);
      }
    }
  }

  // Поднимаем игрока поверх новых тайлов
  // Нужно потому что тайлы добавляются после игрока и рисуются поверх
  scene.children.bringToTop(player);

  // Возвращаем данные чанка — ChunkManager сохранит их для последующего удаления
  return { tiles, walls: walls_ };
}
