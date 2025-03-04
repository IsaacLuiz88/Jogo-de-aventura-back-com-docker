import mongoose from "mongoose";

export function connectToDatabase() {
    const uri = 'mongodb+srv://Livia:livia123@cluster0.n7cnp.mongodb.net/Jogo-Aventura?retryWrites=true&w=majority&appName=Cluster0'

    mongoose.connect(uri)
    .then(() => console.log('conectado ao banco'))
    .catch((e) => console.error('erro ao conectar', e))
}