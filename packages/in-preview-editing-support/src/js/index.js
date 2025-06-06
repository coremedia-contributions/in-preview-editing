import {
  activateInPageEditing,
  deactivateInPageEditing,
} from "./editing";
import { initElementHighlightMarkers } from "./highlighting";
import { initEditMenu } from "./edit-menu";
import { dispatchMessage } from "./messaging";

export function init() {
  if (!window.PDE_IN_PREVIEW_EDITING_INITIALIZED) {
    if (window.parent && window.parent !== window) {
      // Enable post-message handling
      window.addEventListener("message", dispatchMessage);
    }

    // attach PDE edit menu
    initEditMenu();

    // attach markers for highlighting
    initElementHighlightMarkers();

    window.PDE_IN_PREVIEW_EDITING_INITIALIZED = true;
    console.log("[PDE] In-Preview-Editing initialized.");
  }
}

function ready(callback) {
  if (document.readyState !== "loading") {
    callback();
  } else {
    document.addEventListener("DOMContentLoaded", callback);
  }
}

window.PDE_IN_PREVIEW_EDITING_INITIALIZED = false;

window.com = window.com || {};
window.com.coremedia = window.com.coremedia || {};
window.com.coremedia.pde = window.com.coremedia.pde || {};
window.com.coremedia.pde.init = init;
window.com.coremedia.pde.activateInPageEditing = activateInPageEditing;
window.com.coremedia.pde.deactivateInPageEditing = deactivateInPageEditing;

ready(init);
