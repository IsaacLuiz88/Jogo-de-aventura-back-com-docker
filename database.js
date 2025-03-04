import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
export function connectToDatabase() {
    const uri = process.env.MONGO_URL;
    
    if(!uri) {  // Se a URI não foi definida, exibe um erro
        console.error('URI de conexão com o MongoDB não definida');
        process.exit(1);
    }
    
    mongoose.connect(uri)
    .then(() => console.log('✅ Conectado ao MongoDB Atlas'))
    .catch((e) => console.error('❌ Erro ao conectar ao MongoDB', e))
}