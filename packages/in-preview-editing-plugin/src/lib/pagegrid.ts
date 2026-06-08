import { getTopLevelMetadataNodes } from "./utils.ts";

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

export function isPlacement(element: HTMLElement | undefined) {
  return element && findPlacementElement(element) === element;
}

export function getPlacementName(placementElement: HTMLElement | null): string | null {
  if (!placementElement) {
    return null;
  }

  const raw = placementElement.dataset["cmMetadata"];
  if (!raw) return null;

  try {
    const entries = JSON.parse(raw) as Array<Record<string, unknown>>;
    const entry = entries.find(
      (item): item is { placementRequest: Array<{ placementName?: string }> } =>
        Array.isArray((item as { placementRequest?: unknown }).placementRequest),
    );
    return entry?.placementRequest[0]?.placementName ?? null;
  } catch {
    return null;
  }
}
