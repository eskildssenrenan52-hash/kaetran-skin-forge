import { createRoot } from "react-dom/client";
import { OdysseyScreen } from "./routes/odyssey";
import "./styles.css";

const mount = document.getElementById("root");
if (!mount) throw new Error("O container do jogo offline não foi encontrado.");

createRoot(mount).render(<OdysseyScreen startImmediately />);
