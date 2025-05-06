import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import fs from 'fs';
import path from 'path';

const packageDefinition = protoLoader.loadSync('./proto/upload.proto');
const proto = grpc.loadPackageDefinition(packageDefinition) as any;

console.log("Send to "+process.env.IP_PORT)

const client = new proto.Upload(
    process.env.IP_PORT as string,
    grpc.credentials.createInsecure()
);

const uploadFile = (filePath: string, name: string) => {
    const fileContent = fs.readFileSync(filePath);
    const request = { name, fileContent };

    return new Promise((resolve, reject) => {
        client.UploadFile(request, (error: any, response: any) => {
            if (error) { reject(error); }
            else { resolve(response); }
        });
    });
};

setInterval(async () => {

    await new Promise((resolve, reject) => {
        client.ClearFolder({do: true}, (err: any) => {
            if (err) reject(err);
            else resolve(null);
        });
    });

    console.log("Sync in progress")
    const sourceDir = path.join(process.cwd(), "in");

    if (!sourceDir) console.log({ error: 'Le chemin du dossier source est requis.' }, { status: 400 });

    if (!fs.existsSync(sourceDir)) console.log({ error: 'Le dossier source n\'existe pas.' }, { status: 404 });

    const files = fs.readdirSync(sourceDir);

    try {
        const uploadPromises = files.map((file) => {
            const filePath = path.join(sourceDir, file);
            return uploadFile(filePath, file);
        });

        const results = await Promise.all(uploadPromises);
        console.log({ message: 'Tous les fichiers ont été envoyés avec succès', results });
    } catch (error) {
        console.error('Erreur d\'upload des fichiers:', error);
        console.log({ error: 'Erreur lors de l\'upload des fichiers.' }, { status: 500 });
    }
}, 5000)
