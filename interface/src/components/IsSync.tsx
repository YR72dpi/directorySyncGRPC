"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function IsSync() {
  const [hashOut, setHashOut] = useState<string | null>(null);
  const [hashIn, setHashIn] = useState<string | null>(null);
  const [isSync, setIsSync] = useState<boolean | null>(null);

  useEffect(() => {
    const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

    socket.on("hash_out", (hash: string) => {
        setHashOut(hash);
    });
    
    setInterval(async () => {
      await fetch("/api/scanRoute")
        .then((res) => res.json())
        .then((data) => {
          setHashIn(data.hash);
        });
    }, 1000)

    return () => {
      socket.disconnect();
    };
  }, []);

  setInterval(() => {setIsSync(hashOut === hashIn) }, 1000)

  return (
    <Alert className="border-r-accent">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Etat de la synchronisation : {isSync ? "OK 👌" : "Pas ok 😭"}</AlertTitle>
      <AlertDescription>
        <Table>
          <TableCaption></TableCaption>
          <TableHeader>
            <TableRow>
              <TableCell >Hash du IN</TableCell>
              <TableCell >{hashIn ?? "..."}</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell >Hash du OUT</TableCell>
              <TableCell >{hashOut ?? "..."}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </AlertDescription>
    </Alert>
  );
}
