import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useTargetElement } from "../context/TargetElementContext.tsx";

interface Position {
  top: number;
  left: number;
}

const IPEMenu: React.FC = () => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { targetEl } = useTargetElement();
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });

  const overlayRootRef = useRef<HTMLDivElement | null>(null);
  if (!overlayRootRef.current) {
    overlayRootRef.current = document.createElement("div");
    document.body.appendChild(overlayRootRef.current);
  }
  const overlayRoot = overlayRootRef.current;

  useEffect(() => {
    if (!targetEl) {
      return;
    }

    const updatePos = () => {
      const rect = targetEl.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight || 0;
      setPosition({
        top: rect.top + window.scrollY - menuHeight + 2, // 2px offset for highlighter border
        left: rect.left + window.scrollX,
      });
    };

    requestAnimationFrame(updatePos);

    window.addEventListener("scroll", updatePos);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos);
      window.removeEventListener("resize", updatePos);
    };
  }, [targetEl]);

  if (!targetEl) return null;

  return ReactDOM.createPortal(
    <div
      className="ipe-menu"
      ref={menuRef}
      style={{
        top: position.top,
        left: position.left
      }}
    >
      <button>Edit</button>
      <button>Cancel</button>
      <button>Save</button>
      <button>...</button>
      <div>Element: {targetEl.tagName}</div>
      <div>Data: {targetEl.dataset.cmMetadata}</div>
    </div>,
    overlayRoot
  );
};

export default IPEMenu;
