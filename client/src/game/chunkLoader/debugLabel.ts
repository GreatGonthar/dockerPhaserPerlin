import * as Phaser from "phaser";
import { RECT_SIZE } from "../CONSTANTS";

// Рисует отладочный текст поверх тайла — показывает номер слоя
// Вызывается только если DEBUG === true в CONSTANTS
export function createDebugLabel(
  scene: Phaser.Scene,
  x: number, // пиксельная координата X тайла
  y: number, // пиксельная координата Y тайла
  value: number, // номер слоя биома (0=вода, 1=песок, 2=трава...)
): Phaser.GameObjects.Text {
  return scene.add
    .text(
      x + RECT_SIZE / 2, // центр тайла по X
      y + RECT_SIZE / 2, // центр тайла по Y
      value.toString(), // отображаем номер слоя
      { fontSize: `${RECT_SIZE / 3}px`, color: "white" },
    )
    .setOrigin(0.5, 0.5); // якорь по центру текста
}
