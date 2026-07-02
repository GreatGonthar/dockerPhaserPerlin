import * as Phaser from "phaser";
import { RECT_SIZE } from "./CONSTANTS";
import type { Chunk } from "../types/types";
import { loadTiledChunk } from './TiledChunkLoader';
import type { TiledMap } from './TiledParser';
import map1Data from '../assets/tiled/map1.json';
import map2Data from '../assets/tiled/map2.json';

export class ChunkManager {
  private chunks: Map<string, Chunk> = new Map();
  private currentChunkX = 0;
  private currentChunkY = 0;

  // Размеры чанка берём из JSON карты — не из CONSTANTS
  private get mapData(): TiledMap {
    return map1Data as TiledMap;
  }
  private get chunkPixelWidth() {
    return this.mapData.width * RECT_SIZE;
  }
  private get chunkPixelHeight() {
    return this.mapData.height * RECT_SIZE;
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

  // Выбираем карту в шахматном порядке
  private getMapData(chunkX: number, chunkY: number): TiledMap {
    const isEven = (Math.abs(chunkX) + Math.abs(chunkY)) % 2 === 0;
    return isEven ? map1Data as TiledMap : map2Data as TiledMap;
  }

  private loadChunkData(chunkX: number, chunkY: number) {
    const key = `${chunkX},${chunkY}`;
    if (this.chunks.has(key)) return;

    // Берём нужную карту по координатам чанка
    const mapData = this.getMapData(chunkX, chunkY);

    const chunk = loadTiledChunk(
      this.scene,
      this.walls,
      this.player,
      chunkX,
      chunkY,
      mapData,
    );
    this.chunks.set(key, chunk);
  }

  loadInitial() {
    this.currentChunkX = Infinity;
    this.currentChunkY = Infinity;
    this.update();
  }

  update() {
    const newChunkX = Math.floor(this.player.x / this.chunkPixelWidth);
    const newChunkY = Math.floor(this.player.y / this.chunkPixelHeight);

    if (newChunkX === this.currentChunkX && newChunkY === this.currentChunkY) return;

    this.currentChunkX = newChunkX;
    this.currentChunkY = newChunkY;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cx = newChunkX + dx;
        const cy = newChunkY + dy;
        if (!this.chunks.has(`${cx},${cy}`)) {
          this.loadChunkData(cx, cy);
        }
      }
    }

    for (const key of this.chunks.keys()) {
      const [cx, cy] = key.split(",").map(Number);
      if (Math.abs(cx - newChunkX) > 1 || Math.abs(cy - newChunkY) > 1) {
        this.unloadChunk(cx, cy);
      }
    }
  }

  private unloadChunk(chunkX: number, chunkY: number) {
    const key = `${chunkX},${chunkY}`;
    const chunk = this.chunks.get(key);
    if (!chunk) return;

    chunk.tiles.forEach((tile) => tile.destroy());
    chunk.walls.forEach((wall) => this.walls.remove(wall, true, true));
    this.chunks.delete(key);
  }

  // getMap больше не нужен — карты берутся из JSON
  // Но оставим для WaterEffect если используется
  getMap(_chunkX: number, _chunkY: number): number[][] | undefined {
    return undefined;
  }
}