import { PDE_EDITING_FLAG, getScrollPosition } from "./utils";
import '../css/highlighting.css';
import { menuElement } from "./edit-menu";

let elementHighlightMarkers = null;

export function initElementHighlightMarkers() {
  const markerNames = ["top", "right", "bottom", "left"];

  elementHighlightMarkers = {};
  markerNames.forEach((markerName) => {
    const marker = document.createElement("div");
    marker.classList.add("pde-highlight-marker", `pde-highlight-marker--${markerName}`);
    marker.style.visibility = "hidden";
    window.document.body.appendChild(marker);
    elementHighlightMarkers[markerName] = marker;
  });

  // Listen to resize and update highlights
  window.addEventListener('resize', () => highlightElement(menuElement));
}

export function highlightElement(element) {
  if (!element || document.body.dataset[PDE_EDITING_FLAG] === "off") {
    return;
  }

  //console.log("[PDE] highlight element: ", element);
  const scrollPosition = getScrollPosition();
  let elementBoundingRect = element.getBoundingClientRect();
  if ((elementBoundingRect.width === 0 || elementBoundingRect.height === 0) && element.parentNode) {
    elementBoundingRect = element.parentNode.getBoundingClientRect();
  }

  const markerSize = 2; // marker size in px

  // set marker positions
  let posX = Math.round(elementBoundingRect.left + scrollPosition.scrollLeft);
  let posY = Math.round(elementBoundingRect.top + scrollPosition.scrollTop);
  let width = Math.round(elementBoundingRect.width);
  let height = Math.round(elementBoundingRect.height);

  elementHighlightMarkers["top"].style.top = `${posY}px`;
  elementHighlightMarkers["top"].style.left = `${posX}px`;
  elementHighlightMarkers["top"].style.width = `${width}px`;
  elementHighlightMarkers["top"].style.height = "2px";
  elementHighlightMarkers["top"].style.visibility = "visible";

  elementHighlightMarkers["right"].style.top = `${posY}px`;
  elementHighlightMarkers["right"].style.left = `${posX + width - markerSize}px`;
  elementHighlightMarkers["right"].style.width = "2px";
  elementHighlightMarkers["right"].style.height = `${height}px`;
  elementHighlightMarkers["right"].style.visibility = "visible";

  elementHighlightMarkers["bottom"].style.top = `${posY + height - markerSize}px`;
  elementHighlightMarkers["bottom"].style.left = `${posX}px`;
  elementHighlightMarkers["bottom"].style.width = `${width}px`;
  elementHighlightMarkers["bottom"].style.height = "2px";
  elementHighlightMarkers["bottom"].style.visibility = "visible";

  elementHighlightMarkers["left"].style.top = `${posY}px`;
  elementHighlightMarkers["left"].style.left = `${posX}px`;
  elementHighlightMarkers["left"].style.width = "2px";
  elementHighlightMarkers["left"].style.height = `${height}px`;
  elementHighlightMarkers["left"].style.visibility = "visible";
}


export function hideElementHighlightMarkers() {
  if (elementHighlightMarkers) {
    elementHighlightMarkers["top"].style.visibility = "hidden";
    elementHighlightMarkers["right"].style.visibility = "hidden";
    elementHighlightMarkers["bottom"].style.visibility = "hidden";
    elementHighlightMarkers["left"].style.visibility = "hidden";
  }
}
