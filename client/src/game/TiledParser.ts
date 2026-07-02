// Типы для JSON структуры Tiled
interface TiledLayer {
  name: string;
  type: 'tilelayer' | 'objectgroup';
  data?: number[];        // для tilelayer
  objects?: TiledObject[]; // для objectgroup
  width?: number;
  height?: number;
}

interface TiledObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TiledTileset {
  firstgid: number;  // с какого id начинаются тайлы этого сета
  name: string;
  image: string;
  columns: number;
  tilewidth: number;
  tileheight: number;
  tilecount: number;
}

export interface TiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayer[];
  tilesets: TiledTileset[];
}

// Результат парсинга — данные готовые для отрисовки
export interface ParsedMap {
  width: number;           // ширина карты в тайлах
  height: number;          // высота карты в тайлах
  tileWidth: number;       // размер тайла в пикселях
  tileHeight: number;
  groundLayer: number[];   // массив id тайлов земли
  objectsLayer: number[];  // массив id объектов
  collisions: TiledObject[]; // прямоугольники коллизий
}

export function parseTiledMap(mapData: TiledMap): ParsedMap {
  // Находим нужные слои по имени
  const groundLayer = mapData.layers.find(l => l.name === 'grass');
  const objectsLayer = mapData.layers.find(l => l.name === 'objects');
  const collisionLayer = mapData.layers.find(l => l.name === 'collision');

  return {
    width: mapData.width,
    height: mapData.height,
    tileWidth: mapData.tilewidth,
    tileHeight: mapData.tileheight,
    groundLayer: groundLayer?.data ?? [],
    objectsLayer: objectsLayer?.data ?? [],
    collisions: collisionLayer?.objects ?? [],
  };
}

// Переводит id тайла из Tiled в номер фрейма для Phaser
// Tiled нумерует с 1, Phaser с 0
// firstgid — начальный id тайлсета
export function tileIdToFrame(tileId: number, firstgid: number): number {
  if (tileId === 0) return -1; // 0 = пустой тайл
  return tileId - firstgid;   // переводим в индекс фрейма
}