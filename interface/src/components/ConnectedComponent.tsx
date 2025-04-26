"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

let socket: Socket;

export default function ConnectedComponent({ handleConnected }: { handleConnected: (status: boolean) => void }) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) {
      console.error("url pas defini dans le .env");
      return;
    }

    socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("✅ Co", socket.id);
      setConnected(true);
      handleConnected(true)
    });

    socket.on("disconnect", () => {
      console.log("❌ Déco");
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [handleConnected]);
  return (
    <Alert className="border-r-accent">
      <Terminal className="h-4 w-4" />
      <AlertTitle>
        Conection au serveur de synchronisation
      </AlertTitle>
      <AlertDescription>
      {connected
          ? "✅ Connecté au serveur de synchronisation"
          : "🔌 Connexion en cours..."}
      </AlertDescription>
    </Alert>
  );
}
