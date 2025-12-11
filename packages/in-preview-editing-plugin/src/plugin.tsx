import { createRoot } from "react-dom/client";
import IPEMenu from "./components/IPEMenu.tsx";
import { TargetElementProvider } from "./context/TargetElementContext.tsx";
import { Highlighter } from "./components/Highlighter.tsx";

// CSS imports as strings via Vite ?inline
import sharedStyles from "./styles/shared.css?inline";
import pluginStyles from "./styles/plugin.css?inline";

export function initPlugin(): void {
  // Create host element
  const host = document.createElement("coremedia-ipe-plugin");
  document.body.appendChild(host);

  // Attach Shadow DOM
  const shadow = host.attachShadow({ mode: "open" });

  // Inject shared CSS into shadow DOM ---
  const shadowSharedStyle = document.createElement("style");
  shadowSharedStyle.textContent = sharedStyles;
  shadow.appendChild(shadowSharedStyle);

  // Inject plugin-specific CSS into shadow DOM ---
  const shadowPluginStyle = document.createElement("style");
  shadowPluginStyle.textContent = pluginStyles;
  shadow.appendChild(shadowPluginStyle);

  // Inject shared CSS into global document for portal menus ---
  const globalStyle = document.createElement("style");
  globalStyle.textContent = sharedStyles;
  document.head.appendChild(globalStyle);

  // Create mount point for React inside shadow DOM
  const mount = document.createElement("div");
  shadow.appendChild(mount);

  // Render React App inside Shadow DOM
  const root = createRoot(mount);
  root.render(
    <TargetElementProvider shadowRoot={shadow}>
      <IPEMenu />
      <Highlighter shadowRoot={shadow}/>
    </TargetElementProvider>
  );
}

// Auto-run on bundle load
initPlugin();
