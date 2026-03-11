import React, { useEffect, useRef, useState } from "react";
import { usePluginContext } from "../context/PluginContext.tsx";
import PDEEditManager from "../lib/edit-manager.ts";
import ActionsMenu from "./ActionsMenu.tsx";
import { Toolbar } from "@base-ui/react/toolbar";

import toolbarStyles from "../styles/components/Toolbar.module.css";
import clsx from "clsx";
import { markerBorder, markerPadding } from "./Highlighter.tsx";

interface Props {
}

interface Position {
  top: number;
  left: number;
}

const IPEOverlay: React.FC<Props> = () => {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const { targetEl, contentMetadata, inlineEditActive, setInlineEditActive } = usePluginContext();
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);

  useEffect(() => {
    console.log("Target element changed:", targetEl);

    if (!targetEl) {
      setActionsMenuOpen(false);
      return;
    }

    const updatePos = () => {
      const rect = targetEl.getBoundingClientRect();
      const menuHeight = toolbarRef.current?.offsetHeight || 0;
      setPosition({
        top: Math.round(rect.top + window.scrollY) - menuHeight - markerPadding,
        left: Math.round(rect.left + window.scrollX) - markerPadding - markerBorder, // offset to the left for better alignment with highlight marker
      });

      // TODO: Auto close menu when switching target elements
      //setActionsMenuOpen(false);
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

  function editBtnHandler() {
    const inline = contentMetadata?.propertyType === "STRING"; // TODO: Read from property descriptor only enable for string properties
    PDEEditManager.getInstance().startEditing(targetEl, inline);
    setInlineEditActive(inline);
  }

  function cancelBtnHandler() {
    PDEEditManager.getInstance().endEditing(targetEl, false);
    setInlineEditActive(false);
  }

  function saveBtnHandler() {
    PDEEditManager.getInstance().endEditing(targetEl, true);
    setInlineEditActive(false);
  }

  // Render directly inside shadow root
  return (
    <Toolbar.Root className={clsx("ipe-overlay-toolbar", toolbarStyles.Toolbar)}
                  ref={toolbarRef}
                  style={{
                    top: position.top,
                    left: position.left,
                  }}>
      {/*<Toolbar.Button className={clsx(toolbarStyles.Button, buttonStyles.readonly)}>{contentMetadata?.contentName || contentId}</Toolbar.Button>*/}
      {/*<Toolbar.Separator className={toolbarStyles.Separator} />*/}
      <Toolbar.Group className={toolbarStyles.Group}>
        {!inlineEditActive && <Toolbar.Button className={toolbarStyles.Button} onClick={editBtnHandler}>Edit {contentMetadata?.propertyLabel}</Toolbar.Button>}
        {inlineEditActive && (
          <>
            <Toolbar.Button className={toolbarStyles.Button} onClick={saveBtnHandler}>Save {contentMetadata?.propertyLabel}</Toolbar.Button>
            <Toolbar.Button className={clsx(toolbarStyles.Button)} onClick={cancelBtnHandler}>Cancel</Toolbar.Button>
          </>
        )}
      </Toolbar.Group>
      <Toolbar.Separator className={toolbarStyles.Separator} />
      <ActionsMenu open={actionsMenuOpen} onOpenChange={setActionsMenuOpen}/>
    </Toolbar.Root>
  );
};

export default IPEOverlay;
