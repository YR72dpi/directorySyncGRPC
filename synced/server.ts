import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const app = express();
const httpServer = createServer(app);
const SOCKET_PORT = 3521;
const GRPC_PORT = 51500

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

function getOutHash(): string {
  const outDir = path.join(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) return '';

  const files = fs.readdirSync(outDir).sort();
  let content = '';

  for (const file of files) {
    const filePath = path.join(outDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile()) {
      const fileContent = fs.readFileSync(filePath);
      content += fileContent.toString();
    }
  }

  return crypto.createHash('md5').update(content).digest('hex');
}

io.on('connection', (socket) => {
  console.log('Client co');

  socket.on('message', (msg: string) => {
    console.log('Message : ', msg);
    io.emit('message', msg); 
  });

  setInterval(() => {
    socket.emit('hash_out', getOutHash());
  }, 1000);

  socket.on('disconnect', () => {
    console.log("Client deco");
  });
});

httpServer.listen(SOCKET_PORT, () => {
  console.log(`Serveur Socket port : ${SOCKET_PORT}`);
});

// ------------------------------------------ parti proto

const PROTO_PATH = "./proto/upload.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const grpcObj = grpc.loadPackageDefinition(packageDefinition) as any;
const fileSyncPackage = grpcObj.Upload;

const outDir = path.join(__dirname, "./out");

const server = new grpc.Server();

server.addService(fileSyncPackage.service, {
  StreamUploadFile: (call: any, callback: any) => {
    let fileName = '';
    let filePath = '';
    let writeStream: fs.WriteStream;

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    call.on('data', (chunk: any) => {
      if (!fileName) {
        fileName = chunk.name;
        filePath = path.join(outDir, fileName);

        // Création du stream d’écriture une fois le nom reçu
        writeStream = fs.createWriteStream(filePath);
      }

      if (chunk.fileChunk && writeStream) {
        writeStream.write(chunk.fileChunk);
      }
    });

    call.on('end', () => {
      writeStream?.end();

      const timestamp = Date.now();
      console.log(`[UPLOAD DONE] ${fileName} at ${timestamp}`);

      callback(null, {
        success: true,
        ts: timestamp,
        message: 'File uploaded successfully',
      });
    });

    call.on('error', (err: any) => {
      console.error('[UPLOAD ERROR]', err);
      callback(null, {
        success: false,
        ts: Date.now(),
        message: err.message,
      });
    });
  },

  ClearFolder: (call: any, callback: any) => {
    try {
      fs.readdirSync(outDir).forEach(file => {
        fs.unlinkSync(path.join(outDir, file));
      });
      callback(null, { success: true, message: 'Folder cleared.' });
    } catch (err) {
      callback(null, { success: false, message: err as string });
    }
  }
});
server.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`Serveur gRPC port : ${GRPC_PORT}`);
});
