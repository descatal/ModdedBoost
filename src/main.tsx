import ReactDOM from "react-dom/client";
import App from "./App";
import {attachConsole} from "@tauri-apps/plugin-log";

attachConsole(); // <-- this line here

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
