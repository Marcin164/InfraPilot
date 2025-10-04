import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "/node_modules/react-grid-layout/css/styles.css";
import "/node_modules/react-resizable/css/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RedirectToLogin, RequiredAuthProvider } from "@propelauth/react";
import SignInLoader from "./Components/Loaders/SignInLoader.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <RequiredAuthProvider
    authUrl="https://3187297.propelauthtest.com"
    displayWhileLoading={<SignInLoader />}
    displayIfLoggedOut={<RedirectToLogin />}
  >
    <QueryClientProvider client={queryClient}>
      <StrictMode>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </StrictMode>
    </QueryClientProvider>
  </RequiredAuthProvider>
);
