import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

// 🔥 PRIMEIRO DE TUDO
setBaseUrl(import.meta.env.VITE_API_URL);
setAuthTokenGetter(() => localStorage.getItem("adega_token"));

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);