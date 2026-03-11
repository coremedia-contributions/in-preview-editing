import { createRoot } from "react-dom/client";
import IPEOverlay from "./components/IPEOverlay.tsx";
import { PluginContextProvider } from "./context/PluginContext.tsx";
import { Highlighter } from "./components/Highlighter.tsx";
import { Spotlight } from "./components/Spotlight.tsx";
import { IPE_ACTIVATE_EVENT, IPE_DEACTIVATE_EVENT, type IPEActivateEventDetail } from "./events/events.ts";
import { pdeBridge } from "./lib/messaging.ts";

import pluginStyles from "./styles/plugin.css?inline";
import frontendStyles from "./styles/frontend.css?inline";

// Component Styles
import buttonStyles from "./styles/components/Button.module.css?inline";
import iconStyles from "./styles/components/Icon.module.css?inline";
import menuStyles from "./styles/components/Menu.module.css?inline";
import toolbarStyles from "./styles/components/Toolbar.module.css?inline";

const FRONTEND_STYLE_ID = "coremedia-ipe-frontend-styles";

export function initPlugin(): void {
  // Create host element
  const host = document.createElement("coremedia-ipe-plugin");
  document.body.appendChild(host);

  // Attach Shadow DOM
  const shadow = host.attachShadow({ mode: "open" });

  // register global plugin styles
  const pluginSheet = new CSSStyleSheet();
  pluginSheet.replaceSync(pluginStyles);

  // register component styles
  const buttonSheet = new CSSStyleSheet();
  buttonSheet.replaceSync(buttonStyles);
  const iconSheet = new CSSStyleSheet();
  iconSheet.replaceSync(iconStyles);
  const menuSheet = new CSSStyleSheet();
  menuSheet.replaceSync(menuStyles);
  const toolbarSheet = new CSSStyleSheet();
  toolbarSheet.replaceSync(toolbarStyles);

  shadow.adoptedStyleSheets = [pluginSheet, buttonSheet, iconSheet, menuSheet, toolbarSheet];

  // Create mount point for React inside shadow DOM
  const mount = document.createElement("div");
  shadow.appendChild(mount);

  // register frontend styles on main document
  if (!document.getElementById(FRONTEND_STYLE_ID)) {
    const frontendStyle = document.createElement("style");
    frontendStyle.id = FRONTEND_STYLE_ID;
    frontendStyle.textContent = frontendStyles;
    document.head.appendChild(frontendStyle);
  }

  // Render React App inside Shadow DOM
  const root = createRoot(mount);
  root.render(
    <PluginContextProvider shadowRoot={shadow}>
      <IPEOverlay/>
      <Highlighter/>
      <Spotlight/>
    </PluginContextProvider>
  );

  // Register global window API
  window.com = window.com ?? {};
  window.com.coremedia = window.com.coremedia ?? {};
  window.com.coremedia.pde = {
    activateInPageEditing: (lang?: string) => {
      document.dispatchEvent(
        new CustomEvent<IPEActivateEventDetail>(IPE_ACTIVATE_EVENT, { detail: { lang } })
      );
    },
    deactivateInPageEditing: () => {
      document.dispatchEvent(new CustomEvent(IPE_DEACTIVATE_EVENT));
    },
    destroyPlugin: () => {
      root.unmount();
      host.remove();
      pdeBridge.destroy();
    },
  };
}

// Auto-run on bundle load
initPlugin();
