import {
  pdeBridge,
  MESSAGE_TYPE_OPEN_CONTENT, MESSAGE_TYPE_SHOW_IN_LIBRARY,
  MESSAGE_TYPE_OPEN_NAVIGATION_MANAGER, MESSAGE_TYPE_CREATE_PAGE_FROM_TEMPLATE, MESSAGE_TYPE_START_LOCALIZATION,
  MESSAGE_TYPE_START_PUBLICATION, MESSAGE_TYPE_ROLLBACK_REQUEST, MESSAGE_TYPE_SHOW_EDITOR,
  MESSAGE_TYPE_PROPERTY_UPDATE_REQUEST, MESSAGE_TYPE_CONTENT_METADATA_REQUEST, MESSAGE_TYPE_CONTENT_METADATA_RESPONSE,
  MESSAGE_TYPE_CONTENT_METRICS_REQUEST, MESSAGE_TYPE_CONTENT_METRICS_RESPONSE,
  MESSAGE_TYPE_PUBLISH_REQUEST
} from "./messaging";

import { Observable } from "rxjs";

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
      pdeBridge.send(MESSAGE_TYPE_SHOW_EDITOR, {
        contentId,
        propertyName,
        coords: elementCoords,
      });
    }
  };

  postPropertyUpdate = (contentId: string, propertyName: string, propertyValue: string | null | undefined) => {
    if (!contentId || !propertyName || !propertyValue || propertyValue.trim() === "") {
      return;
    }

    pdeBridge.send(MESSAGE_TYPE_PROPERTY_UPDATE_REQUEST, {
      contentId,
      propertyName,
      propertyValue,
    });
  };

  requestContentMetadata = <TResponse = unknown>(
    contentRef: string,
    propertyName: string | null,
    breadcrumbIds: string[] = [],
    timeoutMs = 5000,
  ): Observable<TResponse> | null => {
    if (!contentRef) {
      return null;
    }

    console.log("[IPE] Requesting content metadata: ", {contentRef, propertyName, breadcrumbIds});

    return pdeBridge.request<Record<string, unknown>, TResponse>(
      MESSAGE_TYPE_CONTENT_METADATA_REQUEST,
      { contentRef, propertyName, breadcrumbIds },
      { responseType: MESSAGE_TYPE_CONTENT_METADATA_RESPONSE, timeoutMs, skipCorrelation: true },
    );
  };

  requestContentMetrics = <TResponse = unknown>(
    contentRef: string,
    timeoutMs = 5000,
  ): Observable<TResponse> => {
    return pdeBridge.request<Record<string, unknown>, TResponse>(
      MESSAGE_TYPE_CONTENT_METRICS_REQUEST,
      { contentRef },
      { responseType: MESSAGE_TYPE_CONTENT_METRICS_RESPONSE, timeoutMs, skipCorrelation: true },
    );
  };

  requestContentPublication = (contentRef: string, propertyName: string) => {
    this.triggerContentAction(MESSAGE_TYPE_PUBLISH_REQUEST, contentRef, propertyName);
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
    pdeBridge.send(MESSAGE_TYPE_OPEN_NAVIGATION_MANAGER);
  };

  createPageFromTemplate = () => {
    pdeBridge.send(MESSAGE_TYPE_CREATE_PAGE_FROM_TEMPLATE);
  };

  rollbackContent = (contentRef: string) => {
    this.triggerContentAction(MESSAGE_TYPE_ROLLBACK_REQUEST, contentRef);
  };

  triggerContentAction = (messageType: string, contentRef: string, propertyName: string | null = null) => {
    if (contentRef) {
      pdeBridge.send(messageType, { contentRef, propertyName });
    }
  };

}

export default PDEActionManager;
