import { createRoot } from "react-dom/client";
import App from "./components/App";
import "./style.css";

export function initPlugin(): void {
  // 1. Create host element
  const host = document.createElement("coremedia-ipe-plugin");
  document.body.appendChild(host);

  // 2. Attach Shadow DOM
  const shadow = host.attachShadow({ mode: "open" });

  // 3. Create mount point
  const mount = document.createElement("div");
  shadow.appendChild(mount);

  // 4. Inject basic reset style
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
    }
  `;
  shadow.appendChild(style);

  // 5. Render React App inside Shadow DOM
  const root = createRoot(mount);
  root.render(<App shadowRoot={shadow} />);
}

// Auto-run on bundle load
initPlugin();
