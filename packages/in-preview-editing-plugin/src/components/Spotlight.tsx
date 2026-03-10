import React, { useEffect, useRef } from "react";
import { usePluginContext } from "../context/PluginContext.tsx";
import { markerPadding } from "./Highlighter.tsx";

export const Spotlight: React.FC = () => {
  const { targetEl } = usePluginContext();
  const overlayRef = useRef<HTMLDivElement>(null);

  const updateSpotlight = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (!targetEl) {
      overlay.style.clipPath = "";
      overlay.style.opacity = "0";
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const top = Math.round(rect.top) - markerPadding - 2;
    const left = Math.round(rect.left) - markerPadding - 2;
    const bottom = Math.round(rect.bottom) + markerPadding + 2;
    const right = Math.round(rect.right) + markerPadding + 2;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // path() with evenodd: outer rectangle - inner rectangle (cutout)
    const clipPath = `path(evenodd, "M 0 0 L ${W} 0 L ${W} ${H} L 0 ${H} Z M ${left} ${top} L ${right} ${top} L ${right} ${bottom} L ${left} ${bottom} Z")`;

    overlay.style.clipPath = clipPath;
    overlay.style.opacity = "1";
  };

  useEffect(() => {
    updateSpotlight();
  }, [targetEl]);

  useEffect(() => {
    window.addEventListener("scroll", updateSpotlight, true);
    window.addEventListener("resize", updateSpotlight);

    return () => {
      window.removeEventListener("scroll", updateSpotlight, true);
      window.removeEventListener("resize", updateSpotlight);
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="ipe-spotlight"
      style={{
        position: "fixed",
        opacity: "0",
        inset: 0,
        background: "rgba(0, 0, 0, 0.65)",
        pointerEvents: "none",
        zIndex: 99,
        transition: "opacity 0.2s ease",
      }}
    />
  );
};
