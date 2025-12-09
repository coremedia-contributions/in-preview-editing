import '../css/fonts.css';
import '../css/edit-menu.css';

import { hideElementHighlightMarkers, highlightElement } from "./highlighting";
import {
  findClosestMetadataElement,
  isMarkedAsEditable,
  findContentId,
  findPropertyName,
  getScrollPosition, getCurrentValue, getPropertyNameFromMetadata, getPreviousValue, fadeOut, fadeIn, isNavNode,
  findPlacementItemElement, isTooCloseToBottom, getParentNodesWithMetadata, getContentIdBreadcrumb,
  getBreadcrumbMetadataNotes, findNodeWithContentRefInBreadcrumb, breadcrumbContainsNode
} from "./utils";
import {
  sendMessageToParent,
  MESSAGE_TYPE_CONTENT_METADATA_REQUEST,
  MESSAGE_TYPE_CONTENT_METRICS_REQUEST,
  MESSAGE_TYPE_PUBLISH_REQUEST,
  MESSAGE_TYPE_PROPERTY_UPDATE_REQUEST,
  MESSAGE_TYPE_OPEN_CONTENT,
  MESSAGE_TYPE_SHOW_EDITOR,
  MESSAGE_TYPE_SHOW_IN_LIBRARY,
  MESSAGE_TYPE_OPEN_NAVIGATION_MANAGER,
  MESSAGE_TYPE_CREATE_PAGE_FROM_TEMPLATE,
  MESSAGE_TYPE_START_LOCALIZATION,
  MESSAGE_TYPE_START_PUBLICATION,
  MESSAGE_TYPE_ROLLBACK_REQUEST
} from "./messaging";
import { t } from "./translations";
import { isFeatureEnabled } from "./features";

const HIDE_AFTER_IDLE_SECONDS = 6; // hide edit menu after 6 seconds of inactivity, set to 0 to disable

export let editMenu;
export let menuElement = null;
export let placementItemElement = null;
let menuElementForBreadcrumb = null;
let isBreadcrumbSelectionActive = false;

let contextMenu;
let breadcrumbMenu;
let currentMetadata = null;
let idleTimeout;
let inlineEditingActive = false;
let preventMouseEvents = false;

export function initEditMenu() {
  editMenu = document.createElement("div");
  editMenu.classList.add("pde-edit-menu", "pde-edit-menu--hidden");
  window.document.body.appendChild(editMenu);

  // thumbnail
  const thumbnailPlaceholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
  const thumbnail = document.createElement("img");
  thumbnail.classList.add("pde-thumbnail");
  thumbnail.src = thumbnailPlaceholderImage;
  thumbnail.onerror = (event) => {
    event.target.src = thumbnailPlaceholderImage;
  };
  editMenu.appendChild(thumbnail);

  // Content fields
  const contentInfo = document.createElement("div");
  contentInfo.classList.add("pde-content-info");
  editMenu.appendChild(contentInfo);

  // Actions
  const actions = document.createElement("div");
  actions.classList.add("pde-actions");
  editMenu.appendChild(actions);

  // Content type label
  const contentTypeLabel = document.createElement("div");
  contentTypeLabel.classList.add("pde-content-type-label");
  contentTypeLabel.innerHTML = "";
  contentInfo.appendChild(contentTypeLabel);

  // Content name label
  const contentNameLabel = document.createElement("div");
  contentNameLabel.classList.add("pde-content-name-label");
  contentNameLabel.innerHTML = t("loading");
  contentInfo.appendChild(contentNameLabel);

  // status label
  const statusLabel = document.createElement("div");
  statusLabel.classList.add("pde-status-label");
  statusLabel.innerHTML = "";
  contentInfo.appendChild(statusLabel);

  // property label
  const propertyLabel = document.createElement("div");
  propertyLabel.classList.add("pde-property-label");
  propertyLabel.innerHTML = ``;
  actions.appendChild(propertyLabel);

  // add edit in floating editor action
  const editAction = document.createElement("button");
  // editAction.innerHTML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 1C6.22386 1 6 1.22386 6 1.5C6 1.77614 6.22386 2 6.5 2C7.12671 2 7.45718 2.20028 7.65563 2.47812C7.8781 2.78957 8 3.28837 8 4V11C8 11.7116 7.8781 12.2104 7.65563 12.5219C7.45718 12.7997 7.12671 13 6.5 13C6.22386 13 6 13.2239 6 13.5C6 13.7761 6.22386 14 6.5 14C7.37329 14 8.04282 13.7003 8.46937 13.1031C8.47976 13.0886 8.48997 13.0739 8.5 13.0591C8.51003 13.0739 8.52024 13.0886 8.53063 13.1031C8.95718 13.7003 9.62671 14 10.5 14C10.7761 14 11 13.7761 11 13.5C11 13.2239 10.7761 13 10.5 13C9.87329 13 9.54282 12.7997 9.34437 12.5219C9.1219 12.2104 9 11.7116 9 11V4C9 3.28837 9.1219 2.78957 9.34437 2.47812C9.54282 2.20028 9.87329 2 10.5 2C10.7761 2 11 1.77614 11 1.5C11 1.22386 10.7761 1 10.5 1C9.62671 1 8.95718 1.29972 8.53063 1.89688C8.52024 1.91143 8.51003 1.92611 8.5 1.9409C8.48997 1.92611 8.47976 1.91143 8.46937 1.89688C8.04282 1.29972 7.37329 1 6.5 1ZM14 5H11V4H14C14.5523 4 15 4.44772 15 5V10C15 10.5523 14.5523 11 14 11H11V10H14V5ZM6 4V5H1L1 10H6V11H1C0.447715 11 0 10.5523 0 10V5C0 4.44772 0.447715 4 1 4H6Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg> Edit`;
  editAction.innerHTML = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 16 16" xml:space="preserve"><g><rect x="1.43" y="5.38" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -2.8137 8.2071)" fill="#fff" width="14.14" height="4.24"/><polygon fill="#fff" points="1,15 4,15 1,12 \t"/></g></svg> ${t("edit")}`;
  editAction.classList.add("pde-action", "pde-action--edit");
  actions.appendChild(editAction);


  // add edit inline action
  const editInlineAction = document.createElement("button");
  editInlineAction.innerHTML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 1C6.22386 1 6 1.22386 6 1.5C6 1.77614 6.22386 2 6.5 2C7.12671 2 7.45718 2.20028 7.65563 2.47812C7.8781 2.78957 8 3.28837 8 4V11C8 11.7116 7.8781 12.2104 7.65563 12.5219C7.45718 12.7997 7.12671 13 6.5 13C6.22386 13 6 13.2239 6 13.5C6 13.7761 6.22386 14 6.5 14C7.37329 14 8.04282 13.7003 8.46937 13.1031C8.47976 13.0886 8.48997 13.0739 8.5 13.0591C8.51003 13.0739 8.52024 13.0886 8.53063 13.1031C8.95718 13.7003 9.62671 14 10.5 14C10.7761 14 11 13.7761 11 13.5C11 13.2239 10.7761 13 10.5 13C9.87329 13 9.54282 12.7997 9.34437 12.5219C9.1219 12.2104 9 11.7116 9 11V4C9 3.28837 9.1219 2.78957 9.34437 2.47812C9.54282 2.20028 9.87329 2 10.5 2C10.7761 2 11 1.77614 11 1.5C11 1.22386 10.7761 1 10.5 1C9.62671 1 8.95718 1.29972 8.53063 1.89688C8.52024 1.91143 8.51003 1.92611 8.5 1.9409C8.48997 1.92611 8.47976 1.91143 8.46937 1.89688C8.04282 1.29972 7.37329 1 6.5 1ZM14 5H11V4H14C14.5523 4 15 4.44772 15 5V10C15 10.5523 14.5523 11 14 11H11V10H14V5ZM6 4V5H1L1 10H6V11H1C0.447715 11 0 10.5523 0 10V5C0 4.44772 0.447715 4 1 4H6Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg> ${t("edit_inline")}`;
  editInlineAction.classList.add("pde-action", "pde-action--edit-inline");
  editInlineAction.style.display = "none";
  actions.appendChild(editInlineAction);

  // publish button
  const publishAction = document.createElement("button");
  publishAction.style.display = "none";
  publishAction.innerHTML = t("publish");
  publishAction.classList.add("pde-action", "pde-action--publish");
  actions.appendChild(publishAction);

  // add save action
  const saveAction = document.createElement("button");
  // saveAction.innerHTML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg> Save`;
  saveAction.innerHTML = t("save");
  saveAction.classList.add("pde-action", "pde-action--save");
  actions.appendChild(saveAction);

  // add cancel action
  const cancelAction = document.createElement("button");
  // cancelAction.innerHTML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg> Cancel`;
  cancelAction.innerHTML = t("cancel");
  cancelAction.classList.add("pde-action", "pde-action--cancel");
  cancelAction.onclick = (event) => {
    event.preventDefault();
    endEditing(menuElement, false);
  };
  actions.appendChild(cancelAction);

  initBreadcrumbMenu();

  // add additional actions menu
  initContextMenu();

  // initialize idle timer to close edit menu after a while
  initIdleTimer();
}

export function triggerEditMenuUpdate(event) {
  if (preventMouseEvents) {
    return;
  }

  const metadataElement = findClosestMetadataElement(event.target);
  // console.log("[PDE] Trigger edit menu update for event: ", event, metadataElement);

  let allowUpdate = true;
  if (isBreadcrumbSelectionActive) {
    allowUpdate = !menuElementForBreadcrumb.contains(event.target);
    isBreadcrumbSelectionActive = false;
    menuElementForBreadcrumb = null;
  }

  if (metadataElement && allowUpdate) {
    updateEditMenu(metadataElement);
  }
}

export function updateEditMenu(element) {
  if (inlineEditingActive) {
    return;
  }

  // hide breadcrumb menu
  hideBreadcrumbMenu();

  // hide context menu
  hideContextMenu();

  const metadataElement = findClosestMetadataElement(element);
  if (isMarkedAsEditable(metadataElement)) {

    if (menuElement !== metadataElement) {
      //console.log("[PDE] update edit menu for element: ", metadataElement);
      const propertyName = findPropertyName(metadataElement);
      const contentId = findContentId(metadataElement);
      const breadcrumbIds = getContentIdBreadcrumb(menuElementForBreadcrumb || metadataElement);
      placementItemElement = null;
      requestContentMetadata(contentId, propertyName, breadcrumbIds);

      if (propertyName && contentId) {
        const propertyLabel = editMenu.querySelector(".pde-property-label");
        propertyLabel.innerHTML = propertyName;

        const editButton = editMenu.querySelector(".pde-action--edit");
        const editInlineButton = editMenu.querySelector(".pde-action--edit-inline");

        if (isMarkedAsEditable(metadataElement)) {
        editButton.onclick = (event) => {
          event.preventDefault();
          startEditing(metadataElement);
        };

        editInlineButton.onclick = (event) => {
          event.preventDefault();
          startEditing(metadataElement, true);
        };

          editButton.disabled = false;
          editInlineButton.disabled = false;
        } else {
          editButton.disabled = true;
          editInlineButton.disabled = true;
        }

        const publishButton = editMenu.querySelector(".pde-action--publish");
        publishButton.innerHTML = t("publish");
        publishButton.onclick = (event) => {
          event.preventDefault();
          requestContentPublication(contentId, propertyName);
        };

        const saveButton = editMenu.querySelector(".pde-action--save");
        saveButton.onclick = (event) => {
          event.preventDefault();
          endEditing(metadataElement, true);
        };

        const cancelButton = editMenu.querySelector(".pde-action--cancel");
        cancelButton.onclick = (event) => {
          event.preventDefault();
          endEditing(metadataElement, false);
        };

        menuElement = metadataElement;
        placementItemElement = findPlacementItemElement(metadataElement);
      }
    }

    updateEditMenuPosition(metadataElement);
    highlightElement(metadataElement);

  } else {
    console.warn("[PDE] cannot update menu for element: ", metadataElement);
    // menuElement = null;
    // hideElementHighlightMarkers();
    // hideEditMenu(event.target);
  }
}

export function updateEditMenuPosition(element) {
  // update menu position
  const documentBoundingRect = document.body.getBoundingClientRect();
  const editMenuBoundingRect = editMenu.getBoundingClientRect();
  const metadataElementBoundingRect = element.getBoundingClientRect();
  const scrollPosition = getScrollPosition();

  let top = Math.round(metadataElementBoundingRect.top + scrollPosition.scrollTop - editMenuBoundingRect.height);
  // let left = Math.round(event.clientX - 20); // subtract 10px for padding
  let left = Math.round(metadataElementBoundingRect.left); // subtract 10px for padding

  if (left < 0) {
    left = 0;
  } else if (left + editMenuBoundingRect.width > documentBoundingRect.width) {
    left = documentBoundingRect.width - editMenuBoundingRect.width - 10; // subtract 10px for padding
  }

  if (top < scrollPosition.scrollTop) {
    top = Math.round(scrollPosition.scrollTop) + 10; // add 10px for padding
  }

  // console.log("[PDE] Document bounding rect: ", documentBoundingRect);
  // console.log("[PDE] Metadata element bounding rect: ", metadataElementBoundingRect);
  // console.log("[PDE] Edit menu bounding rect: ", editMenuBoundingRect);
  // console.log("[PDE] Scroll position: ", scrollPosition);

  if (editMenuBoundingRect.height > top) {
    // Detected edit menu close to top of viewport, adjusting position
    top = Math.round(metadataElementBoundingRect.bottom + scrollPosition.scrollTop);
    editMenu.classList.add("pde-edit-menu--below");
  } else {
    editMenu.classList.remove("pde-edit-menu--below");
  }

  // console.log("[PDE] Edit menu visible: ", editMenu.classList);
  //console.log(`[PDE] Edit menu position: (left: ${left}, top: ${top})`);

  editMenu.style.top = `${top}px`;
  editMenu.style.left = `${left}px`;
}

export function showEditMenu(element) {
  //console.log("[PDE] Show edit menu for element: ", element);
  if (inlineEditingActive || !editMenu.classList.contains("pde-edit-menu--hidden")) {
    return;
  }

  let metadataElement = findClosestMetadataElement(element);
  if (!metadataElement) {
    console.log("[PDE] No metadata element found. Cannot show edit menu: ", element);
    return;
  }

  if (isMarkedAsEditable(metadataElement)) {
    const contentRef = findContentId(metadataElement);
    const propertyName = findPropertyName(metadataElement);
    if (contentRef && propertyName) {
      fadeIn(editMenu, "pde-edit-menu");
    } else {
      console.warn(`[PDE] cannot show menu for element due to missing metadata. (contentRef=${contentRef}, propertyName=${propertyName})`);
      hideElementHighlightMarkers();
    }
  } else {
    console.debug("[PDE] cannot show menu for element since it is not marked as editable: ", element);
    hideElementHighlightMarkers();
  }
}

export function hideEditMenu(element) {
  if (editMenu) {
    if (editMenu.classList.contains("pde-edit-menu--hidden")) {
      return;
    }

    // hide other menus as well
    hideBreadcrumbMenu();
    hideContextMenu();

    //console.log("[PDE] hide edit menu. trigger: ", element);
    fadeOut(editMenu, "pde-edit-menu");
  }
}

function manageEditKeyinput(element, event) {
  //console.log("[PDE] key entered: " + event.key);
 event.stopPropagation();

  // Prevent Enter from inserting anything
  if (event.key === "Enter") {
    event.preventDefault();
  }
}

function startEditing(element, inline = false) {
  if (inline) {
    editMenu.classList.add("pde-is-editing");

    editMenu.querySelectorAll(".pde-action--edit, .pde-action--edit-inline, .pde-action--publish").forEach(btn => btn.style.display = "none");
    if (inline) {
      // show save and cancel button for inline-editing
      editMenu.querySelectorAll(".pde-action--save, .pde-action--cancel").forEach(btn => btn.style.display = "inline-flex");
    }

    element.contentEditable = "plaintext-only";

    element.classList.add("pde-edit-input");
    element.addEventListener('keydown', manageEditKeyinput.bind(null, element));

    // save value for restore in case edit is canceled
    element.dataset.pbePrevValue = getCurrentValue(element);
    element.focus();

    inlineEditingActive = true;
  } else {
    requestFloatingEditor(element);
  }
}

function endEditing(element, save = false) {
  editMenu.classList.remove("pde-is-editing");
  editMenu.querySelectorAll(".pde-action--save, .pde-action--cancel").forEach(btn => btn.style.display = "none");

  if (inlineEditingActive) {
    editMenu.querySelector(".pde-action--edit-inline").style.display = "inline-flex";
  } else {
    editMenu.querySelector(".pde-action--edit").style.display = "inline-flex";
  }

  if (currentMetadata) {
    editMenu.querySelector(".pde-action--publish").style.display = currentMetadata.status === "published" ? "none" : "inline-flex";
  }

  element.contentEditable = false;
  element.classList.remove("pde-edit-input");
  element.removeEventListener("keydown", manageEditKeyinput.bind(null, element));

  inlineEditingActive = false;

  if (save) {
    let updatedValue = element.childNodes[0]?.nodeValue;

    // calculate property name
    const propertyName = getPropertyNameFromMetadata(element);

    // calculate content id
    const contentId = findContentId(element);
    postPropertyUpdate(contentId, propertyName, updatedValue);
  } else {
    // edit canceled, restore previous value
    const previousValue = getPreviousValue(element);
    element.childNodes[0].nodeValue = previousValue;
  }

  const contentId = findContentId(element);
  const propertyName = findPropertyName(element);
  const breadcrumbIds = getContentIdBreadcrumb(element);
  if (contentId && propertyName) {
    requestContentMetadata(contentId, propertyName, breadcrumbIds);
  }
}

function requestContentMetadata(contentRef, propertyName, breadcrumbIds) {
  if (contentRef && propertyName) {
    const messageData = {
      contentRef: contentRef,
      propertyName: propertyName,
      breadcrumbIds: breadcrumbIds,
    };
    sendMessageToParent(MESSAGE_TYPE_CONTENT_METADATA_REQUEST, messageData);
  }
}

function requestContentMetrics(contentRef) {
  if (contentRef) {

    const separator = contextMenu.querySelector("#pde-context-menu-separator-5");
    separator.classList.remove("pde-context-menu-separator--hidden");

    const metricsSectionLabel = contextMenu.querySelector("#pde-context-menu-metrics-section-label");
    metricsSectionLabel.classList.remove("pde-context-menu-label--hidden");

    const metricsInfoLabel = contextMenu.querySelector("#pde-context-menu-metrics-info");
    metricsInfoLabel.classList.remove("pde-context-menu-label--hidden");
    metricsInfoLabel.innerHTML = "loading ...";

    const messageData = {
      contentRef: contentRef
    };
    sendMessageToParent(MESSAGE_TYPE_CONTENT_METRICS_REQUEST, messageData);
  }
}

function requestContentPublication(contentRef, propertyName) {
  if (contentRef && propertyName) {
    const publishButton = editMenu.querySelector(".pde-action--publish");
    publishButton.disabled = true;
    publishButton.innerHTML = t("publishing");

    sendMessageToParent(MESSAGE_TYPE_PUBLISH_REQUEST, { contentRef: contentRef, propertyName: propertyName });
  }
}

function requestContentRollback(contentRef, propertyName) {
  if (contentRef && propertyName) {
    const rollbackButton = editMenu.querySelector(".pde-action--rollback");
    rollbackButton.disabled = true;
    rollbackButton.innerHTML = t("rolling back");

    sendMessageToParent(MESSAGE_TYPE_ROLLBACK_REQUEST, { contentRef: contentRef });
  }
}

export function receivedContentMetadata(message) {
  const metadata = message.body?.metadata;
  if (metadata && metadata.propertyName) {
    // save metadata for later use
    currentMetadata = metadata;

    const openContentHandler = () => {
      hideContextMenu();
      if (metadata.contentRef) {
        let messageData = {
          contentRef: metadata.contentRef,
        };
        sendMessageToParent(MESSAGE_TYPE_OPEN_CONTENT, messageData);
      }
    }

    const showInLibraryHandler = () => {
      hideContextMenu();
      if (metadata.contentRef) {
        let messageData = {
          contentRef: metadata.contentRef,
        };
        sendMessageToParent(MESSAGE_TYPE_SHOW_IN_LIBRARY, messageData);
      }
    }

    const openNavigationManagerHandler = () => {
      hideContextMenu();
      sendMessageToParent(MESSAGE_TYPE_OPEN_NAVIGATION_MANAGER, {});
    }

    const createPageFromTemplateHandler = () => {
      hideContextMenu();
      sendMessageToParent(MESSAGE_TYPE_CREATE_PAGE_FROM_TEMPLATE, {});
    }

    const startLocalizationWorkflowHandler = () => {
      hideContextMenu();
      if (metadata.contentRef) {
        let messageData = {
          contentRef: metadata.contentRef,
        };
        sendMessageToParent(MESSAGE_TYPE_START_LOCALIZATION, messageData);
      }
    }

    const startPublicationWorkflowHandler = () => {
      hideContextMenu();
      if (metadata.contentRef) {
        let messageData = {
          contentRef: metadata.contentRef,
        };
        sendMessageToParent(MESSAGE_TYPE_START_PUBLICATION, messageData);
      }
    }

    const rollbackHandler = () => {
      hideContextMenu();
      if (metadata.contentRef) {
        let messageData = {
          contentRef: metadata.contentRef,
        };
        sendMessageToParent(MESSAGE_TYPE_ROLLBACK_REQUEST, messageData);
      }
    }

    const contentTypeLabel = editMenu.querySelector(".pde-content-type-label");
    const propertyLabel = editMenu.querySelector(".pde-property-label");

    //console.log("Received metadata: ", metadata);
    // Update thumbnail
    if (metadata.contentThumbnail) {
      const thumbnail = editMenu.querySelector(".pde-thumbnail");
      thumbnail.src = metadata.contentThumbnail;
      thumbnail.onclick = openContentHandler;
    }

    // Update content type
    if (metadata.contentTypeLabel) {
      contentTypeLabel.innerHTML = metadata.contentTypeLabel;
      contentTypeLabel.classList.remove("pde-breadcrumb-selector");
      contentTypeLabel.onclick = () => {};
    }

    // Update breadcrumb
    if (!isBreadcrumbSelectionActive) {
      breadcrumbMenu.innerHTML = "";
      let breadcrumb = metadata.breadcrumb;
      if (breadcrumb && breadcrumb.length > 2) {
        contentTypeLabel.classList.add("pde-breadcrumb-selector");

        // add breadcrumb items (skip root) in reverse order.
        breadcrumb.slice(1).reverse().forEach((entry, index) => {
          const opacity = Math.round(100 - (100 / breadcrumb.slice(1).length) * index);
          const liEl = document.createElement("li");
          liEl.classList.add("pde-context-menu-action");
          liEl.innerHTML = `${entry.contentTypeLabel} - ${entry.contentName}`;
          liEl.style.setProperty("--breadcrumb-opacity", `${opacity}%`);
          liEl.addEventListener('mouseenter', (event) => {
            // highlight corresponding element in the page
            const breadcrumbMetadataNodes = getBreadcrumbMetadataNotes(menuElement);
            const metadataNode = findNodeWithContentRefInBreadcrumb(breadcrumbMetadataNodes, entry.contentRef);
            if (metadataNode) {
              highlightElement(metadataNode);
            }
          });
          liEl.addEventListener('click', (event) => {
            event.preventDefault();
            hideBreadcrumbMenu();

            const breadcrumbMetadataNodes = getBreadcrumbMetadataNotes(menuElement);
            const metadataNode = findNodeWithContentRefInBreadcrumb(breadcrumbMetadataNodes, entry.contentRef);
            if (metadataNode) {
              isBreadcrumbSelectionActive = true;
              menuElementForBreadcrumb = menuElement;
              preventMouseEvents = true;
              updateEditMenu(metadataNode);

              setTimeout(() => {
                preventMouseEvents = false;
              }, 5000);
            }
          });
          breadcrumbMenu.appendChild(liEl);
        });
      }


      contentTypeLabel.onclick = (event) => {
        event.preventDefault();
        const eventTarget = event.target;
        toggleBreadcrumbMenu();
        updateBreadcrumbMenuPosition(eventTarget);
      };
    }

    // Update content name
    if (metadata.contentName) {
      let contentNameLabel = editMenu.querySelector(".pde-content-name-label");
      contentNameLabel.innerHTML = metadata.contentName;
      contentNameLabel.onclick = openContentHandler;
    }

    // Update menu labels
    if (metadata.propertyLabel) {
      editMenu.querySelector(".pde-property-label").innerHTML = metadata.propertyLabel;
    }
    if (metadata.status) {
      editMenu.querySelector(".pde-status-label").classList.remove("pde-status-label--in-production", "pde-status-label--approved", "pde-status-label--published");
      editMenu.querySelector(".pde-status-label").classList.add(`pde-status-label--${metadata.status}`);
      editMenu.querySelector(".pde-status-label").innerHTML = `<span>${metadata.status}</span>`

      // show/hide publish button
      const showPublishButton = metadata.status !== "published" && metadata.userMayPerformPublish;
      editMenu.querySelector(".pde-action--publish").style.display = showPublishButton ? "inline-flex" : "none";

      const lifecycleStatusLabel = contextMenu.querySelector("#pde-context-menu-publication-state");
      lifecycleStatusLabel.innerHTML = `${t('lifecycle')} <span class="pde-context-menu-lifecycle-status pde-context-menu-lifecycle-status--${metadata.status}">${metadata.status}</span>`;
    }

    if (metadata.translationStatus) {
      const translationStateLabel = contextMenu.querySelector("#pde-context-menu-translation-state");
      translationStateLabel.innerHTML = `${t('localization')} <span class="pde-context-menu-translation-status pde-context-menu-translation-status--${metadata.translationStatus}">${metadata.translationStatus}</span>`;
    }

    if (metadata.siteLocale) {
      const siteLocaleLabel = contextMenu.querySelector("#pde-context-menu-site-locale-label");
      siteLocaleLabel.innerHTML = `<span>${metadata.siteLocale}</span>`;
    }

    // Update context menu actions
    const contextMenuSeparator1 = contextMenu.querySelector("#pde-context-menu-separator-1");
    const contextMenuSeparator2 = contextMenu.querySelector("#pde-context-menu-separator-2");
    const contextMenuSeparator3 = contextMenu.querySelector("#pde-context-menu-separator-3");

    contextMenu.querySelectorAll(".pde-context-menu-action").forEach(action => {
      // disable all actions before update
      action.setAttribute("data-disabled", "");
      // remove handlers
      action.onclick = null;
    });

    const openInTabAction = contextMenu.querySelector(".pde-context-menu-action--open-in-tab");
    openInTabAction.onclick = openContentHandler;
    openInTabAction.removeAttribute("data-disabled");

    const showInLibraryAction = contextMenu.querySelector(".pde-context-menu-action--show-in-library");
    showInLibraryAction.onclick = showInLibraryHandler;
    showInLibraryAction.removeAttribute("data-disabled");

    // Placement item actions
    const removePlacementItemAction = contextMenu.querySelector(".pde-context-menu-action--remove-placement-item");
    const cutPlacementItemAction = contextMenu.querySelector(".pde-context-menu-action--cut-placement-item");
    const copyPlacementItemAction = contextMenu.querySelector(".pde-context-menu-action--copy-placement-item");
    const pastePlacementItemAction = contextMenu.querySelector(".pde-context-menu-action--paste-placement-item");
    if (placementItemElement) {
      // console.log("Placement item element found: ", placementItemElement);
      contextMenuSeparator1.classList.remove("pde-context-menu-separator--hidden");
      removePlacementItemAction.removeAttribute("data-disabled");
      // cutPlacementItemAction.removeAttribute("data-disabled");
      // copyPlacementItemAction.removeAttribute("data-disabled");
      // pastePlacementItemAction.removeAttribute("data-disabled");
      removePlacementItemAction.classList.remove("pde-context-menu-action--hidden");
      // cutPlacementItemAction.classList.remove("pde-context-menu-action--hidden");
      // copyPlacementItemAction.classList.remove("pde-context-menu-action--hidden");
      // pastePlacementItemAction.classList.remove("pde-context-menu-action--hidden");
    } else {
      contextMenuSeparator1.classList.add("pde-context-menu-separator--hidden");
      removePlacementItemAction.classList.add("pde-context-menu-action--hidden");
      cutPlacementItemAction.classList.add("pde-context-menu-action--hidden");
      copyPlacementItemAction.classList.add("pde-context-menu-action--hidden");
      pastePlacementItemAction.classList.add("pde-context-menu-action--hidden");
    }

    const openNavigationManagerAction = contextMenu.querySelector(".pde-context-menu-action--open-navigation-manager");
    const createPageFromTemplateAction = contextMenu.querySelector(".pde-context-menu-action--create-page-from-template");
    if (isNavNode(menuElement)) {
      contextMenuSeparator2.classList.remove("pde-context-menu-separator--hidden");

      openNavigationManagerAction.onclick = openNavigationManagerHandler;
      openNavigationManagerAction.removeAttribute("data-disabled");
      openNavigationManagerAction.classList.remove("pde-context-menu-action--hidden");

      createPageFromTemplateAction.onclick = createPageFromTemplateHandler;
      createPageFromTemplateAction.removeAttribute("data-disabled");
      createPageFromTemplateAction.classList.remove("pde-context-menu-action--hidden");
    } else {
      contextMenuSeparator2.classList.add("pde-context-menu-separator--hidden");
      openNavigationManagerAction.classList.add("pde-context-menu-action--hidden");
      createPageFromTemplateAction.classList.add("pde-context-menu-action--hidden");
    }

    const startLocalizationAction = contextMenu.querySelector(".pde-context-menu-action--start-localization");
    startLocalizationAction.onclick = startLocalizationWorkflowHandler;
    startLocalizationAction.removeAttribute("data-disabled");

    if (metadata.status) {
      const publishEnabled = metadata.status !== "published" && metadata.userMayPerformPublish;
      if (publishEnabled) {
        const startPublicationAction = contextMenu.querySelector(".pde-context-menu-action--start-publication");
        startPublicationAction.onclick = startPublicationWorkflowHandler;
        startPublicationAction.removeAttribute("data-disabled");

        const rollbackAction = contextMenu.querySelector(".pde-context-menu-action--rollback");
        rollbackAction.onclick = rollbackHandler;
        rollbackAction.removeAttribute("data-disabled");
      }
    }

    // show inline edit or floating editor button
    const editButton = editMenu.querySelector(".pde-action--edit");
    const editInlineButton = editMenu.querySelector(".pde-action--edit-inline");
    if (metadata.propertyType === "STRING") {
      editButton.style.display = "none";
      editInlineButton.style.display = "inline-flex";
    } else {
      editButton.style.display = "inline-flex";
      editInlineButton.style.display = "none";
    }

    // Hide edit buttons and clear property label when breadcrumb selection is active
    if (isBreadcrumbSelectionActive) {
      editButton.style.display = "none";
      editInlineButton.style.display = "none";
      propertyLabel.innerHTML = "";
    }

    }
  }

export function receivedContentMetrics(message) {
  const metricsInfoLabel = contextMenu.querySelector("#pde-context-menu-metrics-info");
  const data = message.body?.metrics;
  if (data && data.metrics) {
    // console.log("Received content metrics: ", data);

    // collect metrics to render
    const metricKeys = ['metric_pages', 'metric_visits', 'metric_visitors_unique', 'exit_rate'];
    let metricsToRender = [];

    for (let key of metricKeys) {
      let metricValue = data.metrics[key]?.value;
      if (metricValue !== undefined) {
        let metricVariation = data.metrics[key].variation;
        if (key === 'exit_rate') {
          metricsToRender.push({
            label: t(key),
            value: Math.round(metricValue * 100) + '%',
            variation: Math.round(metricVariation),
            variationStyle: metricVariation <= 0 ? 'positive' : 'negative'
          });
        } else {
          metricsToRender.push({
            label: t(key),
            value: metricValue,
            variation: (metricVariation >= 0 ? '+' : '') + Math.round(metricVariation),
            variationStyle: metricVariation >= 0 ? 'positive' : 'negative'
          });
        }
      }
    }

    metricsInfoLabel.innerHTML = metricsToRender.map(entry => `
        <div class="pde-context-menu-metric">
          <span class="pde-context-menu-metric-label">${t(entry.label)}</span>
          <span class="pde-context-menu-metric-value">${entry.value}</span>
          <span class="pde-context-menu-metric-variation pde-context-menu-metric-variation--${entry.variationStyle}">${entry.variation}</span>
        </div>`)
      .join('');

  } else {
    metricsInfoLabel.innerHTML = "not available";
  }

  updateContextMenuPosition();
}

function requestFloatingEditor(element) {
  const contentId = findContentId(element);
  const propertyName = findPropertyName(element);
  const elementCoords = element.getBoundingClientRect();

  if (contentId && propertyName && elementCoords) {
    let messageData = {
      contentId: contentId,
      propertyName: propertyName,
      coords: elementCoords
    };
    sendMessageToParent(MESSAGE_TYPE_SHOW_EDITOR, messageData);
  }
}

function postPropertyUpdate(contentId, propertyName, propertyValue) {
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

function onIdle() {
  if (!inlineEditingActive && !isContextMenuVisible()) {
    //console.log("[PDE] Idle timeout reached. Hiding edit menu.");
    hideEditMenu();
    hideElementHighlightMarkers();
  }
}

function resetIdleTimer() {
  if (HIDE_AFTER_IDLE_SECONDS > 0) {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(onIdle, HIDE_AFTER_IDLE_SECONDS * 1000);
  }
}

function initIdleTimer() {
  if (HIDE_AFTER_IDLE_SECONDS <= 0) {
    return; // do not initialize idle timer if HIDE_AFTER_IDLE_SECONDS is set to 0
  }
  // Listen for mouse movement
  window.addEventListener("mousemove", resetIdleTimer);
  resetIdleTimer();
}

// breadcrumb menu
function initBreadcrumbMenu() {
  breadcrumbMenu = document.createElement("ul");
  breadcrumbMenu.innerHTML = "<li>loading...</li>"
  breadcrumbMenu.classList.add("pde-breadcrumb-menu", "pde-breadcrumb-menu--hidden");
  window.document.body.appendChild(breadcrumbMenu)
}

function showBreadcrumbMenu() {
  hideContextMenu();
  breadcrumbMenu.classList.remove("pde-breadcrumb-menu--hidden");
}

function hideBreadcrumbMenu() {
  breadcrumbMenu.classList.add("pde-breadcrumb-menu--hidden");

  // reset highlighting to menu element
  if (menuElement) {
    highlightElement(menuElement);
  }
}

function toggleBreadcrumbMenu() {
  if (isBreadcrumbMenuVisible()) {
    hideBreadcrumbMenu();
  } else {
    showBreadcrumbMenu();
  }
}

function isBreadcrumbMenuVisible() {
  return !breadcrumbMenu.classList.contains("pde-breadcrumb-menu--hidden");
}

function updateBreadcrumbMenuPosition(anchorElement = null) {
  const anchorBoundingRect = anchorElement?.getBoundingClientRect() || editMenu.querySelector(".pde-content-type-label")?.getBoundingClientRect();
  if (anchorBoundingRect) {
    breadcrumbMenu.style.top = `${anchorBoundingRect.bottom + 4}px`; // add 4px for margin
    breadcrumbMenu.style.left = `${anchorBoundingRect.left}px`;
    if (isTooCloseToBottom(breadcrumbMenu)) {
      breadcrumbMenu.style.top = `${anchorBoundingRect.top - breadcrumbMenu.offsetHeight - 4}px`; // add 4px for margin
      breadcrumbMenu.classList.add("pde-context-menu--above");
    } else {
      breadcrumbMenu.classList.remove("pde-context-menu--above");
    }
  }
}

// context menu
function initContextMenu() {
  contextMenu = document.createElement("ul");
  contextMenu.classList.add("pde-context-menu", "pde-context-menu--hidden");
  window.document.body.appendChild(contextMenu)

  const openInTabAction = document.createElement("li");
  openInTabAction.innerHTML = t("open_in_tab");
  openInTabAction.classList.add("pde-context-menu-action", "pde-context-menu-action--open-in-tab");
  contextMenu.appendChild(openInTabAction);

  const showInLibraryAction = document.createElement("li");
  showInLibraryAction.classList.add("pde-context-menu-action", "pde-context-menu-action--show-in-library");
  showInLibraryAction.innerHTML = t("show_in_library");
  contextMenu.appendChild(showInLibraryAction);

  let contextMenuSeparator1 = document.createElement("li");
  contextMenuSeparator1.id = "pde-context-menu-separator-1";
  contextMenuSeparator1.classList.add("pde-context-menu-separator", "pde-context-menu-separator--hidden");
  contextMenu.appendChild(contextMenuSeparator1);

  const removePlacementItemAction = document.createElement("li");
  removePlacementItemAction.classList.add("pde-context-menu-action", "pde-context-menu-action--remove-placement-item", "pde-context-menu-action--hidden");
  removePlacementItemAction.innerHTML = t("remove_placement_item");
  contextMenu.appendChild(removePlacementItemAction);

  const cutPlacementItemAction = document.createElement("li");
  cutPlacementItemAction.classList.add("pde-context-menu-action", "pde-context-menu-action--cut-placement-item", "pde-context-menu-action--hidden");
  cutPlacementItemAction.innerHTML = t("cut_placement_item");
  contextMenu.appendChild(cutPlacementItemAction);

  const copyPlacementItemAction = document.createElement("li");
  copyPlacementItemAction.classList.add("pde-context-menu-action", "pde-context-menu-action--copy-placement-item", "pde-context-menu-action--hidden");
  copyPlacementItemAction.innerHTML = t("copy_placement_item");
  contextMenu.appendChild(copyPlacementItemAction);

  const pastePlacementItemAction = document.createElement("li");
  pastePlacementItemAction.classList.add("pde-context-menu-action", "pde-context-menu-action--paste-placement-item", "pde-context-menu-action--hidden");
  pastePlacementItemAction.innerHTML = t("paste_placement_item");
  contextMenu.appendChild(pastePlacementItemAction);

  let contextMenuSeparator2 = document.createElement("li");
  contextMenuSeparator2.id = "pde-context-menu-separator-2";
  contextMenuSeparator2.classList.add("pde-context-menu-separator")
  contextMenu.appendChild(contextMenuSeparator2);

  // -- Navigation specific actions
  const openNavigationManagerAction = document.createElement("li");
  openNavigationManagerAction.classList.add("pde-context-menu-action", "pde-context-menu-action--open-navigation-manager", "pde-context-menu-action--hidden");
  openNavigationManagerAction.innerHTML = t("open_navigation_manager");
  contextMenu.appendChild(openNavigationManagerAction);

  const createPageFromTemplateAction = document.createElement("li");
  createPageFromTemplateAction.classList.add("pde-context-menu-action", "pde-context-menu-action--create-page-from-template", "pde-context-menu-action--hidden");
  createPageFromTemplateAction.innerHTML = t("create_page_from_template");
  contextMenu.appendChild(createPageFromTemplateAction);

  let contextMenuSeparator3 = document.createElement("li");
  contextMenuSeparator3.classList.add("pde-context-menu-separator")
  contextMenu.appendChild(contextMenuSeparator3);

  // -- Lifecycle entries
  const lifecycleStatusLabel = document.createElement("li");
  lifecycleStatusLabel.id = "pde-context-menu-publication-state";
  lifecycleStatusLabel.classList.add("pde-context-menu-label", "pde-context-menu-label--bold");
  lifecycleStatusLabel.innerHTML = `${t('lifecycle')} <span class="pde-context-menu-lifecycle-status">unknown</span>`;
  contextMenu.appendChild(lifecycleStatusLabel);

  const startPublicationAction = document.createElement("li");
  startPublicationAction.classList.add("pde-context-menu-action", "pde-context-menu-action--start-publication");
  startPublicationAction.innerHTML = t("start_publication_workflow");
  contextMenu.appendChild(startPublicationAction);

  const rollbackAction = document.createElement("li");
  rollbackAction.classList.add("pde-context-menu-action", "pde-context-menu-action--rollback", "pde-context-menu-action--hidden");
  rollbackAction.innerHTML = t("rollback");
  contextMenu.appendChild(rollbackAction);

  let contextMenuSeparator4 = document.createElement("li");
  contextMenuSeparator4.classList.add("pde-context-menu-separator")
  contextMenu.appendChild(contextMenuSeparator4);

  // -- Translation entries
  const translationStateLabel = document.createElement("li");
  translationStateLabel.id = "pde-context-menu-translation-state";
  translationStateLabel.classList.add("pde-context-menu-label", "pde-context-menu-label--bold");
  translationStateLabel.innerHTML = `${t('localization')} <span class="pde-context-menu-translation-status">unkown</span>`;
  contextMenu.appendChild(translationStateLabel);

  const siteLocaleLabel = document.createElement("li");
  siteLocaleLabel.id = "pde-context-menu-site-locale-label";
  siteLocaleLabel.classList.add("pde-context-menu-label");
  siteLocaleLabel.innerHTML = `<span>unkown</span>`;
  contextMenu.appendChild(siteLocaleLabel);

  const startLocalizationAction = document.createElement("li");
  startLocalizationAction.classList.add("pde-context-menu-action", "pde-context-menu-action--start-localization");
  startLocalizationAction.innerHTML = t("start_localization_workflow");
  contextMenu.appendChild(startLocalizationAction);

  // -- Metrics
  const contextMenuSeparator5 = document.createElement("li");
  contextMenuSeparator5.id = "pde-context-menu-separator-5";
  contextMenuSeparator5.classList.add("pde-context-menu-separator", "pde-context-menu-separator--hidden");
  contextMenu.appendChild(contextMenuSeparator5);

  const metricsSectionLabel = document.createElement("li");
  metricsSectionLabel.id = "pde-context-menu-metrics-section-label";
  metricsSectionLabel.classList.add("pde-context-menu-label", "pde-context-menu-label--bold", "pde-context-menu-label--hidden");
  metricsSectionLabel.innerHTML = `${t("metrics")}`;
  contextMenu.appendChild(metricsSectionLabel);

  const metricsInfoLabel = document.createElement("li");
  metricsInfoLabel.id = "pde-context-menu-metrics-info";
  metricsInfoLabel.classList.add("pde-context-menu-label", "pde-context-menu-label--hidden");
  contextMenu.appendChild(metricsInfoLabel);

  // let moveUpAction = document.createElement("li");
  // moveUpAction.classList.add("pde-context-menu-action", "pde-context-menu-action--move-up");
  // moveUpAction.innerHTML = t("move_up");
  // contextMenu.appendChild(moveUpAction);
  //
  // let moveDownAction = document.createElement("li");
  // moveDownAction.classList.add("pde-context-menu-action", "pde-context-menu-action--move-down");
  // moveDownAction.innerHTML = t("move_down");
  // contextMenu.appendChild(moveDownAction);

  const contextMenuAction = document.createElement("button");
  contextMenuAction.innerHTML = "...";
  contextMenuAction.classList.add("pde-action", "pde-action--secondary", "pde-action--menu");
  contextMenuAction.onclick = (event) => {
    event.preventDefault();
    const eventTarget = event.target;
    toggleContextMenu();
    updateContextMenuPosition(eventTarget);
  };

  // disable all actions initially
  contextMenu.querySelectorAll(".pde-context-menu-action").forEach(action => action.setAttribute("data-disabled", ""));

  const actions = editMenu.querySelector(".pde-actions");
  actions.appendChild(contextMenuAction);
}

function showContextMenu() {
  hideBreadcrumbMenu();

  contextMenu.classList.remove("pde-context-menu--hidden");

  // request metrics data
  if (isFeatureEnabled("metrics")) {
    const contentId = findContentId(menuElement);
    contentId && requestContentMetrics(contentId);
  }
}

function hideContextMenu() {
  contextMenu.classList.add("pde-context-menu--hidden");
}

function toggleContextMenu() {
  if (isContextMenuVisible()) {
    hideContextMenu();
  } else {
    showContextMenu();
  }
}

function isContextMenuVisible() {
  return !contextMenu.classList.contains("pde-context-menu--hidden");
}

function updateContextMenuPosition(anchorElement = null) {
  const anchorBoundingRect = anchorElement?.getBoundingClientRect() || editMenu.querySelector(".pde-action--menu")?.getBoundingClientRect();
  if (anchorBoundingRect) {
    contextMenu.style.top = `${anchorBoundingRect.bottom + 4}px`; // add 4px for margin
    contextMenu.style.left = `${anchorBoundingRect.left}px`;
    if (isTooCloseToBottom(contextMenu)) {
      contextMenu.style.top = `${anchorBoundingRect.top - contextMenu.offsetHeight - 4}px`; // add 4px for margin
    }
  }
}
