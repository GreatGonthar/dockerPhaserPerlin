import * as Phaser from "phaser";
import { RECT_SIZE, PLAYER_SIZE } from "../CONSTANTS";
import { EventBridge } from "../EventBridge";

export class RemotePlayers {
  // Словарь: id игрока → его спрайт на сцене
  private sprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private labels: Map<string, Phaser.GameObjects.Text> = new Map();
  private scene: Phaser.Scene;
  // Принимаем сцену чтобы создавать спрайты через this.scene.add
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Сразу подписываемся на события от сервера
    this.setupListeners();
  }

  private setupListeners() {
    // Срабатывает один раз при подключении — сервер присылает всех кто уже онлайн
    EventBridge.on(
      "remote-players",
      (players: Record<string, { x: number; y: number }>) => {
        // Создаём спрайт для каждого игрока который уже в игре
        Object.entries(players).forEach(([id, data]) => {
          this.add(id, data.x, data.y);
        });
      },
    );

    // Срабатывает когда любой другой игрок двигается или меняет состояние
    EventBridge.on(
      "remote-player-moved",
      (data: {
        id: string; // уникальный id игрока
        x: number; // новая позиция по X в пикселях
        y: number; // новая позиция по Y в пикселях
        direction: string; // направление: 'up' | 'down' | 'left' | 'right'
        isMoving: boolean; // двигается ли сейчас
        isInWater: boolean; // находится ли в воде
      }) => {
        // Берём существующий спрайт или создаём новый если игрок появился впервые
        const sprite =
          this.sprites.get(data.id) ?? this.add(data.id, data.x, data.y);

        // Обновляем позицию спрайта на сцене
        sprite.setPosition(data.x, data.y);
        // Двигаем label вместе с игроком
        const label = this.labels.get(data.id);
        if (label) {
          label.setPosition(data.x, data.y - RECT_SIZE / 3);
          label.setDepth(1 + data.y / 10000000 + 0.0001);
        }
        // Обновляем глубину рендеринга — чем южнее игрок тем он "ближе" к камере
        sprite.setDepth(1 + data.y / 10000000);

        // Если игрок двигается — запускаем анимацию ходьбы в нужном направлении
        // true = не перезапускать анимацию если она уже играет
        if (data.isMoving) {
          sprite.anims.play(`walk-${data.direction}`, true);
        } else {
          // Игрок стоит — останавливаем анимацию
          sprite.anims.stop();
          // Ставим idle фрейм соответствующий последнему направлению движения
          const idleFrames = { down: 18, left: 9, right: 27, up: 0 };
          sprite.setFrame(
            idleFrames[data.direction as keyof typeof idleFrames],
          );
        }

        // Если игрок в воде — обрезаем нижнюю часть спрайта
        if (data.isInWater) {
          // setCrop(x, y, ширина, высота) — показываем только верхние 2/3 спрайта
          sprite.setCrop(0, 0, PLAYER_SIZE, PLAYER_SIZE / 1.5);
        } else {
          // Сбрасываем обрезку — показываем спрайт полностью
          sprite.setCrop();
        }
      },
    );

    // Срабатывает когда игрок закрыл игру или потерял соединение
    EventBridge.on("remote-player-left", (id: string) => {
      // Удаляем спрайт со сцены и освобождаем память
      this.sprites.get(id)?.destroy();
      this.labels.get(id)?.destroy();
      // Удаляем запись из словаря
      this.sprites.delete(id);
      this.labels.delete(id);
    });
  }

  // Создаёт спрайт нового игрока на сцене
  private add(id: string, x: number, y: number): Phaser.GameObjects.Sprite {
    const sprite = this.scene.add
      .sprite(x, y, "player") // создаём спрайт с текстурой player
      .setDisplaySize(RECT_SIZE, RECT_SIZE) // масштабируем до размера тайла
      .setDepth(1 + y / 10000000); // устанавливаем начальную глубину

    // Запускаем анимацию чтобы инициализировать систему анимаций
    sprite.anims.play("walk-down", true);
    // Сразу останавливаем — игрок стоит на месте
    sprite.anims.stop();
    // Ставим idle фрейм — смотрит вниз
    sprite.setFrame(18);

    // Подпись с id над головой игрока
    const label = this.scene.add
      .text(x, y, id.slice(0, 6), {
        // первые 6 символов id — короче и читабельнее
        fontSize: "10px",
        color: "#ffffff",
        backgroundColor: "#00000088", // полупрозрачный фон
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1) // якорь по нижнему центру текста
      .setDepth(1 + y / 10000000 + 0.0001); // чуть выше спрайта
    // Сохраняем спрайт в словарь по id игрока
    this.sprites.set(id, sprite);
    // Сохраняем label вместе со спрайтом
    this.labels.set(id, label);
    return sprite;
  }

  // Вызывается каждый кадр из MainScene.update()
  update() {
    // Обновляем depth всех удалённых игроков
    // Нужно делать каждый кадр — иначе depth не обновится если игрок не двигался
    this.sprites.forEach((sprite) => {
      sprite.setDepth(1 + sprite.y / 10000000);
    });
  }

  // Вызывается при выходе из сцены — очищаем всё
  destroy() {
    // Отписываемся от всех событий чтобы не было утечек памяти
    EventBridge.off("remote-players");
    EventBridge.off("remote-player-moved");
    EventBridge.off("remote-player-left");
    // Удаляем все спрайты со сцены
    this.sprites.forEach((sprite) => sprite.destroy());
    // Очищаем словарь
    this.sprites.clear();
    this.labels.forEach((label) => label.destroy());
    this.labels.clear();
  }
}
