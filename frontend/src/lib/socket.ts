import { io, Socket } from "socket.io-client";

export const socket: Socket = io(
  import.meta.env.VITE_WS_URL || "http://localhost:3000",
  {
    transports: ["websocket"],
    autoConnect: false, // ⬅️ kontrolujemy kiedy łączymy
  }
);
