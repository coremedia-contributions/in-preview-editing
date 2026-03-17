import React, { useEffect, useRef } from "react";
import { usePluginContext } from "../context/PluginContext.tsx";
import { markerBorder, markerPadding } from "./Highlighter.tsx";

export const Spotlight: React.FC = () => {
  const { targetEl, useSpotlight, dimmerValue } = usePluginContext();
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
    const top = Math.round(rect.top) - markerPadding - markerBorder;
    const left = Math.round(rect.left) - markerPadding - markerBorder;
    const bottom = Math.round(rect.bottom) + markerPadding + markerBorder;
    const right = Math.round(rect.right) + markerPadding + markerBorder;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // path() with evenodd: outer rectangle - inner rectangle (cutout)
    const clipPath = `path(evenodd, "M 0 0 L ${W} 0 L ${W} ${H} L 0 ${H} Z M ${left} ${top} L ${right} ${top} L ${right} ${bottom} L ${left} ${bottom} Z")`;

    overlay.style.clipPath = clipPath;
    overlay.style.opacity = "1";
  };

  useEffect(() => {
    updateSpotlight();
  }, [targetEl, useSpotlight, dimmerValue]);

  useEffect(() => {
    window.addEventListener("scroll", updateSpotlight, true);
    window.addEventListener("resize", updateSpotlight);

    return () => {
      window.removeEventListener("scroll", updateSpotlight, true);
      window.removeEventListener("resize", updateSpotlight);
    };
  }, []);

  if (!useSpotlight) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="ipe-spotlight"
      style={{
        position: "fixed",
        opacity: "0",
        inset: 0,
        background: `rgba(0, 0, 0, ${dimmerValue ? dimmerValue / 100 : 0.25})`,
        pointerEvents: "none",
        zIndex: 99,
        transition: "opacity 0.2s ease",
      }}
    />
  );
};
