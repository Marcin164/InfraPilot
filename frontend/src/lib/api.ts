import axios from "axios";

// No VITE_API_URL at build time → assume nginx proxies /api on the same
// origin the app was loaded from (the on-prem deployment default, see
// DEPLOYMENT.md). Keeps one frontend image installable at any customer's
// IP/domain with zero rebuild. Local dev sets VITE_API_URL explicitly in
// frontend/.env to override this and reach the backend directly.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `${window.location.origin}/api`,
});

let currentToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentToken = token;
  if (token) {
    api.defaults.headers.common["authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["authorization"];
  }
};

export const getAuthToken = () => currentToken;

export default api;
