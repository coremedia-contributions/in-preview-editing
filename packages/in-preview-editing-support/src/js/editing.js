import {
  isMarkedAsEditable,
  PDE_METADATA_ATTRIBUTE,
  PDE_EDITING_FLAG,
} from "./utils";
import { hideElementHighlightMarkers } from "./highlighting";
import { hideEditMenu, showEditMenu, updateEditMenu } from "./edit-menu";
import { setLang } from "./translations";

const PDE_OBSERVED_ELEMENT_FLAG = "pdeObservedElement";

/**
 * Activates in-page-editing for all elements marked as editable.
 */
export function activateInPageEditing(lang = "en") {
  if (document.body.dataset[PDE_EDITING_FLAG] !== "on") {

    // set the lang for translations
    setLang(lang);

    // make all elements with specific metadata editable
    // console.log("[PDE] make elements editable ...");
    document.querySelectorAll(`[${PDE_METADATA_ATTRIBUTE}]`).forEach(makeElementEditable);

    // observer dom changes
    console.log("[PDE] connecting mutation observer ...");
    getObserver().observe(document.body, OBSERVER_CONFIG);

    document.body.dataset[PDE_EDITING_FLAG] = "on";
  }
}

/**
 * Deactivates in-page-editing.
 */
export function deactivateInPageEditing() {
  if (document.body.dataset[PDE_EDITING_FLAG] === "on") {
    hideEditMenu()
    hideElementHighlightMarkers();

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

    //element.addEventListener("mouseenter", elementMouseEnterHandler);
    element.addEventListener("mouseover", elementMouseOverHandler);
  }
}

function makeElementNonEditable(element) {
  if (element.dataset[PDE_OBSERVED_ELEMENT_FLAG] === "true") {
    //console.log("[PDE] make element non-editable: ", element);

    element.dataset[PDE_OBSERVED_ELEMENT_FLAG] = false;

    element.removeEventListener("mouseenter", elementMouseEnterHandler);
    element.removeEventListener("mouseover", elementMouseOverHandler);
  }
}


// --- mouse event handlers ---

function elementMouseEnterHandler(event) {
  //console.log("[PDE] element mouse enter:", event.target);
  if (document.body.dataset[PDE_EDITING_FLAG] === "off") {
    return;
  }
  showEditMenu(event.target);
}

function elementMouseOverHandler(event) {
  //console.log("[PDE] element mouse over:", event.target);
  if (document.body.dataset[PDE_EDITING_FLAG] === "off") {
    return;
  }
  showEditMenu(event.target);
  updateEditMenu(event);
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
