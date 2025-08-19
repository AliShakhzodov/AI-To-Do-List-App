import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css"; // 👈 Tailwind comes in here
import "./pwa";
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
