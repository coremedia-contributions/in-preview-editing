export const PDE_METADATA_ATTRIBUTE = "data-cm-metadata";
export const PDE_EDITING_FLAG = "pdeEditing";


/**
 * Checks whether an element is marked as editable.
 * An element is considered editable if its `data-cm-metadata` attribute
 * contains an object with { editable: true }.
 *
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export function isMarkedAsEditable(element) {
  if (!element) return false;

  const meta = element.getAttribute(PDE_METADATA_ATTRIBUTE);
  if (!meta) return false;

  try {
    // Parse JSON from the data attribute
    const parsed = JSON.parse(meta);

    // The metadata is an array; check if any entry has editable: true
    return Array.isArray(parsed) && parsed.some(item => item.editable === true);
  } catch (e) {
    // Invalid JSON → treat as non-editable
    return false;
  }
}

/**
 * Returns the closest ancestor (including the element itself)
 * that has the `data-cm-metadata` attribute.
 *
 * @param {HTMLElement} element
 * @returns {HTMLElement|null}
 */
export function findClosestMetadataElement(element) {
  let current = element;

  while (current) {
    if (current.hasAttribute && current.hasAttribute(PDE_METADATA_ATTRIBUTE)) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
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

export function getContentIdBreadcrumb(startElement) {
  return getParentNodesWithMetadata(startElement)?.map(getContentIdFromMetadata).filter(Boolean).reverse();
}

export function getBreadcrumbMetadataNotes(startElement) {
  return getParentNodesWithMetadata(startElement)?.filter((item) => getContentIdFromMetadata(item)).reverse();
}

export function findNodeWithContentRefInBreadcrumb(breadcrumbElements, contentId) {
  return breadcrumbElements.find((item) => getContentIdFromMetadata(item) === contentId) || null;
}

export function isNavNode(element) {
  let closestNavNode = element.closest("nav") || element.closest("[role=navigation]");
  return closestNavNode !== null;
}

export function findPlacementElement(element) {
  return element.closest('div[data-cm-metadata*="properties.placement-"]');
}

export function findPlacementItemsWrapper(element) {
  return element.closest('div[data-cm-metadata*="properties.items"]');
}

export function findAllPlacementItems(placementItemsWrapper) {
  return getTopLevelMetadataNodes(placementItemsWrapper);
}

export function findPlacementItemElement(element) {
  const placementContainer = findPlacementElement(element);
  if (!placementContainer) {
    return false;
  }

  const placementItemsWrapper = findPlacementItemsWrapper(element);
  const placementItems = findAllPlacementItems(placementItemsWrapper);

  return placementItems.find(node => node.contains(element)) || null;
}

export function isPlacementItem(element) {
  return findPlacementItemElement(element) === element;
}

function getTopLevelMetadataNodes(parent) {
  const result = [];

  function walk(node) {
    const childNodes = node?.children;
    if (childNodes && childNodes.length > 0) {
      for (const child of childNodes) {
        if (child.hasAttribute("data-cm-metadata")) {
          // Found a top-level data node → collect it but don't go deeper
          result.push(child);
        } else {
          // Keep searching inside if no attribute
          walk(child);
        }
      }
    }
  }

  walk(parent);
  return result;
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

/**
 * Checks if the given element is too close to the bottom of the viewport.
 * @param el element to check
 * @param offset optional offset in pixels (default: 0)
 * @returns {boolean}
 */
export function isTooCloseToBottom(el, offset = 0) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  // Check if the bottom of the element is within `offset` px of the viewport bottom
  // console.log(`[PDE] Checking bounding box against viewport height ${viewportHeight} with offset ${offset}: ${rect.bottom >= viewportHeight - offset}`, rect);
  return rect.bottom >= viewportHeight - offset;
}
