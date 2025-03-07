import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './database.js';  // Conexão com MongoDB
import { client as redisClient, connectRedis } from './redisClient.js'; // Conexão única do Redis
import { Score } from './model.js'; // Modelo Score para interagir com o MongoDB

dotenv.config(); // Carregar variáveis do .env

// Criação do servidor Express
const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3001;

// Conecta ao banco de dados MongoDB
connectToDatabase();

// Configuração do Redis
connectRedis();

// Criação do servidor HTTP e Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`Novo jogador conectado: ${socket.id}`);

  // Evento para o jogador entrar em uma sala (agora usando Redis)
  socket.on("entrarSalas", async (data) => {
    console.log(`Jogador ${socket.id} entrou na sala ${data.sala}`);
    await redisClient.sAdd(`sala:${data.sala}`, socket.id);  // Adiciona o jogador ao conjunto da sala no Redis
    const jogadores = await redisClient.sMembers(`sala:${data.sala}`);  // Busca os jogadores da sala no Redis
    socket.join(data.sala); // Adiciona o jogador à sala
    io.to(data.sala).emit("atualizarJogadores", jogadores); // Atualiza a lista de jogadores da sala
  });

  // Evento de mensagem entre jogadores
  socket.on("mensagem", (data) => {
    console.log(`Mensagem recebida de ${socket.id}:`, data);
    io.emit("mensagem", data); // Envia a mensagem para todos os jogadores
  });

  // Evento de desconexão (agora usando Redis para gerenciar as salas)
  socket.on("disconnect", async () => {
    const salas = await redisClient.keys("sala:*");  // Busca todas as salas no Redis
    for (const sala of salas) {
      await redisClient.sRem(sala, socket.id); // Remove jogador do conjunto da sala no Redis
      const jogadores = await redisClient.sMembers(sala); // Busca os jogadores da sala no Redis
      io.to(sala.replace("sala:", "")).emit("atualizarJogadores", jogadores); // Atualiza a lista de jogadores na sala
    }
    console.log(`Jogador ${socket.id} desconectado`);
  });

  // Evento para salvar score
  socket.on("salvarScore", async (scoreData) => {
    const score = new Score({
      score: scoreData.score,
      total_bricks: scoreData.total_bricks,
      bombs_skipped: scoreData.bombs_skipped,
      bombs_exploded: scoreData.bombs_exploded,
      energy_captured: scoreData.energy_captured,
      nickname: scoreData.nickname
    });
    await score.save();  // Salva o score no MongoDB
    io.emit("scoreSalvo", score);  // Emite evento confirmando o salvamento do score
  });
});

// Rotas do Express para interagir com o banco de dados / salvar score via HTTP (express)
app.post('/', (req, res) => {
  const score = req.body;
  console.log('Score recebido:', score);

  const newScore = new Score({
    score: score.score,
    total_bricks: score.total_bricks,
    bombs_skipped: score.bombs_skipped,
    bombs_exploded: score.bombs_exploded,
    energy_captured: score.energy_captured,
    nickname: score.nickname
  });

  newScore.save()
    .then(() => res.send('Score salvo'))
    .catch((e) => res.send('Erro ao salvar score'));
});

app.get('/all', (req, res) => {
  Score.find()
    .then((scores) => res.send(scores))
    .catch((e) => res.send('Erro ao buscar scores'));
});

app.get('/max', (req, res) => {
  Score.find().sort({ score: -1 }).limit(1)
    .then((scores) => res.send(scores))
    .catch((e) => res.send('Erro ao buscar scores'));
});

// Inicia o servidor Express na porta 3001
server.listen(PORT, () => {
  console.log(`Servidor WebSocket e Express rodando na porta ${PORT}`);
});
