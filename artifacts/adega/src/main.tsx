import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// 🔥 ESSA LINHA RESOLVE TUDO
setBaseUrl(import.meta.env.VITE_API_URL);

// 🔐 token (já estava certo)
setAuthTokenGetter(() => localStorage.getItem("adega_token"));

createRoot(document.getElementById("root")!).render(<App />);