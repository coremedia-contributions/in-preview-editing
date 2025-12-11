import { createRoot } from "react-dom/client";
import IPEMenu from "./components/IPEMenu.tsx";
import { TargetElementProvider } from "./context/TargetElementContext.tsx";
import { Highlighter } from "./components/Highlighter.tsx";

// CSS imports as strings via Vite ?inline
import pluginStyles from "./styles/plugin.css?inline";

export function initPlugin(): void {
  // Create host element
  const host = document.createElement("coremedia-ipe-plugin");
  document.body.appendChild(host);

  // Attach Shadow DOM
  const shadow = host.attachShadow({ mode: "open" });

  // Inject plugin-specific CSS into shadow DOM ---
  const shadowPluginStyle = document.createElement("style");
  shadowPluginStyle.textContent = pluginStyles;
  shadow.appendChild(shadowPluginStyle);

  // Create mount point for React inside shadow DOM
  const mount = document.createElement("div");
  shadow.appendChild(mount);

  // Render React App inside Shadow DOM
  const root = createRoot(mount);
  root.render(
    <TargetElementProvider shadowRoot={shadow}>
      <IPEMenu shadowRoot={shadow} />
      <Highlighter shadowRoot={shadow}/>
    </TargetElementProvider>
  );
}

// Auto-run on bundle load
initPlugin();
