FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3521 51500
CMD ["npx", "ts-node", "server.ts"]
