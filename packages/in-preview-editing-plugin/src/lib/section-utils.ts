import {
  MESSAGE_TYPE_SECTION_ITEM_ACTION_REQUEST, MESSAGE_TYPE_SECTION_ITEM_ACTION_RESPONSE,
  pdeBridge
} from "./messaging.ts";
import { findContentId } from "./utils";
import type { Observable } from "rxjs";

export const SECTION_ITEM_MARKER = "data-cm-section-item";

export const SECTION_ITEM_DUPLICATE_ACTION = "DUPLICATE";
export const SECTION_ITEM_DELETE_ACTION = "DELETE";
export const SECTION_ITEM_MOVE_UP_ACTION = "MOVE_UP";
export const SECTION_ITEM_MOVE_DOWN_ACTION = "MOVE_DOWN";

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

export function moveSectionItemUp(
  sectionItem: HTMLElement,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const contentRef = findContentId(sectionItem);
    const sectionItemId = getSectionItemId(sectionItem);
    requestSectionItemAction(contentRef ?? "", sectionItemId ?? "", SECTION_ITEM_MOVE_UP_ACTION)?.subscribe({
      next: (response) => resolve(response),
      error: (err) => reject(err),
    });
  });
}

export function moveSectionItemDown(
  sectionItem: HTMLElement,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const contentRef = findContentId(sectionItem);
    const sectionItemId = getSectionItemId(sectionItem);
    requestSectionItemAction(contentRef ?? "", sectionItemId ?? "", SECTION_ITEM_MOVE_DOWN_ACTION)?.subscribe({
      next: (response) => resolve(response),
      error: (err) => reject(err),
    });
  });
}

export function duplicateSectionItem(
  sectionItem: HTMLElement,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const contentRef = findContentId(sectionItem);
    const sectionItemId = getSectionItemId(sectionItem);
    requestSectionItemAction(contentRef ?? "", sectionItemId ?? "", SECTION_ITEM_DUPLICATE_ACTION)?.subscribe({
      next: (response) => resolve(response),
      error: (err) => reject(err),
    });
  });
}


export function deleteSectionItem(
  sectionItem: HTMLElement,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const contentRef = findContentId(sectionItem);
    const sectionItemId = getSectionItemId(sectionItem);
    requestSectionItemAction(contentRef ?? "", sectionItemId ?? "", SECTION_ITEM_DELETE_ACTION)?.subscribe({
      next: (response) => resolve(response),
      error: (err) => reject(err),
    });
  });
}

export const requestSectionItemAction = <TResponse = unknown>(
  contentRef: string,
  sectionItemId: string,
  action: string,
  timeoutMs = 5000,
): Observable<TResponse> | null => {
  if (!contentRef || !sectionItemId || !action) {
    return null;
  }

  return pdeBridge.request<Record<string, unknown>, TResponse>(
    MESSAGE_TYPE_SECTION_ITEM_ACTION_REQUEST,
    { contentRef, sectionItemId, action },
    { responseType: MESSAGE_TYPE_SECTION_ITEM_ACTION_RESPONSE, timeoutMs, skipCorrelation: true },
  );
};
