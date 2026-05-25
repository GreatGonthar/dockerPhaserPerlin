import * as Phaser from "phaser";
import { MainScene } from "./MainScene/MainScene";
import { DEBUG } from "./CONSTANTS";

export const initGame = (containerId: string) => {
  return new Phaser.Game({
    type: Phaser.CANVAS,
    parent: containerId,
    pixelArt: true, // Важно для JRPG (пиксель-арт не будет мыльным)
    width: window.innerWidth,
    height: window.innerHeight,

    scale: {
      mode: Phaser.Scale.RESIZE, // автоматически меняет размер при ресайзе окна
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        debug: DEBUG,
      },
    },
    scene: [MainScene],
  });
};
