export const PDE_METADATA_ATTRIBUTE = "data-cm-metadata";
export const PDE_METADATA_ID_ATTRIBUTE = "data-cm-metadata-id";
export const PDE_EDITING_FLAG = "pdeEditing";

/**
 * Checks whether an element is marked as editable.
 * An element is considered editable if its `data-cm-metadata` attribute
 * contains an object with { editable: true }.
 *
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export function isMarkedAsEditable(element: HTMLElement) {
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
export function findClosestMetadataElement(element: HTMLElement) {
  let current: HTMLElement | null = element;

  while (current) {
    if (current.hasAttribute && current.hasAttribute(PDE_METADATA_ATTRIBUTE)) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

export function findContentId(startNode: HTMLElement) {
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

export function getContentIdFromMetadata(element: HTMLElement) {
  // @ts-ignore
  return JSON.parse(element.dataset?.cmMetadata || "[]").find(i => i._?.$Ref)?._.$Ref;
}

export function findPropertyName(startNode: HTMLElement) {
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

export function getPropertyNameFromMetadata(element: HTMLElement) {
  return JSON.parse(element.dataset?.cmMetadata || "[]")
    .find((i: { _: string }) => {
      return i && i._ && typeof i._ === "string" && i._.startsWith("properties");
    })
    ?._.replace("properties.", "");
}

function getParentNodesWithMetadata(startElement: HTMLElement) {
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

export function getContentIdBreadcrumb(startElement: HTMLElement): string[] {
  return getParentNodesWithMetadata(startElement)?.map(getContentIdFromMetadata).filter(Boolean).reverse();
}

export function getBreadcrumbMetadataNotes(startElement: HTMLElement) {
  return getParentNodesWithMetadata(startElement)?.filter((item) => getContentIdFromMetadata(item)).reverse();
}

export function findNodeWithContentRefInBreadcrumb(breadcrumbElements: HTMLElement[], contentId: string) {
  return breadcrumbElements.find((item) => getContentIdFromMetadata(item) === contentId) || null;
}

export function isNavNode(element: HTMLElement) {
  let closestNavNode = element.closest("nav") || element.closest("[role=navigation]");
  return closestNavNode !== null;
}

export function findPlacementElement(element: HTMLElement) {
  return element.closest<HTMLElement>("div[data-cm-metadata*=\"properties.placement-\"]");
}

export function findPlacementItemsWrapper(element: HTMLElement) {
  return element.closest<HTMLElement>("div[data-cm-metadata*=\"properties.items\"]");
}

export function findAllPlacementItems(placementItemsWrapper: HTMLElement | null) {
  return getTopLevelMetadataNodes(placementItemsWrapper);
}

export function findPlacementItemElement(element: HTMLElement) {
  const placementContainer = findPlacementElement(element);
  if (!placementContainer) {
    return false;
  }

  const placementItemsWrapper = findPlacementItemsWrapper(element);
  const placementItems = findAllPlacementItems(placementItemsWrapper);

  return placementItems.find(node => node.contains(element)) || null;
}

export function isPlacementItem(element: HTMLElement) {
  return findPlacementItemElement(element) === element;
}

function getTopLevelMetadataNodes(parent: HTMLElement | null) {
  const result: HTMLElement[] = [];

  function walk(node: HTMLElement) {
    const childNodes = Array.from(node?.children).filter((el) => el instanceof HTMLElement);
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

  if (parent) {
    walk(parent);
  }

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

export function getCurrentValue(element: Element) {
  return element.childNodes[0]?.nodeValue;
}

export function getPreviousValue(element: HTMLElement) {
  return element.dataset.pbePrevValue;
}

export function scrollElementIntoView(el: HTMLElement | null | undefined, animate: boolean = true, position: "start" | "center" | "end" = "start") {
  el?.scrollIntoView({
    behavior: animate ? "smooth" : "instant",
    block: position // position in viewport
  });
}

export function scrollToolbarIntoView(shadowRoot: ShadowRoot) {
  const toolbar = shadowRoot?.querySelector<HTMLElement>(".ipe-overlay-toolbar");
  console.log("Scrolling toolbar into view:", toolbar);
  scrollElementIntoView(toolbar);
}

export function lockScroll() {
  document.documentElement.style.overflow = "hidden";
}

export function unlockScroll() {
  document.documentElement.style.overflow = "";
}
