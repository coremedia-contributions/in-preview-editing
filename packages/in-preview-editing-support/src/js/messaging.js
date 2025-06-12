// message types used for communication with Studio
import { receivedContentMetadata } from "./edit-menu";
import { activateInPageEditing, deactivateInPageEditing } from "./editing";

export const MESSAGE_TYPE_ACTIVATE_IN_PAGE_EDITING = "com.coremedia.pde.editing.on";
export const MESSAGE_TYPE_DEACTIVATE_IN_PAGE_EDITING = "com.coremedia.pde.editing.off";
export const MESSAGE_TYPE_CONTENT_METADATA_REQUEST = "com.coremedia.pde.content.metadata.request";
export const MESSAGE_TYPE_CONTENT_METADATA_RESPONSE = "com.coremedia.pde.content.metadata.response";
export const MESSAGE_TYPE_SHOW_EDITOR = "com.coremedia.pde.showEditor";
export const MESSAGE_TYPE_OPEN_CONTENT = "com.coremedia.pde.openContent";
export const MESSAGE_TYPE_PUBLISH_REQUEST = "com.coremedia.pde.content.publish.request";
export const MESSAGE_TYPE_PROPERTY_UPDATE_REQUEST = "com.coremedia.pde.propertyUpdate";

/**
 * Sends a message to the parent window.
 * @param messageType the type of the message to send
 * @param payload optional payload to send with the message
 */
export function sendMessageToParent(messageType, payload = {}) {
  const msg = JSON.stringify({
    type: messageType,
    body: payload
  });

  console.log("[PDE] sending message to parent window: ", msg);
  window.parent.postMessage(msg, "*");
}

/**
 * Dispatch received events to the appropriate handler based on the message type.
 * @param event
 */
export function dispatchMessage(event) {
  let msgData = event.data;
  if (typeof msgData === "string") {
    msgData = JSON.parse(event.data);
  }

  switch (msgData.type) {

    case MESSAGE_TYPE_ACTIVATE_IN_PAGE_EDITING:
      activateInPageEditing(msgData.lang);
      break;

    case MESSAGE_TYPE_DEACTIVATE_IN_PAGE_EDITING:
      deactivateInPageEditing();
      break;

    case MESSAGE_TYPE_CONTENT_METADATA_RESPONSE:
      receivedContentMetadata(msgData);
      break;
  }
}
