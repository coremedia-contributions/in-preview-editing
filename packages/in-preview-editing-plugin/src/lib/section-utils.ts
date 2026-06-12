import {
  MESSAGE_TYPE_SECTION_ITEM_ACTION_REQUEST, MESSAGE_TYPE_SECTION_ITEM_ACTION_RESPONSE,
  pdeBridge
} from "./messaging.ts";
import { findContentId } from "./utils";
import type { Observable } from "rxjs";

export const SECTION_MARKER = "data-cm-section";
export const SECTION_ITEM_MARKER = "data-cm-section-item";

export const SECTION_ITEM_DUPLICATE_ACTION = "DUPLICATE";
export const SECTION_ITEM_DELETE_ACTION = "DELETE";
export const SECTION_ITEM_MOVE_UP_ACTION = "MOVE_UP";
export const SECTION_ITEM_MOVE_DOWN_ACTION = "MOVE_DOWN";
export const SECTION_ITEM_MOVE_TO_INDEX_ACTION = "MOVE_TO";

export function isSection(element: HTMLElement | undefined): boolean {
  return element?.hasAttribute(SECTION_MARKER) ?? false;
}

export function findSectionNode(startElement: HTMLElement | undefined): HTMLElement | null {
  let current: HTMLElement | undefined | null = startElement;
  while (current) {
    if (isSection(current)) {
      return current;
    }
    current = current?.parentElement;
  }
  return null;
}

export function isSectionItem(element: HTMLElement | undefined): boolean {
  return element?.hasAttribute(SECTION_ITEM_MARKER) ?? false;
}

export function findSectionItemNode(startElement: HTMLElement | undefined): HTMLElement | null {
  let current: HTMLElement | undefined | null = startElement;
  while (current) {
    if (isSectionItem(current)) {
      return current;
    }
    current = current?.parentElement;
  }
  return null;
}

export function getSectionItemId(sectionItem: HTMLElement): string | undefined {
  return sectionItem.getAttribute(SECTION_ITEM_MARKER) ?? undefined;
}

export function getItemsInSection(sectionElement: HTMLElement | null): HTMLElement[] {
  if (!sectionElement) {
    return [];
  }
  return Array.from(sectionElement.querySelectorAll<HTMLElement>(`[${SECTION_ITEM_MARKER}]`));
}

export function itemCountInSection(startElement: HTMLElement): number {
  let section = findSectionNode(startElement);
  return getItemsInSection(section).length;
}

export function indexOfItemInSection(sectionItem: HTMLElement): number {
  const section = findSectionNode(sectionItem);
  if (!section) return -1;
  return getItemsInSection(section).indexOf(sectionItem);
}

export function isFirstItemInSection(sectionItem: HTMLElement): boolean {
  const section = findSectionNode(sectionItem);
  if (!section) return false;
  return getItemsInSection(section).at(0) === sectionItem;
}

export function isLastItemInSection(sectionItem: HTMLElement): boolean {
  const section = findSectionNode(sectionItem);
  if (!section) return false;
  return getItemsInSection(section).at(-1) === sectionItem;
}

function dispatchSectionItemAction(sectionItem: HTMLElement, action: string, actionParams = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const contentRef = findContentId(sectionItem);
    const sectionItemId = getSectionItemId(sectionItem);
    requestSectionItemAction(contentRef ?? "", sectionItemId ?? "", action, actionParams)?.subscribe({
      next: (response) => resolve(response),
      error: (err) => reject(err),
    });
  });
}

export const moveSectionItemUp = (sectionItem: HTMLElement): Promise<any> =>
  dispatchSectionItemAction(sectionItem, SECTION_ITEM_MOVE_UP_ACTION);

export const moveSectionItemDown = (sectionItem: HTMLElement): Promise<any> =>
  dispatchSectionItemAction(sectionItem, SECTION_ITEM_MOVE_DOWN_ACTION);

export const moveSectionItemToIndex = (sectionItem: HTMLElement, moveTo: number): Promise<any> =>
  dispatchSectionItemAction(sectionItem, SECTION_ITEM_MOVE_TO_INDEX_ACTION, { moveTo: moveTo });

export const duplicateSectionItem = (sectionItem: HTMLElement): Promise<any> =>
  dispatchSectionItemAction(sectionItem, SECTION_ITEM_DUPLICATE_ACTION);

export const deleteSectionItem = (sectionItem: HTMLElement): Promise<any> =>
  dispatchSectionItemAction(sectionItem, SECTION_ITEM_DELETE_ACTION);

export const requestSectionItemAction = <TResponse = unknown>(
  contentRef: string,
  sectionItemId: string,
  action: string,
  actionParams = {},
  timeoutMs = 5000,
): Observable<TResponse> | null => {
  if (!contentRef || !sectionItemId || !action) {
    return null;
  }

  return pdeBridge.request<Record<string, unknown>, TResponse>(
    MESSAGE_TYPE_SECTION_ITEM_ACTION_REQUEST,
    { contentRef, sectionItemId, action, actionParams },
    { responseType: MESSAGE_TYPE_SECTION_ITEM_ACTION_RESPONSE, timeoutMs, skipCorrelation: true },
  );
};
