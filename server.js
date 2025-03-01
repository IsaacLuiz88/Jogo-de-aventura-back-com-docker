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

const salas = {}; // Armazena os jogadores em cada sala

io.on("connection", (socket) => {
  console.log(`Novo jogador conectado: ${socket.id}`);

  socket.on("entrarSalas", (data) => {
    console.log(`Jogador ${socket.id} entrou na sala ${data.sala}`);
    socket.join(data.sala); // Adiciona o jogador à sala
    
    if (!salas[data.sala]) {
      salas[data.sala] = []; // Cria a sala se não existir
    }
    salas[data.sala].push(socket.id); // Adiciona o jogador à lista de jogadores da sala
    console.log(`Jogadores na sala ${data.sala}:`, salas[data.sala]);
    io.to(data.sala).emit("atualizarJogadores", salas[data.sala]); // Atualiza a sala
  });

  // Evento de mensagem entre jogadores
  socket.on("mensagem", (data) => {
    console.log(`Mensagem recebida de ${socket.id}:`, data);
    io.emit("mensagem", data); // Envia a mensagem para todos os jogadores
  });

  // Jogador sai da sala ao desconectar
  socket.on("disconnect", () => {
    for (const sala in salas) {
      salas[sala] = salas[sala].filter((jogador) => jogador.id !== socket.id);
      io.to(sala).emit("atualizarJogadores", salas[sala]); // Atualiza a sala
    }
    console.log(`Jogador ${socket.id} desconectado`);
  });
});

server.listen(3001, () => {
  console.log("Servidor WebSocket rodando na porta 3001");
});
