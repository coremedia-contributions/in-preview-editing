import {
  sendMessageToParent, MESSAGE_TYPE_OPEN_CONTENT, MESSAGE_TYPE_SHOW_IN_LIBRARY,
  MESSAGE_TYPE_OPEN_NAVIGATION_MANAGER, MESSAGE_TYPE_CREATE_PAGE_FROM_TEMPLATE, MESSAGE_TYPE_START_LOCALIZATION,
  MESSAGE_TYPE_START_PUBLICATION, MESSAGE_TYPE_ROLLBACK_REQUEST, MESSAGE_TYPE_SHOW_EDITOR,
  MESSAGE_TYPE_PROPERTY_UPDATE_REQUEST, MESSAGE_TYPE_CONTENT_METADATA_REQUEST, MESSAGE_TYPE_CONTENT_METRICS_REQUEST,
  MESSAGE_TYPE_PUBLISH_REQUEST
} from "./messaging";

class PDEActionManager extends EventTarget {

  private static instance: PDEActionManager;

  private constructor() {
    super();
  }

  public static getInstance() {
    if (!PDEActionManager.instance) {
      PDEActionManager.instance = new PDEActionManager();
    }
    return PDEActionManager.instance;
  }

  requestFloatingEditor = (contentId: string, propertyName: string | null = null, elementCoords: DOMRect | null = null) => {
    if (contentId && propertyName && elementCoords) {
      let messageData = {
        contentId: contentId,
        propertyName: propertyName,
        coords: elementCoords
      };
      sendMessageToParent(MESSAGE_TYPE_SHOW_EDITOR, messageData);
    }
  };

  postPropertyUpdate = (contentId: string, propertyName: string, propertyValue: any) => {
    if (!contentId || !propertyName || !propertyValue || propertyValue.trim() === "") {
      return;
    }

    const messageData = {
      contentId: contentId,
      propertyName: propertyName,
      propertyValue: propertyValue,
    };

    sendMessageToParent(MESSAGE_TYPE_PROPERTY_UPDATE_REQUEST, messageData);
  };

  requestContentMetadata = (contentRef: string, propertyName: string, breadcrumbIds: string[] = []) => {
    if (contentRef && propertyName) {
      const messageData = {
        contentRef: contentRef,
        propertyName: propertyName,
        breadcrumbIds: breadcrumbIds,
      };
      sendMessageToParent(MESSAGE_TYPE_CONTENT_METADATA_REQUEST, messageData);
    }
  };

  requestContentPublication = (contentRef: string, propertyName: string) => {
    this.triggerContentAction(MESSAGE_TYPE_PUBLISH_REQUEST, contentRef, propertyName);
  };

  requestContentMetrics = (contentRef: string) => {
    this.triggerContentAction(MESSAGE_TYPE_CONTENT_METRICS_REQUEST, contentRef);
  };

  openContent = (contentRef: string) => {
    this.triggerContentAction(MESSAGE_TYPE_OPEN_CONTENT, contentRef);
  };

  showInLibrary = (contentRef: string) => {
    this.triggerContentAction(MESSAGE_TYPE_SHOW_IN_LIBRARY, contentRef);
  };

  startLocalizationWorkflow = (contentRef: string) => {
    this.triggerContentAction(MESSAGE_TYPE_START_LOCALIZATION, contentRef);
  };

  startPublicationWorkflow = (contentRef: string) => {
    this.triggerContentAction(MESSAGE_TYPE_START_PUBLICATION, contentRef);
  };

  openNavigationManager = () => {
    sendMessageToParent(MESSAGE_TYPE_OPEN_NAVIGATION_MANAGER, {});
  };

  createPageFromTemplate = () => {
    sendMessageToParent(MESSAGE_TYPE_CREATE_PAGE_FROM_TEMPLATE, {});
  };

  rollbackContent = (contentRef: string) => {
    this.triggerContentAction(MESSAGE_TYPE_ROLLBACK_REQUEST, contentRef);
  };

  triggerContentAction = (messageType: string, contentRef: string, propertyName: string | null = null) => {
    contentRef && sendMessageToParent(messageType, { contentRef: contentRef, propertyName: propertyName });
  };

}

export default PDEActionManager;
