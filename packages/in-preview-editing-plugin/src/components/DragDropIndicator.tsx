import React, { useEffect, useRef } from "react";
import { usePluginContext } from "../context/PluginContext.tsx";
import { useSectionDragDrop } from "../hooks/useSectionDragDrop.ts";

/**
 * Renders a visual drop-indicator line inside the Shadow DOM while the user
 * drags a section item. The indicator is an absolutely-positioned div that is
 * repositioned in sync with the current drag/drop state.
 *
 * No React DOM output – the indicator div lives directly in the shadowRoot,
 * following the same pattern as <Highlighter />.
 */
export const DragDropIndicator: React.FC = () => {
  const { isActive, shadowRoot } = usePluginContext();
  const { dropTarget, position } = useSectionDragDrop(isActive);
  const indicatorRef = useRef<HTMLElement | null>(null);

  // Create the indicator element once inside the shadow root
  useEffect(() => {
    const el = document.createElement("div");
    el.className = "ipe-drop-indicator";
    el.style.visibility = "hidden";
    shadowRoot.appendChild(el);
    indicatorRef.current = el;

    return () => {
      el.remove();
      indicatorRef.current = null;
    };
  }, [shadowRoot]);

  // Reposition the indicator whenever drop state changes
  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;

    if (!dropTarget) {
      indicator.style.visibility = "hidden";
      return;
    }

    const rect = dropTarget.getBoundingClientRect();
    const y =
      position === "before"
        ? rect.top + window.scrollY
        : rect.bottom + window.scrollY;

    Object.assign(indicator.style, {
      visibility: "visible",
      top: `${y}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`,
    });
  }, [dropTarget, position]);

  return null;
};

