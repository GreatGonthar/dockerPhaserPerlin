import * as Phaser from "phaser";
import { SocketManager } from "../SocketManager";
import tileset from "../../assets/img/test2.png";
import road from "../../assets/img/roads.png";
import water from "../../assets/img/water.png";
import flowers from "../../assets/img/flowers.png";
import playerImg from "../../assets/img/walk3.png";
import tree from "../../assets/img/tree.png";
import {
  RECT_SIZE,
  MAP_SIZE_W,
  MAP_SIZE_H,
  SPEED,
  TILE_SIZE,
  PLAYER_SIZE,
  SEED,
} from "../CONSTANTS";
import { EventBridge } from "../EventBridge";
import { createPlayer, createAnimations } from "../player";
import { ChunkManager } from "../chunks";
import { Controls } from "../controls";
import { RemotePlayers } from "./RemotePlayers";
import { WaterEffect } from "./WaterEffect";
import { PositionSender } from "./PositionSender";

export class MainScene extends Phaser.Scene {
  // Спрайт нашего игрока
  private player!: Phaser.Physics.Arcade.Sprite;
  // Группа невидимых физических блоков — стены и препятствия
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  // Управляет загрузкой и выгрузкой чанков карты
  private chunkManager!: ChunkManager;
  // Читает ввод с клавиатуры и джойстика
  private controls!: Controls;
  // Управляет WebSocket соединением с сервером
  private socketManager!: SocketManager;
  // Управляет спрайтами других игроков
  private remotePlayers!: RemotePlayers;
  // Применяет эффект воды к нашему игроку
  private waterEffect!: WaterEffect;
  // Отправляет позицию на сервер с ограничением частоты
  private positionSender!: PositionSender;
  // private playerLabel?: Phaser.GameObjects.Text;

  constructor() {
    // Регистрируем сцену под ключом "MainScene"
    super("MainScene");
  }

  preload() {
   this.load.spritesheet('tileset', tileset, {
    frameWidth: 32,
    frameHeight: 32,
  });

  // Тайлсет объектов (деревья) — 2 колонки, 32x32
  this.load.spritesheet('objects',tree, {
    frameWidth: 32,
    frameHeight: 32,
  });
    // Загружаем spritesheet игрока — нарезаем на фреймы размером PLAYER_SIZE
    this.load.spritesheet("player", playerImg, {
      frameWidth: PLAYER_SIZE,
      frameHeight: PLAYER_SIZE,
    });

  }

  create() {
    // Создаём группу статичных физических объектов для стен
    this.walls = this.physics.add.staticGroup();

    // Стартовая позиция — центр нулевого чанка
    const startX = (MAP_SIZE_W * RECT_SIZE) / 2;
    const startY = (MAP_SIZE_H * RECT_SIZE) / 2;

    // Создаём спрайт игрока с физическим телом
    this.player = createPlayer(this, startX, startY);
    // Регистрируем все анимации ходьбы (up, down, left, right)
    createAnimations(this);

    // Создаём менеджер чанков и загружаем стартовые 3x3 чанка
    this.chunkManager = new ChunkManager(this, this.walls, this.player);
    this.chunkManager.loadInitial();

    // Добавляем коллизию между игроком и стенами
    this.physics.add.collider(this.player, this.walls);
    // Задаём большие границы физического мира — карта почти бесконечная
    this.physics.world.setBounds(-100000, -100000, 200000, 200000);
    // Игрок не выходит за границы физического мира
    this.player.setCollideWorldBounds(true);

    // Камера следует за игроком — 0.9 это коэффициент плавности (1.0 = мгновенно)
    this.cameras.main.startFollow(this.player, true, 0.9, 0.9);

    // Инициализируем все модули
    this.controls = new Controls(this); // читает ввод
    this.socketManager = new SocketManager(); // подключается к серверу
    this.remotePlayers = new RemotePlayers(this); // создаёт спрайты других игроков
    this.waterEffect = new WaterEffect(this.player, this.chunkManager); // эффект воды
    this.positionSender = new PositionSender(
      this.player,
      this.socketManager,
      this.controls,
    ); // отправка позиции
    // Подпись над главным игроком — показываем id сокета
    // label создаётся после подключения к серверу
    this.socketManager.onConnect((id: string) => {
      // const label = this.add
      //   .text(startX, startY - RECT_SIZE / 3, id.slice(0, 6), {
      //     fontSize: "10px",
      //     color: "#ffffff",
      //     backgroundColor: "#00000088",
      //     padding: { x: 4, y: 2 },
      //   })
      //   .setOrigin(0.5, 1)
      //   .setDepth(999);
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;

      this.add
        .text(centerX, centerY - RECT_SIZE / 3, id.slice(0, 6), {
          fontSize: "10px",
          color: "#ffffff",
          backgroundColor: "#00000088",
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5, 1)
        .setScrollFactor(0)
        .setDepth(999);

      // Сохраняем label чтобы обновлять позицию
     
    });
  }

  update() {
    // Обновляем глубину рендеринга игрока каждый кадр
    // Чем южнее (больше Y) — тем позже рисуется — тем он "ближе" к камере
    this.player.setDepth(1 + this.player.y / 10000000);

    // Получаем направление движения от модуля управления
    // moveX/moveY — числа от -1 до 1
    const { moveX, moveY } = this.controls.getMovement();

    // Получаем физическое тело игрока для управления скоростью
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Сбрасываем скорость каждый кадр — иначе игрок будет скользить
    body.setVelocity(0);
    // Устанавливаем скорость по X и Y исходя из направления движения
    body.setVelocityX(moveX * SPEED);
    body.setVelocityY(moveY * SPEED);

    // Обновляем анимацию игрока в зависимости от направления
    this.controls.applyAnimation(this.player, moveX, moveY);

    // Проверяем нужно ли загрузить новые чанки или выгрузить старые
    this.chunkManager.update();

    // Проверяем находится ли игрок в воде и применяем эффект обрезки
    // Возвращает boolean — нужен для отправки состояния другим игрокам
    const isInWater = this.waterEffect.update();

    // Отправляем позицию на сервер если она изменилась
    this.positionSender.update(this.game.loop.delta, isInWater);

    // Обновляем depth всех удалённых игроков
    this.remotePlayers.update();

    // Отправляем координаты в React UI через EventBridge
    // React компонент подписан на это событие и показывает координаты на экране
    EventBridge.emit("player-position", {
      x: Math.floor(this.player.x / RECT_SIZE), // координата в тайлах
      y: Math.floor(this.player.y / RECT_SIZE),
      seed: SEED, // seed мира — нужен чтобы другие игроки генерировали ту же карту
    });
    // if (this.playerLabel) {
    //   this.playerLabel.setPosition(
    //     this.player.x,
    //     this.player.y - RECT_SIZE / 3,
    //   );
    // }
  }

  shutdown() {
    // Уничтожаем модуль управления и отписываемся от событий джойстика
    this.controls.destroy();
    // Закрываем WebSocket соединение с сервером
    this.socketManager.disconnect();
    // Удаляем спрайты всех удалённых игроков и отписываемся от EventBridge
    this.remotePlayers.destroy();
  }
}
