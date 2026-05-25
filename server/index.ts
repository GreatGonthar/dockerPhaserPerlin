import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';

const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

// Храним всех игроков
const players: Record<string, { x: number; y: number; seed: string }> = {};

io.on('connection', (socket) => {
  console.log('Игрок подключился:', socket.id);

  // Новый игрок — отправляем ему всех остальных
  socket.emit('players', players);

  // Игрок обновил позицию
  socket.on('player-move', (data: { x: number; y: number; seed: string }) => {
   
    players[socket.id] = data;
    // Рассылаем всем кроме отправителя
    socket.broadcast.emit('player-moved', { id: socket.id, ...data });
  });

  // Игрок отключился
  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('player-left', socket.id);
    console.log('Игрок отключился:', socket.id);
  });
});
httpServer.listen(3001,'0.0.0.0', () => console.log('Сервер запущен на порту 3001'));
app.get('/', (req, res) => {
  res.send('Сервер работает! Игроков онлайн: ' + Object.keys(players).length);
});
