import * as Phaser from "phaser";
import { RECT_SIZE, MAP_SIZE_W, MAP_SIZE_H } from "./CONSTANTS";
import { generateMap } from "./noise";
import type { Chunk } from "../types/types";
import { loadChunk } from "./chunkLoader/index";


//Map — словарь где ключ это строка "x,y", значение — данные чанка. Выбран Map а не
//обычный объект потому что удобнее итерироваться и проверять наличие через .has().
export class ChunkManager {
  private chunks: Map<string, Chunk> = new Map();
  private maps: Map<string, number[][]> = new Map();
  //Запоминаем в каком чанке игрок сейчас. Нужно чтобы в update() не пересчитывать соседей каждый кадр — только когда игрок сменил чанк.
  private currentChunkX = 0;
  private currentChunkY = 0;
  //get — это геттер, вычисляется при каждом обращении. Ширина и высота чанка в пикселях. Например 20 * 64 = 1280px.
  //Сделан через геттер а не константу на случай если MAP_SIZE_W или RECT_SIZE изменятся.
  private get chunkPixelWidth() {
    return MAP_SIZE_W * RECT_SIZE;
  }
  private get chunkPixelHeight() {
    return MAP_SIZE_H * RECT_SIZE;
  }
  private scene: Phaser.Scene;
  private walls: Phaser.Physics.Arcade.StaticGroup;
  private player: Phaser.Physics.Arcade.Sprite;
  constructor(
    scene: Phaser.Scene,
    walls: Phaser.Physics.Arcade.StaticGroup,
    player: Phaser.Physics.Arcade.Sprite,
  ) {
    this.scene = scene;
    this.walls = walls;
    this.player = player;
  }
  private loadChunkData(chunkX: number, chunkY: number) {
    //Создаём уникальный ключ типа "2,-1". Если чанк уже загружен — выходим, не делаем двойную работу.
    const key = `${chunkX},${chunkY}`;
    if (this.chunks.has(key)) return;

    const map = generateMap(MAP_SIZE_H, MAP_SIZE_W, chunkX, chunkY);
    this.maps.set(key, map);
    const chunk = loadChunk(
      this.scene,
      this.walls,
      this.player,
      chunkX,
      chunkY,
      map,
      this.chunkPixelWidth,
      this.chunkPixelHeight,
    );
    this.chunks.set(key, chunk);
  }
  // Загружаем стартовые 3x3 чанка
  // Хитрый трюк — ставим Infinity чтобы условие newChunkX === this.currentChunkX в update() гарантированно не сработало.
  // Это заставит update() загрузить стартовые чанки. Так не дублируем логику загрузки соседей.
  loadInitial() {
    this.currentChunkX = Infinity;
    this.currentChunkY = Infinity;
    this.update();
  }

  // Вызывай в update() — проверяет смену чанка
  update() {
    // Переводим пиксельные координаты игрока в индекс чанка
    const newChunkX = Math.floor(this.player.x / this.chunkPixelWidth);
    const newChunkY = Math.floor(this.player.y / this.chunkPixelHeight);
    // Игрок не сменил чанк — выходим. Это важная оптимизация — update()
    // вызывается каждый кадр (60 раз в секунду), а пересчёт чанков нужен только при переходе границы.
    if (newChunkX === this.currentChunkX && newChunkY === this.currentChunkY)
      return;
    // Запоминаем новый чанк.
    this.currentChunkX = newChunkX;
    this.currentChunkY = newChunkY;

    // Загружаем соседние чанки
    // Двойной цикл dx/dy от -1 до 1 даёт 9 комбинаций — это 3x3 сетка вокруг игрока.
    // Для каждого незагруженного чанка генерируем карту и загружаем. Уже загруженные пропускаем — !this.chunks.has(...).
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cx = newChunkX + dx;
        const cy = newChunkY + dy;
        if (!this.chunks.has(`${cx},${cy}`)) {
          //   const map = generateMap(MAP_SIZE_H, MAP_SIZE_W, cx, cy);
          this.loadChunkData(cx, cy);
        }
      }
    }

    // Удаляем дальние
    // Проходим по всем загруженным чанкам. Если чанк дальше чем 1 шаг от игрока — удаляем. Math.abs нужен чтобы работало в обоих направлениях.
    for (const key of this.chunks.keys()) {
      const [cx, cy] = key.split(",").map(Number);
      if (Math.abs(cx - newChunkX) > 1 || Math.abs(cy - newChunkY) > 1) {
        this.unloadChunk(cx, cy);
      }
    }
  }

  // Удаление чанка — три шага. tile.destroy() — удаляет объект из сцены и освобождает память.
  // walls.remove(wall, true, true) — первый true удаляет из группы, второй true вызывает destroy() на стене.
  // this.chunks.delete(key) — убирает запись из словаря.
  private unloadChunk(chunkX: number, chunkY: number) {
    const key = `${chunkX},${chunkY}`;
    const chunk = this.chunks.get(key);
    if (!chunk) return;

    chunk.tiles.forEach((tile) => tile.destroy());
    chunk.walls.forEach((wall) => this.walls.remove(wall, true, true));
    this.chunks.delete(key);
    this.maps.delete(key);
  }
  getMap(chunkX: number, chunkY: number): number[][] | undefined {
    return this.maps.get(`${chunkX},${chunkY}`);
  }
}
