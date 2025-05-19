import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as fs from 'fs';
import * as path from 'path';
import long from "long";

const PROTO_PATH = './proto/upload.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const proto = grpc.loadPackageDefinition(packageDefinition) as any;

const client = new proto.Upload(
    process.env.IP_PORT || '127.0.0.1:51500',
    grpc.credentials.createInsecure()
);

const CHUNK_SIZE = 64 * 1024; // 64 Ko

const uploadFile = (filePath: string, name: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const call = client.StreamUploadFile((error: any, response: any) => {
            if (error) return reject(error);
            resolve(response);
        });

        // Première requête avec le nom du fichier
        call.write({ name });

        const readStream = fs.createReadStream(filePath, { highWaterMark: CHUNK_SIZE });

        readStream.on('data', (chunk) => {
            call.write({ fileChunk: chunk });
        });

        readStream.on('end', () => {
            call.end();
        });

        readStream.on('error', (err) => {
            reject(err);
        });
    });
};

interface SyncResponse {
    success: boolean;
    ts: {
        low: number;
        high: number;
        unsigned: boolean;
    };
}

const syncFiles = async () => {
    const startTs = Date.now();
    await new Promise((resolve, reject) => {
        client.ClearFolder({ do: true }, (err: any) => {
            if (err) reject(err);
            else resolve(null);
        });
    });

    console.log('Sync in progress');

    const sourceDir = path.join(process.cwd(), 'in');

    if (!fs.existsSync(sourceDir)) {
        console.error('Le dossier source n\'existe pas.');
        return;
    }

    const files = fs.readdirSync(sourceDir);

    try {
        const startTs = Date.now();

        const uploadPromises = files.map((file) => {
            const filePath = path.join(sourceDir, file);
            return uploadFile(filePath, file);
        });

        const results = await Promise.all(uploadPromises) as SyncResponse[];

        results.forEach((res) => {
            const ts = long.fromValue(res.ts).toNumber();

            console.log('Sync in ' + (ts - startTs) + 'ms');

        });

    } catch (err) {
        console.error('Erreur d\'upload des fichiers :', err);
    }
};

// Exécution périodique
setInterval(syncFiles, 5000);
