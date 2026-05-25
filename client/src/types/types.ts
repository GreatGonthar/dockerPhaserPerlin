import * as Phaser from "phaser";
// Тип данных чанка. tiles — всё что рисуется (тайлы, декор, текст). walls — невидимые физические блоки коллизий.
// Два отдельных массива потому что удаляются по-разному — тайлы через destroy(), стены через walls.remove().
export interface Chunk {
	tiles: Phaser.GameObjects.Image[];
	walls: Phaser.Physics.Arcade.Sprite[];
}
