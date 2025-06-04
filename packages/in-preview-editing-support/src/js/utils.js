export const PDE_METADATA_ATTRIBUTE = "data-cm-metadata";
export const PDE_EDITING_FLAG = "pdeEditing";

export function isMarkedAsEditable(element) {
  return JSON.parse(element.dataset?.cmMetadata || "[]")
    .find((i) => i.editable === true);
}

export function findClosestMetadataElement(element) {
  if (!element) {
    return null;
  }

  let current = element;
  while (current && !current.hasAttribute(PDE_METADATA_ATTRIBUTE)) {
    current = current.parentElement;
  }
  return current;
}

export function findContentId(startNode) {
  let contentId = getContentIdFromMetadata(startNode);
  if (!contentId) {
    // iterate over all parent nodes and check for metadata containing the content id
    const metadataNodes = getParentNodesWithMetadata(startNode);
    for (const node of metadataNodes) {
      contentId = getContentIdFromMetadata(node);
      if (contentId) {
        break;
      }
    }
  }
  //console.log("[PDE] found content id: ", contentId);
  return contentId;
}

export function getContentIdFromMetadata(element) {
  return JSON.parse(element.dataset?.cmMetadata || "[]")
    .find(i => i._?.$Ref)?._.$Ref;
}

export function findPropertyName(startNode) {
  let propertyName = getPropertyNameFromMetadata(startNode);
  if (!propertyName) {
    // iterate over all parent nodes and check for metadata containing the content id
    const metadataNodes = getParentNodesWithMetadata(startNode);
    for (const node of metadataNodes) {
      propertyName = getPropertyNameFromMetadata(node);
      if (propertyName) {
        break;
      }
    }
  }
  //console.log("[PDE] found property name: ", propertyName);
  return propertyName;
}

export function getPropertyNameFromMetadata(element) {
  return JSON.parse(element.dataset?.cmMetadata || "[]")
    .find((i) => {
      return i && i._ && typeof i._ === "string" && i._.startsWith("properties");
    })
    ?._.replace("properties.", "");
}

function getParentNodesWithMetadata(startElement) {
  const nodes = [];
  let current = startElement.parentElement;

  while (current) {
    if (current.hasAttribute(PDE_METADATA_ATTRIBUTE)) {
      nodes.push(current);
    }
    current = current.parentElement;
  }

  return nodes;
}

/**
 * Get the current scroll position of the document.
 * @returns {{scrollLeft: number, scrollTop: number}}
 */
export function getScrollPosition() {
  return {
    scrollLeft: document.documentElement.scrollLeft,
    scrollTop: document.documentElement.scrollTop,
  };
}

export function getCurrentValue(element) {
  return element.childNodes[0]?.nodeValue;
}

export function getPreviousValue(element) {
  return element.dataset.pbePrevValue;
}

export function fadeOut(el, baseCls, duration = 500) {
  el.classList.add(`${baseCls}--fade`);
  el.style.opacity = 1;

  // Start fade out
  requestAnimationFrame(() => {
    el.style.opacity = 0;
  });

  // Hide element after transition
  setTimeout(() => {
    el.classList.add(`${baseCls}--hidden`);
  }, duration);
}

export function fadeIn(el, baseCls, duration = 500) {
  el.classList.remove(`${baseCls}--hidden`);
  el.classList.add(`${baseCls}--fade`);
  el.style.opacity = 0;

  // Start fade in
  requestAnimationFrame(() => {
    el.style.opacity = 1;
  });

  // Remove fade class after transition
  setTimeout(() => {
    el.classList.remove(`${baseCls}--fade`);
  }, duration);
}
