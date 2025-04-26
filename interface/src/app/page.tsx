"use client"
import IsSync from "@/components/IsSync";
import ConnectedComponent from "../components/ConnectedComponent";
import { useState } from "react";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-5">
      <ConnectedComponent handleConnected={setIsConnected}/>
      {isConnected && <IsSync/>}
      </div>
    </>
  );
}

