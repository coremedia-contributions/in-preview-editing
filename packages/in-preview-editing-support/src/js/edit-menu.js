import '../css/fonts.css';
import '../css/edit-menu.css';

import { hideElementHighlightMarkers, highlightElement } from "./highlighting";
import {
  findClosestMetadataElement,
  isMarkedAsEditable,
  findContentId,
  findPropertyName,
  getScrollPosition, getCurrentValue, getPropertyNameFromMetadata, getPreviousValue, fadeOut, fadeIn
} from "./utils";
import {
  sendMessageToParent,
  MESSAGE_TYPE_CONTENT_METADATA_REQUEST,
  MESSAGE_TYPE_PUBLISH_REQUEST,
  MESSAGE_TYPE_PROPERTY_UPDATE_REQUEST, MESSAGE_TYPE_OPEN_CONTENT, MESSAGE_TYPE_SHOW_EDITOR
} from "./messaging";

const HIDE_AFTER_IDLE = 0; // hide edit menu after 5 seconds of inactivity, set to 0 to disable

export let editMenu;
export let menuElement = null;

let currentMetadata = null;
let idleTimeout;
let inlineEditingActive = false;

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
  contentNameLabel.innerHTML = "Loading ...";
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
  editAction.innerHTML = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 16 16" xml:space="preserve"><g><rect x="1.43" y="5.38" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -2.8137 8.2071)" fill="#fff" width="14.14" height="4.24"/><polygon fill="#fff" points="1,15 4,15 1,12 \t"/></g></svg> Edit`;
  editAction.classList.add("pde-action", "pde-action--edit");
  actions.appendChild(editAction);


  // add edit inline action
  const editInlineAction = document.createElement("button");
  editInlineAction.innerHTML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 1C6.22386 1 6 1.22386 6 1.5C6 1.77614 6.22386 2 6.5 2C7.12671 2 7.45718 2.20028 7.65563 2.47812C7.8781 2.78957 8 3.28837 8 4V11C8 11.7116 7.8781 12.2104 7.65563 12.5219C7.45718 12.7997 7.12671 13 6.5 13C6.22386 13 6 13.2239 6 13.5C6 13.7761 6.22386 14 6.5 14C7.37329 14 8.04282 13.7003 8.46937 13.1031C8.47976 13.0886 8.48997 13.0739 8.5 13.0591C8.51003 13.0739 8.52024 13.0886 8.53063 13.1031C8.95718 13.7003 9.62671 14 10.5 14C10.7761 14 11 13.7761 11 13.5C11 13.2239 10.7761 13 10.5 13C9.87329 13 9.54282 12.7997 9.34437 12.5219C9.1219 12.2104 9 11.7116 9 11V4C9 3.28837 9.1219 2.78957 9.34437 2.47812C9.54282 2.20028 9.87329 2 10.5 2C10.7761 2 11 1.77614 11 1.5C11 1.22386 10.7761 1 10.5 1C9.62671 1 8.95718 1.29972 8.53063 1.89688C8.52024 1.91143 8.51003 1.92611 8.5 1.9409C8.48997 1.92611 8.47976 1.91143 8.46937 1.89688C8.04282 1.29972 7.37329 1 6.5 1ZM14 5H11V4H14C14.5523 4 15 4.44772 15 5V10C15 10.5523 14.5523 11 14 11H11V10H14V5ZM6 4V5H1L1 10H6V11H1C0.447715 11 0 10.5523 0 10V5C0 4.44772 0.447715 4 1 4H6Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg> Edit`;
  editInlineAction.classList.add("pde-action", "pde-action--edit-inline");
  editInlineAction.style.display = "none";
  actions.appendChild(editInlineAction);

  // publish button
  const publishAction = document.createElement("button");
  publishAction.style.display = "none";
  publishAction.innerHTML = "Publish";
  publishAction.classList.add("pde-action", "pde-action--publish");
  actions.appendChild(publishAction);

  // add save action
  const saveAction = document.createElement("button");
  // saveAction.innerHTML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg> Save`;
  saveAction.innerHTML = "Save";
  saveAction.classList.add("pde-action", "pde-action--save");
  actions.appendChild(saveAction);

  // add cancel action
  const cancelAction = document.createElement("button");
  // cancelAction.innerHTML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg> Cancel`;
  cancelAction.innerHTML = "Cancel";
  cancelAction.classList.add("pde-action", "pde-action--cancel");
  cancelAction.onclick = (event) => {
    event.preventDefault();
    endEditing(element, false);
  };
  actions.appendChild(cancelAction);

  // initialize idle timer to close edit menu after a while
  initIdleTimer();
}

export function updateEditMenu(event) {
  if (inlineEditingActive) {
    return;
  }

  const metadataElement = findClosestMetadataElement(event.target);
  if (metadataElement && isMarkedAsEditable(metadataElement)) {

    if (menuElement !== metadataElement) {
      console.log("[PDE] update edit menu for element: ", metadataElement);
      const propertyName = findPropertyName(metadataElement);
      const contentId = findContentId(metadataElement);

      requestContentMetadata(contentId, propertyName);

      if (propertyName && contentId) {
        const propertyLabel = editMenu.querySelector(".pde-property-label");
        propertyLabel.innerHTML = propertyName;

        const editButton = editMenu.querySelector(".pde-action--edit");
        editButton.onclick = (event) => {
          event.preventDefault();
          startEditing(metadataElement);
        };

        const editInlineButton = editMenu.querySelector(".pde-action--edit-inline");
        editInlineButton.onclick = (event) => {
          event.preventDefault();
          startEditing(metadataElement, true);
        };

        const publishButton = editMenu.querySelector(".pde-action--publish");
        publishButton.innerHTML = "Publish";
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
      }
    }

    updateEditMenuPosition(metadataElement);
    highlightElement(metadataElement);

  } else {
    console.warn("[PDE] cannot update menu for element: ", event.target);
    menuElement = null;
    hideElementHighlightMarkers();
    hideEditMenu(event.target);
  }
}

export function updateEditMenuPosition(element) {
  // update menu position
  const documentBoundingRect = document.body.getBoundingClientRect();
  const editMenuBoundingRect = editMenu.getBoundingClientRect();
  const metadataElementBoundingRect = element.getBoundingClientRect();
  const scrollPosition = getScrollPosition();

  let top = Math.round(metadataElementBoundingRect.top + scrollPosition.scrollTop - editMenuBoundingRect.height);
  let left = Math.round(event.clientX - 20); // subtract 10px for padding

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
  // console.log(`[PDE] Edit menu position: (left: ${left}, top: ${top})`);

  editMenu.style.top = `${top}px`;
  editMenu.style.left = `${left}px`;
}

export function showEditMenu(element) {
  //console.log("Show edit menu for element: ", element);
  if (inlineEditingActive || !editMenu.classList.contains("pde-edit-menu--hidden")) {
    return;
  }

  let metadataElement = findClosestMetadataElement(element);
  if (metadataElement !== menuElement) {
    // do not show edit menu for the wrong element
    console.log("[PDE] No metadata element found. Cannot show edit menu: ", element);
    return;
  }

  if (metadataElement && isMarkedAsEditable(metadataElement)) {
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
    //console.log("[PDE] hide edit menu. trigger: ", element);
    fadeOut(editMenu, "pde-edit-menu");
  }

  hideElementHighlightMarkers();
}

function startEditing(element, inline = false) {
  if (inline) {
    editMenu.classList.add("pde-is-editing");

    editMenu.querySelectorAll(".pde-action--edit, .pde-action--edit-inline, .pde-action--publish").forEach(btn => btn.style.display = "none");
    if (inline) {
      // show save and cancel button for inline-editing
      editMenu.querySelectorAll(".pde-action--save, .pde-action--cancel").forEach(btn => btn.style.display = "inline-flex");
    }

    element.contentEditable = true;
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
  if (contentId && propertyName) {
    requestContentMetadata(contentId, propertyName);
  }
}

function requestContentMetadata(contentRef, propertyName) {
  if (contentRef && propertyName) {
    const messageData = {
      contentRef: contentRef,
      propertyName: propertyName
    };
    sendMessageToParent(MESSAGE_TYPE_CONTENT_METADATA_REQUEST, messageData);
  }
}

function requestContentPublication(contentRef, propertyName) {
  if (contentRef && propertyName) {
    const publishButton = editMenu.querySelector(".pde-action--publish");
    publishButton.disabled = true;
    publishButton.innerHTML = "Publishing ...";

    sendMessageToParent(MESSAGE_TYPE_PUBLISH_REQUEST, { contentRef: contentRef, propertyName: propertyName });
  }
}

export function receivedContentMetadata(message) {
  const metadata = message.body?.metadata;
  if (metadata && metadata.propertyName) {
    // save metadata for later use
    currentMetadata = metadata;

    const openContentHandler = () => {
      if (metadata.contentRef) {
        let messageData = {
          contentRef: metadata.contentRef,
        };
        sendMessageToParent(MESSAGE_TYPE_OPEN_CONTENT, messageData);
      }
    }

    //console.log("Received metadata: ", metadata);
    // Update thumbnail
    if (metadata.contentThumbnail) {
      const thumbnail = editMenu.querySelector(".pde-thumbnail");
      thumbnail.src = metadata.contentThumbnail;
      thumbnail.onclick = openContentHandler;
    }

    // Update content type
    if (metadata.contentTypeLabel) {
      const contentTypeLabel = editMenu.querySelector(".pde-content-type-label");
      contentTypeLabel.innerHTML = metadata.contentTypeLabel;
      contentTypeLabel.onclick = openContentHandler;
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
      editMenu.querySelector(".pde-action--publish").style.display = metadata.status !== "published" ? "inline-flex" : "none";
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
  }
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
  if (!inlineEditingActive) {
    hideEditMenu();
    hideElementHighlightMarkers();
  }
}

function resetIdleTimer() {
  if (HIDE_AFTER_IDLE > 0) {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(onIdle, HIDE_AFTER_IDLE);
  }
}

function initIdleTimer() {
  if (HIDE_AFTER_IDLE <= 0) {
    return; // do not initialize idle timer if HIDE_AFTER_IDLE is set to 0
  }
  // Listen for mouse movement
  window.addEventListener("mousemove", resetIdleTimer);
  resetIdleTimer();
}
