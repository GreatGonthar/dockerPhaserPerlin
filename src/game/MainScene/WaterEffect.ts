import * as Phaser from "phaser";
import {
  RECT_SIZE,
  PLAYER_SIZE,
  LAYERS,
  MAP_SIZE_W,
  MAP_SIZE_H,
} from "../CONSTANTS";
import { ChunkManager } from "../chunks";
import { getTileMask } from "../bitmasking";

export class WaterEffect {
  // Спрайт игрока — будем менять его crop
  private player: Phaser.Physics.Arcade.Sprite;
  // Менеджер чанков — берём из него значение тайла под игроком
  private chunkManager: ChunkManager;
  constructor(
    player: Phaser.Physics.Arcade.Sprite,
    chunkManager: ChunkManager,
  ) {
    this.player = player;
    this.chunkManager = chunkManager;
  }

  // Вызывается каждый кадр из MainScene.update()
  // Возвращает true если игрок сейчас в воде — нужно для отправки по сокету
  update(): boolean {
    // Определяем в каком чанке находится игрок
    // Math.floor даёт отрицательные индексы для отрицательных координат — это правильно
    const chunkX = Math.floor(this.player.x / (MAP_SIZE_W * RECT_SIZE));
    const chunkY = Math.floor(this.player.y / (MAP_SIZE_H * RECT_SIZE));

    // Определяем локальные координаты тайла внутри чанка
    // Вычитаем смещение чанка чтобы не было проблем с отрицательными числами
    const col = Math.floor(
      (this.player.x - chunkX * MAP_SIZE_W * RECT_SIZE) / RECT_SIZE,
    );
    const row = Math.floor(
      (this.player.y - chunkY * MAP_SIZE_H * RECT_SIZE) / RECT_SIZE,
    );

    // Берём значение шума Перлина для тайла под игроком из уже загруженного массива
    // ?. — безопасное обращение на случай если чанк ещё не загружен
    const tileValue = this.chunkManager.getMap(chunkX, chunkY)?.[row]?.[col];

    // Вычисляем битовую маску тайла — нужна чтобы отличить открытый тайл от граничного
    // undefined если tileValue не определён — тайл вне загруженной зоны
    const mask =
      tileValue !== undefined
        ? getTileMask(chunkX, chunkY, col, row, MAP_SIZE_W, MAP_SIZE_H)
        : undefined;

    // Проверяем три условия:
    // 1. tileValue определён — тайл загружен
    // 2. Math.floor(tileValue * LAYERS) === 50 — верхний слой = вода
    // 3. mask === 255 — тайл полностью окружён своими (не граничный)
    const isInWater =
      tileValue !== undefined &&
      Math.floor(tileValue * LAYERS) === 50 &&
      mask === 255;

    if (isInWater) {
      // Обрезаем спрайт — показываем только верхние 2/3
      // setCrop(x начало, y начало, ширина, высота)
      this.player.setCrop(0, 0, PLAYER_SIZE, PLAYER_SIZE / 1.5);
    } else {
      // Без аргументов — сбрасывает crop, показывает спрайт полностью
      this.player.setCrop();
    }

    // Возвращаем состояние воды — MainScene передаёт его в PositionSender
    return isInWater;
  }
}
