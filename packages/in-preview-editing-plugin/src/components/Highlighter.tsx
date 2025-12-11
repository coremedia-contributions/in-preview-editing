import React, { useEffect, useRef } from "react";
import { useTargetElement } from "../context/TargetElementContext.tsx";

interface HighlighterProps {
  shadowRoot: ShadowRoot;
}

export const Highlighter: React.FC<HighlighterProps> = ({ shadowRoot }) => {
  const { targetEl } = useTargetElement();
  const markersRef = useRef<Record<string, HTMLDivElement> | null>(null);

  // Create the 4 markers inside the shadow root
  useEffect(() => {
    if (markersRef.current) return; // Already initialized

    const names = ["top", "right", "bottom", "left"];
    const markers: Record<string, HTMLDivElement> = {};

    names.forEach((name) => {
      const el = document.createElement("div");
      el.classList.add("ipe-highlight-marker", `ipe-highlight-marker--${name}`);
      el.style.visibility = "hidden";
      el.style.position = "absolute";
      el.style.zIndex = "999999";
      el.style.pointerEvents = "none";

      shadowRoot.appendChild(el);
      markers[name] = el;
    });

    markersRef.current = markers;
  }, [shadowRoot]);

  // Update marker positions when element changes
  useEffect(() => {
    const markers = markersRef.current;
    if (!markers) return;

    if (!targetEl) {
      // hide all markers
      Object.values(markers).forEach((m) => (m.style.visibility = "hidden"));
      return;
    }

    const update = () => {
      const rect = targetEl.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      const top = Math.round(rect.top + scrollY);
      const left = Math.round(rect.left + scrollX);
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      const size = 2; // border thickness

      // Top
      Object.assign(markers.top.style, {
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${size}px`,
        visibility: "visible",
      });

      // Right
      Object.assign(markers.right.style, {
        top: `${top}px`,
        left: `${left + width - size}px`,
        width: `${size}px`,
        height: `${height}px`,
        visibility: "visible",
      });

      // Bottom
      Object.assign(markers.bottom.style, {
        top: `${top + height - size}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${size}px`,
        visibility: "visible",
      });

      // Left
      Object.assign(markers.left.style, {
        top: `${top}px`,
        left: `${left}px`,
        width: `${size}px`,
        height: `${height}px`,
        visibility: "visible",
      });
    };

    update();

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [targetEl]);

  return null; // no React DOM output — markers live in shadowRoot
};
