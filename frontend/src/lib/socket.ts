import { io, Socket } from "socket.io-client";
import { getAuthToken } from "./api";

export const socket: Socket = io(
  import.meta.env.VITE_WS_URL || "http://localhost:3000",
  {
    transports: ["websocket"],
    autoConnect: false, // ⬅️ kontrolujemy kiedy łączymy
    // Re-evaluated on every (re)connect attempt so a refreshed PropelAuth
    // token is always sent, not just the one present at page load.
    auth: (cb) => cb({ token: getAuthToken() }),
  }
);
