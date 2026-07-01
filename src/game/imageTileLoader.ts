import { RECT_SIZE } from "./CONSTANTS";
import { tileMask } from "./tileMasks";

export const imageTileLoader = (
  scene: any,
  x: number,
  y: number,
  mask: number,
  tileset: string = "tileset",
  value: number,
) => {
  if (value === 0) {
    //показываем лестницы
    switch (mask) {
      case 199:
        return scene.add
          .image(x, y, tileset, 56)
          .setOrigin(0, 0)
          .setDisplaySize(RECT_SIZE, RECT_SIZE);
      case 124:
        return scene.add
          .image(x, y, tileset, 57)
          .setOrigin(0, 0)
          .setDisplaySize(RECT_SIZE, RECT_SIZE);
      case 31:
        return scene.add
          .image(x, y, tileset, 58)
          .setOrigin(0, 0)
          .setDisplaySize(RECT_SIZE, RECT_SIZE);
      case 241:
        return scene.add
          .image(x, y, tileset, 59)
          .setOrigin(0, 0)
          .setDisplaySize(RECT_SIZE, RECT_SIZE);
      default:
        return scene.add
          .image(x, y, tileset, tileMask[mask])
          .setOrigin(0, 0)
          .setDisplaySize(RECT_SIZE, RECT_SIZE);
    }
  } else
    return scene.add
      .image(x, y, tileset, tileMask[mask])
      .setOrigin(0, 0)
      .setDisplaySize(RECT_SIZE, RECT_SIZE);
};
