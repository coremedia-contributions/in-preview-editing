import { PostMessageRxBridge } from "./post-message-rx-bridge";

// ---------------------------------------------------------------------------
// Message-type constants
// ---------------------------------------------------------------------------

export const MESSAGE_TYPE_ACTIVATE_IN_PAGE_EDITING = "com.coremedia.pde.editing.on";
export const MESSAGE_TYPE_DEACTIVATE_IN_PAGE_EDITING = "com.coremedia.pde.editing.off";
export const MESSAGE_TYPE_CONTENT_METADATA_REQUEST = "com.coremedia.pde.content.metadata.request";
export const MESSAGE_TYPE_CONTENT_METADATA_RESPONSE = "com.coremedia.pde.content.metadata.response";
export const MESSAGE_TYPE_QUICK_CREATE_TEMPLATES_REQUEST = "com.coremedia.pde.quickcreate.templates.request";
export const MESSAGE_TYPE_QUICK_CREATE_TEMPLATES_RESPONSE = "com.coremedia.pde.quickcreate.templates.response";
export const MESSAGE_TYPE_INSERT_QUICK_CREATE_CONTENT_IN_PLACEMENT_REQUEST = "com.coremedia.pde.quickcreate.placement.insert.request";
export const MESSAGE_TYPE_CONTENT_METRICS_REQUEST = "com.coremedia.pde.content.metrics.request";
export const MESSAGE_TYPE_CONTENT_METRICS_RESPONSE = "com.coremedia.pde.content.metrics.response";
export const MESSAGE_TYPE_SHOW_EDITOR = "com.coremedia.pde.showEditor";
export const MESSAGE_TYPE_OPEN_CONTENT = "com.coremedia.pde.openContent";
export const MESSAGE_TYPE_SHOW_IN_LIBRARY = "com.coremedia.pde.showInLibrary";
export const MESSAGE_TYPE_OPEN_NAVIGATION_MANAGER = "com.coremedia.pde.openNavigationManager";
export const MESSAGE_TYPE_CREATE_PAGE_FROM_TEMPLATE = "com.coremedia.pde.createPageFromTemplate";
export const MESSAGE_TYPE_START_LOCALIZATION = "com.coremedia.pde.startLocalization";
export const MESSAGE_TYPE_START_PUBLICATION = "com.coremedia.pde.startPublication";
export const MESSAGE_TYPE_PUBLISH_REQUEST = "com.coremedia.pde.content.publish.request";
export const MESSAGE_TYPE_ROLLBACK_REQUEST = "com.coremedia.pde.content.rollback.request";
export const MESSAGE_TYPE_PROPERTY_UPDATE_REQUEST = "com.coremedia.pde.propertyUpdate";
export const MESSAGE_TYPE_UPDATE_USER_PREFERENCES_REQUEST = "com.coremedia.pde.updateUserPreferenceRequest";

// ---------------------------------------------------------------------------
// Shared bridge singleton
// ---------------------------------------------------------------------------

/**
 * Central RxJS PostMessage bridge shared across the plugin.
 * Use `pdeBridge.on(MESSAGE_TYPE_*)` to subscribe to incoming messages and
 * `pdeBridge.send()` / `pdeBridge.request()` to communicate with the parent.
 * Call `pdeBridge.destroy()` when the plugin unmounts to clean up listeners.
 */
export const pdeBridge = new PostMessageRxBridge({
  channel: "com.coremedia.pde",
  targetWindow: window.parent,
  targetOrigin: "*",
  // Accept legacy messages that were sent without a channel field
  acceptMessagesWithoutChannel: true,
});

// ---------------------------------------------------------------------------
// Legacy helper (kept for backwards-compatibility – delegates to the bridge)
// ---------------------------------------------------------------------------

/**
 * @deprecated Use `pdeBridge.send()` directly.
 */
export function sendMessageToParent(messageType: string, payload: Record<string, unknown> = {}): void {
  console.log("[PDE] sending message to parent window:", messageType, payload);
  pdeBridge.send(messageType, payload);
}
