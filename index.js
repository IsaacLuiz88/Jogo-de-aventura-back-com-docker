const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permite conexões de qualquer origem (ajuste conforme necessário)
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`Novo jogador conectado: ${socket.id}`);

  // Evento de mensagem entre jogadores
  socket.on("mensagem", (data) => {
    console.log(`Mensagem recebida de ${socket.id}:`, data);
    io.emit("mensagem", data); // Envia a mensagem para todos os jogadores
  });

  // Desconexão do jogador
  socket.on("disconnect", () => {
    console.log(`Jogador ${socket.id} desconectado`);
  });
});

server.listen(3001, () => {
  console.log("Servidor WebSocket rodando na porta 3001");
});
