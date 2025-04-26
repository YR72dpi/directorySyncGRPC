# directorySyncGRPC

Ce projet permet de synchroniser 2 dossiers qui ne sont pas sur le même serveur en utilisant GRPC.
Il y a aussi une interface graphique sur le port 3000 fait avec nextJS qui vous permet de voir l'état de la synchronisation.

⚠ __directorySyncGRPC n'est pas (encore) récursif.__ Si vous y mettez un dossier, il ne sera pas synchronisé.

# Set Up

Il y a la racine du projet un docteur compose avec 3 parties :

- Le service ``interface`` permet de voir l'état de la synchronisation par interface graphique sur le port 3000 utilisant websocket pour car peu d'informations mais nécessitant une mise à jours en temps réel. Il n'est pas nécessaire au bon fonctionnement de la synchronisation.

- Le service ``runner``, actif sur le serveur où est présent le dossier source permet de voir les fichiers et de les synchroniser en les envoyant par GRPC. GRPC car il peut potentiellement il y avoir de grandes quantités de donnée

- Le service ``synced`` permet de donner les informations à l'interface graphique sur l'etat de la synchronisation de la destination et à recevoir les fichiers.

```yml
version: '3.8'

# === source ===

# Cette partie va recuperer l'etat du dossier source et dossier destination pour comparer leur contenu et l'afficher
services:
  interface:
    build: ./interface
    ports:
      - "3000:3000"
    volumes:
      - ./test/entree:/app/in
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SOCKET_URL="http://localhost:3521"

# cette partie la va envoyer le contenu source vers la destination
  runner:
    build: ./runner
    environment:
      - IP_PORT=synced:51500
    volumes:
      - ./runner:/app
      - ./test/entree:/app/in
    depends_on:
      - interface
    command: ["npx", "ts-node", "runner.ts"]

# === destination ===
# cette partie là va recevoir les fichiers et donners létat du dossier de destination a l'interface
  synced:
    build: ./synced
    ports:
      - "3521:3521" # Socket.io
      - "51500:51500" # gRPC
    environment:
      - SOCKET_PORT = "3521"
      - GRPC_PORT = "51500"
    volumes:
      - ./synced:/app
      - ./test/sortie:/app/out

```

# TO DO
- Le faire en go
- Reccursivité
- Fait un meilleure compose (ex: container_name, etc...)
