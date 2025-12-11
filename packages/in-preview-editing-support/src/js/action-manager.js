import {
  sendMessageToParent, MESSAGE_TYPE_OPEN_CONTENT, MESSAGE_TYPE_SHOW_IN_LIBRARY,
  MESSAGE_TYPE_OPEN_NAVIGATION_MANAGER, MESSAGE_TYPE_CREATE_PAGE_FROM_TEMPLATE, MESSAGE_TYPE_START_LOCALIZATION,
  MESSAGE_TYPE_START_PUBLICATION, MESSAGE_TYPE_ROLLBACK_REQUEST, MESSAGE_TYPE_SHOW_EDITOR,
  MESSAGE_TYPE_PROPERTY_UPDATE_REQUEST, MESSAGE_TYPE_CONTENT_METADATA_REQUEST, MESSAGE_TYPE_CONTENT_METRICS_REQUEST,
  MESSAGE_TYPE_PUBLISH_REQUEST
} from "./messaging";

class PDEActionManager extends EventTarget {

  constructor() {
    super();

    if (PDEActionManager.instance) {
      return PDEActionManager.instance;
    }

    PDEActionManager.instance = this;
  }

  requestFloatingEditor = (contentId, propertyName, elementCoords) => {
    if (contentId && propertyName && elementCoords) {
      let messageData = {
        contentId: contentId,
        propertyName: propertyName,
        coords: elementCoords
      };
      sendMessageToParent(MESSAGE_TYPE_SHOW_EDITOR, messageData);
    }
  }

  postPropertyUpdate = (contentId, propertyName, propertyValue) => {
    if (!contentId || !propertyName || !propertyValue || propertyValue.trim() === "") {
      return;
    }

    const messageData = {
      contentId: contentId,
      propertyName: propertyName,
      propertyValue: propertyValue,
    };

    sendMessageToParent(MESSAGE_TYPE_PROPERTY_UPDATE_REQUEST, messageData);
  }

  requestContentMetadata = (contentRef, propertyName, breadcrumbIds = []) => {
    if (contentRef && propertyName) {
      const messageData = {
        contentRef: contentRef,
        propertyName: propertyName,
        breadcrumbIds: breadcrumbIds,
      };
      sendMessageToParent(MESSAGE_TYPE_CONTENT_METADATA_REQUEST, messageData);
    }
  }

  requestContentPublication = (contentRef, propertyName) => {
    this.triggerContentAction(MESSAGE_TYPE_PUBLISH_REQUEST, contentRef, propertyName);
  }

  requestContentMetrics = (contentRef) => {
    this.triggerContentAction(MESSAGE_TYPE_CONTENT_METRICS_REQUEST, contentRef);
  }

  openContent = (contentRef) => {
    this.triggerContentAction(MESSAGE_TYPE_OPEN_CONTENT, contentRef);
  }

  showInLibrary = (contentRef) => {
    this.triggerContentAction(MESSAGE_TYPE_SHOW_IN_LIBRARY, contentRef);
  }

  startLocalizationWorkflow = (contentRef) => {
    this.triggerContentAction(MESSAGE_TYPE_START_LOCALIZATION, contentRef);
  }

  startPublicationWorkflow = (contentRef) => {
    this.triggerContentAction(MESSAGE_TYPE_START_PUBLICATION, contentRef);
  }

  openNavigationManager = () => {
    sendMessageToParent(MESSAGE_TYPE_OPEN_NAVIGATION_MANAGER, {});
  }

  createPageFromTemplate = () => {
    sendMessageToParent(MESSAGE_TYPE_CREATE_PAGE_FROM_TEMPLATE, {});
  }

  rollbackContent = (contentRef) => {
    this.triggerContentAction(MESSAGE_TYPE_ROLLBACK_REQUEST, contentRef)
  }

  triggerContentAction = (messageType, contentRef, propertyName = null) => {
    contentRef && sendMessageToParent(messageType, { contentRef: contentRef, propertyName: propertyName });
  }

}

export const pdeActionManager = new PDEActionManager();
