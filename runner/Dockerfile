FROM node:20
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install -g ts-node
# EXPOSE 3521
# EXPOSE 51500
CMD ["npx", "ts-node", "runner.ts"]
