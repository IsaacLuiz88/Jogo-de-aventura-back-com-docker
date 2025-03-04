# Usa uma imagem oficial do Node.js como base
FROM node:18

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos package.json e package-lock.json
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código do aplicativo
COPY . .

# Expõe a porta 3001
EXPOSE 3001

# Inicia o servidor
CMD ["node", "server.js"]