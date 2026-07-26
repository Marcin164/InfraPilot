import { io, Socket } from "socket.io-client";
import { getAuthToken } from "./api";

// Same reasoning as api.ts: fall back to the page's own origin so one built
// image works for any customer's IP/domain without a per-install rebuild.
export const socket: Socket = io(
  import.meta.env.VITE_WS_URL || window.location.origin,
  {
    transports: ["websocket"],
    autoConnect: false, // ⬅️ kontrolujemy kiedy łączymy
    // Re-evaluated on every (re)connect attempt so a refreshed PropelAuth
    // token is always sent, not just the one present at page load.
    auth: (cb) => cb({ token: getAuthToken() }),
  }
);
