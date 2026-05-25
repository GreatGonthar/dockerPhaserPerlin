import * as Phaser from "phaser";
import { RECT_SIZE, PLAYER_SIZE, SPEED } from "./CONSTANTS";

export function createPlayer(
  scene: Phaser.Scene,
  x: number,
  y: number,
): Phaser.Physics.Arcade.Sprite {
  const player = scene.physics.add
    .sprite(x, y, "player")
    .setDisplaySize(RECT_SIZE, RECT_SIZE);

  player.body.setSize(PLAYER_SIZE / 2, PLAYER_SIZE / 4);
  player.body.setOffset(PLAYER_SIZE / 4, (PLAYER_SIZE / 4) * 3);

  return player;
}

export function createAnimations(scene: Phaser.Scene) {
  const animsData = [
    { key: "walk-up", start: 1, end: 8 },
    { key: "walk-left", start: 10, end: 17 },
    { key: "walk-down", start: 19, end: 26 },
    { key: "walk-right", start: 28, end: 35 },
  ];

  animsData.forEach(({ key, start, end }) => {
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers("player", { start, end }),
      frameRate: SPEED / 10,
      repeat: -1,
    });
  });
}
