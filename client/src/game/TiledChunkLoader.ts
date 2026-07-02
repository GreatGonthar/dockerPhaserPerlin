import * as Phaser from "phaser";
import { RECT_SIZE } from "./CONSTANTS";
import type { Chunk } from "../types/types";
import { parseTiledMap, tileIdToFrame, type TiledMap } from "./TiledParser";

export function loadTiledChunk(
  scene: Phaser.Scene,
  walls: Phaser.Physics.Arcade.StaticGroup,
  player: Phaser.Physics.Arcade.Sprite,
  chunkX: number,
  chunkY: number,
  mapData: TiledMap, // JSON из Tiled
): Chunk {
  const map = parseTiledMap(mapData);

  // Смещение чанка в пикселях
  const offsetX = chunkX * map.width *RECT_SIZE;
  const offsetY = chunkY * map.height * RECT_SIZE;

  const tiles: Phaser.GameObjects.Image[] = [];
  const walls_: Phaser.Physics.Arcade.Sprite[] = [];

  // Рисуем слой земли
  for (let row = 0; row < map.height; row++) {
    for (let col = 0; col < map.width; col++) {
      const index = row * map.width + col; // позиция в плоском массиве
      const tileId = map.groundLayer[index];

      if (tileId === 0) continue; // пустой тайл — пропускаем

      const x = offsetX + col * RECT_SIZE;
      const y = offsetY + row * RECT_SIZE;

      // firstgid=1 для test2 — переводим в фрейм
      const frame = tileIdToFrame(tileId, 1);

      const tile = scene.add
        .image(x, y, 'grass', frame)
        .setOrigin(0, 0)
        .setDisplaySize(RECT_SIZE, RECT_SIZE)
        .setDepth(0);
      tiles.push(tile as any);
    }
  }

  // Рисуем слой объектов (деревья)
  for (let row = 0; row < map.height; row++) {
    for (let col = 0; col < map.width; col++) {
      const index = row * map.width + col;
      const tileId = map.objectsLayer[index];

      if (tileId === 0) continue;

      const x = offsetX + col * RECT_SIZE;
      const y = offsetY + row * RECT_SIZE;

      // firstgid=65 для objects (деревья)
      const frame = tileIdToFrame(tileId, 65);
          // Проверяем есть ли тайл дерева снизу
    const belowIndex = (row + 1) * map.width + col;
    const tileBelow = row + 1 < map.height ? map.objectsLayer[belowIndex] : 0;

    // Если снизу нет тайла — это нижний ряд дерева, берём его Y как depth
    const depthY = tileBelow !== 0 ? y + RECT_SIZE : y;

      const tile = scene.add
        .image(x, y, 'objects', frame)
        .setOrigin(0, 0)
        .setDisplaySize(RECT_SIZE, RECT_SIZE)
        // .setDepth(1 + (y + RECT_SIZE) / 10000000);
        .setDepth(1 + depthY / 10000000);
      tiles.push(tile as any);
    }
  }

  // Создаём коллизии из объектного слоя
  const scale = RECT_SIZE / map.tileWidth;
  for (const obj of map.collisions) {
    const wall = walls.create(
     offsetX + obj.x * scale + (obj.width * scale) / 2,  // центр по X
      offsetY + obj.y * scale + (obj.height * scale) / 2,   // центр по Y
      '',
    ) as Phaser.Physics.Arcade.Sprite;
    wall.setVisible(false);
    wall.displayWidth = obj.width* scale;
    wall.displayHeight = obj.height* scale;
    wall.refreshBody();
    walls_.push(wall);
  }

  // Поднимаем игрока поверх новых тайлов
  scene.children.bringToTop(player);

  return { tiles, walls: walls_ };
}