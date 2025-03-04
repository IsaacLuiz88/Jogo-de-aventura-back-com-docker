import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createClient } from 'redis';  // Importação do Redis
import { connectToDatabase } from './database.js'; // Função que conecta ao MongoDB
import { Score } from './model.js'; // Modelo Score para interagir com o MongoDB

// Criação do servidor Express
const app = express();
app.use(express.json());
app.use(cors());

// Conecta ao banco de dados MongoDB
connectToDatabase();

// Configuração do Redis
const redisClient = createClient({ url: 'redis://localhost:6379' });  // Conexão com o Redis local
redisClient.connect().then(() => console.log('Conectado ao Redis')).catch(console.error);  // Conectar e tratar erro

// Criação do servidor HTTP e Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Armazena os jogadores em cada sala
const salas = {};

io.on("connection", (socket) => {
  console.log(`Novo jogador conectado: ${socket.id}`);

  // Evento para o jogador entrar em uma sala (agora usando Redis)
  socket.on("entrarSalas", async (data) => {
    console.log(`Jogador ${socket.id} entrou na sala ${data.sala}`);
    await redisClient.sAdd(`sala:${data.sala}`, socket.id);  // Adiciona o jogador ao conjunto da sala no Redis
    const jogadores = await redisClient.sMembers(`sala:${data.sala}`);  // Busca os jogadores da sala no Redis
    socket.join(data.sala); // Adiciona o jogador à sala
    io.to(data.sala).emit("atualizarJogadores", salas[data.sala]); // Atualiza a lista de jogadores da sala
  });

  // Evento de mensagem entre jogadores
  socket.on("mensagem", (data) => {
    console.log(`Mensagem recebida de ${socket.id}:`, data);
    io.emit("mensagem", data); // Envia a mensagem para todos os jogadores
  });

  // Jogador sai da sala ao desconectar
  socket.on("disconnect", () => {
    for (const sala in salas) {
      salas[sala] = salas[sala].filter((jogador) => jogador !== socket.id); // Remove jogador da sala
      io.to(sala).emit("atualizarJogadores", salas[sala]); // Atualiza a lista de jogadores na sala
    }
    console.log(`Jogador ${socket.id} desconectado`);
  });
  
  // Evento para salvar score
  socket.on("salvarScore", (scoreData) => {
    const score = {
      playerId: socket.id,
      score: scoreData.score,
      room: scoreData.room,
    };

    Score.insertOne(score)
      .then(() => {
        console.log('Score salvo:', score);
        io.emit("scoreSalvo", score); // Emite evento confirmando o salvamento
      })
      .catch((e) => console.error("Erro ao salvar score:", e));
  });
});

// Rotas do Express para interagir com o banco de dados
app.post('/', (req, res) => {
    const score = req.body;
    console.log('Score recebido:', score);

    Score.insertOne(score)
    .then(() => res.send('Score salvo'))
    .catch((e) => res.send('Erro ao salvar score'));
});

app.get('/all', (req, res) => {
    Score.find()
    .then((scores) => res.send(scores))
    .catch((e) => res.send('Erro ao buscar scores'));
});

app.get('/max', (req, res) => {
    Score.find().sort({score: -1}).limit(1)
    .then((scores) => res.send(scores))
    .catch((e) => res.send('Erro ao buscar scores'));
});

// Inicia o servidor Express na porta 3001
server.listen(3001, () => {
    console.log('Servidor WebSocket e Express rodando na porta 3001');
});
