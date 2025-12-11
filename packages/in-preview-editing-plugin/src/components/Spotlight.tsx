import React, { useEffect, useRef } from "react";
import { useTargetElement } from "../context/TargetElementContext.tsx";

export const Spotlight: React.FC = () => {
  const { targetEl } = useTargetElement();
  const overlayRef = useRef<HTMLDivElement>(null);

  const updateSpotlight = () => {
    if (!overlayRef.current) return;

    if (!targetEl) {
      overlayRef.current.style.clipPath = "";
      overlayRef.current.style.opacity = "0";
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const padding = 8; // optional, extra spacing around target

    const top = rect.top - padding;
    const left = rect.left - padding;
    const width = rect.width + padding * 2;
    const height = rect.height + padding * 2;

    // Create a rectangular "hole" using clip-path
    overlayRef.current.style.clipPath = `
      path(
        "M0 0
         H100vw
         V100vh
         H0
         Z
         M${left}px ${top}px
         H${left + width}px
         V${top + height}px
         H${left}px
         Z"
      )
    `;
    overlayRef.current.style.opacity = "1";
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
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.60)",
        pointerEvents: "none",
        transition: "clip-path 0.15s ease-out, opacity 0.15s ease-out",
        opacity: 0,
        zIndex: 999998,
      }}
    />
  );
};
