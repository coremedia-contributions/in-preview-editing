import {
  isMarkedAsEditable,
  PDE_METADATA_ATTRIBUTE,
  PDE_EDITING_FLAG, findClosestMetadataElement,
} from "./utils";
import { hideElementHighlightMarkers, initElementHighlightMarkers, highlightElement } from "./highlighting";
import { hideEditMenu, showEditMenu, initEditMenu, triggerEditMenuUpdate, updateEditMenuPosition } from "./edit-menu";
import { setLang } from "./translations";
import { setFeatures } from "./features";
import { PDEEditFAB } from "./fab";
import { pdeEditManager } from "./edit-manager";

const PDE_OBSERVED_ELEMENT_FLAG = "pdeObservedElement";
const HIDE_AFTER_IDLE_SECONDS = 6; // hide edit menu after 6 seconds of inactivity, set to 0 to disable

const MENU_MODE = "fab";

let editFab = null;
let currentMenuTargetEl = null;
let idleTimeout;

/**
 * Activates in-page-editing for all elements marked as editable.
 */
export function activateInPageEditing(lang = "en", features = {}) {
  if (document.body.dataset[PDE_EDITING_FLAG] !== "on") {

    console.log(`[PDE] activate in-page-editing (lang=${lang}) ...`, features);

    // set the lang for translations
    setLang(lang);

    // set feature flags
    setFeatures(features);

    // attach PDE floating action button
    editFab = new PDEEditFAB();

    // attach PDE edit menu
    // initEditMenu();

    // attach markers for highlighting
    initElementHighlightMarkers();

    // make all elements with specific metadata editable
    // console.log("[PDE] make elements editable ...");
    document.querySelectorAll(`[${PDE_METADATA_ATTRIBUTE}]`).forEach(makeElementEditable);

    // observer dom changes
    console.log("[PDE] connecting mutation observer ...");
    getObserver().observe(document.body, OBSERVER_CONFIG);

    document.body.dataset[PDE_EDITING_FLAG] = "on";

    // initialize idle timer to close edit menu after a while
    initIdleTimer();
  }
}

/**
 * Deactivates in-page-editing.
 */
export function deactivateInPageEditing() {
  if (document.body.dataset[PDE_EDITING_FLAG] === "on") {
    hideEditMenu()
    hideElementHighlightMarkers();

    editFab.hide();

    // make elements non-editable
    // console.log("[PDE] make elements not editable ...");
    document.querySelectorAll(`[${PDE_METADATA_ATTRIBUTE}]`).forEach(makeElementNonEditable);

    // disconnect the observer
    console.log("[PDE] disconnecting mutation observer ...");
    getObserver().disconnect();

    document.body.dataset[PDE_EDITING_FLAG] = "off";
  }
}

function makeElementEditable(element) {
  // check if element is marked as editable
  if (!isMarkedAsEditable(element)) {
    return;
  }

  if (element.dataset[PDE_OBSERVED_ELEMENT_FLAG] !== "true") {
    //console.log("[PDE] make element editable: ", element);

    element.dataset[PDE_OBSERVED_ELEMENT_FLAG] = true;

    // element.addEventListener("mouseenter", elementMouseEnterHandler);
    element.addEventListener("mouseover", elementMouseOverHandler);
    element.addEventListener("mousemove", elementMouseMoveHandler);
  }
}

function makeElementNonEditable(element) {
  if (element.dataset[PDE_OBSERVED_ELEMENT_FLAG] === "true") {
    //console.log("[PDE] make element non-editable: ", element);

    element.dataset[PDE_OBSERVED_ELEMENT_FLAG] = false;

    // element.removeEventListener("mouseenter", elementMouseEnterHandler);
    element.removeEventListener("mouseover", elementMouseOverHandler);
    element.removeEventListener("mousemove", elementMouseMoveHandler);
  }
}


// --- mouse event handlers ---

function elementMouseEnterHandler(event) {
  //console.log("[PDE] element mouse enter:", event.target);
  if (document.body.dataset[PDE_EDITING_FLAG] === "off") {
    return;
  }

  event.stopPropagation();
  triggerEditMenuUpdate(event);
}

function elementMouseOverHandler(event) {
  //console.log("[PDE] element mouse over:", event.target);
  if (document.body.dataset[PDE_EDITING_FLAG] === "off") {
    return;
  }

  event.stopPropagation();

  currentMenuTargetEl = null;
  const metadataElement = findClosestMetadataElement(event.target);
  if (isMarkedAsEditable(metadataElement)) {
    currentMenuTargetEl = metadataElement;
  }

  if (currentMenuTargetEl) {

    switch (MENU_MODE) {
      case "fab":
        editFab.setMetadataNode(currentMenuTargetEl);
        editFab.updateEditFABPosition(currentMenuTargetEl);
        isMarkedAsEditable(event.target) ? editFab.show() : editFab.hide();
        break;

      default:
        triggerEditMenuUpdate(event);
        showEditMenu(currentMenuTargetEl);
    }

  } else {
    hideEditMenu(event.target);
    hideElementHighlightMarkers();
  }
}

function elementMouseMoveHandler(event) {
  //console.log("[PDE] element mouse move:", event.target);
  if (document.body.dataset[PDE_EDITING_FLAG] === "off") {
    return;
  }

  event.stopPropagation();
  if (currentMenuTargetEl) {

    switch (MENU_MODE) {
      case "fab":
        editFab.updateEditFABPosition(event.target);
        isMarkedAsEditable(event.target) ? editFab.show() : editFab.hide();
        break;

      default:
        updateEditMenuPosition(currentMenuTargetEl);
    }

    highlightElement(event.target);

  } else {
    hideEditMenu(event.target);
    hideElementHighlightMarkers();
  }
}


// --- mutation observer ---

// observer config
const OBSERVER_CONFIG = {
  childList: true,       // observe added/removed nodes
  subtree: true          // observe all child nodes
};

// observer instance
let observer = null;

function getObserver() {
  if (observer) {
    return observer;
  }

  return new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        // check if added nodes have the PDE_EDITABLE_ATTRIBUTE
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.dataset[PDE_METADATA_ATTRIBUTE]) {
            makeElementEditable(node);
          }

          // Also check children of the added node (if any)
          if (node.querySelectorAll) {
            document.querySelectorAll(`[${PDE_METADATA_ATTRIBUTE}]`).forEach(makeElementEditable);
          }
        });
      }
    }
  });
}

// --- idle detection ---
function initIdleTimer() {
  if (HIDE_AFTER_IDLE_SECONDS <= 0) {
    return; // do not initialize idle timer if HIDE_AFTER_IDLE_SECONDS is set to 0
  }
  // Listen for mouse movement
  window.addEventListener("mousemove", resetIdleTimer);
  resetIdleTimer();
}

function onIdle() {
  //console.log("[PDE] Idle timeout reached. Hiding edit menu.");
  if (pdeEditManager.isInlineEditingActive()) {
    // do not hide the menu when in inline-editing
    return;
  }

  hideEditMenu();
  hideElementHighlightMarkers();
  editFab.hide();
}

function resetIdleTimer() {
  if (HIDE_AFTER_IDLE_SECONDS > 0) {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(onIdle, HIDE_AFTER_IDLE_SECONDS * 1000);
  }
}
