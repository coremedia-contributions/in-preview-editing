import { type MutableRefObject, useEffect, useRef } from "react";
import { isMarkedAsEditable, PDE_METADATA_ATTRIBUTE } from "../lib/utils.ts";

/**
 * Stores the original state of the tabindex attribute of an element.
 */
type SavedTabIndex =
  | { hadAttribute: false }
  | { hadAttribute: true; value: string };

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]",
  "area[href]",
  "details > summary",
  "iframe",
].join(", ");

interface UseTabFocusManagementOptions {
  isActive: boolean;
  setTargetEl: (el: HTMLElement | undefined) => void;
  /** The shadow DOM host element (the plugin itself – excluded from management) */
  shadowHost: Element;
  /** Ref to the current inlineEditActive state to preserve native TAB behavior during inline editing */
  inlineEditActiveRef: MutableRefObject<boolean>;
}

/**
 * Hook that, when the plugin is active, restricts TAB navigation to all [data-cm-metadata] elements
 * and disables all other focusable elements via tabIndex=-1.
 */
export function useTabFocusManagement({
  isActive,
  setTargetEl,
  shadowHost,
  inlineEditActiveRef,
}: UseTabFocusManagementOptions): void {
  // Stores the original tabindex state of all disabled elements
  const savedTabIndicesRef = useRef<Map<Element, SavedTabIndex>>(new Map());
  // Current index in the metadata node list
  const currentIndexRef = useRef<number>(-1);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // Local copy for the cleanup callback
    const savedMap = savedTabIndicesRef.current;

    if (!isActive) {
      cleanup(savedMap, abortControllerRef, mutationObserverRef, currentIndexRef);
      return;
    }

    // Disable all other focusable elements
    disableFocusableExceptMetadata(document.body, savedMap, shadowHost);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const { signal } = abortController;

    // Keydown handler for TAB navigation
    document.addEventListener(
      "keydown",
      (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;

        // Allow native TAB behavior during inline editing
        if (inlineEditActiveRef.current) return;

        e.preventDefault();

        const nodes = getEditableMetadataNodes();
        if (nodes.length === 0) return;

        if (e.shiftKey) {
          // Navigate backwards (circular)
          currentIndexRef.current =
            currentIndexRef.current <= 0 ? nodes.length - 1 : currentIndexRef.current - 1;
        } else {
          // Navigate forwards (circular)
          currentIndexRef.current = (currentIndexRef.current + 1) % nodes.length;
        }

        const targetEl = nodes[currentIndexRef.current];
        setTargetEl(targetEl);
        targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      },
      { signal },
    );

    // MutationObserver: disable focusable elements that are dynamically added to the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          disableFocusableExceptMetadata(node, savedMap, shadowHost);
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    mutationObserverRef.current = observer;

    return () => {
      cleanup(savedMap, abortControllerRef, mutationObserverRef, currentIndexRef);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Returns all [data-cm-metadata] elements that are marked as editable. */
function getEditableMetadataNodes(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(`[${PDE_METADATA_ATTRIBUTE}]`),
  ).filter(isMarkedAsEditable);
}

/**
 * Disables all focusable elements in the subtree of `root`
 * that do NOT have a [data-cm-metadata] attribute and do not belong to the shadow host.
 */
function disableFocusableExceptMetadata(
  root: Element,
  savedMap: Map<Element, SavedTabIndex>,
  shadowHost: Element,
): void {
  const candidates = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

  // Also check `root` itself in case it is already a focusable element
  const all: HTMLElement[] = root instanceof HTMLElement ? [root, ...Array.from(candidates)] : Array.from(candidates);

  all.forEach((el) => {
    // Skip elements belonging to the plugin itself
    if (el === shadowHost || shadowHost.contains(el)) return;
    // Elements with cm-metadata must remain focusable
    if (el.hasAttribute(PDE_METADATA_ATTRIBUTE)) return;
    // Already processed
    if (savedMap.has(el)) return;

    // Save original state
    if (el.hasAttribute("tabindex")) {
      savedMap.set(el, { hadAttribute: true, value: el.getAttribute("tabindex")! });
    } else {
      savedMap.set(el, { hadAttribute: false });
    }

    el.setAttribute("tabindex", "-1");
  });
}

/** Restores all original tabindex values. */
function restoreTabIndices(savedMap: Map<Element, SavedTabIndex>): void {
  savedMap.forEach((saved, el) => {
    if (!(el instanceof HTMLElement)) return;

    if (saved.hadAttribute) {
      el.setAttribute("tabindex", saved.value);
    } else {
      el.removeAttribute("tabindex");
    }
  });
  savedMap.clear();
}

/** Cleans up all resources used by the hook. */
function cleanup(
  savedMap: Map<Element, SavedTabIndex>,
  abortControllerRef: MutableRefObject<AbortController | null>,
  mutationObserverRef: MutableRefObject<MutationObserver | null>,
  currentIndexRef: MutableRefObject<number>,
): void {
  abortControllerRef.current?.abort();
  abortControllerRef.current = null;
  mutationObserverRef.current?.disconnect();
  mutationObserverRef.current = null;
  restoreTabIndices(savedMap);
  currentIndexRef.current = -1;
}
