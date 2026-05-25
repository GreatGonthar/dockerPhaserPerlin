import * as Phaser from "phaser";

import { SocketManager } from "../SocketManager";
import { Controls } from "../controls";
import { SEED } from "../CONSTANTS";

export class PositionSender {
  // Последняя отправленная позиция — сравниваем чтобы не спамить одинаковые данные
  private lastSentPosition = { x: 0, y: 0 };
  // Накопленное время с последней отправки в миллисекундах
  private sendTimer = 0;
  // Спрайт игрока — берём его координаты
  private player: Phaser.Physics.Arcade.Sprite;
  // Менеджер сокета — через него отправляем данные на сервер
  private socketManager: SocketManager;
  // Управление — берём направление и состояние движения для анимации у других
  private controls: Controls;
  constructor(
    player: Phaser.Physics.Arcade.Sprite,
    socketManager: SocketManager,
    controls: Controls,
  ) {
    this.player = player;
    this.socketManager = socketManager;
    this.controls = controls;
  }

  // Вызывается каждый кадр из MainScene.update()
  // delta — время в мс прошедшее с предыдущего кадра (обычно ~16мс при 60fps)
  // isInWater — передаётся из WaterEffect чтобы другие игроки видели эффект воды
  update(delta: number, isInWater: boolean) {
    // Накапливаем время
    this.sendTimer += delta;

    // Текущая позиция игрока в пикселях
    const tileX = Math.floor(this.player.x);
    const tileY = Math.floor(this.player.y);

    // Отправляем только если:
    // 1. Прошло больше 20мс с последней отправки — не спамим сервер каждый кадр
    // 2. Позиция изменилась — нет смысла отправлять одно и то же
    if (
      this.sendTimer > 20 &&
      (tileX !== this.lastSentPosition.x || tileY !== this.lastSentPosition.y)
    ) {
      this.socketManager.sendPosition(
        tileX,
        tileY,
        String(SEED) ,
        this.controls.getLastDirection(), // 'up' | 'down' | 'left' | 'right'
        this.controls.getIsMoving(), // двигается ли игрок прямо сейчас
        isInWater, // находится ли в воде
      );

      // Запоминаем что отправили — не будем отправлять снова пока не изменится
      this.lastSentPosition = { x: tileX, y: tileY };
      // Сбрасываем таймер
      this.sendTimer = 0;
    }
  }
}
