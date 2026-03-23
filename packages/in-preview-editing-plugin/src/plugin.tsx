import { createRoot } from "react-dom/client";
import "./i18n/i18n";
import IPEOverlay from "./components/IPEOverlay.tsx";
import { PluginContextProvider } from "./context/PluginContext.tsx";
import { Highlighter } from "./components/Highlighter.tsx";
import { Spotlight } from "./components/Spotlight.tsx";
import Sidebar from "./components/Sidebar.tsx";
import { IPE_ACTIVATE_EVENT, IPE_DEACTIVATE_EVENT, type IPEActivateEventDetail } from "./events/events.ts";
import {
  MESSAGE_TYPE_ACTIVATE_IN_PAGE_EDITING,
  MESSAGE_TYPE_DEACTIVATE_IN_PAGE_EDITING,
  pdeBridge
} from "./lib/messaging.ts";

import pluginStyles from "./styles/plugin.css?inline";
import frontendStyles from "./styles/frontend.css?inline";

// Component Styles
import buttonStyles from "./styles/components/Button.module.css?inline";
import iconStyles from "./styles/components/Icon.module.css?inline";
import menuStyles from "./styles/components/Menu.module.css?inline";
import toolbarStyles from "./styles/components/Toolbar.module.css?inline";
import breadcrumbStyles from "./styles/components/BreadcrumbSelector.module.css?inline";
import sidebarStyles from "./styles/components/Sidebar.module.css?inline";
import collapsiblePanelStyles from "./styles/components/CollapsiblePanel.module.css?inline";
import dialogStyles from "./styles/components/Dialog.module.css?inline";
import fieldsetStyles from "./styles/components/Fieldset.module.css?inline";
import SettingsDialog from "./components/SettingsDialog.tsx";


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
  const breadcrumbSelectorSheet = new CSSStyleSheet();
  breadcrumbSelectorSheet.replaceSync(breadcrumbStyles);
  const sidebarSheet = new CSSStyleSheet();
  sidebarSheet.replaceSync(sidebarStyles);
  const collapsiblePanelSheet = new CSSStyleSheet();
  collapsiblePanelSheet.replaceSync(collapsiblePanelStyles);
  const dialogSheet = new CSSStyleSheet();
  dialogSheet.replaceSync(dialogStyles);
  const fieldsetSheet = new CSSStyleSheet();
  fieldsetSheet.replaceSync(fieldsetStyles);

  shadow.adoptedStyleSheets = [pluginSheet, buttonSheet, iconSheet, menuSheet, toolbarSheet, breadcrumbSelectorSheet, sidebarSheet, collapsiblePanelSheet, dialogSheet, fieldsetSheet];

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
      <Sidebar/>
      <SettingsDialog/>
    </PluginContextProvider>
  );

  // Register global window API
  window.com = window.com ?? {};
  window.com.coremedia = window.com.coremedia ?? {};
  window.com.coremedia.pde = {
    activateInPageEditing: (lang?: string, features?: object) => {
      document.dispatchEvent(
        new CustomEvent<IPEActivateEventDetail>(IPE_ACTIVATE_EVENT, { detail: { lang, features } })
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

  // Register window message listener
  window.addEventListener("message", (event) => {
    let message = event.data;
    if (typeof message === "string") {
      message = JSON.parse(event.data);
    }

    switch (message.type) {
    case MESSAGE_TYPE_ACTIVATE_IN_PAGE_EDITING:
      console.log("Activate IPE", event.data);
      document.dispatchEvent(new CustomEvent<IPEActivateEventDetail>(IPE_ACTIVATE_EVENT, {
        detail: {
          lang: message.body.lang,
          features: message.body.features,
        }
      }));
      break;
    case MESSAGE_TYPE_DEACTIVATE_IN_PAGE_EDITING:
      console.log("Deactivate IPE", event.data);
      document.dispatchEvent(new CustomEvent(IPE_DEACTIVATE_EVENT));
      break;
    }

  });
}

// Auto-run on bundle load
initPlugin();
