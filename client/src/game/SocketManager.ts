import { io, Socket } from "socket.io-client";
import { EventBridge } from "./EventBridge";
import { SERVER_URL } from "./CONSTANTS";

export class SocketManager {
  private socket: Socket;
  constructor(serverUrl = SERVER_URL ?? 'http://localhost:3001') {
    this.socket = io(serverUrl);
    this.socket.on("connect", () => {
      console.log("Подключились к серверу, id:", this.socket.id);
    });
    // Получили список всех игроков при подключении
    this.socket.on(
      "players",
      (players: Record<string, { x: number; y: number }>) => {
        console.log("Получили игроков:", players);
        EventBridge.emit("remote-players", players);
      },
    );

    // Кто-то переместился
    this.socket.on(
      "player-moved",
      (data: { id: string; x: number; y: number }) => {
        EventBridge.emit("remote-player-moved", data);
      },
    );

    // Кто-то отключился
    this.socket.on("player-left", (id: string) => {
      console.log("Игрок ушёл:", id);
      EventBridge.emit("remote-player-left", id);
    });
    this.socket.on(
      "player-moved",
      (data: {
        id: string;
        x: number;
        y: number;
        direction: string;
        isMoving: boolean;
      }) => {
        EventBridge.emit("remote-player-moved", data);
      },
    );
  }

  // Отправляем свою позицию

  sendPosition(
    x: number,
    y: number,
    seed: string,
    direction: string,
    isMoving: boolean,
    isInWater: boolean,
  ) {
    this.socket.emit("player-move", {
      x,
      y,
      seed,
      direction,
      isMoving,
      isInWater,
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
  onConnect(callback: (id: string) => void) {
    this.socket.on("connect", () => {
      callback(this.socket.id!);
    });
  }
}
