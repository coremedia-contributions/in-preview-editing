export const MESSAGE_TYPE_ACTIVATE_IN_PAGE_EDITING = "com.coremedia.pde.editing.on";
export const MESSAGE_TYPE_DEACTIVATE_IN_PAGE_EDITING = "com.coremedia.pde.editing.off";
export const MESSAGE_TYPE_CONTENT_METADATA_REQUEST = "com.coremedia.pde.content.metadata.request";
export const MESSAGE_TYPE_CONTENT_METADATA_RESPONSE = "com.coremedia.pde.content.metadata.response";
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

/**
 * Sends a message to the parent window.
 * @param messageType the type of the message to send
 * @param payload optional payload to send with the message
 */
export function sendMessageToParent(messageType: string, payload = {}) {
  const msg = JSON.stringify({
    type: messageType,
    body: payload
  });

  console.log("[PDE] sending message to parent window: ", msg);
  window.parent.postMessage(msg, "*");
}
