import React, { useEffect } from "react";
import { usePluginContext } from "../context/PluginContext.tsx";

interface HighlighterProps {
}

export const markerPadding = 0; // padding around the target element for better visibility
export const markerBorder = 2; // outline width of the highlight marker (outline: 2px)

export const Highlighter: React.FC<HighlighterProps> = () => {
  const { targetEl, shadowRoot, markerRef } = usePluginContext();

  // Create a single marker inside the shadow root
  useEffect(() => {
    const el = document.createElement("div");
    el.classList.add("ipe-highlight-marker");
    el.style.visibility = "hidden";
    el.style.position = "absolute";
    //el.style.pointerEvents = "none";

    shadowRoot.appendChild(el);
    markerRef.current = el;

    return () => {
      el.remove();
      markerRef.current = null;
    };
  }, [shadowRoot]);

  // Update marker position when element changes
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    if (!targetEl) {
      marker.style.visibility = "hidden";
      return;
    }

    const update = () => {
      const rect = targetEl.getBoundingClientRect();

      Object.assign(marker.style, {
        top: `${Math.round(rect.top + window.scrollY) - markerPadding}px`,
        left: `${Math.round(rect.left + window.scrollX) - markerPadding}px`,
        width: `${Math.round(rect.width) + markerPadding*2}px`,
        height: `${Math.round(rect.height) + markerPadding*2}px`,
        visibility: "visible",
      });

      //console.log("[IPE] Marker coords:", marker.getBoundingClientRect());
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
