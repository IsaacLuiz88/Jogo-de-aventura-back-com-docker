import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config(); // Carregar variáveis do .env

const client = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

client.on('error', (err) => console.error('❌ Redis Client Error:', err));

async function connectRedis() {
    try {
        await client.connect();
        console.log('✅ Conectado ao Redis Cloud');
    } catch (err) {
        console.error('❌ Erro ao conectar ao Redis:', err);
    }
}

export { client, connectRedis };
