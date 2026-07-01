import * as Phaser from "phaser";
import { EventBridge } from "./EventBridge";

export class Controls {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private joystickDir: { dx: number; dy: number } | null = null;
  private lastDirection: "down" | "up" | "left" | "right" = "down";

  constructor(scene: Phaser.Scene) {
    this.cursors = scene.input.keyboard!.createCursorKeys();

    EventBridge.on("joystick-move", (data: { dx: number; dy: number }) => {
      this.joystickDir = data;
    });
    EventBridge.on("joystick-stop", () => {
      this.joystickDir = null;
    });
  }

  // Возвращает { moveX, moveY } — вызывай в update()
  getMovement(): { moveX: number; moveY: number } {
    const { left, right, up, down } = this.cursors;
    let moveX = 0;
    let moveY = 0;

    if (left.isDown) moveX = -1;
    else if (right.isDown) moveX = 1;
    if (up.isDown) moveY = -1;
    else if (down.isDown) moveY = 1;

    if (this.joystickDir) {
      const { dx, dy } = this.joystickDir;

      const max = Math.max(Math.abs(dx), Math.abs(dy));
      moveX = dx / max;
      moveY = dy / max;
    }

    return { moveX, moveY };
  }

  // Обновляет анимацию и возвращает последнее направление
  applyAnimation(
    player: Phaser.Physics.Arcade.Sprite,
    moveX: number,
    moveY: number,
  ) {
    if (moveX === 0 && moveY === 0) {
      player.anims.stop();
      const idleFrames = { down: 18, left: 9, right: 27, up: 0 };
      player.setFrame(idleFrames[this.lastDirection]);
      return;
    }

    if (Math.abs(moveY) > Math.abs(moveX)) {
      if (moveY < 0) {
        player.anims.play("walk-up", true);
        this.lastDirection = "up";
      } else {
        player.anims.play("walk-down", true);
        this.lastDirection = "down";
      }
    } else {
      if (moveX < 0) {
        player.anims.play("walk-left", true);
        this.lastDirection = "left";
      } else {
        player.anims.play("walk-right", true);
        this.lastDirection = "right";
      }
    }
  }

  destroy() {
    EventBridge.off("joystick-move");
    EventBridge.off("joystick-stop");
  }
  getLastDirection() {
    return this.lastDirection;
  }
  getIsMoving() {
    return (
      this.joystickDir !== null ||
      Object.values(this.cursors).some((k) => k.isDown)
    );
  }
}
