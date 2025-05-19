# directorySyncGRPC

Ce projet permet de synchroniser 2 dossiers qui ne sont pas sur le même serveur en utilisant GRPC.
Il y a aussi une interface graphique sur le port 3000 fait avec nextJS qui vous permet de voir l'état de la synchronisation.

⚠ __directorySyncGRPC n'est pas (encore) récursif.__ Si vous y mettez un dossier, il ne sera pas synchronisé.

Via gRPC : 10.4 Mo prend environ 70-75 ms à se transferer en local, soit environ 148 Mo/s

# Set Up

Il y a la racine du projet un docker compose avec 3 parties :

- Le service ``interface`` permet de voir l'état de la synchronisation par interface graphique sur le port 3000 utilisant websocket pour car peu d'informations mais nécessitant une mise à jours en temps réel. Il n'est pas nécessaire au bon fonctionnement de la synchronisation.

- Le service ``runner``, actif sur le serveur où est présent le dossier source permet de voir les fichiers et de les synchroniser en les envoyant par GRPC. GRPC car il peut potentiellement il y avoir de grandes quantités de donnée

- Le service ``synced`` permet de donner les informations à l'interface graphique sur l'etat de la synchronisation de la destination et à recevoir les fichiers.

```yml
# source
services:
  interface:
    build: ./interface
    ports:
      - "${INTERFACE_PORT}:3000"
    volumes:
      - ./test/entree:/app/in
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SOCKET_URL=http://${DESTINATION_IP}:${SOCKET_PORT}

  runner:
    build: ./runner
    environment:
      - IP_PORT=${DESTINATION_IP}:${GRPC_PORT}
    volumes:
      - ./test/entree:/usr/src/app/in
    depends_on:
      - interface

# destination
  synced:
    build: ./synced
    ports:
      - "${SOCKET_PORT}:3521" # Socket.io
      - "${GRPC_PORT}:51500" # gRPC
    environment:
      - SOCKET_PORT=${SOCKET_PORT}
      - GRPC_PORT=${GRPC_PORT}
    volumes:
      - ./test/sortie:/usr/src/app/out
```

Le Env : 

```
# "synced" on local
DESTINATION_IP="synced"

SOCKET_PORT="3521"
GRPC_PORT="51500"

INTERFACE_PORT="3000"
```

- ``DESTINATION_IP`` : [IP]:[PORT] du serveur grpc ou se trouve la destination du fichier (ex: 1.2.3.4:51500)

- ``SOCKET_PORT`` : le port où le websocket de la synchronisation de la destination est ouvert

- `` GRPC_PORT`` : le port gRPC du serveur de la destination

- ``INTERFACE_PORT`` : port de l'interface permettant d'avoir un visuel de l'etat de la synchro

# TO DO
- Le faire en go
- Reccursivité
- Fait un meilleure compose (ex: container_name, etc...)
