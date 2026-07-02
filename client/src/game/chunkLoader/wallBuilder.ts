import * as Phaser from "phaser";
import { RECT_SIZE } from "../CONSTANTS";

// Создаёт невидимый физический блок — препятствие для игрока
export function createWall(
  walls: Phaser.Physics.Arcade.StaticGroup, // группа стен куда добавляем
  x: number, // пиксельная координата X тайла
  y: number, // пиксельная координата Y тайла
  width: number, // ширина хитбокса в пикселях
  height: number, // высота хитбокса в пикселях
  offsetX = 0, // смещение центра по X относительно тайла
  offsetY = 0, // смещение центра по Y относительно тайла
): Phaser.Physics.Arcade.Sprite {
  // Создаём пустой спрайт в центре тайла — null текстура = невидимый
  const wall = walls.create(
    x + RECT_SIZE / 2 + offsetX, // центр хитбокса по X
    y + RECT_SIZE / 2 + offsetY, // центр хитбокса по Y
    "",
  ) as Phaser.Physics.Arcade.Sprite;

  wall.setVisible(false); // делаем невидимым — только физика
  wall.displayWidth = width; // задаём ширину хитбокса
  wall.displayHeight = height; // задаём высоту хитбокса
  wall.refreshBody(); // синхронизируем физический хитбокс с размером
  return wall;
}
