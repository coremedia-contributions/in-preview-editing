import { useEffect, useRef, useState } from "react";
import {
  findSectionNode,
  getItemsInSection,
  moveSectionItemToIndex,
  SECTION_ITEM_MARKER,
} from "../lib/section-utils.ts";

export interface DragDropState {
  dropTarget: HTMLElement | null;
  position: "before" | "after";
}

const DRAGGING_CLASS = "ipe-dragging";

/**
 * Attaches native HTML5 Drag & Drop listeners to all [data-cm-section-item] elements
 * in the host document. Items may only be dropped within their own enclosing
 * [data-cm-section] element. On drop, moveSectionItemToIndex is called with the
 * computed target index.
 *
 * Returns live drag/drop state so a visual indicator can be rendered.
 */
export function useSectionDragDrop(
  isActive: boolean,
  setIsDragging?: (v: boolean) => void,
  setTargetEl?: (el: HTMLElement | undefined) => void,
): DragDropState {
  const dragSourceRef = useRef<HTMLElement | null>(null);
  const postDragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref mirrors state to avoid stale closures inside event listeners
  const dropStateRef = useRef<DragDropState>({ dropTarget: null, position: "before" });
  const [dropState, setDropState] = useState<DragDropState>({ dropTarget: null, position: "before" });

  function updateDropState(dropTarget: HTMLElement | null, position: "before" | "after") {
    dropStateRef.current = { dropTarget, position };
    setDropState({ dropTarget, position });
  }

  useEffect(() => {
    if (!isActive) return;

    const abortController = new AbortController();
    const { signal } = abortController;

    function attachListeners(item: HTMLElement) {
      item.setAttribute("draggable", "true");

      item.addEventListener(
        "dragstart",
        (e: DragEvent) => {
          dragSourceRef.current = item;
          e.dataTransfer!.effectAllowed = "move";
          setIsDragging?.(true);
          setTargetEl?.(undefined);
          // Small delay so the browser can capture the element for the ghost image
          // before we visually dim it.
          setTimeout(() => item.classList.add(DRAGGING_CLASS), 0);
        },
        { signal },
      );

      item.addEventListener(
        "dragend",
        () => {
          item.classList.remove(DRAGGING_CLASS);
          dragSourceRef.current = null;
          updateDropState(null, "before");
          // Keep isDragging true for 5 s after drop to prevent UI flickering
          // before the section item list has settled after the server-side reorder.
          if (postDragTimerRef.current !== null) {
            clearTimeout(postDragTimerRef.current);
          }
          postDragTimerRef.current = setTimeout(() => {
            setIsDragging?.(false);
            postDragTimerRef.current = null;
          }, 5000);
        },
        { signal },
      );

      item.addEventListener(
        "dragover",
        (e: DragEvent) => {
          e.preventDefault();
          const source = dragSourceRef.current;
          if (!source || source === item) return;

          // Enforce section boundary
          const sourceSection = findSectionNode(source);
          const targetSection = findSectionNode(item);
          if (!sourceSection || sourceSection !== targetSection) {
            e.dataTransfer!.dropEffect = "none";
            return;
          }

          e.dataTransfer!.dropEffect = "move";

          const rect = item.getBoundingClientRect();
          const position: "before" | "after" =
            e.clientY < rect.top + rect.height / 2 ? "before" : "after";
          updateDropState(item, position);
        },
        { signal },
      );

      item.addEventListener(
        "dragleave",
        (e: DragEvent) => {
          // Only clear state when the pointer leaves to an element that is NOT
          // a descendant of the current item (prevents flicker on child elements).
          if (item.contains(e.relatedTarget as Node | null)) return;
          if (dropStateRef.current.dropTarget === item) {
            updateDropState(null, "before");
          }
        },
        { signal },
      );

      item.addEventListener(
        "drop",
        async (e: DragEvent) => {
          e.preventDefault();
          const source = dragSourceRef.current;
          if (!source || source === item) return;

          const section = findSectionNode(source);
          if (!section || findSectionNode(item) !== section) return;

          const items = getItemsInSection(section);
          const fromIndex = items.indexOf(source);
          const targetIdx = items.indexOf(item);

          // Compute raw target index depending on drop half (before / after)
          const rawToIndex =
            dropStateRef.current.position === "before" ? targetIdx : targetIdx + 1;

          // Adjust for the removal of the source element shifting indices
          const finalIndex = rawToIndex > fromIndex ? rawToIndex - 1 : rawToIndex;

          updateDropState(null, "before");

          if (finalIndex === fromIndex) return; // No-op – dropped back to same position

          try {
            await moveSectionItemToIndex(source, finalIndex);
          } catch (err) {
            console.warn("[IPE] moveSectionItemToIndex failed:", err);
          }
        },
        { signal },
      );
    }

    // Attach to all current section items
    document.querySelectorAll<HTMLElement>(`[${SECTION_ITEM_MARKER}]`).forEach(attachListeners);

    // Watch for dynamically added section items
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.hasAttribute(SECTION_ITEM_MARKER)) attachListeners(node);
          node.querySelectorAll<HTMLElement>(`[${SECTION_ITEM_MARKER}]`).forEach(attachListeners);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      abortController.abort();
      observer.disconnect();

      if (postDragTimerRef.current !== null) {
        clearTimeout(postDragTimerRef.current);
        postDragTimerRef.current = null;
      }

      // Clean up draggable attribute and dragging class from all section items
      document.querySelectorAll<HTMLElement>(`[${SECTION_ITEM_MARKER}]`).forEach((item) => {
        item.removeAttribute("draggable");
        item.classList.remove(DRAGGING_CLASS);
      });

      dragSourceRef.current = null;
      updateDropState(null, "before");
    };
  }, [isActive]);

  return dropState;
}

